export type InstrumentType = 'kick' | 'snare' | 'hihat' | 'clap';

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
}

export interface DrumKit {
  name: string;
  samples: Record<InstrumentType, string>;
}

export type GridPattern = boolean[][];

export interface PatternData {
  version: number;
  bpm: number;
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