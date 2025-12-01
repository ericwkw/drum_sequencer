
import { Instrument, InstrumentType, GridPattern, DrumKit, Track } from './types';

export const INSTRUMENTS: Instrument[] = [
  {
    id: 'kick',
    name: 'Kick',
    color: 'bg-rose-500'
  },
  {
    id: 'snare',
    name: 'Snare',
    color: 'bg-amber-500'
  },
  {
    id: 'hihat',
    name: 'Hi-Hat',
    color: 'bg-emerald-500'
  },
  {
    id: 'clap',
    name: 'Clap',
    color: 'bg-violet-500'
  }
];

export const KITS: Record<string, DrumKit> = {
  CR78: {
    name: "Classic (CR78)",
    samples: {
      kick: "https://tonejs.github.io/audio/drum-samples/CR78/kick.mp3",
      snare: "https://tonejs.github.io/audio/drum-samples/CR78/snare.mp3",
      hihat: "https://tonejs.github.io/audio/drum-samples/CR78/hihat.mp3",
      clap: "https://tonejs.github.io/audio/berklee/clap_1.mp3" // Fallback to Berklee clap
    }
  },
  KPR77: {
    name: "Analog (KPR77)",
    samples: {
      kick: "https://tonejs.github.io/audio/drum-samples/KPR77/kick.mp3",
      snare: "https://tonejs.github.io/audio/drum-samples/KPR77/snare.mp3",
      hihat: "https://tonejs.github.io/audio/drum-samples/KPR77/hihat.mp3",
      clap: "https://tonejs.github.io/audio/berklee/clap_1.mp3" // Fallback to Berklee clap
    }
  },
  LINN: {
    name: "Digital (Linn)",
    samples: {
      kick: "https://tonejs.github.io/audio/drum-samples/LinnDrum/kick.mp3",
      snare: "https://tonejs.github.io/audio/drum-samples/LinnDrum/snare.mp3",
      hihat: "https://tonejs.github.io/audio/drum-samples/LinnDrum/hihat.mp3",
      clap: "https://tonejs.github.io/audio/berklee/clap_1.mp3" // Fallback to Berklee clap
    }
  }
};

export const DEFAULT_STEPS = 16;
export const DEFAULT_BPM = 120;
export const DEFAULT_KIT = "CR78";

export const DEFAULT_TRACKS: Track[] = [
  { id: 'track-0', instrumentId: 'kick', name: 'Kick', color: 'bg-rose-500', volume: 0.9, muted: false, pitch: 0 },
  { id: 'track-1', instrumentId: 'snare', name: 'Snare', color: 'bg-amber-500', volume: 0.8, muted: false, pitch: 0 },
  { id: 'track-2', instrumentId: 'hihat', name: 'Hi-Hat', color: 'bg-emerald-500', volume: 0.7, muted: false, pitch: 0 },
  { id: 'track-3', instrumentId: 'clap', name: 'Clap', color: 'bg-violet-500', volume: 0.8, muted: false, pitch: 0 }
];

export const createEmptyGrid = (tracks: Track[], steps: number): GridPattern => {
  return tracks.map(() => Array(steps).fill(false));
};
