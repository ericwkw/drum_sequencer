## Support me: https://ko-fi.com/ericwkw

# BeatMe 🥁✨

**BeatMe** is a professional-grade web drum sequencer that fuses classic groovebox workflows with the power of Generative AI. 

Designed for musicians and producers, it runs entirely in the browser using the Web Audio API. You can compose beats manually using the step sequencer, or describe a vibe (e.g., *"Lo-fi hip hop beat with heavy swing"* or *"Fast-paced Berlin techno"*) and watch **Google Gemini** dream up the pattern for you.

![BeatMe Interface](https://via.placeholder.com/1200x600/111827/38bdf8?text=BeatMe+Sequencer+Screenshot)

## 🚀 Key Features

### 🎧 Pro Audio Engine
- **9-Track Drum Kit**: Full sequencing for Kick, Snare, Hi-Hat, Open Hat, Clap, High Tom, Low Tom, Crash, and Ride.
- **Channel Mixer**: Individual **Volume** faders and **Pitch/Tuning** knobs (-12 to +12 semitones) for every track.
- **Master Effects**:
  - **Reverb**: Convolution reverb with adjustable send level.
  - **Compressor**: Integrated master bus compression for punchy, loud mixes.
  - **Swing**: Global MPC-style swing parameter to humanize your rhythms.

### 🧠 AI Composer
- **Text-to-Beat**: Powered by **Google Gemini 2.5 Flash**. Just type a prompt, and the AI generates a full multi-track pattern instantly.
- **Smart Mapping**: The AI understands specific instrument roles (e.g., syncing open hats with kicks) and genre-specific tempos.

### 🎹 Advanced Sequencing
- **Pattern Banking**: 4 distinct banks (**A, B, C, D**) per project. Create variations for Verses, Choruses, and Drops and switch instantly.
- **Polyrhythms & Odd Meters**: Support for custom time signatures (3/4, 5/4, 7/8) and adjustable step counts (4 to 64 steps).
- **Vintage Kits**: Switch between legendary drum machine sounds:
  - **Classic (CR-78)**: The warmth of early analog rhythm boxes.
  - **Analog (KPR-77)**: Raw, metallic analog textures.
  - **Digital (TR-808)**: The industry-standard boom and snap of the 80s.

### 💾 Workflow & Persistence
- **Auto-Save**: Your session (patterns, mixer settings, kit selection) is automatically saved to LocalStorage.
- **Project Management**: Name your projects and **Export/Import** them as JSON files to share or backup.
- **Privacy First**: All audio processing happens client-side. No user data is stored on our servers.

## 🛠️ Tech Stack

- **Frontend**: React 18, TypeScript, Vite
- **Styling**: Tailwind CSS
- **AI**: Google GenAI SDK (`@google/genai`)
- **Audio**: Native Web Audio API (`AudioContext`, `GainNode`, `ConvolverNode`)

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
   Create a `.env` file in the root directory (or configure Vercel environment variables):
   ```env
   # Get your key at https://aistudio.google.com/
   API_KEY=your_google_gemini_api_key_here
   ```

4. **Run Local Server**
   ```bash
   npm run start
   ```

## 🎮 Quick Guide

1. **The Grid**: Click the pads to toggle steps. Use **Shift + Click** to clear an entire row.
2. **The Mixer**: 
   - Drag the **Slider** to adjust volume.
   - Drag the **Tune** knob (purple) to pitch samples up or down.
   - Click **M** to mute a track.
3. **AI Generation**: Type a prompt in the bottom bar (e.g., *"Syncopated house beat"*) and click **Dream**.
4. **Arrangement**: Use the **A / B / C / D** buttons to switch pattern banks. Use the dropdown to **Copy** the current bank to a new slot.
5. **Saving**: Click **Export** to save your project file.

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License

Distributed under the MIT License.
