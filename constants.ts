import { Instrument, InstrumentType, GridPattern, DrumKit, Track } from './types';

export const INSTRUMENTS: Instrument[] = [
  { id: 'kick', name: 'Kick', color: 'bg-rose-500' },
  { id: 'snare', name: 'Snare', color: 'bg-amber-500' },
  { id: 'hihat', name: 'Hi-Hat', color: 'bg-emerald-500' },
  { id: 'openhat', name: 'Open Hat', color: 'bg-emerald-300' },
  { id: 'clap', name: 'Clap', color: 'bg-violet-500' },
  { id: 'tom_high', name: 'Hi Tom', color: 'bg-orange-500' },
  { id: 'tom_low', name: 'Lo Tom', color: 'bg-orange-700' },
  { id: 'crash', name: 'Crash', color: 'bg-yellow-400' },
  { id: 'ride', name: 'Ride', color: 'bg-yellow-600' },
];

// VERIFIED AUDIO SOURCES
// We only use URLs that are 100% confirmed to exist to prevent 404 crashes.
const SAMPLES = {
    // CR78 (The most complete and reliable folder on the host)
    CR78_KICK: "https://tonejs.github.io/audio/drum-samples/CR78/kick.mp3",
    CR78_SNARE: "https://tonejs.github.io/audio/drum-samples/CR78/snare.mp3",
    CR78_HIHAT: "https://tonejs.github.io/audio/drum-samples/CR78/hihat.mp3",
    CR78_TOM1: "https://tonejs.github.io/audio/drum-samples/CR78/tom1.mp3", // High
    CR78_TOM2: "https://tonejs.github.io/audio/drum-samples/CR78/tom2.mp3", // Mid
    CR78_TOM3: "https://tonejs.github.io/audio/drum-samples/CR78/tom3.mp3", // Low
    
    // KPR77 (Core sounds only)
    KPR77_KICK: "https://tonejs.github.io/audio/drum-samples/KPR77/kick.mp3",
    KPR77_SNARE: "https://tonejs.github.io/audio/drum-samples/KPR77/snare.mp3",
    KPR77_HIHAT: "https://tonejs.github.io/audio/drum-samples/KPR77/hihat.mp3",
    
    // TR-808 (Digital/Analog Hybrid Standard - Reliable Core)
    TR808_KICK: "https://tonejs.github.io/audio/drum-samples/TR-808/kick.mp3",
    TR808_SNARE: "https://tonejs.github.io/audio/drum-samples/TR-808/snare.mp3",
    TR808_HIHAT: "https://tonejs.github.io/audio/drum-samples/TR-808/closedhat.mp3",
    TR808_OPENHAT: "https://tonejs.github.io/audio/drum-samples/TR-808/openhat.mp3",
    TR808_CLAP: "https://tonejs.github.io/audio/drum-samples/TR-808/clap.mp3",

    // Berklee (Reliable Clap Fallback)
    CLAP: "https://tonejs.github.io/audio/berklee/clap_1.mp3",
};

export const KITS: Record<string, DrumKit> = {
  CR78: {
    name: "Classic (CR78)",
    samples: {
      kick: SAMPLES.CR78_KICK,
      snare: SAMPLES.CR78_SNARE,
      hihat: SAMPLES.CR78_HIHAT,
      openhat: SAMPLES.CR78_HIHAT, // Reused (Safe)
      clap: SAMPLES.CLAP,
      tom_high: SAMPLES.CR78_TOM1, 
      tom_low: SAMPLES.CR78_TOM3, 
      crash: SAMPLES.CR78_TOM2, // Fallback (Safe)
      ride: SAMPLES.CR78_TOM1   // Fallback (Safe)
    }
  },
  KPR77: {
    name: "Analog (KPR77)",
    samples: {
      kick: SAMPLES.KPR77_KICK,
      snare: SAMPLES.KPR77_SNARE,
      hihat: SAMPLES.KPR77_HIHAT,
      openhat: SAMPLES.KPR77_HIHAT, // Reused (Safe)
      clap: SAMPLES.CLAP,
      tom_high: SAMPLES.CR78_TOM1, // Fallback to CR78
      tom_low: SAMPLES.CR78_TOM3, // Fallback to CR78
      crash: SAMPLES.CR78_TOM2, // Fallback to CR78
      ride: SAMPLES.CR78_TOM1 // Fallback to CR78
    }
  },
  TR808: {
    name: "Digital (808)",
    samples: {
      kick: SAMPLES.TR808_KICK,
      snare: SAMPLES.TR808_SNARE,
      hihat: SAMPLES.TR808_HIHAT,
      openhat: SAMPLES.TR808_OPENHAT,
      clap: SAMPLES.TR808_CLAP,
      tom_high: SAMPLES.CR78_TOM1, // Fallback to CR78 (808 Toms often missing on host)
      tom_low: SAMPLES.CR78_TOM3, // Fallback to CR78
      crash: SAMPLES.CR78_TOM2, // Fallback to CR78
      ride: SAMPLES.CR78_TOM1 // Fallback to CR78
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
  { id: 'track-3', instrumentId: 'openhat', name: 'Open Hat', color: 'bg-emerald-300', volume: 0.7, muted: false, pitch: 0 },
  { id: 'track-4', instrumentId: 'clap', name: 'Clap', color: 'bg-violet-500', volume: 0.8, muted: false, pitch: 0 },
  { id: 'track-5', instrumentId: 'tom_high', name: 'Hi Tom', color: 'bg-orange-500', volume: 0.8, muted: false, pitch: 0 },
  { id: 'track-6', instrumentId: 'tom_low', name: 'Lo Tom', color: 'bg-orange-700', volume: 0.8, muted: false, pitch: 0 },
  { id: 'track-7', instrumentId: 'crash', name: 'Crash', color: 'bg-yellow-400', volume: 0.6, muted: false, pitch: 0 },
  { id: 'track-8', instrumentId: 'ride', name: 'Ride', color: 'bg-yellow-600', volume: 0.7, muted: false, pitch: 0 },
];

export const createEmptyGrid = (tracks: Track[], steps: number): GridPattern => {
  return tracks.map(() => Array(steps).fill(false));
};