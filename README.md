# BeatMe 🥁✨

**BeatMe** is a next-generation web-based drum sequencer that fuses classic groovebox workflows with the power of Generative AI. 

Compose beats manually using a professional step sequencer, or simply describe a vibe (e.g., *"Lo-fi hip hop beat with heavy swing"* or *"Fast-paced Berlin techno"*) and watch Google's Gemini AI dream up the pattern for you.

![BeatMe Interface](https://via.placeholder.com/1200x600/111827/38bdf8?text=BeatMe+Interface+Screenshot)

## 🚀 Key Features

### 🧠 AI-Powered Composition
- **Text-to-Beat**: Powered by **Google Gemini 2.5 Flash**. Just type a prompt, and the AI generates a multi-track pattern instantly.
- **Context Aware**: The AI understands musical genres, tempo, and instrument roles.

### 🎛️ Professional Audio Engine
- **Sample-Accurate Timing**: Built on the native Web Audio API for precise playback.
- **Sonic Control**: Per-track **Volume**, **Mute**, and **Pitch Tuning** (-12/+12 semitones).
- **Groove & Effects**: Global **Swing** (MPC-style) and Master **Reverb**.
- **Dynamics**: Integrated Master Compressor/Limiter to keep your beats loud and punchy without clipping.

### 🎹 Advanced Sequencing
- **Pattern Banking**: Switch instantly between 4 unique patterns (A, B, C, D) to build verses, choruses, and breakdowns.
- **Polyrhythms & Odd Meters**: Support for custom time signatures (3/4, 5/4, 7/8) and step counts (4 to 64 steps).
- **Dynamic Tracks**: Add or remove instruments (Kick, Snare, Hats, Toms, Cymbals) to build your custom kit.
- **Multiple Kits**: Switch between classic drum machines (CR78, KPR77, LinnDrum, Roland R8).

### 💾 Persistence
- **Auto-Save**: Your session is automatically saved to your browser's LocalStorage.
- **Export/Import**: Download your projects as `.json` files to share or backup.
- **Privacy First**: All audio processing happens in the browser. No personal data is stored on any server.

## 🛠️ Tech Stack

- **Frontend**: React 18, TypeScript, Vite
- **Styling**: Tailwind CSS
- **AI**: Google GenAI SDK (`@google/genai`)
- **Audio**: Native Web Audio API (AudioContext, GainNode, ConvolverNode)

## 📦 Getting Started

### Prerequisites
- Node.js (v18 or higher)
- A Google AI Studio API Key (for AI features)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/beatme.git
   cd beatme
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure Environment**
   Create a `.env` file in the root directory (if using Vite/local setup) or configure your Vercel Environment Variables:
   ```env
   # Get your key at https://aistudio.google.com/
   API_KEY=your_google_gemini_api_key_here
   ```
   *Note: In the provided source code structure, ensure your bundler injects `process.env.API_KEY`.*

4. **Run Local Server**
   ```bash
   npm run start
   # or
   npm run dev
   ```

## 🎮 Usage Guide

1. **Manual Sequencing**: Click the grid pads to toggle steps. Use the **Volume** and **Tune** sliders on the left to mix your kit.
2. **AI Generation**: Type a prompt in the bottom bar (e.g., *"House beat with syncopated hats"*) and click **Dream**.
3. **Banking**: Use the **A / B / C / D** buttons to switch variations. Use the dropdown to **Copy** the current bank to another slot.
4. **Swing**: Adjust the **Swing** slider to push even-numbered 16th notes off-grid for a "human" feel.
5. **Saving**: Click **Export** to save your project file. Click the **Trash** icon to factory reset the app.

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

Distributed under the MIT License. See `LICENSE` for more information.

---

*Built with ❤️ using React and Google Gemini.*
