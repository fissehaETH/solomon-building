
# Solomon Building Materials Management System

Premium Android-optimized PWA for managing sales, inventory, and logistics for building materials professionals.

## 🚀 Quick Start

To run this project locally on your machine, follow these steps:

### 1. Prerequisites
Ensure you have **Node.js** (v18 or higher) and **npm** installed.

### 2. Installation
Open your terminal in the project root directory and run:
```bash
npm install
```

### 3. Set API Key
The application requires a Google Gemini API key to generate business insights.
Create a `.env` file in the root directory:
```env
API_KEY=your_gemini_api_key_here
```

### 4. Start Development Server
```bash
npm run dev
```
The app will be available at `http://localhost:3000`.

## 📱 Android Deployment
Since this is a Progressive Web App (PWA):
1. Host the project on a HTTPS-enabled server (like Vercel or Netlify).
2. Open the URL in Chrome on Android.
3. Tap the **Menu (three dots)** and select **"Add to Home Screen"**.
4. The app will now appear in your drawer and launch as a standalone, fullscreen experience.

## 🛠 Tech Stack
- **Framework**: React 19
- **Bundler**: Vite
- **Styling**: Tailwind CSS
- **Database**: IndexedDB (Local) + Google Apps Script (Remote Sync)
- **AI**: Google Gemini API
- **Icons**: Lucide React
- **Charts**: Recharts
