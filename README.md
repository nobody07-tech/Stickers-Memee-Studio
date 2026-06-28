# AI STUDIO - Générateur de Memes Multimodal [ICT202 G1/G2]

## 📝 Présentation
Application mobile cross-platform (React Native) permettant de générer du contenu humoristique (mèmes/stickers) en utilisant l'intelligence artificielle (Groq Llama 3 & Pollinations AI).

## 🚀 Fonctionnalités
### Core (Obligatoire)
- **Context Reader** : Analyse une discussion textuelle pour suggérer un mème.
- **Voice-to-Meme** : Transcription audio (simulée) et enrichissement par IA.
- **Status Remixer** : Import d'images et génération automatique de légendes "POV".

### Bonus
- **Génération d'images par IA** : Création de fonds de mèmes à partir de prompts textuels.
- **Localisation Culturelle** : Switch permettant d'activer l'humour et l'argot local (Cameroun/Afrique).
- **Studio d'édition** : Ajout d'accessoires (lunettes, laser eyes) et filtres (Néon, Glitch).

## 🛠️ Stack Technique
- **Frontend** : React Native (0.86), TypeScript, Animated API.
- **Backend** : Node.js, Express.js, Multer (gestion fichiers).
- **IA** : Groq API (Llama 3), Pollinations AI (Diffusion).

## ⚙️ Installation

### 1. Serveur Backend
```bash
cd backend
npm install
# Assurez-vous que le fichier .env contient votre GROQ_API_KEY
npm start
```

### 2. Application Mobile
```bash
# Dans le dossier racine
npm install
npm start
# Appuyez sur 'a' pour lancer sur Android (Emulateur ou physique via USB)
```

## 🌐 Configuration Réseau
Pour le test sur téléphone physique :
1. Connectez le PC et le téléphone sur le même Wi-Fi.
2. L'IP actuelle configurée est : `192.168.228.175`.
3. Modifiez `API_URL` dans `App.tsx` si votre adresse IP change.

## 👥 Équipe
**Groupe ICT202 G2 / G1**
🏆 Projet de Développement Mobile - 2024
