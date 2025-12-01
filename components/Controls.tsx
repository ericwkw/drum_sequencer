import React, { useState, useRef } from 'react';
import { KITS, INSTRUMENTS } from '../constants';
import { InstrumentType } from '../types';

interface ControlsProps {
  isPlaying: boolean;
  bpm: number;
  steps: number;
  currentKit: string;
  activeBankIndex: number;
  reverbAmount: number;
  onPlayToggle: () => void;
  onBpmChange: (bpm: number) => void;
  onStepsChange: (steps: number) => void;
  onKitChange: (kitKey: string) => void;
  onBankChange: (index: number) => void;
  onReverbChange: (amount: number) => void;
  onClear: () => void;
  onGenerate: (prompt: string) => void;
  onAddTrack: (type: InstrumentType) => void;
  onExport: () => void;
  onImport: (file: File) => void;
  isGenerating: boolean;
  isLoaded: boolean;
}

const Controls: React.FC<ControlsProps> = ({
  isPlaying,
  bpm,
  steps,
  currentKit,
  activeBankIndex,
  reverbAmount,
  onPlayToggle,
  onBpmChange,
  onStepsChange,
  onKitChange,
  onBankChange,
  onReverbChange,
  onClear,
  onGenerate,
  onAddTrack,
  onExport,
  onImport,
  isGenerating,
  isLoaded
}) => {
  const [prompt, setPrompt] = useState('');
  const [isAddMenuOpen, setIsAddMenuOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleGenerate = (e: React.FormEvent) => {
    e.preventDefault();
    if (prompt.trim()) {
      onGenerate(prompt);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files[0]) {
          onImport(e.target.files[0]);
      }
  };

  return (
    <div className="flex flex-col gap-4 w-full max-w-[1400px] mx-auto mb-6">
      
      {/* Main Dashboard Panel */}
      <div className="bg-gray-900 rounded-xl border border-gray-800 shadow-xl overflow-hidden flex flex-col md:flex-row divide-y md:divide-y-0 md:divide-x divide-gray-800">
        
        {/* SECTION 1: Transport & Timing (Left) */}
        <div className="p-4 flex flex-col justify-between gap-4 md:w-1/3 min-w-[300px]">
             <div className="flex items-center gap-3">
                {/* Play Button - Hero Element */}
                <button
                    onClick={onPlayToggle}
                    disabled={!isLoaded}
                    className={`
                        flex-1 h-12 rounded-lg font-bold text-white text-lg tracking-wider transition-all
                        ${isPlaying 
                        ? 'bg-rose-600 hover:bg-rose-700 shadow-[0_0_15px_rgba(225,29,72,0.4)]' 
                        : 'bg-emerald-600 hover:bg-emerald-700 shadow-[0_0_15px_rgba(16,185,129,0.4)]'}
                        disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2
                    `}
                >
                    {isPlaying ? (
                         <><span className="w-3 h-3 bg-white rounded-sm"></span> STOP</>
                    ) : (
                         <><span className="w-0 h-0 border-t-[6px] border-t-transparent border-l-[10px] border-l-white border-b-[6px] border-b-transparent ml-1"></span> PLAY</>
                    )}
                </button>
             </div>

             <div className="grid grid-cols-2 gap-3">
                {/* BPM */}
                <div className="bg-gray-950 rounded-lg p-2 border border-gray-700 flex flex-col">
                    <label className="text-[10px] text-gray-500 font-bold uppercase tracking-wider mb-1">Tempo</label>
                    <div className="flex items-center gap-2">
                        <input
                            type="number"
                            min="60"
                            max="200"
                            value={bpm}
                            onChange={(e) => onBpmChange(Number(e.target.value))}
                            className="bg-transparent text-cyan-400 font-mono text-xl font-bold w-full focus:outline-none"
                        />
                        <span className="text-xs text-gray-600">BPM</span>
                    </div>
                </div>

                {/* Steps / Time Signature */}
                <div className="bg-gray-950 rounded-lg p-2 border border-gray-700 flex flex-col">
                     <label className="text-[10px] text-gray-500 font-bold uppercase tracking-wider mb-1">Length</label>
                     <div className="flex items-center gap-2">
                         <button 
                            onClick={() => onStepsChange(Math.max(4, steps - 4))}
                            className="text-gray-500 hover:text-white px-1"
                         >-</button>
                         <span className="flex-1 text-center text-cyan-400 font-mono text-xl font-bold">{steps}</span>
                         <button 
                            onClick={() => onStepsChange(Math.min(64, steps + 4))}
                            className="text-gray-500 hover:text-white px-1"
                         >+</button>
                     </div>
                </div>
             </div>
        </div>

        {/* SECTION 2: Pattern & Sound (Center) */}
        <div className="p-4 flex flex-col justify-between gap-4 md:w-1/3">
             {/* Bank Selector */}
             <div className="flex flex-col">
                 <label className="text-[10px] text-gray-500 font-bold uppercase tracking-wider mb-2 flex justify-between">
                     <span>Pattern Bank</span>
                     <span className="text-gray-600">Active: {['A','B','C','D'][activeBankIndex]}</span>
                 </label>
                 <div className="grid grid-cols-4 gap-2 bg-gray-950 p-1 rounded-lg border border-gray-800">
                    {['A', 'B', 'C', 'D'].map((bank, idx) => (
                        <button
                            key={bank}
                            onClick={() => onBankChange(idx)}
                            className={`
                                h-8 rounded-md text-xs font-bold transition-all
                                ${activeBankIndex === idx 
                                    ? 'bg-gradient-to-br from-cyan-500 to-blue-600 text-white shadow-lg' 
                                    : 'text-gray-500 hover:text-gray-300 hover:bg-gray-800'}
                            `}
                        >
                            {bank}
                        </button>
                    ))}
                 </div>
             </div>

             <div className="grid grid-cols-2 gap-3">
                 {/* Kit Selector */}
                 <div className="flex flex-col">
                    <label className="text-[10px] text-gray-500 font-bold uppercase tracking-wider mb-1">Drum Kit</label>
                    <select 
                        value={currentKit}
                        onChange={(e) => onKitChange(e.target.value)}
                        className="bg-gray-950 text-gray-300 text-xs rounded-lg border border-gray-700 p-2 h-9 focus:ring-1 focus:ring-cyan-500 focus:outline-none w-full"
                    >
                        {Object.entries(KITS).map(([key, kit]) => (
                        <option key={key} value={key}>{kit.name}</option>
                        ))}
                    </select>
                 </div>

                 {/* Reverb Control */}
                 <div className="flex flex-col">
                    <label className="text-[10px] text-gray-500 font-bold uppercase tracking-wider mb-1">Reverb</label>
                    <div className="flex items-center h-9 px-2 bg-gray-950 rounded-lg border border-gray-700">
                        <input
                            type="range"
                            min="0"
                            max="1"
                            step="0.05"
                            value={reverbAmount}
                            onChange={(e) => onReverbChange(Number(e.target.value))}
                            className="w-full h-1 bg-gray-800 rounded-lg appearance-none cursor-pointer accent-purple-500"
                        />
                    </div>
                 </div>
             </div>
        </div>

        {/* SECTION 3: Actions & AI (Right) */}
        <div className="p-4 flex flex-col justify-between gap-4 md:w-1/3">
             
             {/* Toolbar */}
             <div className="flex flex-col">
                 <label className="text-[10px] text-gray-500 font-bold uppercase tracking-wider mb-2">Tools</label>
                 <div className="flex gap-2">
                    {/* Add Track */}
                    <div className="relative flex-1">
                        <button 
                            onClick={() => setIsAddMenuOpen(!isAddMenuOpen)}
                            className="w-full bg-gray-800 hover:bg-gray-700 text-gray-300 text-xs font-medium rounded-lg border border-gray-700 p-2 h-9 flex items-center justify-center gap-2 transition-colors"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                            </svg>
                            Add Track
                        </button>
                        {isAddMenuOpen && (
                            <div className="absolute top-full right-0 mt-2 w-48 bg-gray-800 border border-gray-700 rounded-lg shadow-xl z-50 py-1 max-h-48 overflow-y-auto">
                                {INSTRUMENTS.map((inst) => (
                                <button
                                    key={inst.id}
                                    onClick={() => {
                                    onAddTrack(inst.id);
                                    setIsAddMenuOpen(false);
                                    }}
                                    className="w-full text-left px-4 py-2 text-xs text-gray-300 hover:bg-gray-700 hover:text-white flex items-center gap-2"
                                >
                                    <div className={`w-2 h-2 rounded-full ${inst.color}`}></div>
                                    {inst.name}
                                </button>
                                ))}
                            </div>
                        )}
                        {isAddMenuOpen && (
                            <div className="fixed inset-0 z-40" onClick={() => setIsAddMenuOpen(false)}></div>
                        )}
                    </div>

                    {/* Clear Button */}
                     <button
                        onClick={onClear}
                        className="bg-gray-800 hover:bg-red-900/30 hover:text-red-400 hover:border-red-900 text-gray-400 text-xs rounded-lg border border-gray-700 p-2 h-9 flex items-center justify-center w-9 transition-colors"
                        title="Clear Pattern"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                    </button>
                 </div>
                 <div className="flex gap-2 mt-2">
                     <button 
                        onClick={onExport}
                        className="flex-1 bg-gray-800 hover:bg-gray-700 text-gray-300 text-xs rounded-lg border border-gray-700 p-2 h-8 flex items-center justify-center gap-1"
                        title="Save Project JSON"
                     >
                         <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                             <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                         </svg>
                         Export
                    </button>
                    <button 
                        onClick={() => fileInputRef.current?.click()}
                        className="flex-1 bg-gray-800 hover:bg-gray-700 text-gray-300 text-xs rounded-lg border border-gray-700 p-2 h-8 flex items-center justify-center gap-1"
                        title="Load Project JSON"
                    >
                         <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                             <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                         </svg>
                         Import
                    </button>
                    <input 
                        type="file" 
                        ref={fileInputRef} 
                        onChange={handleFileChange} 
                        accept=".json" 
                        className="hidden" 
                    />
                 </div>
             </div>

             {/* AI Prompt */}
             <form onSubmit={handleGenerate} className="relative group mt-auto">
                <div className="absolute -inset-0.5 bg-gradient-to-r from-cyan-600 to-purple-600 rounded-lg blur opacity-20 group-hover:opacity-40 transition duration-1000"></div>
                <div className="relative flex gap-2 bg-gray-900 p-1.5 rounded-lg border border-gray-800">
                    <input
                        type="text"
                        value={prompt}
                        onChange={(e) => setPrompt(e.target.value)}
                        placeholder="AI: 'Fast DnB beat'"
                        className="flex-1 bg-transparent border-none focus:ring-0 text-white placeholder-gray-600 text-xs px-2"
                    />
                    <button
                        type="submit"
                        disabled={isGenerating || !isLoaded}
                        className="px-3 py-1 bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs rounded-md transition-colors disabled:opacity-50 whitespace-nowrap"
                    >
                        {isGenerating ? '...' : 'Dream'}
                    </button>
                </div>
              </form>
        </div>
      </div>
    </div>
  );
};

export default Controls;