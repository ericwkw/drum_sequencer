import React, { useState } from 'react';

interface ControlsProps {
  isPlaying: boolean;
  bpm: number;
  onPlayToggle: () => void;
  onBpmChange: (bpm: number) => void;
  onClear: () => void;
  onGenerate: (prompt: string) => void;
  isGenerating: boolean;
  isLoaded: boolean;
}

const Controls: React.FC<ControlsProps> = ({
  isPlaying,
  bpm,
  onPlayToggle,
  onBpmChange,
  onClear,
  onGenerate,
  isGenerating,
  isLoaded
}) => {
  const [prompt, setPrompt] = useState('');

  const handleGenerate = (e: React.FormEvent) => {
    e.preventDefault();
    if (prompt.trim()) {
      onGenerate(prompt);
    }
  };

  return (
    <div className="flex flex-col gap-6 w-full max-w-4xl mx-auto mb-6">
      
      {/* Top Row: Transport & BPM */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-4 bg-gray-900 rounded-xl border border-gray-800">
        <div className="flex items-center gap-4">
            <button
            onClick={onPlayToggle}
            disabled={!isLoaded}
            className={`
                px-6 py-3 rounded-lg font-bold text-white transition-all
                ${isPlaying 
                ? 'bg-rose-600 hover:bg-rose-700 shadow-[0_0_15px_rgba(225,29,72,0.4)]' 
                : 'bg-emerald-600 hover:bg-emerald-700 shadow-[0_0_15px_rgba(16,185,129,0.4)]'}
                disabled:opacity-50 disabled:cursor-not-allowed
            `}
            >
            {!isLoaded ? 'Loading...' : isPlaying ? 'STOP' : 'PLAY'}
            </button>

            <button
                onClick={onClear}
                disabled={!isLoaded}
                className="px-4 py-3 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-300 font-medium transition-colors"
            >
                Clear
            </button>
        </div>

        <div className="flex items-center gap-4 bg-gray-950 p-2 rounded-lg border border-gray-800">
          <label className="text-xs text-gray-500 font-bold uppercase tracking-wider">BPM</label>
          <input
            type="range"
            min="60"
            max="200"
            value={bpm}
            onChange={(e) => onBpmChange(Number(e.target.value))}
            className="w-32 h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
          />
          <span className="text-xl font-mono text-blue-400 w-12 text-center">{bpm}</span>
        </div>
      </div>

      {/* AI Section */}
      <form onSubmit={handleGenerate} className="relative group">
        <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg blur opacity-25 group-hover:opacity-50 transition duration-1000"></div>
        <div className="relative flex gap-2 bg-gray-900 p-2 rounded-lg border border-gray-800">
            <div className="flex-1 flex items-center px-2">
                <svg className="w-5 h-5 text-purple-400 mr-2 animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                <input
                    type="text"
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    placeholder="Describe a beat (e.g., 'Aggressive dark techno', 'Chill lofi', 'Funky disco')"
                    className="w-full bg-transparent border-none focus:ring-0 text-white placeholder-gray-500"
                />
            </div>
            <button
                type="submit"
                disabled={isGenerating || !isLoaded}
                className="px-6 py-2 bg-purple-600 hover:bg-purple-700 text-white font-semibold rounded-md transition-colors disabled:opacity-50 flex items-center gap-2"
            >
                {isGenerating ? (
                    <>
                        <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Dreaming...
                    </>
                ) : (
                    'Generate'
                )}
            </button>
        </div>
      </form>
    </div>
  );
};

export default Controls;
