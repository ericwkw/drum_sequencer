import { InstrumentType, Instrument } from '../types';

export class AudioEngine {
  private context: AudioContext | null = null;
  private buffers: Record<string, AudioBuffer> = {};
  private nextNoteTime: number = 0;
  private timerID: number | null = null;
  private lookahead: number = 25.0; // How frequently to call scheduling (ms)
  private scheduleAheadTime: number = 0.1; // How far ahead to schedule audio (sec)
  
  // Callback to update UI current step
  private onStepPlay: (step: number) => void;
  private currentStep: number = 0;
  private isPlaying: boolean = false;
  private bpm: number = 120;
  private steps: number = 16;
  private activeGrid: boolean[][] = [];

  constructor(onStepPlay: (step: number) => void) {
    this.onStepPlay = onStepPlay;
  }

  public async initialize(instruments: Instrument[]) {
    if (!this.context) {
      this.context = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    
    if (this.context.state === 'suspended') {
      await this.context.resume();
    }

    const loadPromises = instruments.map(async (inst) => {
      try {
        const response = await fetch(inst.sampleUrl);
        const arrayBuffer = await response.arrayBuffer();
        const audioBuffer = await this.context!.decodeAudioData(arrayBuffer);
        this.buffers[inst.id] = audioBuffer;
      } catch (e) {
        console.error(`Failed to load sample for ${inst.name}`, e);
      }
    });

    await Promise.all(loadPromises);
    return true;
  }

  public setGrid(grid: boolean[][]) {
    this.activeGrid = grid;
  }

  public setBpm(bpm: number) {
    this.bpm = bpm;
  }

  public start() {
    if (this.isPlaying || !this.context) return;
    
    if (this.context.state === 'suspended') {
      this.context.resume();
    }

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
    // Reset UI immediately
    this.onStepPlay(0); 
  }

  public toggle() {
    if (this.isPlaying) {
      this.stop();
    } else {
      this.start();
    }
  }

  private nextNote() {
    const secondsPerBeat = 60.0 / this.bpm;
    // 16th notes = 0.25 of a beat
    this.nextNoteTime += 0.25 * secondsPerBeat; 

    this.currentStep++;
    if (this.currentStep === this.steps) {
      this.currentStep = 0;
    }
  }

  private scheduleNote(beatNumber: number, time: number) {
    // Notify UI (using requestAnimationFrame to sync with visual update loop if desired, 
    // but direct call is usually fine for this scale)
    // We use a small timeout to sync the visual "flash" with the sound roughly
    setTimeout(() => {
        if(this.isPlaying) this.onStepPlay(beatNumber);
    }, (time - this.context!.currentTime) * 1000);

    // Check instruments for this step
    this.activeGrid.forEach((row, rowIndex) => {
      if (row[beatNumber]) {
        this.playSample(Object.keys(this.buffers)[rowIndex], time);
      }
    });
  }

  private playSample(instrumentId: string, time: number) {
    if (!this.context || !this.buffers[instrumentId]) return;

    const source = this.context.createBufferSource();
    source.buffer = this.buffers[instrumentId];
    source.connect(this.context.destination);
    source.start(time);
  }

  private scheduler() {
    if (!this.context) return;

    // While there are notes that will need to play before the next interval, 
    // schedule them and advance the pointer.
    while (this.nextNoteTime < this.context.currentTime + this.scheduleAheadTime) {
      this.scheduleNote(this.currentStep, this.nextNoteTime);
      this.nextNote();
    }

    if (this.isPlaying) {
      this.timerID = window.setTimeout(() => this.scheduler(), this.lookahead);
    }
  }
}
