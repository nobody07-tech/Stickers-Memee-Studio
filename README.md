# AI Studio - Générateur de memes multimodal

AI Studio est une application mobile cross-platform développée avec React Native, conçue pour générer des créations humoristiques à partir de texte, d’audio et d’images. Le projet combine une interface mobile moderne à un backend Node.js/Express qui appelle des services d’intelligence artificielle pour produire des légendes de mèmes, transcrire des voix et analyser des images.

## Vue d’ensemble

Cette application permet à un utilisateur de :
- saisir un texte et obtenir une légende de mème générée par IA,
- enregistrer une voix pour obtenir une transcription et une légende sarcastique,
- choisir une photo depuis la galerie pour générer une légende à partir du contenu visuel,
- générer une image de fond à partir d’un prompt textuel,
- manipuler les textes directement sur un canvas interactif.

Le projet a été conçu comme une application de démonstration pédagogique pour l’ICT202, avec une architecture simple et facilement extensible.

## Fonctionnalités implémentées

### 1. Analyse de contexte (texte)
L’utilisateur saisit un prompt ou un contexte. Le backend envoie ce texte à l’API Groq et retourne une légende courte et humoristique adaptée au contexte.

### 2. Voice-to-Meme (audio)
L’application permet d’enregistrer un audio depuis le microphone. Le fichier est envoyé au backend, transcrit via Whisper puis transformé en légende de mème.

### 3. Status Remixer (image)
L’utilisateur peut sélectionner une image depuis la galerie. Le backend l’analyse avec une IA de vision et génère une légende humoristique de type “POV”.

### 4. Génération d’images IA
À partir d’un prompt texte, l’application peut produire une image générative via Pollinations AI et l’afficher comme fond du canvas.

### 5. Interface interactive
Le canvas permet :
- de déplacer les textes par glisser-déposer,
- de les sélectionner,
- de les supprimer,
- de remettre à zéro la composition.

### 6. Mode culturel
Un toggle permet d’ajuster le style du humour vers un ton plus local, avec des références culturelles adaptées.

## Stack technique

### Frontend mobile
- React Native 0.86
- TypeScript
- React Native Image Picker
- React Native Audio Recorder Player
- React Native FS
- React Native Linear Gradient
- React Native SVG
- React Native Safe Area Context

### Backend
- Node.js
- Express.js
- Multer
- Axios
- dotenv
- FormData

### Services IA
- Groq API pour le traitement texte, audio et vision
- Pollinations AI pour la génération d’images

## Structure du projet

```text
.
├── App.tsx                  # Vue principale de l’application
├── index.js                 # Point d’entrée React Native
├── package.json             # Dépendances et scripts frontend
├── app.json                 # Configuration de l’application
├── android/                 # Projet natif Android
├── ios/                     # Projet natif iOS
├── backend/
│   ├── index.js             # Serveur Express et endpoints API
│   ├── package.json         # Dépendances backend
│   └── uploads/             # Stockage temporaire des fichiers uploadés
├── __tests__/
│   └── App.test.tsx         # Test de base de l’application
└── README.md
```

## Prérequis

Avant de lancer le projet, assurez-vous d’avoir :
- Node.js 22.x ou plus
- npm ou yarn
- Android Studio avec SDK Android installé
- Xcode (uniquement pour la cible iOS, sur macOS)
- Un appareil Android/iPhone ou des émulateurs fonctionnels
- Une clé API Groq valide

## Configuration

### 1. Backend
Dans le dossier backend, créez un fichier .env avec la variable suivante :

```env
GROQ_API_KEY=votre_cle_api_groq
PORT=3000
```

Ensuite installez les dépendances :

```bash
cd backend
npm install
```

### 2. Frontend
Depuis la racine du projet :

```bash
npm install
```

## Exécution en développement

### Démarrer le backend
```bash
cd backend
npm start
```

Le serveur sera accessible sur :
- http://localhost:3000
- http://<votre-ip-local>:3000

### Démarrer l’application mobile
Dans une autre fenêtre terminal :

```bash
npm start
```

Puis lancer l’application sur la plateforme souhaitée :

```bash
npm run android
```

ou

```bash
npm run ios
```

> Important : l’application frontend pointe vers une URL API définie dans App.tsx. Si vous utilisez un appareil physique ou un émulateur distant, mettez à jour la constante API_URL avec l’adresse IP locale de votre machine sur le même réseau.

## Compilation et build

### Android
```bash
npm run build:apk
```

Ou directement :

```bash
cd android
./gradlew assembleDebug
```

### iOS
Après installation des pods si nécessaire :

```bash
cd ios
pod install
cd ..
npm run ios
```

## Dépendances principales

### Frontend
- @react-native/new-app-screen
- react
- react-native
- react-native-audio-recorder-player
- react-native-fs
- react-native-image-picker
- react-native-linear-gradient
- react-native-safe-area-context
- react-native-sound
- react-native-svg

### Backend
- express
- cors
- dotenv
- multer
- axios
- openai

## Limitations actuelles

Le projet est fonctionnel comme prototype, mais plusieurs limites restent visibles :
- l’URL de l’API est codée en dur dans le frontend,
- les fichiers uploadés sont stockés localement dans le backend,
- il n’existe pas encore de base de données persistante,
- la logique UI est concentrée dans un seul composant principal,
- le système n’a pas encore de gestion avancée d’authentification ou de sessions,
- les tests sont très basiques.

## Améliorations futures

Voici quelques pistes d’évolution :
- modulariser l’interface en composants réutilisables,
- ajouter une base de données pour sauvegarder les créations,
- introduire un système d’authentification,
- améliorer la gestion des erreurs et du fallback IA,
- ajouter un export réel vers la galerie ou le partage,
- permettre l’enregistrement et la lecture de créations multiples,
- intégrer une vraie pipeline de production et de CI/CD.

## Déploiement

### Android
1. Générer un build de débogage ou de release.
2. Vérifier la signature Android et les variables de build.
3. Installer l’APK sur un appareil ou le distribuer via un store interne.

### iOS
1. Configurer les profils de signature Apple.
2. Vérifier les permissions microphone et photo.
3. Builder l’application depuis Xcode et la distribuer via TestFlight ou l’App Store.

## Auteurs

Projet développé dans le cadre du cours ICT202 par l’équipe de développement du groupe G1/G2.

## Licence

Ce projet est fourni à des fins pédagogiques et de démonstration.

