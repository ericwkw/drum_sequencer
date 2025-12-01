export type InstrumentType = 'kick' | 'snare' | 'hihat' | 'clap';

export interface Instrument {
  id: InstrumentType;
  name: string;
  color: string;
  sampleUrl: string;
}

export type GridPattern = boolean[][];

export interface PatternData {
  id: string;
  name: string;
  bpm: number;
  grid: GridPattern;
}

export interface AudioContextState {
  context: AudioContext | null;
  buffers: Record<InstrumentType, AudioBuffer | null>;
  isLoaded: boolean;
}
