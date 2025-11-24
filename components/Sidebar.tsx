import React, { useState, useEffect } from 'react';
import { StellarCategory, StellarBody, Scenario, CustomBodyTemplate, AnomalyType, DragPayload } from '../types';
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

const StellarNode: React.FC<{ 
    category?: StellarCategory; 
    anomalyType?: AnomalyType;
    template?: CustomBodyTemplate;
    label: string;
    subLabel?: string;
    color: string;
}> = ({ category, anomalyType, template, label, subLabel, color }) => {
    
    const handleDragStart = (e: React.DragEvent) => {
        const payload: DragPayload = {
            type: template ? 'CUSTOM' : anomalyType ? 'ANOMALY' : 'PRESET',
            data: {
                category,
                anomalyType,
                template
            }
        };
        e.dataTransfer.setData('application/json', JSON.stringify(payload));
        e.dataTransfer.effectAllowed = 'copy';
        
        // Custom drag image could go here
    };

    // Mini simulation styles
    let nodeStyle: React.CSSProperties = {
        background: `radial-gradient(circle at 30% 30%, ${color}, #000)`,
        boxShadow: `0 0 10px ${color}40`
    };

    // Specific visual tweaks based on type
    if (category?.includes('Star') || category?.includes('Giant') || category?.includes('Sun')) {
        nodeStyle.boxShadow = `0 0 15px ${color}, 0 0 30px ${color}40`;
        nodeStyle.animation = 'pulse 3s infinite ease-in-out';
    }
    if (category === StellarCategory.BLACK_HOLE || category === StellarCategory.SUPERMASSIVE_BLACK_HOLE) {
        nodeStyle.background = '#000';
        nodeStyle.border = '1px solid #fff';
        nodeStyle.boxShadow = `inset 0 0 10px #fff, 0 0 20px #ffffff40`;
    }
    if (anomalyType === 'WORMHOLE') {
        nodeStyle.background = 'conic-gradient(from 0deg, #a855f7, #000, #a855f7)';
        nodeStyle.borderRadius = '50%';
        nodeStyle.animation = 'spin 4s linear infinite';
    }

    return (
        <div 
            draggable 
            onDragStart={handleDragStart}
            className="group relative bg-gray-900 border border-gray-800 hover:border-blue-500 rounded-lg p-3 cursor-grab active:cursor-grabbing transition-all hover:bg-gray-800 flex items-center gap-4 select-none"
        >
            {/* Visual Node Representation */}
            <div className="w-10 h-10 rounded-full flex-shrink-0 relative overflow-hidden flex items-center justify-center bg-black/50">
                <div className="w-8 h-8 rounded-full transition-transform group-hover:scale-110" style={nodeStyle}></div>
            </div>

            <div className="flex-1 min-w-0">
                <h4 className="text-xs font-bold text-gray-200 truncate group-hover:text-white">{label}</h4>
                <p className="text-[10px] text-gray-500 truncate">{subLabel || category}</p>
            </div>

            <div className="text-gray-600 group-hover:text-blue-400">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path></svg>
            </div>
        </div>
    );
};

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

  // Group presets for display
  const stars = Object.values(StellarCategory).filter(c => 
    c.includes('Star') || c.includes('Giant') || c.includes('Dwarf') || c.includes('Pulsar') || c.includes('Magnetar')
  );
  const planets = Object.values(StellarCategory).filter(c => 
    c.includes('Planet') || c.includes('Moon') || c.includes('Asteroid')
  );
  const exotics = Object.values(StellarCategory).filter(c => 
    c.includes('Black Hole') || c.includes('Quasar')
  );

  return (
    <div className="absolute top-0 left-0 h-full w-80 bg-black/95 border-r border-gray-800 backdrop-blur-md flex flex-col z-10 overflow-hidden font-mono shadow-2xl">
      <style>{`
        @keyframes pulse { 0% { transform: scale(1); opacity: 0.8; } 50% { transform: scale(1.05); opacity: 1; } 100% { transform: scale(1); opacity: 0.8; } }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
      
      <div className="p-4 border-b border-gray-800 bg-gradient-to-r from-gray-900 to-black">
        <h1 className="text-xl font-bold tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-600">
            COSMIC BUILDER
        </h1>
        <p className="text-[10px] text-gray-500 mt-1 uppercase tracking-widest">God Mode Active</p>
      </div>

      {/* Selected Object Info */}
      <div className="p-4 border-b border-gray-800 min-h-[100px] bg-gray-900/30">
        <h2 className="text-[9px] font-bold text-gray-600 uppercase tracking-widest mb-2">Target Telemetry</h2>
        {selectedBody ? (
          <div className="animate-fadeIn">
            <div className="flex justify-between items-start mb-1">
                <h3 className="text-sm font-bold text-white truncate">{selectedBody.name}</h3>
                <button 
                    onClick={() => onDeleteBody(selectedBody.id)}
                    className="text-red-500 hover:bg-red-900/30 text-[10px] border border-red-900 px-2 py-0.5 rounded"
                >
                    DELETE
                </button>
            </div>
            <div className="grid grid-cols-2 gap-2 text-[10px] text-gray-400 mt-2">
                <div className="bg-black/50 p-1 rounded">M: <span className="text-blue-300">{selectedBody.mass.toFixed(1)}</span></div>
                <div className="bg-black/50 p-1 rounded">R: <span className="text-blue-300">{selectedBody.radius.toFixed(1)}</span></div>
            </div>
          </div>
        ) : (
            <div className="h-full flex flex-col items-center justify-center text-[10px] text-gray-700">
                <span>NO TARGET LOCKED</span>
                <span className="text-[9px] mt-1 opacity-50">Click object to inspect</span>
            </div>
        )}
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-800 bg-gray-900/50">
          {(['CATALOG', 'EDITOR', 'SCENARIOS'] as Tab[]).map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`flex-1 py-3 text-[9px] font-bold tracking-widest hover:bg-gray-800 transition ${activeTab === tab ? 'text-blue-400 border-b-2 border-blue-500 bg-gray-800' : 'text-gray-500'}`}
              >
                  {tab}
              </button>
          ))}
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar p-3 space-y-6">
        
        {/* CATALOG TAB */}
        {activeTab === 'CATALOG' && (
            <>
                 {/* Search */}
                <form onSubmit={handleSearch} className="sticky top-0 z-20 bg-black/80 pb-2 backdrop-blur">
                    <div className="flex gap-2">
                        <input 
                            type="text" 
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Find real star..."
                            className="w-full bg-gray-900 border border-gray-700 rounded px-2 py-1.5 text-xs text-white focus:border-blue-500 outline-none placeholder-gray-600"
                        />
                        <button type="submit" disabled={isSearching} className="bg-blue-900/30 border border-blue-800 text-blue-400 px-3 rounded text-xs hover:bg-blue-900/50">
                            {isSearching ? '...' : 'Go'}
                        </button>
                    </div>
                </form>

                {/* Draggable Nodes */}
                <div className="space-y-6">
                    <div>
                        <h3 className="text-[10px] text-gray-500 mb-2 uppercase tracking-widest font-bold">Planetary Bodies</h3>
                        <div className="grid grid-cols-1 gap-2">
                            {planets.map(cat => (
                                <StellarNode 
                                    key={cat} 
                                    category={cat} 
                                    label={cat} 
                                    color={STELLAR_PRESETS[cat].defaultColor} 
                                />
                            ))}
                        </div>
                    </div>

                    <div>
                        <h3 className="text-[10px] text-gray-500 mb-2 uppercase tracking-widest font-bold">Stellar Objects</h3>
                        <div className="grid grid-cols-1 gap-2">
                            {stars.map(cat => (
                                <StellarNode 
                                    key={cat} 
                                    category={cat} 
                                    label={cat} 
                                    color={STELLAR_PRESETS[cat].defaultColor} 
                                />
                            ))}
                        </div>
                    </div>

                    <div>
                        <h3 className="text-[10px] text-gray-500 mb-2 uppercase tracking-widest font-bold">Singularities</h3>
                        <div className="grid grid-cols-1 gap-2">
                            {exotics.map(cat => (
                                <StellarNode 
                                    key={cat} 
                                    category={cat} 
                                    label={cat} 
                                    color={STELLAR_PRESETS[cat].defaultColor} 
                                />
                            ))}
                        </div>
                    </div>

                    <div>
                        <h3 className="text-[10px] text-gray-500 mb-2 uppercase tracking-widest font-bold">Anomalies</h3>
                        <div className="grid grid-cols-1 gap-2">
                            <StellarNode 
                                anomalyType="WORMHOLE" 
                                label="Wormhole Pair" 
                                subLabel="Teleportation Gateway"
                                color="#a855f7" 
                            />
                            <StellarNode 
                                anomalyType="REPULSOR" 
                                label="Repulsor Field" 
                                subLabel="Anti-Gravity Node"
                                color="#ef4444" 
                            />
                        </div>
                         <button
                            onClick={handleGenerateAnomaly}
                            disabled={isGenerating}
                            className="w-full mt-2 py-3 border border-green-500/30 bg-green-900/10 text-green-400 hover:bg-green-900/30 rounded text-xs uppercase flex justify-center items-center gap-2 transition"
                        >
                            {isGenerating ? 'Computing...' : 'Generate Random Anomaly'}
                        </button>
                    </div>
                </div>
            </>
        )}

        {/* EDITOR TAB */}
        {activeTab === 'EDITOR' && (
            <div className="space-y-6">
                <div className="space-y-3 bg-gray-900/30 p-3 rounded border border-gray-800">
                    <h3 className="text-xs text-blue-400 uppercase font-bold mb-4">Fabricator</h3>
                    
                    <div className="space-y-1">
                        <label className="text-[10px] text-gray-500">Designation</label>
                        <input type="text" value={customName} onChange={(e) => setCustomName(e.target.value)} className="w-full bg-black border border-gray-700 px-2 py-1.5 text-xs text-white rounded focus:border-blue-500 outline-none" />
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                        <div className="space-y-1">
                            <label className="text-[10px] text-gray-500">Mass Index</label>
                            <input type="number" value={customMass} onChange={(e) => setCustomMass(parseFloat(e.target.value))} className="w-full bg-black border border-gray-700 px-2 py-1.5 text-xs text-white rounded focus:border-blue-500 outline-none" />
                        </div>
                        <div className="space-y-1">
                            <label className="text-[10px] text-gray-500">Radius (km)</label>
                            <input type="number" value={customRadius} onChange={(e) => setCustomRadius(parseFloat(e.target.value))} className="w-full bg-black border border-gray-700 px-2 py-1.5 text-xs text-white rounded focus:border-blue-500 outline-none" />
                        </div>
                    </div>

                    <div className="space-y-1">
                        <label className="text-[10px] text-gray-500">Spectral Signature</label>
                        <div className="flex gap-2 items-center bg-black p-1 rounded border border-gray-700">
                            <input type="color" value={customColor} onChange={(e) => setCustomColor(e.target.value)} className="h-6 w-8 bg-transparent border-none cursor-pointer" />
                            <span className="text-xs text-gray-400 font-mono">{customColor}</span>
                        </div>
                    </div>

                    <div className="flex gap-2 mt-4 pt-2 border-t border-gray-800">
                        <button 
                            onClick={handleSaveTemplate}
                            className="flex-1 bg-gray-800 hover:bg-gray-700 text-white py-2 rounded text-[10px] uppercase border border-gray-600 transition"
                        >
                            Save Blueprint
                        </button>
                    </div>
                </div>

                <div>
                    <h3 className="text-[10px] text-gray-500 mb-3 uppercase tracking-widest font-bold">My Blueprints</h3>
                    <div className="space-y-2">
                        {savedTemplates.length === 0 && <p className="text-[10px] text-gray-600 italic text-center py-4">No custom blueprints saved.</p>}
                        {savedTemplates.map(template => (
                            <div key={template.id} className="relative">
                                <StellarNode 
                                    template={template} 
                                    label={template.name} 
                                    subLabel={`M:${template.mass} R:${template.radius}`}
                                    color={template.color} 
                                />
                                <button 
                                    onClick={() => handleDeleteTemplate(template.id)}
                                    className="absolute top-2 right-2 text-red-500 hover:text-red-400 opacity-50 hover:opacity-100 p-1"
                                >
                                    ×
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        )}

        {/* SCENARIOS TAB */}
        {activeTab === 'SCENARIOS' && (
            <div className="space-y-4">
                <p className="text-[10px] text-yellow-500/80 bg-yellow-900/10 border border-yellow-900/30 p-2 rounded flex gap-2">
                    <span>⚠</span> Loading a scenario will reset the simulation.
                </p>
                {SCENARIOS.map(scenario => (
                    <button
                        key={scenario.id}
                        onClick={() => onLoadScenario(scenario)}
                        className="w-full text-left p-3 rounded border border-gray-800 hover:border-blue-500 hover:bg-gray-900 transition group relative overflow-hidden"
                    >
                        <div className="absolute inset-0 bg-blue-500/5 translate-y-full group-hover:translate-y-0 transition-transform duration-300"></div>
                        <h4 className="text-xs font-bold text-white group-hover:text-blue-400 relative z-10">{scenario.name}</h4>
                        <p className="text-[10px] text-gray-500 mt-1 leading-tight relative z-10">{scenario.description}</p>
                    </button>
                ))}
            </div>
        )}

      </div>
    </div>
  );
};

export default Sidebar;