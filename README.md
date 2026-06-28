# AI STUDIO - Generateur de Memes Multimodal [ICT202 G1/G2]

Le code source du serveur (Backend) se trouve dans le dossier /backend situe a la racine du projet.

## Presentation du Projet
Ce projet consiste en une application mobile cross-platform developpee avec React Native, integree a un serveur backend Express.js. L'objectif est de fournir un outil capable de generer du contenu humoristique de type meme en exploitant des services d'intelligence artificielle pour le texte, l'audio et l'image.

## Fonctionnalites Principales (Core)

### Context Reader (Texte)
Analyse d'un extrait de discussion ou d'un texte saisi par l'utilisateur. Le backend utilise l'API Groq (modele Llama 3.3) pour interpreter le contexte et suggerer une legende adaptee.

### Voice-to-Meme (Audio)
Enregistrement d'une note vocale via le microphone de l'appareil. Le fichier est transmis au backend pour transcription et generation d'un texte de meme sarcastique base sur le contenu detecte.

### Status Remixer (Image)
Importation d'une image depuis la galerie du telephone. L'application envoie l'image au backend pour generer une legende de type POV humoristique generee par l'IA.

## Fonctionnalites Avancees (Bonus)

### Generation d'images par IA
Integration de Pollinations AI pour creer des images de fond uniques a partir d'un prompt textuel fourni par l'utilisateur.

### Localisation Culturelle
Option permettant d'activer un mode d'humour specifique. L'IA adapte ses reponses en utilisant des expressions et des references culturelles locales (Cameroun et Afrique centrale).

## Architecture et Stack Technique

### Frontend Mobile
- Framework : React Native 0.86
- Langage : TypeScript
- Gestion des gestes : PanResponder pour le deplacement des calques.
- Image : react-native-image-picker.

### Backend (API Gateway)
- Runtime : Node.js
- Framework : Express.js
- Gestion de fichiers : Multer.
- Client HTTP : Axios.

### Services IA
- NLP / Texte : Groq Cloud API (Llama 3.3 70b).
- Image : Pollinations AI (Diffusion).

## Installation et Configuration

### Pre-requis
- Node.js (Version 22 ou superieure)
- Android Studio / SDK Android
- Une cle API Groq Cloud valide

### Configuration du Backend
1. Naviguer dans le dossier backend : cd backend
2. Installer les dependances : npm install
3. Creer un fichier .env et y ajouter la cle API :
   GROQ_API_KEY=votre_cle_ici
   PORT=3000
4. Lancer le serveur : npm start

### Configuration de l'Application Mobile
1. Revenir a la racine du projet.
2. Installer les dependances : npm install
3. Dans le fichier App.tsx, verifier que la constante API_URL correspond a l'adresse IP de votre machine sur le reseau Wi-Fi (actuellement configuree sur 192.168.228.175).
4. Lancer Metro Bundler : npm start
5. Lancer l'application sur Android : npm run android

## Guide d'utilisation
1. Canvas : Appuyer sur un element textuel pour le selectionner et le deplacer.
2. IA : Saisir un texte puis cliquer sur Analyse Texte ou Image IA.
3. Reset : Utiliser le bouton RESET pour vider le canvas.
4. Export : Cliquer sur Sauvegarder pour simuler l'enregistrement dans la galerie.

## Equipe
Groupe ICT202 G2 / G1
Projet de Developpement Mobile - 2024
