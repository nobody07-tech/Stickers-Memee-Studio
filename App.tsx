/**
 * AI Studio - Projet ICT202 G2
 * Générateur de Memes Multimodal - VERSION FINALE (VOICE + VISION INTEGRÉS)
 */

import React, {useState, useRef, useCallback, useEffect} from 'react';
import {
  View, Text, StyleSheet, StatusBar, TouchableOpacity, ScrollView,
  TextInput, PanResponder, Animated, Dimensions, Alert, Platform,
  SafeAreaView, Vibration, Image, Switch, ActivityIndicator, Pressable,
  PermissionsAndroid,
} from 'react-native';
import {launchImageLibrary} from 'react-native-image-picker';
import AudioRecorderPlayer from 'react-native-audio-recorder-player';

const {width: SCREEN_W} = Dimensions.get('window');
const CANVAS_SIZE = Math.min(SCREEN_W - 32, 370);

// --- CONFIGURATION IP ---
const API_URL = 'http://192.168.228.175:3000';

const C = {
  bg: '#07050f', card: '#13102a', border: 'rgba(139,92,246,0.3)',
  neonPurple: '#8b5cf6', neonPink: '#ec4899', neonCyan: '#06b6d4',
  textPrimary: '#f3f4f6', textMuted: '#6b7280',
};

// Instance unique du recorder (en dehors du composant)
const audioRecorderPlayer = new AudioRecorderPlayer();

