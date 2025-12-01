import React from 'react';
import { GridPattern, Track } from '../types';

interface SequencerGridProps {
  grid: GridPattern;
  tracks: Track[];
  steps: number;
  currentStep: number;
  onToggle: (row: number, col: number, e: React.MouseEvent) => void;
  onRemoveTrack: (index: number) => void;
  onTrackChange: (index: number, updates: Partial<Track>) => void;
  isLoaded: boolean;
}

const SequencerGrid: React.FC<SequencerGridProps> = ({ 
  grid, 
  tracks, 
  steps,
  currentStep, 
  onToggle, 
  onRemoveTrack,
  onTrackChange,
  isLoaded 
}) => {
  
  const gridStyle = {
    gridTemplateColumns: `repeat(${steps}, minmax(0, 1fr))`
  };

  return (
    <div className="w-full bg-gray-900 rounded-xl shadow-2xl border border-gray-800 p-4 overflow-hidden flex flex-col">
      
      <div className="overflow-x-auto pb-2 custom-scrollbar">
        <div className="flex flex-col gap-2" style={{ minWidth: `${steps * 40}px` }}>
          
          {/* Timeline Ruler */}
          <div className="flex gap-4 items-end mb-1">
            {/* Header Spacer for controls */}
            <div className="w-64 shrink-0 flex justify-between px-2 text-xs text-gray-500 font-mono pb-1 uppercase tracking-wider">
               <span className="pl-8">Mixer</span>
               <span className="text-right">Track</span>
            </div>
            
            <div className="flex-1 grid gap-1" style={gridStyle}>
              {[...Array(steps)].map((_, i) => {
                 const isBeat = i % 4 === 0;
                 const isActive = currentStep === i;
                 return (
                   <div 
                     key={i} 
                     className={`
                       text-[10px] text-center py-1 rounded-t-sm transition-colors
                       ${isActive ? 'bg-gray-700 text-cyan-400 font-bold' : 'text-gray-600'}
                       ${isBeat && !isActive ? 'text-gray-400 font-medium' : ''}
                     `}
                   >
                     {i + 1}
                   </div>
                 );
              })}
            </div>
          </div>

          {/* Track Rows */}
          {tracks.map((track, rowIndex) => (
            <div key={track.id} className="flex items-center gap-4 group/row">
              {/* Instrument Controls */}
              <div className="w-64 shrink-0 flex items-center justify-between gap-3 bg-gray-900/50 p-2 rounded border border-transparent hover:border-gray-800 transition-colors">
                
                <div className="flex items-center gap-2 shrink-0">
                    {/* Delete */}
                    <button 
                        onClick={() => onRemoveTrack(rowIndex)}
                        className="w-5 h-5 flex items-center justify-center opacity-0 group-hover/row:opacity-100 text-gray-600 hover:text-red-500 transition-opacity"
                        title="Remove Track"
                        disabled={tracks.length <= 1}
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                        </svg>
                    </button>

                    {/* Mute */}
                    <button
                        onClick={() => onTrackChange(rowIndex, { muted: !track.muted })}
                        className={`
                            w-6 h-6 shrink-0 rounded flex items-center justify-center text-[10px] font-bold border transition-colors
                            ${track.muted 
                            ? 'bg-red-900/50 border-red-800 text-red-400' 
                            : 'bg-gray-800 border-gray-700 text-gray-400 hover:text-white'}
                        `}
                        title="Mute"
                    >
                        M
                    </button>
                </div>

                {/* Volume */}
                <div className="flex-1 px-1 group/vol flex items-center">
                    <input 
                        type="range" 
                        min="0" 
                        max="1" 
                        step="0.05"
                        value={track.volume}
                        onChange={(e) => onTrackChange(rowIndex, { volume: parseFloat(e.target.value) })}
                        className="w-full h-1 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-cyan-500 hover:accent-cyan-400"
                        title={`Volume: ${Math.round(track.volume * 100)}%`}
                    />
                </div>

                {/* Name */}
                <div className="w-20 text-right relative shrink-0">
                    <span className={`text-sm font-bold tracking-wider uppercase transition-colors truncate block ${isLoaded ? 'text-gray-300' : 'text-gray-600'} ${track.muted ? 'line-through opacity-50' : ''}`}>
                    {track.name}
                    </span>
                    <div className={`h-[2px] w-full mt-1 opacity-50 ${track.color.replace('bg-', 'bg-gradient-to-r from-transparent to-')}`}></div>
                </div>
              </div>

              {/* Steps Grid */}
              <div className="flex-1 grid gap-1" style={gridStyle}>
                {grid[rowIndex] && grid[rowIndex].map((active, stepIndex) => {
                  const isCurrent = currentStep === stepIndex;
                  const isBeat = stepIndex % 4 === 0;
                  
                  let bgClass = "bg-gray-800";
                  if (active) {
                    bgClass = track.muted ? "bg-gray-700" : track.color; // Dim color if muted
                  } else if (isCurrent) {
                    bgClass = "bg-gray-700";
                  } else if (isBeat) {
                    bgClass = "bg-gray-800/80";
                  }

                  const activeScale = active && isCurrent && !track.muted ? "scale-110 brightness-125 shadow-[0_0_10px_rgba(255,255,255,0.5)] z-10" : "";
                  const hoverState = !isLoaded ? "cursor-not-allowed" : "cursor-pointer hover:bg-gray-700 hover:scale-105";
                  const playHeadIndicator = isCurrent ? "ring-1 ring-white/20" : "";

                  return (
                    <button
                      key={stepIndex}
                      onClick={(e) => isLoaded && onToggle(rowIndex, stepIndex, e)}
                      disabled={!isLoaded}
                      className={`
                        aspect-square rounded-md transition-all duration-75 ease-out
                        ${bgClass}
                        ${activeScale}
                        ${hoverState}
                        ${playHeadIndicator}
                        border border-gray-900/40 relative
                        ${track.muted ? 'opacity-50' : ''}
                      `}
                      title={`${track.name} - Step ${stepIndex + 1}`}
                    >
                        {active && !track.muted && (
                            <div className="absolute inset-0 m-auto w-2 h-2 rounded-full bg-white/40"></div>
                        )}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default SequencerGrid;