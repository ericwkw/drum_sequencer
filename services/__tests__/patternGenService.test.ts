import { describe, it, expect, vi, afterEach } from 'vitest';
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

  it('throws when no API key is configured, without calling the network', async () => {
    (process.env as any).API_KEY = '';
    const fetchSpy = vi.fn();
    global.fetch = fetchSpy as any;

    await expect(generatePattern('lofi beat', 90, 16)).rejects.toThrow(/API key/i);
    expect(fetchSpy).not.toHaveBeenCalled();
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
