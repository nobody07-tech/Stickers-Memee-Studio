/**
 * AI Studio - Application d'Édition Multimédia IA (Stickers & Mèmes)
 * React Native 0.86 - Compatible Android
 */

import React, {useState, useRef, useCallback, useEffect, useMemo} from 'react';
import {
  View,
  Text,
  StyleSheet,
  StatusBar,
  TouchableOpacity,
  ScrollView,
  TextInput,
  PanResponder,
  PanResponderInstance,
  Animated,
  Dimensions,
  Alert,
  Platform,
  SafeAreaView,
  Vibration,
} from 'react-native';
import {launchCamera, launchImageLibrary} from 'react-native-image-picker';

const {width: SCREEN_W} = Dimensions.get('window');
const CANVAS_SIZE = Math.min(SCREEN_W - 32, 370);

// ─── DESIGN TOKENS ──────────────────────────────────────────────────────────
const C = {
  bg: '#07050f',
  card: '#13102a',
  glass: 'rgba(30,22,60,0.85)',
  border: 'rgba(139,92,246,0.30)',
  neonPurple: '#8b5cf6',
  neonPink: '#ec4899',
  neonCyan: '#06b6d4',
  neonGreen: '#10b981',
  neonYellow: '#f59e0b',
  textPrimary: '#f3f4f6',
  textSecondary: '#9ca3af',
  textMuted: '#6b7280',
};

// ─── STATIC DATA ──────────────────────────────────────────────────────────────
const TEMPLATES = [
  {id: 'pepe', name: 'Sad Pepe', type: 'sticker', emoji: '🐸', bg: '#16a34a'},
  {id: 'doge', name: 'Cyber Doge', type: 'meme', emoji: '🐶', bg: '#ca8a04'},
  {id: 'drake', name: 'Drake', type: 'meme', emoji: '🎤', bg: '#7c3aed'},
  {id: 'chad', name: 'Gigachad', type: 'sticker', emoji: '💪', bg: '#374151'},
  {id: 'cat', name: 'Smug Cat', type: 'sticker', emoji: '😺', bg: '#db2777'},
  {id: 'fire', name: 'This is Fine', type: 'meme', emoji: '🔥', bg: '#dc2626'},
];

const ACCESSORIES = [
  {id: 'glasses', name: 'Deal With It', emoji: '🕶️'},
  {id: 'hat', name: 'Wizard Hat', emoji: '🧙'},
  {id: 'laser', name: 'Laser Eyes', emoji: '👁️'},
  {id: 'crown', name: 'Couronne', emoji: '👑'},
  {id: 'fire_acc', name: 'Flammes', emoji: '🔥'},
  {id: 'stars', name: 'Sparkles', emoji: '✨'},
];

const FACES = [
  {id: 'chicago', name: 'Chicago', emoji: '😎', color: '#fed7aa'},
  {id: 'cat_face', name: 'Cat Face', emoji: '😸', color: '#d1fae5'},
  {id: 'anime', name: 'Anime', emoji: '🥺', color: '#fce7f3'},
];

const FILTERS = [
  {id: 'none', name: 'Normal', emoji: '🎨', overlay: 'transparent'},
  {id: 'neon', name: 'Néon', emoji: '💜', overlay: 'rgba(139,92,246,0.30)'},
  {id: 'glitch', name: 'Glitch', emoji: '⚡', overlay: 'rgba(236,72,153,0.22)'},
  {id: 'retro', name: 'Rétro', emoji: '📺', overlay: 'rgba(120,80,30,0.35)'},
  {id: 'vintage', name: 'Vintage', emoji: '🎞️', overlay: 'rgba(200,150,80,0.28)'},
  {id: 'bw', name: 'N&B', emoji: '⬛', overlay: 'rgba(0,0,0,0.45)'},
];

const VOICE_PRESETS = [
  {id: 'normal', label: 'Normal', icon: '😊'},
  {id: 'robot', label: 'Robot', icon: '🤖'},
  {id: 'high', label: 'Hélium', icon: '🎈'},
  {id: 'low', label: 'Grave', icon: '🔊'},
  {id: 'echo', label: 'Écho', icon: '🌌'},
];

// ─── TYPES ────────────────────────────────────────────────────────────────────
type LayerType = 'bg' | 'text' | 'face' | 'accessory';
type NavTab = 'templates' | 'deepfake' | 'elements' | 'voice' | 'export';
type VoicePreset = 'normal' | 'robot' | 'high' | 'low' | 'echo';
type FilterTab = 'all' | 'sticker' | 'meme';

interface Layer {
  id: string;
  type: LayerType;
  content: string;
  emoji?: string;
  color?: string;
  bg?: string;
  x: Animated.Value;
  y: Animated.Value;
  zIndex: number;
  textColor?: string;
  textSize?: number;
  pan?: PanResponderInstance;
}

