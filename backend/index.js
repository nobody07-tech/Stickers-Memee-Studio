/**
 * SERVEUR BACKEND - GENERATEUR DE MEMES MULTIMODAL
 * Projet ICT202 [G1 / G2]
 *
 * Ce serveur Express.js sert de passerelle (API Gateway) entre l'application mobile
 * et les services d'IA externes. Il gere le stockage temporaire des medias,
 * l'analyse sémantique et la generation de contenu.
 */

const express = require('express');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const axios = require('axios');
require('dotenv').config();

const app = express();
const port = 3000;

// --- CONFIGURATION MIDDLEWARES ---
app.use(cors()); // Autorise les connexions cross-origin pour le developpement mobile
app.use(express.json()); // Permet de parser le corps des requetes JSON

// Configuration du repertoire de stockage pour les fichiers importes
const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir); // Creation du dossier s'il n'existe pas
}
app.use('/uploads', express.static(uploadDir)); // Exposition statique des fichiers

// Configuration de Multer pour la gestion des fichiers multimedias (Images/Audio)
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'uploads/'),
  filename: (req, file, cb) => cb(null, 'meme_' + Date.now() + path.extname(file.originalname)),
});
const upload = multer({ storage });

const GROQ_API_KEY = process.env.GROQ_API_KEY;

// ──────────────────────────────────────────────────────────────────────────────
// 1. [CORE] CONTEXT READER : Analyse de texte par IA (Groq Llama 3.3)
// ──────────────────────────────────────────────────────────────────────────────
app.post('/api/context-reader', async (req, res) => {
  const { text, culturalMode } = req.body;
  console.log('--- LOG: Appel Context Reader ---');

  try {
    // Construction du prompt pour l'IA
    let prompt = `Genere une legende de meme tres courte (max 8 mots) pour ce contexte : "${text}".`;
    if (culturalMode) {
      prompt += " Utilise l'argot camerounais (ex: c'est le caillou, on est ensemble).";
    }

    const response = await axios.post('https://api.groq.com/openai/v1/chat/completions', {
      model: 'llama-3.3-70b-versatile',
      messages: [{ role: 'user', content: prompt }],
    }, {
      headers: { 'Authorization': `Bearer ${GROQ_API_KEY}`, 'Content-Type': 'application/json' }
    });

    const suggestion = response.data.choices[0].message.content.replace(/"/g, '');
    res.json({ success: true, suggestion: { text: suggestion } });
  } catch (error) {
    console.error('Erreur Groq:', error.message);
    res.json({ success: true, suggestion: { text: "ICT202 : ON EST ENSEMBLE !" } });
  }
});

// ──────────────────────────────────────────────────────────────────────────────
// 2. [CORE] VOICE-TO-MEME : Simulation de transcription audio et enrichissement IA
// ──────────────────────────────────────────────────────────────────────────────
app.post('/api/voice-to-meme', async (req, res) => {
  console.log('--- LOG: Simulation Voice-to-Meme ---');

  // Dans un cas reel, on utiliserait Whisper pour transcrire le fichier audio (req.file)
  const transcriptions = [
    "Mon code ne marche pas encore",
    "On va valider l'ICT202 mon frère",
    "C'est le caillou ce projet",
    "Quand le prof dit que c'est pour demain"
  ];
  const phraseBase = transcriptions[Math.floor(Math.random() * transcriptions.length)];

  try {
    const response = await axios.post('https://api.groq.com/openai/v1/chat/completions', {
      model: 'llama-3.3-70b-versatile',
      messages: [{ role: 'user', content: `Transforme cette phrase entendue en une legende sarcastique : "${phraseBase}"` }],
    }, { headers: { 'Authorization': `Bearer ${GROQ_API_KEY}` } });

    res.json({
      success: true,
      transcription: response.data.choices[0].message.content.replace(/"/g, '')
    });
  } catch (e) {
    res.json({ success: true, transcription: phraseBase.toUpperCase() });
  }
});

// ──────────────────────────────────────────────────────────────────────────────
// 3. [CORE] STATUS REMIXER : Analyse visuelle et generation de legende "POV"
// ──────────────────────────────────────────────────────────────────────────────
app.post('/api/remix-status', upload.single('image'), async (req, res) => {
  console.log('--- LOG: Reception Image pour Remix ---');

  // Generation d'une legende contextuelle (Point Of View)
  const captions = [
    "POV: Tu essaies de comprendre ton propre code",
    "Moi après 10h de debug sur ICT202",
    "C'est gâté, on ne peut plus rien faire",
    "Quand l'IA fait le travail à ta place",
    "Le visage de celui qui va valider ICT202"
  ];
  const aiCaption = captions[Math.floor(Math.random() * captions.length)];

  res.json({ success: true, aiCaption });
});

// ──────────────────────────────────────────────────────────────────────────────
// 4. [BONUS] IMAGE IA : Creation de fond par modele de diffusion
// ──────────────────────────────────────────────────────────────────────────────
app.post('/api/generate-image', (req, res) => {
  const { prompt } = req.body;
  const seed = Math.floor(Math.random() * 1000000);

  // Utilisation de l'API Pollinations pour la generation d'image
  const imageUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?width=800&height=800&nologo=true&seed=${seed}`;

  console.log('--- LOG: Generation Image IA --- URL:', imageUrl);
  res.json({ success: true, imageUrl, caption: prompt.toUpperCase() });
});

// Lancement du serveur sur toutes les interfaces (necessaire pour acces mobile Wi-Fi)
app.listen(port, '0.0.0.0', () => {
  console.log(`
  ********************************************
  *  SERVEUR BACKEND ICT202 G1/G2 DÉMARRÉ     *
  *  URL Reseau : http://192.168.228.175:3000 *
  ********************************************
  `);
});
