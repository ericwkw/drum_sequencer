import React from 'react';
import { GridPattern, Instrument } from '../types';
import { INSTRUMENTS, STEPS } from '../constants';

interface SequencerGridProps {
  grid: GridPattern;
  currentStep: number;
  onToggle: (row: number, col: number) => void;
  isLoaded: boolean;
}

const SequencerGrid: React.FC<SequencerGridProps> = ({ grid, currentStep, onToggle, isLoaded }) => {
  return (
    <div className="flex flex-col gap-2 p-4 bg-gray-900 rounded-xl shadow-2xl border border-gray-800">
      {INSTRUMENTS.map((inst, rowIndex) => (
        <div key={inst.id} className="flex items-center gap-2 sm:gap-4">
          {/* Instrument Label */}
          <div className="w-16 sm:w-24 text-right">
            <span className={`text-xs sm:text-sm font-bold tracking-wider uppercase ${isLoaded ? 'text-gray-300' : 'text-gray-600'}`}>
              {inst.name}
            </span>
          </div>

          {/* Steps */}
          <div className="flex-1 grid grid-cols-16 gap-1">
            {grid[rowIndex].map((active, stepIndex) => {
              const isCurrent = currentStep === stepIndex;
              const isBeat = stepIndex % 4 === 0; // Visual marker for beats
              
              let bgClass = "bg-gray-800";
              if (active) {
                bgClass = inst.color; // Active Note Color
              } else if (isCurrent) {
                bgClass = "bg-gray-700"; // Playhead passing empty slot
              } else if (isBeat) {
                bgClass = "bg-gray-800/80"; // Metronome marker
              }

              // Brightness boost when playhead hits an active note
              const activeScale = active && isCurrent ? "scale-110 brightness-125 shadow-[0_0_10px_rgba(255,255,255,0.5)]" : "";
              const hoverState = !isLoaded ? "cursor-not-allowed" : "cursor-pointer hover:bg-gray-700 hover:scale-105";

              return (
                <button
                  key={stepIndex}
                  onClick={() => isLoaded && onToggle(rowIndex, stepIndex)}
                  disabled={!isLoaded}
                  className={`
                    aspect-square rounded-sm sm:rounded-md transition-all duration-100 ease-in-out
                    ${bgClass}
                    ${activeScale}
                    ${hoverState}
                    border border-gray-900/20
                  `}
                  aria-label={`${inst.name} step ${stepIndex + 1}`}
                />
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
};

export default SequencerGrid;