// ─── VOICE COMMAND PARSER ─────────────────────────────────────────────────────
function parseVoiceCommand(
  cmd: string,
  callbacks: {
    addText: (t: string) => void;
    setFilter: (f: string) => void;
    addAccessory: (a: (typeof ACCESSORIES)[0]) => void;
    setPreset: (v: VoicePreset) => void;
    setTab: (t: NavTab) => void;
  },
) {
  const t = cmd.toLowerCase().trim();
  if (t.includes('ajoute le texte')) {
    const content = t.replace('ajoute le texte', '').trim();
    if (content) callbacks.addText(content.toUpperCase());
  } else if (t.startsWith('écris ') || t.startsWith('ecris ')) {
    const content = t.replace(/^[eé]cris\s+/, '').trim();
    if (content) callbacks.addText(content.toUpperCase());
  } else if (t.includes('filtre') || t.includes('effet')) {
    if (t.includes('neon') || t.includes('néon')) callbacks.setFilter('neon');
    else if (t.includes('glitch')) callbacks.setFilter('glitch');
    else if (t.includes('retro') || t.includes('rétro')) callbacks.setFilter('retro');
    else if (t.includes('vintage')) callbacks.setFilter('vintage');
    else if (t.includes('noir') || t.includes('blanc')) callbacks.setFilter('bw');
    else callbacks.setFilter('none');
  } else if (t.includes('lunettes')) {
    callbacks.addAccessory(ACCESSORIES[0]);
  } else if (t.includes('chapeau')) {
    callbacks.addAccessory(ACCESSORIES[1]);
  } else if (t.includes('laser')) {
    callbacks.addAccessory(ACCESSORIES[2]);
  } else if (t.includes('couronne') || t.includes('crown')) {
    callbacks.addAccessory(ACCESSORIES[3]);
  } else if (t.includes('robot')) {
    callbacks.setPreset('robot');
    callbacks.setTab('voice');
  } else if (t.includes('aigu') || t.includes('helium') || t.includes('hélium')) {
    callbacks.setPreset('high');
    callbacks.setTab('voice');
  } else if (t.includes('grave')) {
    callbacks.setPreset('low');
    callbacks.setTab('voice');
  } else if (t.includes('echo') || t.includes('écho')) {
    callbacks.setPreset('echo');
    callbacks.setTab('voice');
  } else if (t.includes('export') || t.includes('sauvegarde')) {
    callbacks.setTab('export');
  }
}