export default function App() {
  const [layers, setLayers] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [commandInput, setCommandInput] = useState('');
  const [culturalMode, setCulturalMode] = useState(false);
  const [recordSeconds, setRecordSeconds] = useState(0);
  const recordTimerRef = useRef(null);
  const audioPathRef = useRef(null);

  // Animation pulse pour le logo
  const pulseAnim = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    Animated.loop(Animated.sequence([
      Animated.timing(pulseAnim, {toValue: 1.05, duration: 1000, useNativeDriver: true}),
      Animated.timing(pulseAnim, {toValue: 1, duration: 1000, useNativeDriver: true}),
    ])).start();

    // Nettoyage à la destruction du composant
    return () => {
      clearInterval(recordTimerRef.current);
      audioRecorderPlayer.stopRecorder().catch(() => {});
    };
  }, []);

  // ─── Demande permission microphone Android ───
  const requestMicPermission = async () => {
    if (Platform.OS !== 'android') return true;
    try {
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
        {
          title: 'Permission Microphone',
          message: 'Voice-to-Meme a besoin du microphone pour t\'écouter.',
          buttonPositive: 'Autoriser',
          buttonNegative: 'Refuser',
        },
      );
      return granted === PermissionsAndroid.RESULTS.GRANTED;
    } catch {
      return false;
    }
  };

  // Chaque calque de texte doit conserver son comportement de déplacement et sa sélection propre,
  // donc il est créé comme un objet autonome plutôt qu’en simple chaîne de caractères.
  const createTextLayer = useCallback((text, initialX = 20, initialY = CANVAS_SIZE / 2) => {
    const id = Math.random().toString(36).substr(2, 9);
    const pan = new Animated.ValueXY({x: initialX, y: initialY});

    const panResponder = PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: () => {
        setSelectedId(id);
        pan.extractOffset();
      },
      onPanResponderMove: Animated.event(
        [null, {dx: pan.x, dy: pan.y}],
        {useNativeDriver: false},
      ),
      onPanResponderRelease: () => pan.flattenOffset(),
    });

    return {id, type: 'text', content: text.toUpperCase(), pan, panResponder};
  }, []);

  // Le flux texte transforme une saisie libre en une proposition de légende directement exploitable par le canvas.
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
    } catch {
      Alert.alert('Erreur', 'PC et Mobile sont-ils sur le même Wi-Fi ?');
    } finally {
      setIsProcessing(false);
    }
  };

  // L’enregistrement audio suit un flux asynchrone : l’interface doit réagir immédiatement,
  // puis le fichier est envoyé au backend une fois l’arrêt détecté.
  const startRecording = async () => {
    const hasPermission = await requestMicPermission();
    if (!hasPermission) {
      Alert.alert('Permission refusée', 'Active le microphone dans les paramètres.');
      return;
    }

    try {
      // Chemin du fichier audio
      const audioPath = Platform.OS === 'android'
        ? `${require('react-native-fs').DocumentDirectoryPath}/voice_${Date.now()}.mp4`
        : `${require('react-native-fs').DocumentDirectoryPath}/voice_${Date.now()}.m4a`;

      audioPathRef.current = audioPath;

      await audioRecorderPlayer.startRecorder(audioPath);
      setIsListening(true);
      setRecordSeconds(0);
      Vibration.vibrate(100);

      // Timer d'affichage
      recordTimerRef.current = setInterval(() => {
        setRecordSeconds(s => s + 1);
      }, 1000);

    } catch (e) {
      console.error('Erreur démarrage enregistrement:', e);
      Alert.alert('Erreur', 'Impossible de démarrer l\'enregistrement.');
    }
  };

  const stopRecordingAndSend = async () => {
    clearInterval(recordTimerRef.current);
    setIsListening(false);
    setIsProcessing(true);
    Vibration.vibrate([0, 50, 50, 50]);

    try {
      const resultPath = await audioRecorderPlayer.stopRecorder();
      const filePath = audioPathRef.current || resultPath;

      console.log('Audio enregistré :', filePath);

      // Préparer le FormData pour l'envoi
      const formData = new FormData();
      formData.append('audio', {
        uri: Platform.OS === 'android' ? `file://${filePath}` : filePath,
        type: Platform.OS === 'android' ? 'audio/mp4' : 'audio/m4a',
        name: 'audio.m4a',
      });

      const res = await fetch(`${API_URL}/api/voice-to-meme`, {
        method: 'POST',
        headers: {'Content-Type': 'multipart/form-data'},
        body: formData,
      });

      const data = await res.json();

      if (data.success) {
        // Ajouter la transcription ET la légende mème sur le canvas
        if (data.transcription) {
          setLayers(prev => [...prev, createTextLayer(data.transcription, 20, CANVAS_SIZE / 3)]);
        }
        if (data.memeText && data.memeText !== data.transcription) {
          setLayers(prev => [...prev, createTextLayer(data.memeText, 20, CANVAS_SIZE - 80)]);
        }
      } else {
        Alert.alert('Erreur', data.error || 'Transcription échouée.');
      }
    } catch (e) {
      console.error('Erreur voice-to-meme:', e);
      Alert.alert('Erreur', 'Impossible d\'envoyer l\'audio au serveur.');
    } finally {
      setIsProcessing(false);
      audioPathRef.current = null;
    }
  };

  // Toggle micro : appui = démarre, second appui = stop + envoi
  const handleVoice = () => {
    if (isListening) {
      stopRecordingAndSend();
    } else {
      startRecording();
    }
  };

  // L’image est d’abord affichée comme contexte visuel, puis la légende IA est ajoutée en arrière-plan
  // pour donner un retour rapide à l’utilisateur sans bloquer l’interface.
  const remix = () => {
    launchImageLibrary({mediaType: 'photo', includeBase64: false}, async (res) => {
      if (res.didCancel || !res.assets) return;

      const asset = res.assets[0];
      const uri = asset.uri;

      // Afficher l'image immédiatement comme fond
      setLayers(prev => [
        {id: 'bg-layer', type: 'bg', color: uri},
        ...prev.filter(l => l.type !== 'bg'),
      ]);

      // Envoyer l'image au backend pour analyse vision IA
      setIsProcessing(true);
      try {
        const formData = new FormData();
        formData.append('image', {
          uri,
          type: asset.type || 'image/jpeg',
          name: asset.fileName || 'photo.jpg',
        });
        if (culturalMode) formData.append('culturalMode', 'true');

        const response = await fetch(`${API_URL}/api/remix-status`, {
          method: 'POST',
          headers: {'Content-Type': 'multipart/form-data'},
          body: formData,
        });

        const data = await response.json();
        if (data.success && data.aiCaption) {
          // Ajouter la légende générée par vision IA sur le canvas
          setLayers(prev => [...prev, createTextLayer(data.aiCaption, 20, CANVAS_SIZE - 80)]);
        }
      } catch (e) {
        console.error('Erreur remix:', e);
        // L'image est déjà affichée, on ignore l'erreur de légende silencieusement
      } finally {
        setIsProcessing(false);
      }
    });
  };

  // ─── BONUS: Image IA (Génération) — INCHANGÉ ───
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
        const bgLayer = {id: 'bg-layer', type: 'bg', color: data.imageUrl};
        const textLayer = createTextLayer(data.caption, 20, CANVAS_SIZE - 70);
        setLayers(prev => [bgLayer, ...prev.filter(l => l.type !== 'bg'), textLayer]);
      }
    } catch {
      Alert.alert('Erreur IA', "Génération d'image impossible.");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <SafeAreaView style={s.root}>
      <StatusBar barStyle="light-content" />
      <View style={s.header}>
        <Animated.View style={[s.dot, {transform: [{scale: pulseAnim}]}]} />
        <Text style={s.logo}>
          AI STUDIO <Text style={{color: C.neonCyan}}>ICT202</Text>
        </Text>

        <View style={s.headerBtns}>
          <TouchableOpacity
            onPress={handleVoice}
            style={[s.micBtn, isListening && s.micBtnActive]}>
            <Text style={s.btnEmoji}>{isListening ? '⏹️' : '🎙️'}</Text>
          </TouchableOpacity>
          {isListening && (
            <Text style={s.recordTimer}>{recordSeconds}s</Text>
          )}
          <TouchableOpacity
            onPress={() => {setLayers([]); setSelectedId(null);}}
            style={s.resetBtn}>
            <Text style={{color: '#fff', fontSize: 12}}>RESET</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={s.canvasWrapper}>
        <View style={s.canvas}>
          {/* 1. Image de fond */}
          {layers.filter(l => l.type === 'bg').map(l => (
            <Image
              key={l.color}
              source={{uri: l.color}}
              style={StyleSheet.absoluteFill}
              resizeMode="cover"
            />
          ))}

          {/* 2. Zone de clic pour déselectionner */}
          <Pressable style={StyleSheet.absoluteFill} onPress={() => setSelectedId(null)} />

          {/* 3. Textes mobiles */}
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
                },
              ]}>
              <Text style={s.memeText} pointerEvents="none">{l.content}</Text>
              {selectedId === l.id && (
                <TouchableOpacity
                  style={s.delBtn}
                  onPress={() => setLayers(prev => prev.filter(lay => lay.id !== l.id))}>
                  <Text style={{color: '#fff', fontSize: 10, fontWeight: 'bold'}}>✕</Text>
                </TouchableOpacity>
              )}
            </Animated.View>
          ))}

          {/* Overlay traitement IA */}
          {isProcessing && (
            <View style={s.overlay}>
              <ActivityIndicator size="large" color={C.neonPurple} />
              <Text style={s.overlayText}>IA EN ACTION...</Text>
            </View>
          )}

          {/* Overlay écoute micro */}
          {isListening && (
            <View style={s.overlayListening}>
              <ActivityIndicator size="large" color={C.neonPink} />
              <Text style={s.overlayText}>🎙️ ÉCOUTE... {recordSeconds}s</Text>
              <Text style={[s.overlayText, {fontSize: 12, marginTop: 4}]}>
                Appuie sur ⏹️ pour terminer
              </Text>
            </View>
          )}
        </View>
      </View>

      <View style={s.drawer}>
        <ScrollView keyboardShouldPersistTaps="handled">
          <View style={s.card}>
            <View style={s.row}>
              <Text style={s.cardTitle}>Humour Local 🇨🇲</Text>
              <Switch
                value={culturalMode}
                onValueChange={setCulturalMode}
                trackColor={{true: C.neonPurple}}
              />
            </View>

            <TextInput
              style={s.input}
              placeholder="Tape ton prompt ou contexte..."
              placeholderTextColor="#666"
              value={commandInput}
              onChangeText={setCommandInput}
              multiline
            />

            <View style={s.btnRow}>
              <TouchableOpacity onPress={analyzeContext} style={s.btn}>
                <Text style={s.btnText}>📝 Analyse IA</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={genAIImage}
                style={[s.btn, {backgroundColor: C.neonCyan}]}>
                <Text style={s.btnText}>🎨 Image IA</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              onPress={remix}
              style={[s.btn, {marginTop: 10, backgroundColor: '#10b981', width: '100%'}]}>
              <Text style={s.btnText}>🖼️ Utiliser ma Photo (Analyse IA)</Text>
            </TouchableOpacity>
          </View>

          <Text style={{color: C.textMuted, textAlign: 'center', marginTop: 15, fontSize: 11}}>
            🎙️ Appuie sur le micro pour enregistrer · Appuie sur ⏹️ pour analyser
          </Text>
          <Text style={{color: C.textMuted, textAlign: 'center', marginTop: 4, fontSize: 11}}>
            Touche un texte pour le déplacer · Appuie sur ✕ pour supprimer
          </Text>
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  root: {flex: 1, backgroundColor: C.bg},
  header: {
    height: 60, flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between', paddingHorizontal: 20,
    borderBottomWidth: 1, borderBottomColor: C.border,
  },
  headerBtns: {flexDirection: 'row', alignItems: 'center'},
  logo: {fontSize: 20, fontWeight: 'bold', color: '#fff', letterSpacing: 1},
  dot: {
    width: 10, height: 10, borderRadius: 5,
    backgroundColor: C.neonPurple, marginRight: 10,
  },
  micBtn: {
    width: 42, height: 42, borderRadius: 21,
    backgroundColor: 'rgba(255,255,255,0.05)',
    alignItems: 'center', justifyContent: 'center', marginRight: 6,
  },
  micBtnActive: {backgroundColor: C.neonPink},
  btnEmoji: {fontSize: 18},
  recordTimer: {color: C.neonPink, fontWeight: 'bold', fontSize: 13, marginRight: 8},
  resetBtn: {
    paddingVertical: 6, paddingHorizontal: 12,
    backgroundColor: 'rgba(255,0,0,0.2)', borderRadius: 8,
  },
  canvasWrapper: {alignItems: 'center', marginTop: 15},
  canvas: {
    width: CANVAS_SIZE, height: CANVAS_SIZE,
    backgroundColor: '#111', borderRadius: 20, overflow: 'hidden',
    elevation: 15, borderWidth: 1, borderColor: C.border,
  },
  movable: {
    position: 'absolute', padding: 12,
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.4)', borderRadius: 10, minWidth: 120,
  },
  memeText: {
    fontSize: 22, fontWeight: '900', color: '#fff',
    textAlign: 'center', textShadowColor: '#000', textShadowRadius: 8,
  },
  delBtn: {
    position: 'absolute', top: -12, right: -12,
    backgroundColor: 'red', borderRadius: 12,
    width: 24, height: 24, alignItems: 'center', justifyContent: 'center', zIndex: 101,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.7)',
    alignItems: 'center', justifyContent: 'center', zIndex: 100,
  },
  overlayListening: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(236,72,153,0.3)',
    alignItems: 'center', justifyContent: 'center', zIndex: 100,
  },
  overlayText: {color: '#fff', marginTop: 10, fontWeight: 'bold'},
  drawer: {flex: 1, padding: 20},
  card: {backgroundColor: C.card, padding: 20, borderRadius: 25},
  row: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', marginBottom: 10,
  },
  cardTitle: {color: '#fff', fontWeight: 'bold', fontSize: 16},
  input: {
    backgroundColor: '#1a1a1a', color: '#fff', borderRadius: 12,
    padding: 15, marginVertical: 10, borderWidth: 1, borderColor: C.border,
  },
  btnRow: {flexDirection: 'row', justifyContent: 'space-between'},
  btn: {
    flex: 1, backgroundColor: C.neonPurple, padding: 15,
    borderRadius: 15, alignItems: 'center', marginHorizontal: 5,
  },
  btnText: {color: '#fff', fontWeight: 'bold'},
});