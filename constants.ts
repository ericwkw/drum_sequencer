import { Instrument, InstrumentType, GridPattern } from './types';

// Using high-quality open domain samples
export const INSTRUMENTS: Instrument[] = [
  {
    id: 'kick',
    name: 'Kick',
    color: 'bg-rose-500',
    sampleUrl: 'https://cdn.jsdelivr.net/gh/Tonejs/audio/drum-samples/CR78/kick.mp3'
  },
  {
    id: 'snare',
    name: 'Snare',
    color: 'bg-amber-500',
    sampleUrl: 'https://cdn.jsdelivr.net/gh/Tonejs/audio/drum-samples/CR78/snare.mp3'
  },
  {
    id: 'hihat',
    name: 'Hi-Hat',
    color: 'bg-emerald-500',
    sampleUrl: 'https://cdn.jsdelivr.net/gh/Tonejs/audio/drum-samples/CR78/hihat.mp3'
  },
  {
    id: 'clap',
    name: 'Clap',
    color: 'bg-violet-500',
    sampleUrl: 'https://cdn.jsdelivr.net/gh/Tonejs/audio/drum-samples/CR78/tom1.mp3' // Using a Tom/Perc sound as clap alternative for CR78 set
  }
];

export const STEPS = 16;
export const DEFAULT_BPM = 120;

// Helper to create an empty grid
export const createEmptyGrid = (): GridPattern => {
  return INSTRUMENTS.map(() => Array(STEPS).fill(false));
};