// ─── MAIN APP ─────────────────────────────────────────────────────────────────
export default function App() {
  const [activeTab, setActiveTab] = useState<NavTab>('templates');
  const [layers, setLayers] = useState<Layer[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState<string>('none');
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingMsg, setProcessingMsg] = useState('');
  const [_progress, setProgress] = useState(0);
  const [voiceText, setVoiceText] = useState('');
  const [voicePreset, setVoicePreset] = useState<VoicePreset>('normal');
  const [isListening, setIsListening] = useState(false);
  const [commandInput, setCommandInput] = useState('');
  const [filterTab, setFilterTab] = useState<FilterTab>('all');
  const [textInput, setTextInput] = useState('');
  const layerCounter = useRef(0);

  // Animations
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const waveAnim = useRef(new Animated.Value(0)).current;
  const progressAnim = useRef(new Animated.Value(0)).current;

  // ── Pulse dot animation ───────────────────────────────────────────────────
  useEffect(() => {
    const anim = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {toValue: 1.25, duration: 850, useNativeDriver: true}),
        Animated.timing(pulseAnim, {toValue: 1, duration: 850, useNativeDriver: true}),
      ]),
    );
    anim.start();
    return () => anim.stop();
  }, [pulseAnim]);

  // ── Wave animation for listening state ────────────────────────────────────
  useEffect(() => {
    if (isListening) {
      const anim = Animated.loop(
        Animated.sequence([
          Animated.timing(waveAnim, {toValue: 1, duration: 500, useNativeDriver: true}),
          Animated.timing(waveAnim, {toValue: 0.3, duration: 500, useNativeDriver: true}),
        ]),
      );
      anim.start();
      return () => anim.stop();
    } else {
      waveAnim.setValue(0);
    }
  }, [isListening, waveAnim]);

  // ── AI Spinner ────────────────────────────────────────────────────────────
  const showSpinner = useCallback(
    (msg: string, p: number, cb: () => void) => {
      setProcessingMsg(msg);
      setProgress(p);
      setIsProcessing(true);
      Animated.timing(progressAnim, {
        toValue: p,
        duration: 400,
        useNativeDriver: false,
      }).start();
      setTimeout(() => {
        setIsProcessing(false);
        cb();
      }, 850);
    },
    [progressAnim],
  );

  // ── Layer factory ─────────────────────────────────────────────────────────
  const makeLayer = useCallback((
    type: LayerType,
    content: string,
    opts: Partial<Layer> = {},
  ): Layer => {
    layerCounter.current += 1;
    const x = new Animated.Value(CANVAS_SIZE / 2 - 55);
    const y = new Animated.Value(CANVAS_SIZE / 2 - 55);

    // Build PanResponder inside the factory so each layer has a stable one
    const xRef = x;
    const yRef = y;
    const pan = PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: () => {
        xRef.extractOffset();
        yRef.extractOffset();
      },
      onPanResponderMove: Animated.event(
        [{}, {dx: xRef, dy: yRef}],
        {useNativeDriver: false},
      ),
      onPanResponderRelease: () => {
        xRef.flattenOffset();
        yRef.flattenOffset();
      },
    });

    return {
      id: `l${layerCounter.current}`,
      type,
      content,
      x,
      y,
      zIndex: layerCounter.current,
      textColor: '#ffffff',
      textSize: 32,
      ...opts,
      pan,
    };
  }, []);

  // ── Load template ─────────────────────────────────────────────────────────
  const loadTemplate = useCallback((tmpl: (typeof TEMPLATES)[0]) => {
    showSpinner('Chargement du template...', 60, () => {
      setLayers([makeLayer('bg', tmpl.name, {emoji: tmpl.emoji, bg: tmpl.bg, color: tmpl.bg})]);
      setSelectedId(null);
      setActiveFilter('none');
    });
  }, [makeLayer, showSpinner]);

  // ── Add text layer ────────────────────────────────────────────────────────
  const addTextLayer = useCallback((text: string) => {
    if (!text.trim()) return;
    const layer = makeLayer('text', text.toUpperCase(), {textColor: '#ffffff', textSize: 34});
    setLayers(prev => [...prev, layer]);
    setSelectedId(layer.id);
  }, [makeLayer]);

  // ── Add face overlay ──────────────────────────────────────────────────────
  const addFaceOverlay = useCallback((face: (typeof FACES)[0]) => {
    showSpinner('Analyse faciale IA...', 35, () =>
      showSpinner('Extraction des repères...', 70, () =>
        showSpinner('Fusion colorimétrique...', 95, () => {
          const layer = makeLayer('face', face.name, {emoji: face.emoji, color: face.color});
          setLayers(prev => [...prev, layer]);
          setSelectedId(layer.id);
        }),
      ),
    );
  }, [makeLayer, showSpinner]);

  // ── Add accessory ─────────────────────────────────────────────────────────
  const addAccessory = useCallback((acc: (typeof ACCESSORIES)[0]) => {
    const layer = makeLayer('accessory', acc.name, {emoji: acc.emoji});
    setLayers(prev => [...prev, layer]);
    setSelectedId(layer.id);
  }, [makeLayer]);

  // ── Delete selected layer ─────────────────────────────────────────────────
  const deleteSelected = useCallback(() => {
    if (!selectedId) return;
    setLayers(prev => prev.filter(l => l.id !== selectedId || l.type === 'bg'));
    setSelectedId(null);
  }, [selectedId]);

  // ── Camera: selfie ────────────────────────────────────────────────────────
  const captureSelfie = useCallback(() => {
    launchCamera({mediaType: 'photo', cameraType: 'front', quality: 0.7}, res => {
      if (res.didCancel || res.errorCode) {
        if (res.errorCode) Alert.alert('Erreur caméra', res.errorMessage || 'Accès refusé');
        return;
      }
      const uri = res.assets?.[0]?.uri;
      if (!uri) return;
      showSpinner('Traitement du visage...', 80, () => {
        const layer = makeLayer('face', 'Selfie', {color: uri});
        setLayers(prev => [...prev, layer]);
        setSelectedId(layer.id);
      });
    });
  }, [makeLayer, showSpinner]);

  // ── Import from gallery ───────────────────────────────────────────────────
  const importGallery = useCallback((target: 'bg' | 'face') => {
    launchImageLibrary({mediaType: 'photo', quality: 1}, res => {
      if (res.didCancel || res.errorCode) return;
      const uri = res.assets?.[0]?.uri;
      if (!uri) return;
      if (target === 'bg') {
        const layer = makeLayer('bg', 'Image importée', {color: uri});
        setLayers(prev => [layer, ...prev.filter(l => l.type !== 'bg')]);
      } else {
        const layer = makeLayer('face', 'Visage importé', {color: uri});
        setLayers(prev => [...prev, layer]);
        setSelectedId(layer.id);
      }
    });
  }, [makeLayer]);

  // ── Voice / text command ──────────────────────────────────────────────────
  const handleCommand = useCallback(() => {
    if (!commandInput.trim()) return;
    showSpinner('IA en analyse sémantique...', 55, () => {
      parseVoiceCommand(commandInput, {
        addText: addTextLayer,
        setFilter: setActiveFilter,
        addAccessory,
        setPreset: setVoicePreset,
        setTab: setActiveTab,
      });
      setCommandInput('');
    });
  }, [commandInput, addTextLayer, addAccessory, showSpinner]);

  // ── Mic toggle (UI only — Web Speech not available in RN) ─────────────────
  const toggleMic = useCallback(() => {
    Vibration.vibrate(60);
    if (isListening) {
      setIsListening(false);
    } else {
      setIsListening(true);
      setTimeout(() => setIsListening(false), 5000);
      Alert.alert(
        '🎙️ Commande Vocale',
        'Saisissez votre commande dans la zone de texte de l\'onglet Éléments.\n\nEx : "ajoute le texte WOW"\n     "filtre neon"\n     "ajoute des lunettes"',
        [{text: 'Compris', onPress: () => setIsListening(false)}],
      );
    }
  }, [isListening]);

  // ── Filtered templates ────────────────────────────────────────────────────
  const filteredTemplates = useMemo(
    () => TEMPLATES.filter(t => filterTab === 'all' || t.type === filterTab),
    [filterTab],
  );

  // ── Active filter overlay color ───────────────────────────────────────────
  const filterOverlay = useMemo(
    () => FILTERS.find(f => f.id === activeFilter)?.overlay ?? 'transparent',
    [activeFilter],
  );

  // ── Progress bar width ────────────────────────────────────────────────────
  const progressWidth = progressAnim.interpolate({
    inputRange: [0, 100],
    outputRange: ['0%', '100%'],
    extrapolate: 'clamp',
  });

  // ─── RENDER ───────────────────────────────────────────────────────────────
  return (
    <SafeAreaView style={s.root}>
      <StatusBar barStyle="light-content" backgroundColor={C.bg} translucent={false} />

      {/* ── HEADER ──────────────────────────────────────────────────── */}
      <View style={s.header}>
        <View style={s.headerLeft}>
          <Animated.View style={[s.pulseDot, {transform: [{scale: pulseAnim}]}]} />
          <Text style={s.logo}>
            AI<Text style={s.logoAccent}>STUDIO</Text>
          </Text>
        </View>
        <View style={s.headerRight}>
          <TouchableOpacity
            style={[s.micBtn, isListening && s.micBtnOn]}
            onPress={toggleMic}
            activeOpacity={0.75}>
            <Text style={s.micBtnText}>{isListening ? '⏹' : '🎙️'}</Text>
          </TouchableOpacity>
          <View style={[s.badge, isProcessing && s.badgeBusy]}>
            <Text style={[s.badgeText, isProcessing && s.badgeBusyText]}>
              {isProcessing ? 'IA occupée' : 'IA Prête'}
            </Text>
          </View>
        </View>
      </View>

      {/* ── VOICE BANNER ────────────────────────────────────────────── */}
      {isListening && (
        <View style={s.voiceBanner}>
          <Animated.View
            style={[s.waveDot, {transform: [{scaleY: waveAnim.interpolate({inputRange: [0, 1], outputRange: [0.4, 1.6]})}]}]}
          />
          <Animated.View
            style={[s.waveDot, s.waveDot2, {transform: [{scaleY: waveAnim.interpolate({inputRange: [0, 1], outputRange: [1.2, 0.4]})}]}]}
          />
          <Animated.View
            style={[s.waveDot, {transform: [{scaleY: waveAnim.interpolate({inputRange: [0, 1], outputRange: [0.6, 1.4]})}]}]}
          />
          <Text style={s.voiceBannerText}>  Écoute en cours...</Text>
        </View>
      )}

      {/* ── CANVAS ──────────────────────────────────────────────────── */}
      <View style={s.canvasWrapper}>
        <TouchableOpacity
          activeOpacity={1}
          onPress={() => setSelectedId(null)}
          style={[s.canvas, {width: CANVAS_SIZE, height: CANVAS_SIZE}]}>

          {/* BG layer */}
          {layers
            .filter(l => l.type === 'bg')
            .map(layer => (
              <View
                key={layer.id}
                style={[StyleSheet.absoluteFill, {backgroundColor: layer.bg || layer.color || C.card, alignItems: 'center', justifyContent: 'center'}]}>
                <Text style={s.bgEmoji}>{layer.emoji || '🎨'}</Text>
                <Text style={s.bgLabel}>{layer.content}</Text>
              </View>
            ))}

          {/* Filter overlay */}
          {activeFilter !== 'none' && (
            <View style={[StyleSheet.absoluteFill, {backgroundColor: filterOverlay}]} pointerEvents="none" />
          )}

          {/* Movable layers (text, face, accessory) */}
          {layers
            .filter(l => l.type !== 'bg')
            .map(layer => {
              const isSelected = layer.id === selectedId;
              return (
                <Animated.View
                  key={layer.id}
                  style={[
                    s.movable,
                    {
                      transform: [{translateX: layer.x}, {translateY: layer.y}],
                      zIndex: layer.zIndex,
                      borderWidth: isSelected ? 2 : 0,
                      borderColor: C.neonPink,
                      borderStyle: 'dotted',
                    },
                  ]}
                  {...(layer.pan?.panHandlers ?? {})}>
                  {layer.type === 'text' && (
                    <Text
                      style={[
                        s.layerText,
                        {fontSize: layer.textSize ?? 32, color: layer.textColor ?? '#fff'},
                      ]}>
                      {layer.content}
                    </Text>
                  )}
                  {layer.type === 'face' && (
                    <View
                      style={[s.faceCircle, {backgroundColor: layer.color?.startsWith('file') || layer.color?.startsWith('content') ? 'transparent' : (layer.color || '#fed7aa')}]}>
                      <Text style={s.faceEmoji}>{layer.emoji || '😊'}</Text>
                    </View>
                  )}
                  {layer.type === 'accessory' && (
                    <Text style={s.accEmojiBig}>{layer.emoji}</Text>
                  )}
                  {isSelected && (
                    <TouchableOpacity style={s.delBtn} onPress={deleteSelected}>
                      <Text style={s.delBtnText}>✕</Text>
                    </TouchableOpacity>
                  )}
                </Animated.View>
              );
            })}

          {/* AI processing overlay */}
          {isProcessing && (
            <View style={s.overlay}>
              <View style={s.spinner} />
              <View style={s.progressBg}>
                <Animated.View style={[s.progressFill, {width: progressWidth}]} />
              </View>
              <Text style={s.overlayText}>{processingMsg}</Text>
            </View>
          )}

          {/* Empty state */}
          {layers.length === 0 && !isProcessing && (
            <View style={s.empty}>
              <Text style={s.emptyIcon}>🎨</Text>
              <Text style={s.emptyTitle}>Choisissez un modèle</Text>
              <Text style={s.emptyHint}>dans l'onglet Bases ci-dessous</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      {/* ── FILTER STRIP ────────────────────────────────────────────── */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={s.filterStrip}
        contentContainerStyle={s.filterStripInner}>
        {FILTERS.map(f => (
          <TouchableOpacity
            key={f.id}
            style={[s.filterChip, activeFilter === f.id && s.filterChipOn]}
            onPress={() => setActiveFilter(f.id)}>
            <Text style={s.filterChipIcon}>{f.emoji}</Text>
            <Text style={[s.filterChipLabel, activeFilter === f.id && s.filterChipLabelOn]}>
              {f.name}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* ── DRAWER ──────────────────────────────────────────────────── */}
      <View style={s.drawer}>
        <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">

          {/* TEMPLATES TAB */}
          {activeTab === 'templates' && (
            <View>
              <Text style={s.drawerTitle}>📦 Bases & Modèles</Text>
              <View style={s.tabRow}>
                {(['all', 'sticker', 'meme'] as FilterTab[]).map(t => (
                  <TouchableOpacity
                    key={t}
                    style={[s.tabPill, filterTab === t && s.tabPillOn]}
                    onPress={() => setFilterTab(t)}>
                    <Text style={[s.tabPillText, filterTab === t && s.tabPillTextOn]}>
                      {t === 'all' ? 'Tous' : t === 'sticker' ? 'Stickers' : 'Mèmes'}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
              <View style={s.grid}>
                {filteredTemplates.map(tmpl => (
                  <TouchableOpacity
                    key={tmpl.id}
                    style={[s.gridCell, {backgroundColor: tmpl.bg + '40'}]}
                    onPress={() => loadTemplate(tmpl)}>
                    <Text style={s.gridEmoji}>{tmpl.emoji}</Text>
                    <Text style={s.gridLabel}>{tmpl.name}</Text>
                  </TouchableOpacity>
                ))}
              </View>
              <TouchableOpacity style={s.outlineBtn} onPress={() => importGallery('bg')}>
                <Text style={s.outlineBtnText}>📂  Importer une Image / GIF</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* DEEPFAKE TAB */}
          {activeTab === 'deepfake' && (
            <View>
              <Text style={s.drawerTitle}>🤖 Deepfake & Visages</Text>
              <View style={s.card}>
                <Text style={s.cardTitle}>Caméra</Text>
                <TouchableOpacity style={s.primaryBtn} onPress={captureSelfie}>
                  <Text style={s.primaryBtnText}>📸  Prendre un Selfie</Text>
                </TouchableOpacity>
                <View style={s.spacer8} />
                <TouchableOpacity
                  style={[s.primaryBtn, {backgroundColor: C.neonCyan}]}
                  onPress={() => importGallery('face')}>
                  <Text style={s.primaryBtnText}>🖼️  Importer un Visage</Text>
                </TouchableOpacity>
              </View>

              <Text style={s.separator}>─── ou utiliser un visage prédéfini ───</Text>

              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.faceRow}>
                {FACES.map(face => (
                  <TouchableOpacity
                    key={face.id}
                    style={s.faceChip}
                    onPress={() => addFaceOverlay(face)}>
                    <View style={[s.faceChipCircle, {backgroundColor: face.color}]}>
                      <Text style={s.faceChipEmoji}>{face.emoji}</Text>
                    </View>
                    <Text style={s.faceChipName}>{face.name}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              <View style={s.card}>
                <Text style={s.cardTitle}>🧬 Fusion IA</Text>
                <Text style={s.hint}>
                  Après avoir ajouté un visage, faites-le glisser sur le canvas et positionnez-le sur le personnage. Sélectionnez-le puis appuyez sur ✕ pour le supprimer.
                </Text>
              </View>
            </View>
          )}

          {/* ELEMENTS TAB */}
          {activeTab === 'elements' && (
            <View>
              <Text style={s.drawerTitle}>✏️ Textes & Accessoires</Text>

              <View style={s.card}>
                <Text style={s.cardTitle}>Ajouter du Texte</Text>
                <View style={s.row}>
                  <TextInput
                    style={s.input}
                    placeholder="Votre texte de mème..."
                    placeholderTextColor={C.textMuted}
                    value={textInput}
                    onChangeText={setTextInput}
                    returnKeyType="done"
                    onSubmitEditing={() => {addTextLayer(textInput); setTextInput('');}}
                  />
                  <TouchableOpacity
                    style={s.addBtn}
                    onPress={() => {addTextLayer(textInput); setTextInput('');}}>
                    <Text style={s.addBtnText}>+</Text>
                  </TouchableOpacity>
                </View>
              </View>

              <Text style={s.cardTitle}>Accessoires Otaku & Mème</Text>
              <View style={s.accGrid}>
                {ACCESSORIES.map(acc => (
                  <TouchableOpacity
                    key={acc.id}
                    style={s.accCell}
                    onPress={() => addAccessory(acc)}>
                    <Text style={s.accCellEmoji}>{acc.emoji}</Text>
                    <Text style={s.accCellLabel}>{acc.name}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <View style={s.card}>
                <Text style={s.cardTitle}>🧠 Commande IA</Text>
                <Text style={s.hint}>Ex : "ajoute le texte WOW", "filtre glitch", "ajoute des lunettes"</Text>
                <View style={s.row}>
                  <TextInput
                    style={s.input}
                    placeholder="Entrer une commande..."
                    placeholderTextColor={C.textMuted}
                    value={commandInput}
                    onChangeText={setCommandInput}
                    returnKeyType="done"
                    onSubmitEditing={handleCommand}
                  />
                  <TouchableOpacity
                    style={[s.addBtn, {backgroundColor: C.neonCyan}]}
                    onPress={handleCommand}>
                    <Text style={s.addBtnText}>▶</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          )}

          {/* VOICE TAB */}
          {activeTab === 'voice' && (
            <View>
              <Text style={s.drawerTitle}>🎵 Studio Vocal IA</Text>
              <View style={s.card}>
                <Text style={s.cardTitle}>Texte à Synthétiser</Text>
                <TextInput
                  style={[s.input, s.inputMulti]}
                  placeholder="Entrez une phrase que le mème va prononcer..."
                  placeholderTextColor={C.textMuted}
                  value={voiceText}
                  onChangeText={setVoiceText}
                  multiline
                  numberOfLines={3}
                  textAlignVertical="top"
                />
              </View>

              <Text style={s.cardTitle}>Effet Vocal IA</Text>
              <View style={s.presetGrid}>
                {VOICE_PRESETS.map(p => (
                  <TouchableOpacity
                    key={p.id}
                    style={[s.presetBtn, voicePreset === p.id && s.presetBtnOn]}
                    onPress={() => setVoicePreset(p.id as VoicePreset)}>
                    <Text style={s.presetIcon}>{p.icon}</Text>
                    <Text style={[s.presetLabel, voicePreset === p.id && s.presetLabelOn]}>
                      {p.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <TouchableOpacity
                style={[s.primaryBtn, {backgroundColor: C.neonPink}]}
                onPress={() =>
                  Alert.alert(
                    '🎵 Voix générée',
                    `Preset "${voicePreset}" appliqué sur :\n"${voiceText || '(aucun texte saisi)'}"\n\nLa lecture audio native est disponible avec react-native-tts.`,
                  )
                }>
                <Text style={s.primaryBtnText}>▶  Générer et Jouer la Voix</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* EXPORT TAB */}
          {activeTab === 'export' && (
            <View>
              <Text style={s.drawerTitle}>💾 Exportation & Partage</Text>

              <View style={[s.card, {alignItems: 'center'}]}>
                <View style={[s.miniPreview, {backgroundColor: layers.find(l => l.type === 'bg')?.bg || C.card}]}>
                  <Text style={{fontSize: 42}}>{layers.find(l => l.type === 'bg')?.emoji || '🎨'}</Text>
                </View>
                <Text style={s.hint}>{layers.length > 0 ? `${layers.length} calque(s) sur le canvas` : 'Aucun contenu à exporter'}</Text>
                <Text style={s.watermark}>AI STUDIO CREATION</Text>
              </View>

              <TouchableOpacity
                style={s.primaryBtn}
                onPress={() =>
                  Alert.alert('✅ Sticker PNG', 'Exportation en PNG transparent réussie !\n\n(react-native-view-shot permet la capture réelle du canvas en production)')
                }>
                <Text style={s.primaryBtnText}>⬇  Sauvegarder Sticker (PNG)</Text>
              </TouchableOpacity>

              <View style={s.spacer8} />

              <TouchableOpacity
                style={[s.primaryBtn, {backgroundColor: C.neonPink}]}
                onPress={() =>
                  Alert.alert('✅ Mème JPEG', 'Exportation en JPEG réussie !')
                }>
                <Text style={s.primaryBtnText}>⬇  Sauvegarder Mème (JPEG)</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[s.outlineBtn, {marginTop: 10}]}
                onPress={() =>
                  Alert.alert('📤 Partage', 'Partage natif disponible via react-native-share.')
                }>
                <Text style={s.outlineBtnText}>📤  Partager (WhatsApp, Telegram...)</Text>
              </TouchableOpacity>
            </View>
          )}

          <View style={s.spacer24} />
        </ScrollView>
      </View>

      {/* ── BOTTOM NAVIGATION ───────────────────────────────────────── */}
      <View style={s.nav}>
        {(
          [
            {id: 'templates', icon: '📦', label: 'Bases'},
            {id: 'deepfake', icon: '🤖', label: 'Deepfake'},
            {id: 'elements', icon: '✏️', label: 'Éléments'},
            {id: 'voice', icon: '🎵', label: 'Voix'},
            {id: 'export', icon: '💾', label: 'Exporter'},
          ] as {id: NavTab; icon: string; label: string}[]
        ).map(tab => (
          <TouchableOpacity
            key={tab.id}
            style={[s.navItem, activeTab === tab.id && s.navItemOn]}
            onPress={() => setActiveTab(tab.id)}>
            <Text style={s.navIcon}>{tab.icon}</Text>
            <Text style={[s.navLabel, activeTab === tab.id && s.navLabelOn]}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </SafeAreaView>
  );
}

// ─── STYLES ───────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  root: {flex: 1, backgroundColor: C.bg},

  // Header
  header: {
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: C.border,
    backgroundColor: 'rgba(7,5,15,0.97)',
  },
  headerLeft: {flexDirection: 'row', alignItems: 'center'},
  pulseDot: {
    width: 9,
    height: 9,
    borderRadius: 5,
    backgroundColor: C.neonPink,
    marginRight: 8,
    elevation: 4,
  },
  logo: {
    fontSize: 20,
    fontWeight: '900',
    color: C.textPrimary,
    letterSpacing: 3,
  },
  logoAccent: {color: C.neonPurple},
  headerRight: {flexDirection: 'row', alignItems: 'center'},
  micBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: C.glass,
    borderWidth: 1,
    borderColor: C.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  micBtnOn: {borderColor: C.neonPink, backgroundColor: 'rgba(236,72,153,0.18)'},
  micBtnText: {fontSize: 16},
  badge: {
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: 'rgba(6,182,212,0.12)',
    borderWidth: 1,
    borderColor: C.neonCyan,
  },
  badgeBusy: {backgroundColor: 'rgba(245,158,11,0.12)', borderColor: C.neonYellow},
  badgeText: {fontSize: 10, fontWeight: '700', color: C.neonCyan, letterSpacing: 0.8},
  badgeBusyText: {color: C.neonYellow},

  // Voice banner
  voiceBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    backgroundColor: C.neonPurple,
  },
  waveDot: {width: 4, height: 20, backgroundColor: 'rgba(255,255,255,0.8)', borderRadius: 3, marginHorizontal: 3},
  waveDot2: {height: 28},
  voiceBannerText: {color: '#fff', fontWeight: '700', fontSize: 13},

  // Canvas
  canvasWrapper: {alignItems: 'center', paddingVertical: 10},
  canvas: {
    backgroundColor: C.card,
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: C.border,
    elevation: 10,
  },
  bgEmoji: {fontSize: 72},
  bgLabel: {color: 'rgba(255,255,255,0.2)', fontSize: 11, marginTop: 4},

  // Movable layer
  movable: {position: 'absolute', alignItems: 'center', justifyContent: 'center', borderRadius: 6, padding: 2},
  layerText: {
    fontFamily: Platform.OS === 'android' ? 'sans-serif-black' : 'Arial',
    fontWeight: '900',
    textAlign: 'center',
    textShadowColor: '#000',
    textShadowOffset: {width: 2, height: 2},
    textShadowRadius: 5,
  },
  faceCircle: {width: 86, height: 86, borderRadius: 43, alignItems: 'center', justifyContent: 'center'},
  faceEmoji: {fontSize: 40},
  accEmojiBig: {fontSize: 50},
  delBtn: {
    position: 'absolute',
    top: -10,
    right: -10,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#ef4444',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 5,
  },
  delBtnText: {color: '#fff', fontSize: 11, fontWeight: '900'},

  // Processing overlay
  overlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(7,5,15,0.87)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  spinner: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 3,
    borderColor: C.neonPurple,
    borderTopColor: C.neonPink,
    marginBottom: 12,
  },
  progressBg: {
    width: '60%',
    height: 4,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 10,
  },
  progressFill: {height: 4, backgroundColor: C.neonPurple, borderRadius: 4},
  overlayText: {color: C.textSecondary, fontSize: 12, letterSpacing: 0.8},

  // Empty state
  empty: {flex: 1, alignItems: 'center', justifyContent: 'center'},
  emptyIcon: {fontSize: 50, marginBottom: 10},
  emptyTitle: {color: C.textSecondary, fontSize: 14, fontWeight: '600'},
  emptyHint: {color: C.textMuted, fontSize: 12, marginTop: 4},

  // Filter strip
  filterStrip: {maxHeight: 50, flexGrow: 0},
  filterStripInner: {paddingHorizontal: 12, alignItems: 'center'},
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: C.glass,
    borderWidth: 1,
    borderColor: C.border,
    marginRight: 8,
  },
  filterChipOn: {backgroundColor: C.neonPurple, borderColor: C.neonPurple},
  filterChipIcon: {fontSize: 13, marginRight: 4},
  filterChipLabel: {fontSize: 12, color: C.textSecondary, fontWeight: '600'},
  filterChipLabelOn: {color: '#fff'},

  // Drawer
  drawer: {
    flex: 1,
    backgroundColor: 'rgba(7,5,15,0.97)',
    borderTopWidth: 1,
    borderTopColor: C.border,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    paddingHorizontal: 16,
    paddingTop: 14,
  },
  drawerTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: C.textPrimary,
    marginBottom: 12,
    borderLeftWidth: 3,
    borderLeftColor: C.neonPink,
    paddingLeft: 8,
  },
  tabRow: {flexDirection: 'row', marginBottom: 12},
  tabPill: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: C.border,
    backgroundColor: C.glass,
    marginRight: 8,
  },
  tabPillOn: {backgroundColor: C.neonPurple, borderColor: C.neonPurple},
  tabPillText: {color: C.textSecondary, fontSize: 12, fontWeight: '600'},
  tabPillTextOn: {color: '#fff'},

  grid: {flexDirection: 'row', flexWrap: 'wrap', marginBottom: 12},
  gridCell: {
    width: (CANVAS_SIZE - 20) / 3,
    aspectRatio: 1,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: C.border,
    alignItems: 'center',
    justifyContent: 'center',
    margin: 3,
  },
  gridEmoji: {fontSize: 28},
  gridLabel: {color: C.textSecondary, fontSize: 10, textAlign: 'center', marginTop: 3},

  card: {
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: C.border,
    marginBottom: 12,
  },
  cardTitle: {fontSize: 12, color: C.neonCyan, textTransform: 'uppercase', letterSpacing: 1, fontWeight: '700', marginBottom: 10},
  hint: {color: C.textMuted, fontSize: 12, lineHeight: 18},
  separator: {textAlign: 'center', color: C.textMuted, fontSize: 11, marginVertical: 10},

  faceRow: {marginBottom: 12},
  faceChip: {alignItems: 'center', marginRight: 14},
  faceChipCircle: {width: 58, height: 58, borderRadius: 29, alignItems: 'center', justifyContent: 'center', marginBottom: 4},
  faceChipEmoji: {fontSize: 28},
  faceChipName: {color: C.textSecondary, fontSize: 11},

  row: {flexDirection: 'row', alignItems: 'center'},
  input: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: Platform.OS === 'android' ? 8 : 10,
    color: C.textPrimary,
    fontSize: 14,
    marginRight: 8,
  },
  inputMulti: {height: 72, marginRight: 0},
  addBtn: {
    width: 42,
    height: 42,
    borderRadius: 8,
    backgroundColor: C.neonPurple,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 4,
  },
  addBtnText: {color: '#fff', fontSize: 22, fontWeight: '900', lineHeight: 26},

  accGrid: {flexDirection: 'row', flexWrap: 'wrap', marginBottom: 12},
  accCell: {
    width: (CANVAS_SIZE - 28) / 3,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: C.border,
    backgroundColor: C.glass,
    alignItems: 'center',
    margin: 3,
  },
  accCellEmoji: {fontSize: 26},
  accCellLabel: {color: C.textSecondary, fontSize: 10, marginTop: 3, textAlign: 'center'},

  presetGrid: {flexDirection: 'row', flexWrap: 'wrap', marginBottom: 14},
  presetBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: C.border,
    backgroundColor: C.glass,
    margin: 4,
  },
  presetBtnOn: {backgroundColor: C.neonPurple, borderColor: C.neonPurple},
  presetIcon: {fontSize: 16, marginRight: 6},
  presetLabel: {color: C.textSecondary, fontSize: 12, fontWeight: '600'},
  presetLabelOn: {color: '#fff'},

  miniPreview: {
    width: 100,
    height: 100,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
    borderWidth: 1,
    borderColor: C.border,
  },
  watermark: {color: 'rgba(255,255,255,0.18)', fontSize: 9, letterSpacing: 1, fontWeight: '700', marginTop: 4},

  primaryBtn: {
    backgroundColor: C.neonPurple,
    borderRadius: 10,
    paddingVertical: 13,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 6,
  },
  primaryBtnText: {color: '#fff', fontWeight: '700', fontSize: 14},

  outlineBtn: {
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: C.border,
  },
  outlineBtnText: {color: C.textSecondary, fontSize: 13},

  spacer8: {height: 8},
  spacer24: {height: 24},

  // Bottom nav
  nav: {
    height: 60,
    flexDirection: 'row',
    backgroundColor: 'rgba(7,5,15,0.98)',
    borderTopWidth: 1,
    borderTopColor: C.border,
    elevation: 10,
  },
  navItem: {flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 6},
  navItemOn: {backgroundColor: 'rgba(139,92,246,0.12)'},
  navIcon: {fontSize: 18},
  navLabel: {fontSize: 9, color: C.textMuted, fontWeight: '600', marginTop: 2},
  navLabelOn: {color: C.neonPurple},
});
