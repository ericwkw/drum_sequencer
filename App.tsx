import React, { useState, useEffect, useRef, useCallback } from 'react';
import { createEmptyGrid, DEFAULT_BPM, INSTRUMENTS } from './constants';
import { GridPattern } from './types';
import { AudioEngine } from './services/audioEngine';
import { generatePatternWithGemini } from './services/geminiService';
import SequencerGrid from './components/SequencerGrid';
import Controls from './components/Controls';

const App: React.FC = () => {
  // State
  const [grid, setGrid] = useState<GridPattern>(createEmptyGrid());
  const [bpm, setBpm] = useState<number>(DEFAULT_BPM);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [currentStep, setCurrentStep] = useState<number>(0);
  const [isAudioLoaded, setIsAudioLoaded] = useState<boolean>(false);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [statusMessage, setStatusMessage] = useState<string>("");

  // Refs
  const audioEngineRef = useRef<AudioEngine | null>(null);

  // Initialize Audio Engine
  useEffect(() => {
    // We instantiate the engine but don't load buffers until interaction or mount if desired
    // To support mobile, we usually wait for interaction, but here we load on mount for desktop web app feel
    const engine = new AudioEngine((step) => {
      setCurrentStep(step);
    });

    audioEngineRef.current = engine;

    const loadAudio = async () => {
      setStatusMessage("Loading samples...");
      await engine.initialize(INSTRUMENTS);
      setIsAudioLoaded(true);
      setStatusMessage("");
    };

    loadAudio();

    return () => {
      engine.stop();
    };
  }, []);

  // Update Engine when Grid/BPM changes
  useEffect(() => {
    if (audioEngineRef.current) {
      audioEngineRef.current.setGrid(grid);
    }
  }, [grid]);

  useEffect(() => {
    if (audioEngineRef.current) {
      audioEngineRef.current.setBpm(bpm);
    }
  }, [bpm]);

  // Handlers
  const handleToggleStep = useCallback((row: number, col: number) => {
    setGrid((prev) => {
      const newGrid = prev.map((r) => [...r]);
      newGrid[row][col] = !newGrid[row][col];
      return newGrid;
    });
  }, []);

  const handlePlayToggle = () => {
    if (!audioEngineRef.current) return;
    
    if (isPlaying) {
      audioEngineRef.current.stop();
      setIsPlaying(false);
    } else {
      // AudioContext requires user gesture to resume if suspended
      audioEngineRef.current.start();
      setIsPlaying(true);
    }
  };

  const handleClear = () => {
    setGrid(createEmptyGrid());
    if (isPlaying && audioEngineRef.current) {
        // Keep playing but silence
        audioEngineRef.current.setGrid(createEmptyGrid());
    }
  };

  const handleGenerate = async (prompt: string) => {
    if (!process.env.API_KEY) {
        alert("Please set your API_KEY in the environment.");
        return;
    }

    setIsGenerating(true);
    setStatusMessage("AI is composing your beat...");
    
    // Optional: Stop playing while generating to avoid jarring changes, or keep playing for "live coding" feel.
    // Let's keep playing for the "Live" feel.

    try {
      const result = await generatePatternWithGemini(prompt, bpm);
      setGrid(result.grid);
      setBpm(result.bpm);
      setStatusMessage(`Generated: ${prompt}`);
      
      // Clear status after 3 seconds
      setTimeout(() => setStatusMessage(""), 3000);
    } catch (error) {
      setStatusMessage("Failed to generate pattern.");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="flex flex-col items-center min-h-screen bg-gray-950 text-white p-4 sm:p-8">
      {/* Header */}
      <header className="mb-8 text-center">
        <h1 className="text-4xl sm:text-5xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 to-purple-500 tracking-tight">
          AI BeatGenius
        </h1>
        <p className="text-gray-400 mt-2 text-sm sm:text-base">
          Gemini-Powered Drum Sequencer
        </p>
      </header>

      {/* Main Controls */}
      <Controls
        isPlaying={isPlaying}
        bpm={bpm}
        onPlayToggle={handlePlayToggle}
        onBpmChange={setBpm}
        onClear={handleClear}
        onGenerate={handleGenerate}
        isGenerating={isGenerating}
        isLoaded={isAudioLoaded}
      />

      {/* Grid */}
      <div className="w-full max-w-4xl">
        <SequencerGrid
          grid={grid}
          currentStep={currentStep}
          onToggle={handleToggleStep}
          isLoaded={isAudioLoaded}
        />
      </div>

      {/* Status Bar */}
      <div className="h-8 mt-4">
        {statusMessage && (
          <div className="text-sm font-mono text-cyan-400 animate-pulse">
            {'>'} {statusMessage}
          </div>
        )}
      </div>

      {/* Footer Info */}
      <footer className="mt-auto py-6 text-gray-600 text-xs text-center">
        <p>Built with React, Web Audio API & Google Gemini.</p>
        {!process.env.API_KEY && (
           <p className="text-red-500 mt-2">Warning: API_KEY not detected. AI features will fail.</p>
        )}
      </footer>
    </div>
  );
};

export default App;
