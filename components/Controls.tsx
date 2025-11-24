import React from 'react';
import { CameraState, SimulationSettings } from '../types';

interface ControlsProps {
  settings: SimulationSettings;
  setSettings: React.Dispatch<React.SetStateAction<SimulationSettings>>;
  camera: CameraState;
  setCamera: React.Dispatch<React.SetStateAction<CameraState>>;
  onAnalyze: () => void;
  isAnalyzing: boolean;
}

const Controls: React.FC<ControlsProps> = ({
  settings,
  setSettings,
  camera,
  setCamera,
  onAnalyze,
  isAnalyzing
}) => {
  return (
    <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 bg-gray-900/80 backdrop-blur-md border border-gray-700 p-4 rounded-xl flex items-center gap-6 shadow-2xl z-20 pointer-events-auto">
      {/* Time Controls */}
      <div className="flex flex-col items-center border-r border-gray-600 pr-4">
        <label className="text-xs text-gray-400 mb-1">Time Flow</label>
        <div className="flex gap-2">
          <button
            onClick={() => setSettings(s => ({ ...s, paused: !s.paused }))}
            className={`px-3 py-1 rounded text-sm font-bold transition ${settings.paused ? 'bg-green-600 hover:bg-green-500' : 'bg-yellow-600 hover:bg-yellow-500'}`}
          >
            {settings.paused ? 'RESUME' : 'PAUSE'}
          </button>
          <input
            type="range"
            min="0.1"
            max="5000"
            step="0.1"
            value={settings.timeScale}
            onChange={(e) => setSettings(s => ({ ...s, timeScale: parseFloat(e.target.value) }))}
            className="w-24 accent-blue-500"
          />
          <span className="text-xs w-8">{settings.timeScale.toFixed(1)}x</span>
        </div>
      </div>

      {/* Movement Hint */}
      <div className="flex flex-col items-center border-r border-gray-600 pr-4">
        <label className="text-xs text-gray-400 mb-1">Navigation (FPS)</label>
        <div className="flex gap-2 items-center text-xs text-gray-300">
            <span className="border border-gray-600 px-1 rounded">W</span>
            <span className="border border-gray-600 px-1 rounded">A</span>
            <span className="border border-gray-600 px-1 rounded">S</span>
            <span className="border border-gray-600 px-1 rounded">D</span>
            <span className="mx-1">+</span>
            <span className="border border-gray-600 px-1 rounded" title="Ascend">SPACE</span>
            <span className="border border-gray-600 px-1 rounded" title="Descend">SHIFT</span>
            <span className="mx-1">+</span>
            <span className="text-[10px] text-gray-400">Scroll</span>
        </div>
      </div>

      {/* Toggles */}
      <div className="flex flex-col items-start gap-1 text-sm border-r border-gray-600 pr-4">
         <label className="flex items-center gap-2 cursor-pointer select-none">
            <input 
                type="checkbox" 
                checked={settings.showTrails} 
                onChange={() => setSettings(s => ({...s, showTrails: !s.showTrails}))}
                className="accent-blue-500"
            />
            Show Orbital Trails
         </label>
         <label className="flex items-center gap-2 cursor-pointer select-none">
            <input 
                type="checkbox" 
                checked={settings.showGrid} 
                onChange={() => setSettings(s => ({...s, showGrid: !s.showGrid}))}
                className="accent-blue-500"
            />
            Show Spacetime Grid
         </label>
         <label className="flex items-center gap-2 cursor-pointer select-none">
            <input 
                type="range" 
                min="0.1" max="5" step="0.1"
                value={settings.gravityConstant} 
                onChange={(e) => setSettings(s => ({...s, gravityConstant: parseFloat(e.target.value)}))}
                className="accent-purple-500 w-20 h-1 bg-gray-700 rounded-lg appearance-none"
            />
            <span className="text-xs">G: {settings.gravityConstant.toFixed(1)}</span>
         </label>
      </div>

      {/* AI Analysis */}
      <div>
        <button
            onClick={onAnalyze}
            disabled={isAnalyzing}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-bold transition shadow-lg border border-purple-500/50 ${
                isAnalyzing ? 'bg-purple-900/50 cursor-wait' : 'bg-gradient-to-r from-purple-700 to-indigo-600 hover:from-purple-600 hover:to-indigo-500'
            }`}
        >
            <svg className="w-5 h-5 animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.384-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z"></path></svg>
            {isAnalyzing ? 'Thinking...' : 'Analyze System'}
        </button>
      </div>
    </div>
  );
};

export default Controls;