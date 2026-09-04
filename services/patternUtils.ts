import { GridPattern, PatternData, Track } from '../types';

const BANK_COUNT = 4;
const MIN_STEPS = 4;
const MAX_STEPS = 64;
const MIN_BPM = 20;
const MAX_BPM = 300;

const clamp = (n: number, min: number, max: number) => Math.min(max, Math.max(min, n));

export const normalizeRow = (row: boolean[] | undefined, steps: number): boolean[] => {
  const source = Array.isArray(row) ? row : [];
  if (source.length === steps) return source.map(Boolean);
  if (source.length < steps) {
    return [...source.map(Boolean), ...Array(steps - source.length).fill(false)];
  }
  return source.slice(0, steps).map(Boolean);
};

export const normalizeGrid = (grid: GridPattern | undefined, trackCount: number, steps: number): GridPattern => {
  const source = Array.isArray(grid) ? grid : [];
  const rows: GridPattern = [];
  for (let i = 0; i < trackCount; i++) {
    rows.push(normalizeRow(source[i], steps));
  }
  return rows;
};

// Ensures a loaded/imported PatternData is internally consistent:
// every row matches `steps`, every grid matches `tracks.length`, exactly
// BANK_COUNT banks exist, and numeric fields are within their legal ranges.
export const normalizePatternData = (data: Partial<PatternData>, fallbackTracks: Track[]): PatternData => {
  const tracks = Array.isArray(data.tracks) && data.tracks.length > 0 ? data.tracks : fallbackTracks;
  const steps = Number.isFinite(data.steps) ? clamp(Math.round(data.steps as number), MIN_STEPS, MAX_STEPS) : 16;
  const bpm = Number.isFinite(data.bpm) ? clamp(Math.round(data.bpm as number), MIN_BPM, MAX_BPM) : 120;
  const swing = Number.isFinite(data.swing) ? clamp(data.swing as number, 0, 1) : 0;

  const sourceGrids = Array.isArray(data.grids) ? data.grids : [];
  const grids: GridPattern[] = [];
  for (let i = 0; i < BANK_COUNT; i++) {
    grids.push(normalizeGrid(sourceGrids[i], tracks.length, steps));
  }

  const activeBankIndex = Number.isFinite(data.activeBankIndex)
    ? clamp(Math.round(data.activeBankIndex as number), 0, BANK_COUNT - 1)
    : 0;

  return {
    version: 1,
    name: typeof data.name === 'string' && data.name.trim() ? data.name : 'Untitled Beat',
    bpm,
    swing,
    steps,
    currentKit: typeof data.currentKit === 'string' ? data.currentKit : '',
    tracks,
    grids,
    activeBankIndex,
  };
};
