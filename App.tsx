
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { createEmptyGrid, DEFAULT_BPM, KITS, DEFAULT_KIT, DEFAULT_STEPS, DEFAULT_TRACKS, INSTRUMENTS } from './constants';
import { GridPattern, Track, InstrumentType, PatternData } from './types';
import { AudioEngine } from './services/audioEngine';
import { generatePatternWithGemini } from './services/geminiService';
import SequencerGrid from './components/SequencerGrid';
import Controls from './components/Controls';

const STORAGE_KEY = 'beatme_state_v1';

const App: React.FC = () => {
  // State
  const [projectName, setProjectName] = useState<string>("Untitled Beat");
  const [tracks, setTracks] = useState<Track[]>(DEFAULT_TRACKS);
  const [steps, setSteps] = useState<number>(DEFAULT_STEPS);
  const [bpm, setBpm] = useState<number>(DEFAULT_BPM);
  const [swing, setSwing] = useState<number>(0);
  const [currentKit, setCurrentKit] = useState<string>(DEFAULT_KIT);
  
  // Banking State: 4 Grids
  const [grids, setGrids] = useState<GridPattern[]>([
      createEmptyGrid(DEFAULT_TRACKS, DEFAULT_STEPS),
      createEmptyGrid(DEFAULT_TRACKS, DEFAULT_STEPS),
      createEmptyGrid(DEFAULT_TRACKS, DEFAULT_STEPS),
      createEmptyGrid(DEFAULT_TRACKS, DEFAULT_STEPS),
  ]);
  const [activeBankIndex, setActiveBankIndex] = useState<number>(0);
  
  // Audio State
  const [reverbAmount, setReverbAmount] = useState<number>(0.3);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [currentStep, setCurrentStep] = useState<number>(0);
  const [isAudioLoaded, setIsAudioLoaded] = useState<boolean>(false);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [statusMessage, setStatusMessage] = useState<string>("");

  // Refs
  const audioEngineRef = useRef<AudioEngine | null>(null);

  // Load from Local Storage on mount
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const parsed: PatternData = JSON.parse(saved);
        if (parsed.name) setProjectName(parsed.name);
        if (parsed.tracks) setTracks(parsed.tracks);
        if (parsed.steps) setSteps(parsed.steps);
        if (parsed.swing) setSwing(parsed.swing);
        if (parsed.grids && Array.isArray(parsed.grids)) setGrids(parsed.grids);
        if (parsed.bpm) setBpm(parsed.bpm);
        if (parsed.currentKit && KITS[parsed.currentKit]) setCurrentKit(parsed.currentKit);
        if (parsed.activeBankIndex !== undefined) setActiveBankIndex(parsed.activeBankIndex);
      } catch (e) {
        console.warn("Failed to load saved state", e);
      }
    }
  }, []);

  // Save to Local Storage on change
  useEffect(() => {
    if (isAudioLoaded) { 
      const stateToSave: PatternData = { 
          version: 1,
          name: projectName,
          grids, 
          bpm,
          swing,
          currentKit, 
          tracks, 
          steps,
          activeBankIndex 
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(stateToSave));
    }
  }, [grids, bpm, swing, currentKit, tracks, steps, activeBankIndex, isAudioLoaded, projectName]);

  // Initialize Audio Engine
  useEffect(() => {
    const engine = new AudioEngine((step) => {
      setCurrentStep(step);
    });

    audioEngineRef.current = engine;

    const loadAudio = async () => {
      setStatusMessage(`Loading ${KITS[currentKit].name}...`);
      await engine.initialize();
      engine.setReverbAmount(reverbAmount);
      engine.setSwing(swing);
      await engine.loadKit(KITS[currentKit]);
      
      setIsAudioLoaded(true);
      setStatusMessage("Ready.");
      setTimeout(() => setStatusMessage(""), 3000);
    };

    loadAudio();

    return () => {
      engine.stop();
    };
  }, []);

  // Handle Kit Change
  useEffect(() => {
    if (audioEngineRef.current && isAudioLoaded) {
      const changeKit = async () => {
        setStatusMessage(`Loading ${KITS[currentKit].name}...`);
        await audioEngineRef.current?.loadKit(KITS[currentKit]);
        setStatusMessage("");
      };
      changeKit();
    }
  }, [currentKit, isAudioLoaded]);

  // Handle Reverb Change
  useEffect(() => {
      if(audioEngineRef.current) {
          audioEngineRef.current.setReverbAmount(reverbAmount);
      }
  }, [reverbAmount]);

  // Handle Swing Change
  useEffect(() => {
    if(audioEngineRef.current) {
        audioEngineRef.current.setSwing(swing);
    }
  }, [swing]);

  // Update Engine when Grid/BPM/Tracks/Steps/Bank changes
  useEffect(() => {
    if (audioEngineRef.current) {
      audioEngineRef.current.updateSequence(grids[activeBankIndex], tracks, steps);
    }
  }, [grids, activeBankIndex, tracks, steps]);

  useEffect(() => {
    if (audioEngineRef.current) {
      audioEngineRef.current.setBpm(bpm);
    }
  }, [bpm]);

  // Handlers
  const handleToggleStep = useCallback((row: number, col: number, e: React.MouseEvent) => {
    if (audioEngineRef.current) {
        audioEngineRef.current.resumeContext();
    }

    setGrids((prevGrids) => {
      const newGrids = [...prevGrids];
      const newGrid = newGrids[activeBankIndex].map((r) => [...r]);
      
      if (e.shiftKey) {
        newGrid[row] = Array(steps).fill(false);
        setStatusMessage("Row cleared");
        setTimeout(() => setStatusMessage(""), 1000);
      } else {
        newGrid[row][col] = !newGrid[row][col];
      }
      
      newGrids[activeBankIndex] = newGrid;
      return newGrids;
    });
  }, [steps, activeBankIndex]);

  const handleTrackChange = (index: number, updates: Partial<Track>) => {
      setTracks(prev => {
          const newTracks = [...prev];
          newTracks[index] = { ...newTracks[index], ...updates };
          return newTracks;
      });
  };

  const handlePlayToggle = () => {
    if (!audioEngineRef.current) return;
    
    if (isPlaying) {
      audioEngineRef.current.stop();
      setIsPlaying(false);
    } else {
      audioEngineRef.current.start();
      setIsPlaying(true);
    }
  };

  const handleClear = () => {
    setGrids(prev => {
        const newGrids = [...prev];
        newGrids[activeBankIndex] = createEmptyGrid(tracks, steps);
        return newGrids;
    });
    setStatusMessage("Pattern cleared");
    setTimeout(() => setStatusMessage(""), 2000);
  };

  const handleCopyBank = (targetIndex: number) => {
      if (targetIndex === activeBankIndex) return;
      
      setGrids(prev => {
          const newGrids = [...prev];
          // Deep copy current grid to target
          newGrids[targetIndex] = prev[activeBankIndex].map(row => [...row]);
          return newGrids;
      });
      setStatusMessage(`Copied Bank ${['A','B','C','D'][activeBankIndex]} to ${['A','B','C','D'][targetIndex]}`);
      setTimeout(() => setStatusMessage(""), 2500);
  };
  
  const handleFactoryReset = () => {
      if (confirm("Are you sure? This will wipe all local data and reset the app.")) {
          localStorage.removeItem(STORAGE_KEY);
          window.location.reload();
      }
  };

  const handleStepsChange = (newSteps: number) => {
      if (newSteps < 4 || newSteps > 64) return;
      
      setSteps(newSteps);
      setGrids(prevGrids => {
          return prevGrids.map(grid => {
              return grid.map(row => {
                if (row.length < newSteps) {
                    return [...row, ...Array(newSteps - row.length).fill(false)];
                } else {
                    return row.slice(0, newSteps);
                }
              });
          });
      });
  };

  const handleAddTrack = (instrumentId: InstrumentType) => {
      const instrumentDef = INSTRUMENTS.find(i => i.id === instrumentId);
      if (!instrumentDef) return;

      const newTrack: Track = {
          id: `${instrumentId}-${Date.now()}`,
          instrumentId: instrumentId,
          name: instrumentDef.name,
          color: instrumentDef.color,
          volume: 0.8,
          muted: false,
          pitch: 0
      };

      setTracks(prev => [...prev, newTrack]);
      setGrids(prevGrids => prevGrids.map(grid => [...grid, Array(steps).fill(false)]));
  };

  const handleRemoveTrack = (index: number) => {
      if (tracks.length <= 1) return;
      setTracks(prev => prev.filter((_, i) => i !== index));
      setGrids(prevGrids => prevGrids.map(grid => grid.filter((_, i) => i !== index)));
  };

  // Export Project
  const handleExport = () => {
    const projectData: PatternData = {
        version: 1,
        name: projectName,
        grids,
        bpm,
        swing,
        currentKit,
        tracks,
        steps,
        activeBankIndex
    };
    
    // Sanitize filename
    const safeName = projectName.replace(/[^a-z0-9]/gi, '_').toLowerCase();
    const filename = `beatme-${safeName || 'project'}.json`;

    const blob = new Blob([JSON.stringify(projectData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    setStatusMessage("Project exported!");
    setTimeout(() => setStatusMessage(""), 2000);
  };

  // Import Project
  const handleImport = (file: File) => {
      const reader = new FileReader();
      reader.onload = (e) => {
          try {
              const text = e.target?.result as string;
              const data = JSON.parse(text);
              
              // Validation
              if (!data.version || !data.grids || !Array.isArray(data.grids)) {
                  throw new Error("Invalid project structure");
              }

              // Stop Playback
              setIsPlaying(false);
              audioEngineRef.current?.stop();
              
              // Apply state
              if(data.name) setProjectName(data.name);
              if(data.tracks) setTracks(data.tracks);
              if(data.steps) setSteps(data.steps);
              if(data.grids) setGrids(data.grids);
              if(data.bpm) setBpm(data.bpm);
              if(data.swing) setSwing(data.swing);
              if(data.currentKit && KITS[data.currentKit]) setCurrentKit(data.currentKit);
              if(data.activeBankIndex !== undefined) setActiveBankIndex(data.activeBankIndex);
              
              setStatusMessage("Project loaded successfully.");
              setTimeout(() => setStatusMessage(""), 3000);
          } catch (err) {
              console.error(err);
              setStatusMessage("Error: Invalid Project File");
              setTimeout(() => setStatusMessage(""), 3000);
          }
      };
      reader.readAsText(file);
  };

  const handleGenerate = async (prompt: string) => {
    if (!process.env.API_KEY) {
        alert("Please set your API_KEY in the environment.");
        return;
    }

    audioEngineRef.current?.resumeContext();
    setIsGenerating(true);
    setStatusMessage("AI is composing...");
    
    try {
      const result = await generatePatternWithGemini(prompt, bpm, steps);
      
      const aiPatterns: Record<string, boolean[]> = {
          'kick': result.grid[0],
          'snare': result.grid[1],
          'hihat': result.grid[2],
          'clap': result.grid[3]
      };

      const newGridForActiveBank = tracks.map(track => {
          const pattern = aiPatterns[track.instrumentId];
          if (pattern) {
              if (pattern.length < steps) return [...pattern, ...Array(steps - pattern.length).fill(false)];
              if (pattern.length > steps) return pattern.slice(0, steps);
              return pattern;
          }
          return Array(steps).fill(false);
      });

      // Update ONLY the active bank
      setGrids(prev => {
          const next = [...prev];
          next[activeBankIndex] = newGridForActiveBank;
          return next;
      });

      setBpm(result.bpm);
      setStatusMessage(`Generated: ${prompt}`);
      setTimeout(() => setStatusMessage(""), 3000);
    } catch (error) {
      console.error(error);
      setStatusMessage("Failed to generate pattern.");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="flex flex-col items-center min-h-screen bg-gray-950 text-white p-4 sm:p-8">
      {/* Header */}
      <header className="mb-6 text-center">
        <h1 className="text-4xl sm:text-5xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 to-purple-500 tracking-tight">
          BeatMe
        </h1>
        <p className="text-gray-400 mt-2 text-sm sm:text-base">
          Sequence beats manually or dream them up with AI.
        </p>
      </header>

      {/* Main Controls */}
      <Controls
        projectName={projectName}
        isPlaying={isPlaying}
        bpm={bpm}
        steps={steps}
        swing={swing}
        currentKit={currentKit}
        activeBankIndex={activeBankIndex}
        reverbAmount={reverbAmount}
        onProjectNameChange={setProjectName}
        onPlayToggle={handlePlayToggle}
        onBpmChange={setBpm}
        onStepsChange={handleStepsChange}
        onSwingChange={setSwing}
        onKitChange={setCurrentKit}
        onBankChange={setActiveBankIndex}
        onCopyBank={handleCopyBank}
        onReverbChange={setReverbAmount}
        onClear={handleClear}
        onReset={handleFactoryReset}
        onGenerate={handleGenerate}
        onAddTrack={handleAddTrack}
        onExport={handleExport}
        onImport={handleImport}
        isGenerating={isGenerating}
        isLoaded={isAudioLoaded}
      />

      {/* Grid */}
      <div className="w-full max-w-[1800px] relative">
        <SequencerGrid
          grid={grids[activeBankIndex]}
          tracks={tracks}
          steps={steps}
          currentStep={currentStep}
          onToggle={handleToggleStep}
          onRemoveTrack={handleRemoveTrack}
          onTrackChange={handleTrackChange}
          isLoaded={isAudioLoaded}
        />
        {!isAudioLoaded && (
          <div className="absolute inset-0 bg-gray-950/80 flex items-center justify-center z-10 rounded-xl">
             <span className="text-cyan-400 font-mono animate-pulse">Initializing Audio Engine...</span>
          </div>
        )}
      </div>

      {/* Status Bar */}
      <div className="h-8 mt-4 text-center">
        {statusMessage && (
          <div className="text-sm font-mono text-cyan-400 animate-pulse">
            {'>'} {statusMessage}
          </div>
        )}
      </div>

      {/* Footer Info */}
      <footer className="mt-auto py-6 text-gray-600 text-xs text-center">
        <p>Built with React, Web Audio API & Google Gemini.</p>
        <p className="mt-1 opacity-50">App data is stored locally on your device.</p>
        {!process.env.API_KEY && (
           <p className="text-red-500 mt-2">Warning: API_KEY not detected. AI features will fail.</p>
        )}
      </footer>
    </div>
  );
};

export default App;
