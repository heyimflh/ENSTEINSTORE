'use client';

import React from 'react';
import { PageUIState } from '../../types/store';
import { Sliders, RefreshCw, AlertTriangle, CheckCircle, Clock } from 'lucide-react';

interface StateSimulationBarProps {
  currentState: PageUIState;
  onChangeState: (state: PageUIState) => void;
  isAuthenticated: boolean;
  onToggleAuth: () => void;
}

export const StateSimulationBar: React.FC<StateSimulationBarProps> = ({
  currentState,
  onChangeState,
  isAuthenticated,
  onToggleAuth,
}) => {
  return (
    <div className="bg-stone-900 text-stone-200 border-b border-stone-800 px-4 py-2 text-xs">
      <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3">
        
        {/* Left: Indicator */}
        <div className="flex items-center gap-2">
          <Sliders className="w-4 h-4 text-amber-400" />
          <span className="font-bold text-stone-100">Simulasi State UI (Testing Reviewer):</span>
        </div>

        {/* Middle: State Buttons */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <button
            onClick={() => onChangeState('SUCCESS')}
            className={`px-3 py-1 rounded-full font-medium transition-colors flex items-center gap-1 ${
              currentState === 'SUCCESS'
                ? 'bg-emerald-600 text-white font-bold'
                : 'bg-stone-800 text-stone-300 hover:bg-stone-700'
            }`}
          >
            <CheckCircle className="w-3 h-3" />
            Normal (Success)
          </button>

          <button
            onClick={() => onChangeState('LOADING')}
            className={`px-3 py-1 rounded-full font-medium transition-colors flex items-center gap-1 ${
              currentState === 'LOADING'
                ? 'bg-amber-500 text-slate-950 font-bold'
                : 'bg-stone-800 text-stone-300 hover:bg-stone-700'
            }`}
          >
            <Clock className="w-3 h-3" />
            Loading (Skeleton)
          </button>

          <button
            onClick={() => onChangeState('EMPTY')}
            className={`px-3 py-1 rounded-full font-medium transition-colors flex items-center gap-1 ${
              currentState === 'EMPTY'
                ? 'bg-sky-600 text-white font-bold'
                : 'bg-stone-800 text-stone-300 hover:bg-stone-700'
            }`}
          >
            Empty State
          </button>

          <button
            onClick={() => onChangeState('ERROR')}
            className={`px-3 py-1 rounded-full font-medium transition-colors flex items-center gap-1 ${
              currentState === 'ERROR'
                ? 'bg-rose-600 text-white font-bold'
                : 'bg-stone-800 text-stone-300 hover:bg-stone-700'
            }`}
          >
            <AlertTriangle className="w-3 h-3" />
            Error State
          </button>
        </div>

        {/* Right: Auth switch */}
        <div className="flex items-center gap-2">
          <span className="text-stone-400">Mode User:</span>
          <button
            onClick={onToggleAuth}
            className="px-2.5 py-1 rounded-md bg-stone-800 hover:bg-stone-700 font-mono text-[11px] text-amber-300 border border-stone-700 transition-colors"
          >
            {isAuthenticated ? 'Pelanggan: Bu Rina' : 'Guest (Tamu)'}
          </button>
        </div>

      </div>
    </div>
  );
};
