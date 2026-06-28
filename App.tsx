/**
 * AI Studio - Projet ICT202 G2 / G1
 * Application de generation de memes multimodaux utilisant l'IA.
 *
 * Technologies : React Native (0.86), TypeScript, Animated API.
 */

import React, {useState, useRef, useCallback, useEffect} from 'react';
import {
  View, Text, StyleSheet, StatusBar, TouchableOpacity, ScrollView,
  TextInput, PanResponder, Animated, Dimensions, Alert, Platform,
  SafeAreaView, Vibration, Image, Switch, ActivityIndicator, Pressable
} from 'react-native';
import {launchImageLibrary} from 'react-native-image-picker';

// Recuperation des dimensions de l'ecran pour adapter le Canvas
const {width: SCREEN_W} = Dimensions.get('window');
const CANVAS_SIZE = Math.min(SCREEN_W - 32, 370);

// Configuration de l'URL du serveur backend
// Note : 192.168.228.175 est l'adresse IP locale du PC pour le test sur mobile physique
const API_URL = 'http://192.168.228.175:3000';

// Palette de couleurs (Design Tokens)
const C = {
  bg: '#07050f',
  card: '#13102a',
  border: 'rgba(139,92,246,0.3)',
  neonPurple: '#8b5cf6',
  neonPink: '#ec4899',
  neonCyan: '#06b6d4',
  textPrimary: '#f3f4f6',
  textMuted: '#6b7280',
};

// Liste des accessoires disponibles pour la superposition
const ACCESSORIES = [
  {id: 'glasses', emoji: '🕶️'}, {id: 'hat', emoji: '🧙'},
  {id: 'laser', emoji: '👁️'}, {id: 'crown', emoji: '👑'},
];

