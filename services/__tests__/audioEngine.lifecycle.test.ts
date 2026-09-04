import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AudioEngine } from '../audioEngine';

// Minimal fake Web Audio graph — just enough surface area for AudioEngine to
// initialize and schedule a one-shot without touching a real AudioContext.
class FakeAudioParam {
  value = 0;
  setTargetAtTime = vi.fn();
}

class FakeNode {
  connect = vi.fn();
}

class FakeCompressor extends FakeNode {
  threshold = new FakeAudioParam();
  knee = new FakeAudioParam();
  ratio = new FakeAudioParam();
  attack = new FakeAudioParam();
  release = new FakeAudioParam();
}

class FakeGain extends FakeNode {
  gain = new FakeAudioParam();
}

class FakeConvolver extends FakeNode {
  buffer: unknown = null;
}

class FakeBufferSource extends FakeNode {
  buffer: unknown = null;
  playbackRate = new FakeAudioParam();
  onended: (() => void) | null = null;
  start = vi.fn();
  stop = vi.fn();
}

class FakeAudioContext {
  currentTime = 0;
  state: AudioContextState = 'running';
  sampleRate = 44100;
  destination = {};

  createDynamicsCompressor() { return new FakeCompressor(); }
  createGain() { return new FakeGain(); }
  createConvolver() { return new FakeConvolver(); }
  createBuffer(_channels: number, length: number) {
    return { getChannelData: () => new Float32Array(length) };
  }
  createBufferSource() { return new FakeBufferSource(); }
  resume() { return Promise.resolve(); }
  close() { this.state = 'closed'; return Promise.resolve(); }
}

describe('AudioEngine lifecycle', () => {
  beforeEach(() => {
    (globalThis as any).AudioContext = FakeAudioContext;
  });

  it('stop() cancels sources that were already scheduled', async () => {
    const engine = new AudioEngine(() => {});
    await engine.initialize();
    // Pretend a kit is loaded so playSample doesn't bail on a missing buffer.
    (engine as any).buffers['kick'] = {};

    engine.playOneShot('kick');
    // playOneShot resolves resumeContext() before calling playSample — flush
    // that microtask queue.
    await Promise.resolve();
    await Promise.resolve();

    const activeSources: Set<FakeBufferSource> = (engine as any).activeSources;
    expect(activeSources.size).toBe(1);
    const [source] = Array.from(activeSources);
    expect(source.start).toHaveBeenCalledTimes(1);

    engine.stop();

    expect(source.stop).toHaveBeenCalledTimes(1);
    expect(activeSources.size).toBe(0);
  });

  it('dispose() stops playback and closes the context', async () => {
    const engine = new AudioEngine(() => {});
    await engine.initialize();
    const context: FakeAudioContext = (engine as any).context;

    await engine.dispose();

    expect(context.state).toBe('closed');
    expect((engine as any).context).toBeNull();
  });

  it('start() returns false and does nothing when the context is not initialized', async () => {
    const engine = new AudioEngine(() => {});
    const started = await engine.start();
    expect(started).toBe(false);
  });
});
