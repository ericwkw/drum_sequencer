import { describe, it, expect } from 'vitest';
import { normalizeRow, normalizeGrid, normalizePatternData } from '../patternUtils';
import { DEFAULT_TRACKS, DEFAULT_STEPS, createEmptyGrid } from '../../constants';
import { Track } from '../../types';

const track = (id: string): Track => ({
  id,
  instrumentId: 'kick',
  name: id,
  color: 'bg-rose-500',
  volume: 0.8,
  muted: false,
  pitch: 0,
});

describe('normalizeRow', () => {
  it('pads a short row with false', () => {
    expect(normalizeRow([true, false], 4)).toEqual([true, false, false, false]);
  });

  it('truncates a long row', () => {
    expect(normalizeRow([true, true, true, true], 2)).toEqual([true, true]);
  });

  it('treats undefined/non-array as an empty row', () => {
    expect(normalizeRow(undefined, 3)).toEqual([false, false, false]);
  });
});

describe('normalizeGrid', () => {
  it('produces exactly trackCount rows, each of length steps', () => {
    const grid = normalizeGrid([[true, false]], 3, 4);
    expect(grid).toHaveLength(3);
    grid.forEach((row) => expect(row).toHaveLength(4));
    expect(grid[0]).toEqual([true, false, false, false]);
    expect(grid[1]).toEqual([false, false, false, false]);
  });
});

describe('normalizePatternData', () => {
  it('fills in defaults for a minimal/empty object', () => {
    const result = normalizePatternData({}, DEFAULT_TRACKS);
    expect(result.tracks).toBe(DEFAULT_TRACKS);
    expect(result.steps).toBe(16);
    expect(result.grids).toHaveLength(4);
    result.grids.forEach((g) => expect(g).toHaveLength(DEFAULT_TRACKS.length));
  });

  it('reconciles grid row count with track count', () => {
    const tracks = [track('a'), track('b'), track('c')];
    const result = normalizePatternData(
      { tracks, steps: 8, grids: [[[true], [false]]] },
      DEFAULT_TRACKS,
    );
    expect(result.grids[0]).toHaveLength(3); // matches tracks.length, not the stale 2 rows
    expect(result.grids[0][0]).toHaveLength(8);
  });

  it('pads/truncates grids to exactly 4 banks', () => {
    const result = normalizePatternData({ tracks: DEFAULT_TRACKS, steps: 16, grids: [] }, DEFAULT_TRACKS);
    expect(result.grids).toHaveLength(4);

    const fiveBanks = Array.from({ length: 5 }, () => createEmptyGrid(DEFAULT_TRACKS, 16));
    const result2 = normalizePatternData({ tracks: DEFAULT_TRACKS, steps: 16, grids: fiveBanks }, DEFAULT_TRACKS);
    expect(result2.grids).toHaveLength(4);
  });

  it('clamps bpm, swing, steps and activeBankIndex to legal ranges', () => {
    const result = normalizePatternData(
      { bpm: 9999, swing: 5, steps: 200, activeBankIndex: 99 },
      DEFAULT_TRACKS,
    );
    expect(result.bpm).toBeLessThanOrEqual(300);
    expect(result.swing).toBeLessThanOrEqual(1);
    expect(result.steps).toBeLessThanOrEqual(64);
    expect(result.activeBankIndex).toBeLessThanOrEqual(3);
  });

  it('falls back to defaults for garbage/non-finite numeric fields', () => {
    const result = normalizePatternData(
      { bpm: 'fast' as any, swing: null as any, steps: NaN as any },
      DEFAULT_TRACKS,
    );
    expect(result.bpm).toBe(120);
    expect(result.swing).toBe(0);
    expect(result.steps).toBe(16);
  });

  it('falls back to the given default tracks when tracks is missing/empty', () => {
    const result = normalizePatternData({ tracks: [] }, DEFAULT_TRACKS);
    expect(result.tracks).toBe(DEFAULT_TRACKS);
  });
});
