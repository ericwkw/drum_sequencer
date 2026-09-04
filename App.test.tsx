import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor, within, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

// Mock the audio engine so component tests don't touch Web Audio at all.
// Each `new AudioEngine(...)` call is recorded in `__instances` so tests can
// inspect what App called on it (loadKit count, updateSequence args, etc.).
vi.mock('./services/audioEngine', () => {
  class MockAudioEngine {
    onStepPlay: (step: number) => void;
    initialize = vi.fn().mockResolvedValue(true);
    setReverbAmount = vi.fn();
    setSwing = vi.fn();
    loadKit = vi.fn().mockResolvedValue([]);
    updateSequence = vi.fn();
    setBpm = vi.fn();
    start = vi.fn().mockResolvedValue(true);
    stop = vi.fn();
    dispose = vi.fn().mockResolvedValue(undefined);
    resumeContext = vi.fn().mockResolvedValue(undefined);
    playOneShot = vi.fn();

    constructor(onStepPlay: (step: number) => void) {
      this.onStepPlay = onStepPlay;
      (globalThis as any).__engineInstances.push(this);
    }
  }
  (globalThis as any).__engineInstances = [];
  return { AudioEngine: MockAudioEngine };
});

import App from './App';

const getLastEngine = () => {
  const instances = (globalThis as any).__engineInstances;
  return instances[instances.length - 1];
};

const podTitle = (trackName: string, step: number) => `${trackName} - Step ${step}`;

beforeEach(() => {
  (globalThis as any).__engineInstances = [];
  localStorage.clear();
});

