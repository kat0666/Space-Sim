import React, { useState, useEffect } from 'react';
import { StellarCategory, StellarBody, Scenario, CustomBodyTemplate, AnomalyType } from '../types';
import { STELLAR_PRESETS, SCENARIOS } from '../constants';
import { fetchRealObjectData, generateAnomaly } from '../services/geminiService';

interface SidebarProps {
  onSelectType: (type: StellarCategory) => void;
  selectedType: StellarCategory | null;
  selectedBody: StellarBody | null;
  onDeleteBody: (id: string) => void;
  onAddBodyDirectly: (body: StellarBody) => void;
  onLoadScenario: (scenario: Scenario) => void;
  onSelectAnomaly: (type: AnomalyType) => void;
  selectedAnomalyType: AnomalyType | null;
  onPlaceCustomBody: (template: CustomBodyTemplate) => void;
}

type Tab = 'CATALOG' | 'EDITOR' | 'SCENARIOS';

const Sidebar: React.FC<SidebarProps> = ({ 
    onSelectType, 
    selectedType, 
    selectedBody,
    onDeleteBody,
    onAddBodyDirectly,
    onLoadScenario,
    onSelectAnomaly,
    selectedAnomalyType,
    onPlaceCustomBody
}) => {
  const [activeTab, setActiveTab] = useState<Tab>('CATALOG');
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  // Editor State
  const [customName, setCustomName] = useState('My Planet');
  const [customMass, setCustomMass] = useState(100);
  const [customRadius, setCustomRadius] = useState(20);
  const [customColor, setCustomColor] = useState('#00ff00');
  const [savedTemplates, setSavedTemplates] = useState<CustomBodyTemplate[]>([]);

  useEffect(() => {
      const saved = localStorage.getItem('custom_bodies');
      if (saved) {
          try {
              setSavedTemplates(JSON.parse(saved));
          } catch(e) { console.error(e); }
      }
  }, []);

  const handleSaveTemplate = () => {
      const newTemplate: CustomBodyTemplate = {
          id: crypto.randomUUID(),
          name: customName,
          mass: customMass,
          radius: customRadius,
          color: customColor
      };
      const updated = [...savedTemplates, newTemplate];
      setSavedTemplates(updated);
      localStorage.setItem('custom_bodies', JSON.stringify(updated));
  };

  const handleDeleteTemplate = (id: string) => {
      const updated = savedTemplates.filter(t => t.id !== id);
      setSavedTemplates(updated);
      localStorage.setItem('custom_bodies', JSON.stringify(updated));
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    
    setIsSearching(true);
    const data = await fetchRealObjectData(searchQuery);
    setIsSearching(false);
    
    if (data) {
        const newBody: StellarBody = {
            id: crypto.randomUUID(),
            name: data.name,
            category: data.category,
            mass: data.mass,
            radius: data.radius,
            color: STELLAR_PRESETS[data.category]?.defaultColor || '#fff',
            position: { x: (Math.random() - 0.5) * 500, y: (Math.random() - 0.5) * 500 },
            velocity: { x: 0, y: 0 },
            trail: [],
            description: data.description
        };
        onAddBodyDirectly(newBody);
        setSearchQuery('');
    }
  };

  const handleGenerateAnomaly = async () => {
      setIsGenerating(true);
      const anomaly = await generateAnomaly();
      setIsGenerating(false);
      if (anomaly) {
        anomaly.position = { x: (Math.random() - 0.5) * 800, y: (Math.random() - 0.5) * 800 };
        onAddBodyDirectly(anomaly);
      }
  };

  return (
    <div className="absolute top-0 left-0 h-full w-80 bg-black/90 border-r border-gray-800 backdrop-blur-sm flex flex-col z-10 overflow-hidden font-mono">
      <div className="p-4 border-b border-gray-800">
        <h1 className="text-xl font-bold tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-600">
            COSMIC GRAVITY
        </h1>
        <p className="text-xs text-gray-500 mt-1">Stellar Simulator v2.1</p>
      </div>

      {/* Selected Object Info (Always Visible) */}
      <div className="p-4 border-b border-gray-800 min-h-[120px] bg-gray-900/50">
        <h2 className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2">Target Telemetry</h2>
        {selectedBody ? (
          <div className="animate-fadeIn">
            <div className="flex justify-between items-start mb-1">
                <h3 className="text-md font-bold text-white truncate">{selectedBody.name}</h3>
                <button 
                    onClick={() => onDeleteBody(selectedBody.id)}
                    className="text-red-500 hover:text-red-400 text-[10px] border border-red-900 bg-red-900/20 px-1 py-0.5 rounded"
                >
                    DESTROY
                </button>
            </div>
            <p className="text-[10px] text-blue-400 mb-2">{selectedBody.category} {selectedBody.anomalyType ? `[${selectedBody.anomalyType}]` : ''}</p>
            <div className="grid grid-cols-2 gap-2 text-[10px] text-gray-400">
                <div>Mass: <span className="text-white">{selectedBody.mass.toFixed(2)}</span></div>
                <div>Radius: <span className="text-white">{selectedBody.radius.toFixed(2)}</span></div>
                <div>Pos: <span className="text-white">{selectedBody.position.x.toFixed(0)}, {selectedBody.position.y.toFixed(0)}</span></div>
            </div>
          </div>
        ) : (
            <div className="h-full flex items-center justify-center text-[10px] text-gray-700">
                NO TARGET SELECTED
            </div>
        )}
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-800">
          {(['CATALOG', 'EDITOR', 'SCENARIOS'] as Tab[]).map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`flex-1 py-3 text-[10px] font-bold tracking-wider hover:bg-gray-900 transition ${activeTab === tab ? 'text-blue-400 border-b-2 border-blue-500 bg-gray-900' : 'text-gray-500'}`}
              >
                  {tab}
              </button>
          ))}
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar p-4">
        
        {/* CATALOG TAB */}
        {activeTab === 'CATALOG' && (
            <div className="space-y-4">
                 {/* Search */}
                <form onSubmit={handleSearch}>
                    <div className="flex gap-2">
                        <input 
                            type="text" 
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Find real star..."
                            className="w-full bg-gray-900 border border-gray-700 rounded px-2 py-1 text-xs text-white focus:border-blue-500 outline-none"
                        />
                        <button type="submit" disabled={isSearching} className="bg-blue-900/30 border border-blue-800 text-blue-400 px-2 rounded text-xs">
                            {isSearching ? '...' : 'Go'}
                        </button>
                    </div>
                </form>

                <div>
                    <h3 className="text-xs text-gray-500 mb-2 uppercase">Standard Matter</h3>
                    <div className="grid grid-cols-2 gap-1">
                        {Object.values(StellarCategory).filter(c => c !== StellarCategory.ANOMALY).map((cat) => (
                            <button
                                key={cat}
                                onClick={() => { onSelectType(cat); onSelectAnomaly(null as any); }}
                                className={`text-left px-2 py-2 rounded text-[10px] uppercase border transition truncate ${
                                    selectedType === cat 
                                    ? 'bg-white text-black border-white' 
                                    : 'bg-black text-gray-400 border-gray-800 hover:border-gray-600'
                                }`}
                            >
                                {cat}
                            </button>
                        ))}
                    </div>
                </div>

                <div>
                    <h3 className="text-xs text-gray-500 mb-2 uppercase">Exotic Physics</h3>
                    <div className="space-y-2">
                        <button
                            onClick={() => { onSelectAnomaly('WORMHOLE'); onSelectType(null as any); }}
                            className={`w-full text-left px-3 py-2 rounded text-xs uppercase border flex justify-between items-center ${
                                selectedAnomalyType === 'WORMHOLE' ? 'bg-purple-900/50 border-purple-500 text-purple-200' : 'bg-black border-purple-900/30 text-purple-400 hover:border-purple-500'
                            }`}
                        >
                            <span>Wormhole Pair</span>
                            <span>◎</span>
                        </button>
                        <button
                            onClick={() => { onSelectAnomaly('REPULSOR'); onSelectType(null as any); }}
                            className={`w-full text-left px-3 py-2 rounded text-xs uppercase border flex justify-between items-center ${
                                selectedAnomalyType === 'REPULSOR' ? 'bg-red-900/50 border-red-500 text-red-200' : 'bg-black border-red-900/30 text-red-400 hover:border-red-500'
                            }`}
                        >
                            <span>Repulsor Field</span>
                            <span>⦾</span>
                        </button>
                        <button
                            onClick={handleGenerateAnomaly}
                            disabled={isGenerating}
                            className="w-full py-2 border border-green-500/30 bg-green-900/10 text-green-400 hover:bg-green-900/30 rounded text-xs uppercase flex justify-center items-center gap-2"
                        >
                            {isGenerating ? 'Computing...' : 'Generate Random Anomaly'}
                        </button>
                    </div>
                </div>
            </div>
        )}

        {/* EDITOR TAB */}
        {activeTab === 'EDITOR' && (
            <div className="space-y-6">
                <div className="space-y-3 bg-gray-900/30 p-3 rounded border border-gray-800">
                    <h3 className="text-xs text-blue-400 uppercase font-bold">Design Parameters</h3>
                    
                    <div className="space-y-1">
                        <label className="text-[10px] text-gray-500">Name</label>
                        <input type="text" value={customName} onChange={(e) => setCustomName(e.target.value)} className="w-full bg-black border border-gray-700 px-2 py-1 text-xs text-white" />
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                        <div className="space-y-1">
                            <label className="text-[10px] text-gray-500">Mass (Relative)</label>
                            <input type="number" value={customMass} onChange={(e) => setCustomMass(parseFloat(e.target.value))} className="w-full bg-black border border-gray-700 px-2 py-1 text-xs text-white" />
                        </div>
                        <div className="space-y-1">
                            <label className="text-[10px] text-gray-500">Radius</label>
                            <input type="number" value={customRadius} onChange={(e) => setCustomRadius(parseFloat(e.target.value))} className="w-full bg-black border border-gray-700 px-2 py-1 text-xs text-white" />
                        </div>
                    </div>

                    <div className="space-y-1">
                        <label className="text-[10px] text-gray-500">Signature Color</label>
                        <div className="flex gap-2">
                            <input type="color" value={customColor} onChange={(e) => setCustomColor(e.target.value)} className="h-6 w-8 bg-transparent border-none" />
                            <span className="text-xs text-gray-400 pt-1">{customColor}</span>
                        </div>
                    </div>

                    <div className="flex gap-2 mt-4">
                        <button 
                            onClick={handleSaveTemplate}
                            className="flex-1 bg-gray-800 hover:bg-gray-700 text-white py-1 rounded text-[10px] uppercase border border-gray-600"
                        >
                            Save Preset
                        </button>
                        <button 
                            onClick={() => onPlaceCustomBody({ id: '', name: customName, mass: customMass, radius: customRadius, color: customColor })}
                            className="flex-1 bg-blue-900 hover:bg-blue-800 text-white py-1 rounded text-[10px] uppercase border border-blue-600 font-bold"
                        >
                            Launch Now
                        </button>
                    </div>
                </div>

                <div>
                    <h3 className="text-xs text-gray-500 mb-2 uppercase">Saved Blueprints</h3>
                    <div className="space-y-2">
                        {savedTemplates.length === 0 && <p className="text-[10px] text-gray-600 italic">No custom objects saved.</p>}
                        {savedTemplates.map(template => (
                            <div key={template.id} className="flex items-center justify-between bg-gray-900 border border-gray-800 p-2 rounded group hover:border-gray-600 transition">
                                <div className="flex items-center gap-2">
                                    <div className="w-3 h-3 rounded-full" style={{ background: template.color }}></div>
                                    <span className="text-xs text-gray-300">{template.name}</span>
                                </div>
                                <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition">
                                    <button 
                                        onClick={() => onPlaceCustomBody(template)}
                                        className="text-blue-400 hover:text-blue-300 text-[10px] uppercase"
                                    >
                                        Load
                                    </button>
                                    <button 
                                        onClick={() => handleDeleteTemplate(template.id)}
                                        className="text-red-500 hover:text-red-400"
                                    >
                                        ×
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        )}

        {/* SCENARIOS TAB */}
        {activeTab === 'SCENARIOS' && (
            <div className="space-y-4">
                <p className="text-[10px] text-yellow-600 bg-yellow-900/10 border border-yellow-900/30 p-2 rounded">
                    ⚠ Warning: Loading a scenario will clear the current simulation state.
                </p>
                {SCENARIOS.map(scenario => (
                    <button
                        key={scenario.id}
                        onClick={() => onLoadScenario(scenario)}
                        className="w-full text-left p-3 rounded border border-gray-800 hover:border-blue-500 hover:bg-gray-900 transition group"
                    >
                        <h4 className="text-xs font-bold text-white group-hover:text-blue-400">{scenario.name}</h4>
                        <p className="text-[10px] text-gray-500 mt-1 leading-tight">{scenario.description}</p>
                    </button>
                ))}
            </div>
        )}

      </div>
    </div>
  );
};

export default Sidebar;