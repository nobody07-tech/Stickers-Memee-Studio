const express = require('express');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const axios = require('axios');
const FormData = require('form-data');
require('dotenv').config();

const app = express();
const port = 3000;

app.use(cors());
app.use(express.json({ limit: '20mb' }));

// Dossier pour les uploads
const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir);
app.use('/uploads', express.static(uploadDir));

// Storage pour les images
const imageStorage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'uploads/'),
  filename: (req, file, cb) => cb(null, 'img_' + Date.now() + path.extname(file.originalname)),
});
const uploadImage = multer({
  storage: imageStorage,
  fileFilter: (req, file, cb) => {
    const allowed = ['image/jpeg', 'image/png', 'image/jpg', 'image/webp'];
    cb(null, allowed.includes(file.mimetype));
  },
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB max
});

// Storage pour l'audio
const audioStorage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'uploads/'),
  filename: (req, file, cb) => {
    // On force .m4a car React Native enregistre en m4a
    cb(null, 'audio_' + Date.now() + '.m4a');
  },
});
const uploadAudio = multer({
  storage: audioStorage,
  limits: { fileSize: 25 * 1024 * 1024 }, // 25MB max (limite Whisper)
});

const GROQ_API_KEY = process.env.GROQ_API_KEY;

// Helper : appel chat completion Groq
async function groqChat(userMessage, systemPrompt = null) {
  const messages = [];
  if (systemPrompt) messages.push({ role: 'system', content: systemPrompt });
  messages.push({ role: 'user', content: userMessage });

  const response = await axios.post(
    'https://api.groq.com/openai/v1/chat/completions',
    {
      model: 'llama-3.3-70b-versatile',
      messages,
      max_tokens: 200,
    },
    {
      headers: {
        Authorization: `Bearer ${GROQ_API_KEY}`,
        'Content-Type': 'application/json',
      },
    }
  );
  return response.data.choices[0].message.content.trim().replace(/"/g, '');
}

// Helper : transcription audio via Whisper (Groq)
async function transcribeAudio(filePath) {
  const formData = new FormData();
  formData.append('file', fs.createReadStream(filePath));
  formData.append('model', 'whisper-large-v3');
  formData.append('language', 'fr');
  formData.append('response_format', 'json');

  const response = await axios.post(
    'https://api.groq.com/openai/v1/audio/transcriptions',
    formData,
    {
      headers: {
        Authorization: `Bearer ${GROQ_API_KEY}`,
        ...formData.getHeaders(),
      },
    }
  );
  return response.data.text;
}

// Helper : nettoyer fichier uploadé
function cleanupFile(filePath) {
  if (filePath && fs.existsSync(filePath)) {
    try { fs.unlinkSync(filePath); } catch (_) {}
  }
}

// ─────────────────────────────────────────────
// 1. Context Reader (Texte)
// ─────────────────────────────────────────────
app.post('/api/context-reader', async (req, res) => {
  const { text, culturalMode } = req.body;

  if (!text || text.trim() === '') {
    return res.status(400).json({ success: false, error: 'Texte manquant.' });
  }

  try {
    const prompt = culturalMode
      ? `Génère une légende de mème très courte et sarcastique pour : "${text}". Utilise l'argot camerounais et des expressions locales.`
      : `Génère une légende de mème très courte et sarcastique (10 mots max) pour : "${text}".`;

    const suggestion = await groqChat(prompt);
    res.json({ success: true, suggestion: { text: suggestion } });
  } catch (error) {
    console.error('Context reader error:', error.response?.data || error.message);
    res.json({ success: true, suggestion: { text: 'ICT202 : ON EST ENSEMBLE !' } });
  }
});

// ─────────────────────────────────────────────
// 2. Voice-to-Meme (Vocal) — VRAI Whisper
// ─────────────────────────────────────────────
app.post('/api/voice-to-meme', uploadAudio.single('audio'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ success: false, error: 'Aucun fichier audio reçu.' });
  }

  console.log('🎤 Audio reçu :', req.file.filename, `(${(req.file.size / 1024).toFixed(1)} KB)`);

  try {
    // Étape 1 : Transcrire l'audio avec Whisper
    const transcription = await transcribeAudio(req.file.path);
    console.log('📝 Transcription :', transcription);

    if (!transcription || transcription.trim() === '') {
      cleanupFile(req.file.path);
      return res.status(400).json({ success: false, error: 'Aucune parole détectée dans l\'audio.' });
    }

    // Étape 2 : Générer la légende mème à partir de la transcription
    const memeLegend = await groqChat(
      `Transforme cette phrase en une légende de mème sarcastique et percutante (10 mots max) : "${transcription}"`,
      'Tu es un générateur de mèmes hilarant. Sois bref, percutant, drôle.'
    );

    cleanupFile(req.file.path);

    res.json({
      success: true,
      transcription: transcription.trim(),
      memeText: memeLegend,
    });
  } catch (error) {
    console.error('Voice-to-meme error:', error.response?.data || error.message);
    cleanupFile(req.file.path);

    // Fallback si Whisper échoue
    res.status(500).json({
      success: false,
      error: 'Échec de la transcription audio. Vérifiez le format du fichier (m4a, mp3, wav).',
    });
  }
});

