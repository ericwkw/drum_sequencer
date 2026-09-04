
import { DrumKit, Track } from '../types';

// Swing lengthens every other 16th note and shortens the one after it.
// `noteIndex` must be a counter that increments every note played and is
// only ever reset when the transport itself restarts (start()) — NOT when
// the pattern wraps back to step 0. Deriving the parity from the pattern
// step index instead breaks on odd step counts (5/4, 7/8, etc.): the wrap
// from the last step back to step 0 produces two "lengthen" notes in a row,
// so the loop runs measurably long every cycle instead of holding tempo.
// Capped at 0.33 (~triplet feel) to avoid breaking time.
export const computeStepDuration = (noteIndex: number, baseSixteenth: number, swing: number): number => {
  const swingFactor = swing * 0.33;
  return noteIndex % 2 === 0
    ? baseSixteenth * (1 + swingFactor)
    : baseSixteenth * (1 - swingFactor);
};

export class AudioEngine {
  private context: AudioContext | null = null;
  private buffers: Record<string, AudioBuffer> = {};
  
  // Graph Nodes
  private masterGain: GainNode | null = null;
  private compressor: DynamicsCompressorNode | null = null;
  private reverbNode: ConvolverNode | null = null;
  private reverbGain: GainNode | null = null;

  // Timing
  private nextNoteTime: number = 0;
  private timerID: number | null = null;
  private lookahead: number = 25.0; 
  private scheduleAheadTime: number = 0.1;
  
  // State
  private onStepPlay: (step: number) => void;
  private currentStep: number = 0;
  private isPlaying: boolean = false;
  private bpm: number = 120;
  private steps: number = 16;
  private swing: number = 0; // 0.0 to 1.0
  
  private activeGrid: boolean[][] = [];
  private activeTracks: Track[] = [];
  private noteIndex: number = 0;
  private activeSources: Set<AudioBufferSourceNode> = new Set();

  constructor(onStepPlay: (step: number) => void) {
    this.onStepPlay = onStepPlay;
  }

  public async initialize() {
    if (!this.context) {
      this.context = new (window.AudioContext || (window as any).webkitAudioContext)();
      
      // Master Bus: Compressor -> Master Gain -> Destination
      this.compressor = this.context.createDynamicsCompressor();
      this.compressor.threshold.value = -10;
      this.compressor.knee.value = 10;
      this.compressor.ratio.value = 12;
      this.compressor.attack.value = 0;
      this.compressor.release.value = 0.25;

      this.masterGain = this.context.createGain();
      this.masterGain.gain.value = 1.0;

      // Reverb Bus
      this.reverbNode = this.context.createConvolver();
      this.reverbNode.buffer = this.createImpulseResponse(2.0, 2.0, false);
      this.reverbGain = this.context.createGain();
      this.reverbGain.gain.value = 0.3; // Default reverb amount

      // Connect Graph
      // Master Chain
      this.compressor.connect(this.masterGain);
      this.masterGain.connect(this.context.destination);

      // Reverb Chain (Parallel)
      this.reverbGain.connect(this.reverbNode);
      this.reverbNode.connect(this.masterGain);
    }
    return true;
  }

  // Create a synthetic impulse response for reverb
  private createImpulseResponse(duration: number, decay: number, reverse: boolean): AudioBuffer {
    const sampleRate = this.context!.sampleRate;
    const length = sampleRate * duration;
    const impulse = this.context!.createBuffer(2, length, sampleRate);
    const left = impulse.getChannelData(0);
    const right = impulse.getChannelData(1);

    for (let i = 0; i < length; i++) {
        let n = reverse ? length - i : i;
        // Simple exponential decay noise
        left[i] = (Math.random() * 2 - 1) * Math.pow(1 - n / length, decay);
        right[i] = (Math.random() * 2 - 1) * Math.pow(1 - n / length, decay);
    }
    return impulse;
  }

  public setReverbAmount(amount: number) {
    if (this.reverbGain && this.context) {
        // Clamp 0-1
        this.reverbGain.gain.setTargetAtTime(amount, this.context.currentTime, 0.02);
    }
  }

  public async resumeContext() {
    if (this.context && this.context.state === 'suspended') {
      await this.context.resume();
    }
  }

