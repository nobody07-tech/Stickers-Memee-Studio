# AI STUDIO - Generateur de Memes Multimodal [ICT202 G1/G2]

Le code source du serveur (Backend) se trouve dans le dossier /backend situe a la racine du projet.

## 1. Presentation du Projet
Ce projet est une application mobile developpee avec React Native (Frontend) et Node.js/Express (Backend). Elle permet la creation de memes via l'intelligence artificielle en traitant des donnees textuelles, audio et visuelles.

## 2. Fonctionnalites Principales (Core)

### Context Reader (Texte)
Analyse de texte saisi pour generer une legende humoristique adaptee. Utilise le modele Llama 3.3 via l'API Groq.

### Voice-to-Meme (Audio)
Enregistrement vocal traite par le modele Whisper (OpenAI via Groq) pour la transcription, suivi d'une generation de legende sarcastique.

### Status Remixer (Image)
Analyse d'une image importee via le modele Llama Vision pour generer une legende de type "Point of View" (POV) coherente avec le contenu visuel.

## 3. Fonctionnalites Avancees (Bonus)

### Generation d'images par IA
Creation de fonds de memes originaux a partir de descriptions textuelles via Pollinations AI.

### Localisation Culturelle
Adaptation de l'humour et du vocabulaire aux references locales (Cameroun et Afrique Centrale) via des instructions specifiques envoyees aux modeles d'IA.

## 4. Stack Technique

### Frontend
- React Native 0.86
- TypeScript
- Animated API (Mouvements fluides)
- Image Picker (Gestion de la galerie)

### Backend
- Node.js / Express
- Multer (Gestion des uploads multimedias)
- Groq Cloud SDK (Whisper, Llama 3.3, Llama Vision)

## 5. Installation et Lancement

### Configuration du Backend
1. Acceder au repertoire : `cd backend`
2. Installer les modules : `npm install` # Installe Express, Multer, Axios et Dotenv
3. Configurer les variables d'environnement :
   Creer un fichier `.env` dans le dossier /backend avec :
   `GROQ_API_KEY=votre_cle_api`
   `PORT=3000`
4. Demarrer le serveur : `npm start` # Le serveur ecoute sur le port 3000

### Configuration du Frontend
1. Revenir a la racine : `cd ..`
2. Installer les dependances : `npm install` # Installe React Native et les plugins
3. Configurer l'adresse IP :
   Dans `App.tsx`, modifier la constante `API_URL` avec l'adresse IP locale du PC (ex: 192.168.228.175).
4. Lancer Metro : `npm start` # Demarre le gestionnaire de paquets React Native
5. Executer sur Android : `npm run android` # Compile et installe l'application sur l'appareil

## 6. Guide de Demonstration
1. Saisie : Entrer un contexte dans le champ texte.
2. IA : Cliquer sur Analyse Texte pour une legende ou Image IA pour un fond.
3. Vocal : Utiliser le bouton micro pour simuler/effectuer un enregistrement.
4. Edition : Deplacer les textes sur le canvas avec le doigt. Selection par simple toucher.
5. Reset : Bouton en haut a droite pour recommencer a zero.
6. Export : Onglet Export pour sauvegarder la creation finale.

## Equipe
Groupe ICT202 G2 / G1
Projet de Developpement Mobile - 2024