describe('App', () => {
  const renderApp = async () => {
    render(<App />);
    // Pads are disabled until isAudioLoaded flips true.
    await waitFor(() => expect(screen.getByTitle(podTitle('Kick', 1))).not.toBeDisabled());
  };

  it('loads the kit exactly once on startup (no duplicate fetch)', async () => {
    await renderApp();
    const engine = getLastEngine();
    expect(engine.loadKit).toHaveBeenCalledTimes(1);
  });

  it('clicking a pad toggles exactly that cell', async () => {
    const user = userEvent.setup();
    await renderApp();

    const pad = screen.getByTitle(podTitle('Kick', 1)) as HTMLButtonElement;
    const neighbor = screen.getByTitle(podTitle('Kick', 2)) as HTMLButtonElement;

    expect(pad.querySelector('.bg-white\\/40')).toBeNull();
    await user.click(pad);
    expect(pad.querySelector('.bg-white\\/40')).not.toBeNull();
    expect(neighbor.querySelector('.bg-white\\/40')).toBeNull();

    await user.click(pad);
    expect(pad.querySelector('.bg-white\\/40')).toBeNull();
  });

  it('shift-click clears the whole row', async () => {
    const user = userEvent.setup();
    await renderApp();

    const pad1 = screen.getByTitle(podTitle('Kick', 1));
    const pad2 = screen.getByTitle(podTitle('Kick', 3));
    await user.click(pad1);
    await user.click(pad2);
    expect(pad1.querySelector('.bg-white\\/40')).not.toBeNull();
    expect(pad2.querySelector('.bg-white\\/40')).not.toBeNull();

    await user.keyboard('[ShiftLeft>]');
    await user.click(pad1);
    await user.keyboard('[/ShiftLeft]');

    expect(pad1.querySelector('.bg-white\\/40')).toBeNull();
    expect(pad2.querySelector('.bg-white\\/40')).toBeNull();
  });

  it('preserves the first N steps when shrinking and growing the step count', async () => {
    const user = userEvent.setup();
    await renderApp();

    await user.click(screen.getByTitle(podTitle('Kick', 1)));

    const minus = screen.getByText('-');
    const plus = screen.getByText('+');

    // 16 -> 8
    for (let i = 0; i < 8; i++) await user.click(minus);
    await waitFor(() => expect(screen.queryByTitle(podTitle('Kick', 9))).toBeNull());
    expect(screen.getByTitle(podTitle('Kick', 1)).querySelector('.bg-white\\/40')).not.toBeNull();

    // 8 -> 16
    for (let i = 0; i < 8; i++) await user.click(plus);
    await waitFor(() => expect(screen.getByTitle(podTitle('Kick', 16))).toBeInTheDocument());
    expect(screen.getByTitle(podTitle('Kick', 1)).querySelector('.bg-white\\/40')).not.toBeNull();
    expect(screen.getByTitle(podTitle('Kick', 9)).querySelector('.bg-white\\/40')).toBeNull();
  });

  it('switches banks and copies a bank without aliasing the source', async () => {
    const user = userEvent.setup();
    await renderApp();

    // Bank A: mark step 1 active.
    await user.click(screen.getByTitle(podTitle('Kick', 1)));

    // Switch to Bank B — should start empty.
    await user.click(screen.getByRole('button', { name: 'B' }));
    expect(screen.getByTitle(podTitle('Kick', 1)).querySelector('.bg-white\\/40')).toBeNull();

    // Back to Bank A — step 1 still active.
    await user.click(screen.getByRole('button', { name: 'A' }));
    expect(screen.getByTitle(podTitle('Kick', 1)).querySelector('.bg-white\\/40')).not.toBeNull();

    // Copy Bank A -> Bank C via the "Copy to..." select.
    const copySelect = screen.getAllByRole('combobox').find((el) =>
      within(el as HTMLSelectElement).queryByText('Copy to...'),
    ) as HTMLSelectElement;
    await user.selectOptions(copySelect, '2'); // Bank C index

    // Mutate Bank A after the copy.
    await user.click(screen.getByTitle(podTitle('Kick', 2)));

    // Bank C should reflect the state at copy time, not the later mutation.
    await user.click(screen.getByRole('button', { name: 'C' }));
    expect(screen.getByTitle(podTitle('Kick', 1)).querySelector('.bg-white\\/40')).not.toBeNull();
    expect(screen.getByTitle(podTitle('Kick', 2)).querySelector('.bg-white\\/40')).toBeNull();
  });

  it('routes mute/pitch track changes to the audio engine', async () => {
    const user = userEvent.setup();
    await renderApp();
    const engine = getLastEngine();

    const muteButtons = screen.getAllByText('M', { selector: 'button' });
    await user.click(muteButtons[0]); // Kick is the first track/row

    await waitFor(() => {
      const lastCall = engine.updateSequence.mock.calls.at(-1);
      expect(lastCall[1][0].muted).toBe(true);
    });

    // Pitch sliders are the only range inputs with min="-12"/max="12".
    const pitchSliders = screen.getAllByRole('slider').filter(
      (el) => (el as HTMLInputElement).min === '-12',
    ) as HTMLInputElement[];
    fireEvent.change(pitchSliders[0], { target: { value: '5' } });

    await waitFor(() => {
      const lastCall = engine.updateSequence.mock.calls.at(-1);
      expect(lastCall[1][0].pitch).toBe(5);
    });
  });

  it('round-trips export -> import back to the same pattern', async () => {
    const user = userEvent.setup();

    // jsdom's Blob doesn't implement text()/arrayBuffer(), so capture the
    // JSON string directly from the Blob constructor call instead.
    let capturedText: string | null = null;
    const OriginalBlob = globalThis.Blob;
    (globalThis as any).Blob = class extends OriginalBlob {
      constructor(parts: BlobPart[], options?: BlobPropertyBag) {
        super(parts, options);
        capturedText = String(parts[0]);
      }
    };

    const originalCreateObjectURL = URL.createObjectURL;
    const originalRevokeObjectURL = URL.revokeObjectURL;
    (URL as any).createObjectURL = vi.fn(() => 'blob:mock');
    (URL as any).revokeObjectURL = vi.fn();
    const clickSpy = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});

    try {
      await renderApp();
      await user.click(screen.getByTitle(podTitle('Kick', 1)));

      await user.click(screen.getByTitle('Download Project'));
      expect(capturedText).not.toBeNull();
      const exportedText = capturedText as string;

      // Change state so the import is a real round trip, not a no-op.
      await user.click(screen.getByTitle(podTitle('Kick', 1)));
      expect(screen.getByTitle(podTitle('Kick', 1)).querySelector('.bg-white\\/40')).toBeNull();

      const file = new File([exportedText], 'project.json', { type: 'application/json' });
      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
      fireEvent.change(fileInput, { target: { files: [file] } });

      await waitFor(() =>
        expect(screen.getByTitle(podTitle('Kick', 1)).querySelector('.bg-white\\/40')).not.toBeNull(),
      );
    } finally {
      URL.createObjectURL = originalCreateObjectURL;
      URL.revokeObjectURL = originalRevokeObjectURL;
      (globalThis as any).Blob = OriginalBlob;
      clickSpy.mockRestore();
    }
  });
});
