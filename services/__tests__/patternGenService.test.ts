import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { generatePattern } from '../patternGenService';

const okResponse = (body: unknown) => ({
  ok: true,
  json: () => Promise.resolve(body),
  text: () => Promise.resolve(''),
});

const chatCompletion = (content: string) => okResponse({
  choices: [{ message: { content } }],
});

describe('generatePattern', () => {
  const originalFetch = global.fetch;
  const originalApiKey = process.env.API_KEY;

  afterEach(() => {
    global.fetch = originalFetch;
    (process.env as any).API_KEY = originalApiKey;
    vi.restoreAllMocks();
  });

  it('falls back to the offline generator when no API key is set', async () => {
    (process.env as any).API_KEY = '';
    const fetchSpy = vi.fn();
    global.fetch = fetchSpy as any;

    const result = await generatePattern('lofi beat', 90, 16);

    expect(fetchSpy).not.toHaveBeenCalled();
    expect(result.offline).toBe(true);
    expect(result.bpm).toBe(90);
    expect(result.grid.kick).toHaveLength(16);
    expect(result.grid.kick.some(Boolean)).toBe(true); // not a silent pattern
  });

  it('scales the offline pattern to an arbitrary step count', async () => {
    (process.env as any).API_KEY = '';
    global.fetch = vi.fn() as any;

    const result = await generatePattern('anything', 120, 14); // 7/8

    Object.values(result.grid).forEach((row) => expect(row).toHaveLength(14));
  });

  it('parses a valid LLM response and returns the requested-length rows', async () => {
    (process.env as any).API_KEY = 'test-key';
    const fetchMock = vi.fn().mockResolvedValue(chatCompletion(JSON.stringify({
      suggestedBpm: 140,
      kickPattern: [true, false, true, false],
      snarePattern: [false, true, false, true],
    })));
    global.fetch = fetchMock as any;

    const result = await generatePattern('fast dnb', 120, 4);

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(result.offline).toBe(false);
    expect(result.bpm).toBe(140);
    expect(result.grid.kick).toEqual([true, false, true, false]);
    expect(result.grid.snare).toEqual([false, true, false, true]);
    // Instruments the model omitted still come back as valid, empty rows.
    expect(result.grid.crash).toEqual([false, false, false, false]);
  });

  it('strips markdown code fences before parsing', async () => {
    (process.env as any).API_KEY = 'test-key';
    const fenced = '```json\n' + JSON.stringify({ suggestedBpm: 100, kickPattern: [true, false] }) + '\n```';
    global.fetch = vi.fn().mockResolvedValue(chatCompletion(fenced)) as any;

    const result = await generatePattern('house', 120, 2);
    expect(result.grid.kick).toEqual([true, false]);
  });

  it('retries once with a nudge when the first response is unusable, then succeeds', async () => {
    (process.env as any).API_KEY = 'test-key';
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(chatCompletion('not json at all'))
      .mockResolvedValueOnce(chatCompletion(JSON.stringify({ suggestedBpm: 128, kickPattern: [true, true] })));
    global.fetch = fetchMock as any;

    const result = await generatePattern('techno', 120, 2);

    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(result.offline).toBe(false);
    expect(result.grid.kick).toEqual([true, true]);
  });

  it('throws after two unusable attempts (caller can surface the failure)', async () => {
    (process.env as any).API_KEY = 'test-key';
    global.fetch = vi.fn().mockResolvedValue(chatCompletion('garbage')) as any;

    await expect(generatePattern('anything', 120, 4)).rejects.toThrow();
  });

  it('surfaces a non-ok HTTP response as an error', async () => {
    (process.env as any).API_KEY = 'test-key';
    global.fetch = vi.fn()
      .mockResolvedValue({ ok: false, status: 401, text: () => Promise.resolve('unauthorized') }) as any;

    await expect(generatePattern('anything', 120, 4)).rejects.toThrow();
  });
});
