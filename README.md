# BeatMe 🥁✨

**BeatMe** is a professional-grade web drum sequencer that fuses classic groovebox workflows with the power of Generative AI. 

Designed for musicians and producers, it runs entirely in the browser using the Web Audio API. You can compose beats manually using the step sequencer, or describe a vibe (e.g., *"Lo-fi hip hop beat with heavy swing"* or *"Fast-paced Berlin techno"*) and watch an **LLM** dream up the pattern for you.

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
- **Text-to-Beat**: Provider-agnostic — talks to any OpenAI-compatible chat-completions endpoint (OpenRouter, Gemini's OpenAI-compat endpoint, etc.), config-driven via `.env`. Just type a prompt, and the AI generates a full multi-track pattern instantly.
- **Smart Mapping**: The AI understands specific instrument roles (e.g., syncing open hats with kicks) and genre-specific tempos.
- **Retries on bad output**: an invalid response gets one nudged retry before failing.
- **Offline fallback**: no API key configured? Dream still works, generating from a built-in deterministic pattern instead of blocking the feature.

### 🎹 Advanced Sequencing
- **Pattern Banking**: 4 distinct banks (**A, B, C, D**) per project. Create variations for Verses, Choruses, and Drops and switch instantly.
- **Polyrhythms & Odd Meters**: Support for custom time signatures (3/4, 5/4, 7/8) and adjustable step counts (4 to 64 steps).
- **Vintage Kits**: Switch between three kick/snare/hihat sample sets:
  - **Classic (CR-78)**: Full CR-78 samples for every instrument.
  - **Analog (KPR-77)**: Real KPR-77 kick/snare/hihat; other instruments fall back to CR-78 (the host doesn't serve the rest of the KPR-77 set).
  - **Hybrid (Safe)**: KPR-77 kick/snare over CR-78 percussion — not an actual TR-808 sample set, just the closest punchy combination available from reliable sources.
  
  Crash and ride are approximated from CR-78 tom/hihat samples in all three kits — there's no dedicated cymbal sample source wired up yet.

### 💾 Workflow & Persistence
- **Auto-Save**: Your session (patterns, mixer settings, kit selection) is automatically saved to LocalStorage.
- **Project Management**: Name your projects and **Export/Import** them as JSON files to share or backup.
- **Privacy First**: All audio processing happens client-side. No user data is stored on our servers.

## 🛠️ Tech Stack

- **Frontend**: React 18, TypeScript, Vite
- **Styling**: Tailwind CSS
- **AI**: Plain `fetch` against any OpenAI-compatible `/chat/completions` endpoint — no vendor SDK
- **Audio**: Native Web Audio API (`AudioContext`, `GainNode`, `ConvolverNode`)

## 📦 Getting Started

### Prerequisites
- Node.js (v18 or higher)
- An API key for AI generation (optional — Dream falls back to an offline generator without one)

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

3. **Configure Environment (optional)**
   AI generation talks to any OpenAI-compatible `/chat/completions` endpoint. Create a
   `.env` file in the root directory (or configure Vercel environment variables) to point
   it at a provider:
   ```env
   # OpenRouter (default) — get a free key at https://openrouter.ai/keys
   API_KEY=your_openrouter_key_here
   # LLM_BASE_URL and LLM_MODEL default to OpenRouter + a free GLM model; override to
   # use a different provider, e.g. Gemini's OpenAI-compatible endpoint:
   # LLM_BASE_URL=https://generativelanguage.googleapis.com/v1beta/openai
   # LLM_MODEL=gemini-2.5-flash
   ```
   No key? Dream still works — it falls back to a built-in offline pattern generator.

   Note: this key is compiled directly into the client bundle at build time (there's no
   backend proxy), so it is visible to anyone who inspects the deployed app. Use a free
   or low-limit key.

4. **Run Local Server**
   ```bash
   npm run dev
   ```

### Other Scripts
```bash
npm run build      # Production build
npm run preview    # Preview the production build locally
npm run typecheck  # tsc --noEmit
npm run test       # Run the vitest suite once
npm run test:watch # Run vitest in watch mode
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