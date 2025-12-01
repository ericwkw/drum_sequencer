
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

// Fallback URLs for common sounds
// Using R8 samples which are complete and reliable on this CDN
const SAMPLES = {
    CR78_KICK: "https://tonejs.github.io/audio/drum-samples/CR78/kick.mp3",
    CR78_SNARE: "https://tonejs.github.io/audio/drum-samples/CR78/snare.mp3",
    CR78_HIHAT: "https://tonejs.github.io/audio/drum-samples/CR78/hihat.mp3",
    
    KPR77_KICK: "https://tonejs.github.io/audio/drum-samples/KPR77/kick.mp3",
    KPR77_SNARE: "https://tonejs.github.io/audio/drum-samples/KPR77/snare.mp3",
    KPR77_HIHAT: "https://tonejs.github.io/audio/drum-samples/KPR77/hihat.mp3",
    
    LINN_KICK: "https://tonejs.github.io/audio/drum-samples/LinnDrum/kick.mp3",
    LINN_SNARE: "https://tonejs.github.io/audio/drum-samples/LinnDrum/snare.mp3",
    LINN_HIHAT: "https://tonejs.github.io/audio/drum-samples/LinnDrum/hihat.mp3",
    
    // Reliable Fallbacks using R8 Kit and Berklee
    CLAP: "https://tonejs.github.io/audio/berklee/clap_1.mp3", 
    
    // R8 Kit is very complete
    TOM_HI: "https://tonejs.github.io/audio/drum-samples/R8/tom1.mp3", 
    TOM_LO: "https://tonejs.github.io/audio/drum-samples/R8/tom2.mp3",
    CRASH: "https://tonejs.github.io/audio/drum-samples/R8/crash.mp3",
    RIDE: "https://tonejs.github.io/audio/drum-samples/R8/ride.mp3",
    OPEN_HAT: "https://tonejs.github.io/audio/drum-samples/R8/openhat.mp3" 
};

export const KITS: Record<string, DrumKit> = {
  CR78: {
    name: "Classic (CR78)",
    samples: {
      kick: SAMPLES.CR78_KICK,
      snare: SAMPLES.CR78_SNARE,
      hihat: SAMPLES.CR78_HIHAT,
      openhat: SAMPLES.OPEN_HAT, 
      clap: SAMPLES.CLAP,
      tom_high: SAMPLES.TOM_HI, 
      tom_low: SAMPLES.TOM_LO, 
      crash: SAMPLES.CRASH, 
      ride: SAMPLES.RIDE
    }
  },
  KPR77: {
    name: "Analog (KPR77)",
    samples: {
      kick: SAMPLES.KPR77_KICK,
      snare: SAMPLES.KPR77_SNARE,
      hihat: SAMPLES.KPR77_HIHAT,
      openhat: SAMPLES.OPEN_HAT, 
      clap: SAMPLES.CLAP,
      tom_high: SAMPLES.TOM_HI, 
      tom_low: SAMPLES.TOM_LO, 
      crash: SAMPLES.CRASH, 
      ride: SAMPLES.RIDE
    }
  },
  LINN: {
    name: "Digital (Linn)",
    samples: {
      kick: SAMPLES.LINN_KICK,
      snare: SAMPLES.LINN_SNARE,
      hihat: SAMPLES.LINN_HIHAT,
      openhat: SAMPLES.OPEN_HAT,
      clap: SAMPLES.CLAP,
      tom_high: SAMPLES.TOM_HI,
      tom_low: SAMPLES.TOM_LO,
      crash: SAMPLES.CRASH,
      ride: SAMPLES.RIDE
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
