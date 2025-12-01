
export type InstrumentType = 'kick' | 'snare' | 'hihat' | 'clap' | 'tom_high' | 'tom_low' | 'crash' | 'ride' | 'openhat';

export interface Instrument {
  id: InstrumentType;
  name: string;
  color: string;
}

export interface Track {
  id: string; 
  instrumentId: InstrumentType;
  name: string;
  color: string;
  volume: number; // 0.0 to 1.0
  muted: boolean;
  pitch: number; // -12 to +12 semitones
}

export interface DrumKit {
  name: string;
  samples: Record<InstrumentType, string>;
}

export type GridPattern = boolean[][];

export interface PatternData {
  version: number;
  name?: string; // Project Name
  bpm: number;
  swing: number; // 0.0 to 1.0
  steps: number;
  currentKit: string;
  tracks: Track[];
  grids: GridPattern[]; // Array of grids (banks)
  activeBankIndex: number;
}

export interface AudioContextState {
  context: AudioContext | null;
  buffers: Record<InstrumentType, AudioBuffer | null>;
  isLoaded: boolean;
}