export default function App() {
  // --- ETATS DE L'APPLICATION ---
  const [layers, setLayers] = useState([]); // Liste des calques (fond, textes, accessoires)
  const [selectedId, setSelectedId] = useState(null); // ID de l'element actuellement selectionne
  const [isProcessing, setIsProcessing] = useState(false); // Indicateur de chargement IA
  const [isListening, setIsListening] = useState(false); // Etat de la simulation vocale
  const [commandInput, setCommandInput] = useState(''); // Texte saisi pour les prompts
  const [culturalMode, setCulturalMode] = useState(false); // Mode humour local (Bonus)

  // Animation pulse pour l'indicateur d'etat dans le header
  const pulseAnim = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    Animated.loop(Animated.sequence([
      Animated.timing(pulseAnim, {toValue: 1.05, duration: 1000, useNativeDriver: true}),
      Animated.timing(pulseAnim, {toValue: 1, duration: 1000, useNativeDriver: true}),
    ])).start();
  }, []);

  /**
   * Factory pour creer un calque mobile avec son propre gestionnaire de gestes (PanResponder)
   */
  const createTextLayer = useCallback((text, initialX = 20, initialY = CANVAS_SIZE / 2) => {
    const id = Math.random().toString(36).substr(2, 9);
    const pan = new Animated.ValueXY({ x: initialX, y: initialY });

    const panResponder = PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: () => {
        setSelectedId(id); // Selectionner l'element au toucher
        pan.extractOffset(); // Capturer la position actuelle pour un deplacement fluide
      },
      onPanResponderMove: Animated.event(
        [null, { dx: pan.x, dy: pan.y }],
        { useNativeDriver: false }
      ),
      onPanResponderRelease: () => {
        pan.flattenOffset(); // Fixer la nouvelle position
      },
    });

    return { id, type: 'text', content: text.toUpperCase(), pan, panResponder };
  }, []);

  /**
   * CORE 1 : Context Reader
   * Envoie le texte saisi au backend pour analyse sémantique et suggestion de legende
   */
  const analyzeContext = async () => {
    if (!commandInput.trim()) return;
    setIsProcessing(true);
    try {
      const res = await fetch(`${API_URL}/api/context-reader`, {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({text: commandInput, culturalMode}),
      });
      const data = await res.json();
      if (data.success) {
        setLayers(prev => [...prev, createTextLayer(data.suggestion.text)]);
      }
    } catch (e) {
      Alert.alert("Erreur", "Connexion au serveur impossible. Verifiez l'adresse IP.");
    } finally {
      setIsProcessing(false);
    }
  };

  /**
   * CORE 2 : Voice-to-Meme
   * Simulation d'enregistrement vocal et generation de legende par IA
   */
  const handleVoice = () => {
    setIsListening(true);
    Vibration.vibrate(100);

    // Simulation d'une attente d'enregistrement de 2.5 secondes
    setTimeout(async () => {
      setIsListening(false);
      setIsProcessing(true);
      try {
        const res = await fetch(`${API_URL}/api/voice-to-meme`, { method: 'POST' });
        const data = await res.json();
        if (data.success) {
          setLayers(prev => [...prev, createTextLayer(data.transcription)]);
        }
      } catch (e) {
        Alert.alert('Erreur', 'Echec de la simulation vocale');
      } finally {
        setIsProcessing(false);
      }
    }, 2500);
  };

  /**
   * BONUS : AI Image Generation
   * Genere une image de fond a partir du prompt saisi via Pollinations AI
   */
  const genAIImage = async () => {
    if (!commandInput.trim()) return;
    setIsProcessing(true);
    try {
      const res = await fetch(`${API_URL}/api/generate-image`, {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({prompt: commandInput}),
      });
      const data = await res.json();
      if (data.success) {
        // Mise a jour groupée du fond et de la legende
        const bgLayer = { id: 'bg-layer', type: 'bg', color: data.imageUrl };
        const textLayer = createTextLayer(data.caption, 20, CANVAS_SIZE - 80);

        setLayers(prev => [
          bgLayer,
          ...prev.filter(l => l.type !== 'bg'),
          textLayer
        ]);
      }
    } catch (e) {
      Alert.alert('Erreur IA', 'Generation d\'image impossible.');
    } finally {
      setIsProcessing(false);
    }
  };

  /**
   * CORE 3 : Status Remixer (Image Import)
   * Importation d'une image de la galerie et analyse IA de secours
   */
  const remix = () => {
    launchImageLibrary({mediaType: 'photo'}, (res) => {
      if (res.didCancel || !res.assets) return;
      const uri = res.assets[0].uri;
      setLayers(prev => [
        { id: 'bg-layer', type: 'bg', color: uri },
        ...prev.filter(l => l.type !== 'bg')
      ]);
    });
  };

  return (
    <SafeAreaView style={s.root}>
      <StatusBar barStyle="light-content" />

      {/* --- HEADER --- */}
      <View style={s.header}>
        <Text style={s.logo}>AI STUDIO <Text style={{color: C.neonCyan}}>ICT202</Text></Text>
        <View style={s.headerBtns}>
          <TouchableOpacity onPress={handleVoice} style={[s.micBtn, isListening && s.micBtnActive]}>
            <Text style={{fontSize: 18}}>{isListening ? '⏹️' : '🎙️'}</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => {setLayers([]); setSelectedId(null);}} style={s.resetBtn}>
            <Text style={{color: '#fff', fontSize: 12}}>RESET</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* --- CANVAS (Zone d'edition) --- */}
      <View style={s.canvasWrapper}>
        <View style={s.canvas}>
          {/* Calque de fond (Image) */}
          {layers.filter(l => l.type === 'bg').map(l => (
            <Image
              key={l.color}
              source={{uri: l.color}}
              style={StyleSheet.absoluteFill}
              resizeMode="cover"
            />
          ))}

          {/* Zone de clic invisible pour deselectionner les elements */}
          <Pressable style={StyleSheet.absoluteFill} onPress={() => setSelectedId(null)} />

          {/* Calques de texte mobiles */}
          {layers.filter(l => l.type === 'text').map(l => (
            <Animated.View
              key={l.id}
              {...l.panResponder.panHandlers}
              style={[
                s.movable,
                {
                  transform: l.pan.getTranslateTransform(),
                  zIndex: selectedId === l.id ? 100 : 10,
                  borderColor: selectedId === l.id ? C.neonPink : 'transparent',
                  borderWidth: selectedId === l.id ? 2 : 0,
                }
              ]}
            >
              <Text style={s.memeText} pointerEvents="none">{l.content}</Text>
              {selectedId === l.id && (
                <TouchableOpacity
                  style={s.delBtn}
                  onPress={() => setLayers(prev => prev.filter(lay => lay.id !== l.id))}
                >
                  <Text style={{color: '#fff', fontSize: 10, fontWeight: 'bold'}}>✕</Text>
                </TouchableOpacity>
              )}
            </Animated.View>
          ))}

          {/* Indicateur de traitement IA */}
          {isProcessing && (
            <View style={s.overlay}>
              <ActivityIndicator size="large" color={C.neonPurple} />
              <Text style={s.overlayText}>IA EN ACTION...</Text>
            </View>
          )}

          {/* Indicateur d'enregistrement vocal */}
          {isListening && (
            <View style={s.overlayListening}>
              <ActivityIndicator size="large" color={C.neonPink} />
              <Text style={s.overlayText}>ECOUTE EN COURS...</Text>
            </View>
          )}
        </View>
      </View>

      {/* --- PANNEAU DE CONTROLE (Drawer) --- */}
      <View style={s.drawer}>
        <ScrollView keyboardShouldPersistTaps="handled">
          <View style={s.card}>
            {/* Switch Mode Culturel (Bonus) */}
            <View style={s.row}>
              <Text style={s.cardTitle}>Humour Local 🇨🇲</Text>
              <Switch value={culturalMode} onValueChange={setCulturalMode} trackColor={{true: C.neonPurple}} />
            </View>

            {/* Saisie de texte pour les prompts */}
            <TextInput
              style={s.input}
              placeholder="Tape ton prompt ou contexte..."
              placeholderTextColor="#666"
              value={commandInput}
              onChangeText={setCommandInput}
            />

            {/* Actions principales */}
            <View style={s.btnRow}>
              <TouchableOpacity onPress={analyzeContext} style={s.btn}>
                <Text style={s.btnText}>Analyse IA</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={genAIImage} style={[s.btn, {backgroundColor: C.neonCyan}]}>
                <Text style={s.btnText}>Image IA</Text>
              </TouchableOpacity>
            </View>

            {/* Remixage image galerie */}
            <TouchableOpacity onPress={remix} style={[s.btn, {marginTop: 10, backgroundColor: '#10b981', width: '100%'}]}>
              <Text style={s.btnText}>Utiliser ma Photo</Text>
            </TouchableOpacity>
          </View>

          <Text style={{color: '#666', textAlign: 'center', marginTop: 15, fontSize: 11}}>Touche un texte pour le deplacer.</Text>
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

// --- FEUILLE DE STYLE ---
const s = StyleSheet.create({
  root: {flex: 1, backgroundColor: C.bg},
  header: {height: 60, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, borderBottomWidth: 1, borderBottomColor: C.border},
  headerBtns: {flexDirection: 'row', alignItems: 'center'},
  logo: {fontSize: 20, fontWeight: 'bold', color: '#fff', letterSpacing: 1},
  micBtn: {width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.05)', alignItems: 'center', justifyContent: 'center', marginRight: 10},
  micBtnActive: {backgroundColor: C.neonPink},
  resetBtn: {paddingVertical: 6, paddingHorizontal: 12, backgroundColor: 'rgba(255,0,0,0.2)', borderRadius: 8},
  canvasWrapper: {alignItems: 'center', marginTop: 15},
  canvas: {width: CANVAS_SIZE, height: CANVAS_SIZE, backgroundColor: '#111', borderRadius: 20, overflow: 'hidden', elevation: 15, borderWidth: 1, borderColor: C.border},
  movable: {position: 'absolute', padding: 12, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.4)', borderRadius: 10, minWidth: 120},
  memeText: {fontSize: 22, fontWeight: '900', color: '#fff', textAlign: 'center', textShadowColor: '#000', textShadowRadius: 8},
  delBtn: {position: 'absolute', top: -12, right: -12, backgroundColor: 'red', borderRadius: 12, width: 24, height: 24, alignItems: 'center', justifyContent: 'center', zIndex: 101},
  overlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.7)', alignItems: 'center', justifyContent: 'center', zIndex: 100},
  overlayListening: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(236,72,153,0.3)', alignItems: 'center', justifyContent: 'center', zIndex: 100},
  overlayText: {color: '#fff', marginTop: 10, fontWeight: 'bold'},
  drawer: {flex: 1, padding: 20},
  card: {backgroundColor: C.card, padding: 20, borderRadius: 25},
  row: {flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10},
  cardTitle: {color: '#fff', fontWeight: 'bold', fontSize: 16},
  input: {backgroundColor: '#1a1a1a', color: '#fff', borderRadius: 12, padding: 15, marginVertical: 10, borderWidth: 1, borderColor: C.border},
  btnRow: {flexDirection: 'row', justifyContent: 'space-between'},
  btn: {flex: 1, backgroundColor: C.neonPurple, padding: 15, borderRadius: 15, alignItems: 'center', marginHorizontal: 5},
  btnText: {color: '#fff', fontWeight: 'bold'},
});
