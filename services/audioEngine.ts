
import { DrumKit, Track } from '../types';

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

  public async loadKit(kit: DrumKit) {
    if (!this.context) await this.initialize();

    const loadPromises = Object.entries(kit.samples).map(async ([id, url]) => {
      try {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const arrayBuffer = await response.arrayBuffer();
        const audioBuffer = await this.context!.decodeAudioData(arrayBuffer);
        this.buffers[id] = audioBuffer;
      } catch (e) {
        console.error(`Failed to load sample for ${id} from ${url}`, e);
      }
    });

    await Promise.all(loadPromises);
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

  public async start() {
    if (this.isPlaying || !this.context) return;
    
    await this.resumeContext();

    this.isPlaying = true;
    this.currentStep = 0;
    this.nextNoteTime = this.context.currentTime;
    this.scheduler();
  }

  public stop() {
    this.isPlaying = false;
    if (this.timerID) {
      window.clearTimeout(this.timerID);
      this.timerID = null;
    }
    this.currentStep = 0;
    this.onStepPlay(0); 
  }

  public playOneShot(instrumentId: string, volume: number = 1.0, pitch: number = 0) {
      this.resumeContext().then(() => {
          this.playSample(instrumentId, this.context!.currentTime, volume, pitch, false);
      });
  }

  private nextNote() {
    const secondsPerBeat = 60.0 / this.bpm;
    const baseSixteenth = 0.25 * secondsPerBeat;
    
    // Apply Swing
    // Swing affects odd-numbered 16th notes (1, 3, 5...).
    // Standard: Even (0) -> 0.25s -> Odd (1) -> 0.25s -> Even (2)
    // Swing:    Even (0) -> 0.25*(1+s) -> Odd (1) -> 0.25*(1-s) -> Even (2)
    // We cap swing impact at 0.33 to prevent breaking time (triplet feel max)
    const swingFactor = this.swing * 0.33; 

    let duration = baseSixteenth;
    if (this.currentStep % 2 === 0) {
        // Current is Even, next is Odd. Lengthen this step.
        duration = baseSixteenth * (1 + swingFactor);
    } else {
        // Current is Odd, next is Even. Shorten this step.
        duration = baseSixteenth * (1 - swingFactor);
    }

    this.nextNoteTime += duration;

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