// ─────────────────────────────────────────────
// 3. Status Remixer (Image) — VRAI analyse vision
// ─────────────────────────────────────────────
app.post('/api/remix-status', uploadImage.single('image'), async (req, res) => {
  const { culturalMode } = req.body;

  if (!req.file) {
    return res.status(400).json({ success: false, error: 'Aucune image reçue.' });
  }

  console.log('🖼️  Image reçue :', req.file.filename);

  try {
    // Lire l'image en base64 pour l'envoyer à l'IA vision
    const imageData = fs.readFileSync(req.file.path);
    const base64Image = imageData.toString('base64');
    const mimeType = req.file.mimetype || 'image/jpeg';

    // Groq supporte llama-4 avec vision
    const culturalInstruction = culturalMode
      ? ' Utilise l\'humour camerounais et des expressions locales.'
      : '';

    const visionResponse = await axios.post(
      'https://api.groq.com/openai/v1/chat/completions',
      {
        model: 'meta-llama/llama-4-scout-17b-16e-instruct', // modèle vision Groq
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'image_url',
                image_url: {
                  url: `data:${mimeType};base64,${base64Image}`,
                },
              },
              {
                type: 'text',
                text: `Regarde cette image et génère une légende de mème sarcastique et hilarante (15 mots max).${culturalInstruction} Réponds uniquement avec la légende, sans guillemets.`,
              },
            ],
          },
        ],
        max_tokens: 100,
      },
      {
        headers: {
          Authorization: `Bearer ${GROQ_API_KEY}`,
          'Content-Type': 'application/json',
        },
      }
    );

    const aiCaption = visionResponse.data.choices[0].message.content
      .trim()
      .replace(/"/g, '');

    cleanupFile(req.file.path);

    res.json({ success: true, aiCaption });
  } catch (error) {
    console.error('Status remixer error:', error.response?.data || error.message);
    cleanupFile(req.file.path);

    // Fallback si vision échoue
    const fallbackCaptions = [
      'POV: Tu essaies de comprendre ton propre code',
      'Moi après 10h de debug sur ICT202',
      'Quand l IA fait le travail à ta place',
      'Le visage de celui qui va valider ICT202',
    ];
    res.json({
      success: true,
      aiCaption: fallbackCaptions[Math.floor(Math.random() * fallbackCaptions.length)],
    });
  }
});

// ─────────────────────────────────────────────
// 4. Image IA — INCHANGÉ
// ─────────────────────────────────────────────
app.post('/api/generate-image', (req, res) => {
  const { prompt } = req.body;
  const seed = Math.floor(Math.random() * 1000000);
  const imageUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?width=800&height=800&nologo=true&seed=${seed}`;
  res.json({ success: true, imageUrl, caption: prompt.toUpperCase() });
});

// ─────────────────────────────────────────────
// Démarrage
// ─────────────────────────────────────────────
app.listen(port, '0.0.0.0', () =>
  console.log(`
  🚀 SERVEUR MONSTRE DÉMARRÉ
  Local:   http://localhost:${port}
  Réseau:  http://192.168.228.175:${port}
  `)
);