  // Returns the instrument ids whose sample failed to load, so a silently
  // dead track can be surfaced to the user instead of just logged.
  public async loadKit(kit: DrumKit): Promise<string[]> {
    if (!this.context) await this.initialize();
    // Captured so a concurrent dispose() (e.g. React StrictMode's dev-only
    // double mount/unmount) that nulls `this.context` mid-fetch can't turn
    // an in-flight decodeAudioData call into a null-dereference crash.
    const context = this.context;

    const failed: string[] = [];

    const loadPromises = Object.entries(kit.samples).map(async ([id, url]) => {
      try {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const arrayBuffer = await response.arrayBuffer();
        if (!context || context.state === 'closed') return;
        const audioBuffer = await context.decodeAudioData(arrayBuffer);
        this.buffers[id] = audioBuffer;
      } catch (e) {
        console.error(`Failed to load sample for ${id} from ${url}`, e);
        failed.push(id);
      }
    });

    await Promise.all(loadPromises);
    return failed;
  }

  public updateSequence(grid: boolean[][], tracks: Track[], steps: number) {
    this.activeGrid = grid;
    this.activeTracks = tracks;
    this.steps = steps;
  }

  public setBpm(bpm: number) {
    this.bpm = bpm;
  }

  public setSwing(swing: number) {
    this.swing = swing;
  }

  public async start(): Promise<boolean> {
    if (this.isPlaying || !this.context) return false;

    await this.resumeContext();

    this.isPlaying = true;
    this.currentStep = 0;
    this.noteIndex = 0;
    this.nextNoteTime = this.context.currentTime;
    this.scheduler();
    return true;
  }

  public stop() {
    this.isPlaying = false;
    if (this.timerID) {
      window.clearTimeout(this.timerID);
      this.timerID = null;
    }
    this.currentStep = 0;
    this.onStepPlay(0);

    // Notes scheduled up to `scheduleAheadTime` ahead are already queued on
    // the AudioContext clock; cancel them or they play out after Stop.
    this.activeSources.forEach((source) => {
      try {
        source.stop();
      } catch {
        // Already stopped/ended — ignore.
      }
    });
    this.activeSources.clear();
  }

  public async dispose() {
    this.stop();
    if (this.context && this.context.state !== 'closed') {
      await this.context.close();
    }
    this.context = null;
  }

  public playOneShot(instrumentId: string, volume: number = 1.0, pitch: number = 0) {
      this.resumeContext().then(() => {
          this.playSample(instrumentId, this.context!.currentTime, volume, pitch, false);
      });
  }

  private nextNote() {
    const secondsPerBeat = 60.0 / this.bpm;
    const baseSixteenth = 0.25 * secondsPerBeat;

    this.nextNoteTime += computeStepDuration(this.noteIndex, baseSixteenth, this.swing);
    this.noteIndex++;

    this.currentStep++;
    if (this.currentStep >= this.steps) {
      this.currentStep = 0;
    }
  }

  private scheduleNote(beatNumber: number, time: number) {
    // Notify UI 
    setTimeout(() => {
        if(this.isPlaying) this.onStepPlay(beatNumber);
    }, (time - this.context!.currentTime) * 1000);

    this.activeGrid.forEach((row, rowIndex) => {
      if (row && row[beatNumber] && this.activeTracks[rowIndex]) {
        const track = this.activeTracks[rowIndex];
        if (!track.muted) {
            this.playSample(track.instrumentId, time, track.volume, track.pitch || 0, true);
        }
      }
    });
  }

  private playSample(instrumentId: string, time: number, volume: number, pitch: number, sendToReverb: boolean) {
    if (!this.context || !this.buffers[instrumentId]) return;

    // Source
    const source = this.context.createBufferSource();
    source.buffer = this.buffers[instrumentId];
    
    // Pitch Shift
    // playbackRate.value = 2 ^ (semitones / 12)
    if (pitch !== 0) {
        source.playbackRate.value = Math.pow(2, pitch / 12);
    }

    // Track Volume Gain
    const gainNode = this.context.createGain();
    gainNode.gain.value = volume;

    // Routing
    source.connect(gainNode);
    gainNode.connect(this.compressor!); // Dry signal to compressor -> master
    
    if (sendToReverb && this.reverbGain) {
        gainNode.connect(this.reverbGain); // Send to reverb bus
    }

    this.activeSources.add(source);
    source.onended = () => this.activeSources.delete(source);

    source.start(time);
  }

  private scheduler() {
    if (!this.context) return;

    while (this.nextNoteTime < this.context.currentTime + this.scheduleAheadTime) {
      this.scheduleNote(this.currentStep, this.nextNoteTime);
      this.nextNote();
    }

    if (this.isPlaying) {
      this.timerID = window.setTimeout(() => this.scheduler(), this.lookahead);
    }
  }
}
