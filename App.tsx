import React, { useState } from 'react';
import Sidebar from './components/Sidebar';
import SimulationCanvas from './components/SimulationCanvas';
import Controls from './components/Controls';
import { StellarBody, StellarCategory, CameraState, SimulationSettings, Vector2, SimulationAnalysis, Scenario, AnomalyType, CustomBodyTemplate, DragPayload } from './types';
import { STELLAR_PRESETS } from './constants';
import { analyzeSimulationStability } from './services/geminiService';

const App: React.FC = () => {
  const [bodies, setBodies] = useState<StellarBody[]>([
    {
      id: 'sun-default',
      name: 'Sun',
      category: StellarCategory.STAR,
      mass: 1000,
      radius: 60,
      position: { x: 0, y: 0 },
      velocity: { x: 0, y: 0 },
      color: '#ffffaa',
      trail: [],
      description: 'The center of our solar system.'
    },
    {
      id: 'earth-default',
      name: 'Earth',
      category: StellarCategory.PLANET,
      mass: 20,
      radius: 15,
      position: { x: 300, y: 0 },
      velocity: { x: 0, y: 1.3 }, 
      color: '#4488ff',
      trail: [],
      description: 'Our home.'
    }
  ]);

  const [camera, setCamera] = useState<CameraState>({ x: 0, y: 0, zoom: 0.8, rotation: 0 });
  const [settings, setSettings] = useState<SimulationSettings>({
    timeScale: 1,
    paused: false,
    showTrails: true,
    gravityConstant: 0.5,
    showGrid: true
  });

  const [selectedType, setSelectedType] = useState<StellarCategory | null>(null);
  const [selectedAnomalyType, setSelectedAnomalyType] = useState<AnomalyType | null>(null);
  const [selectedBodyId, setSelectedBodyId] = useState<string | null>(null);
  const [analysisResult, setAnalysisResult] = useState<SimulationAnalysis | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [showAnalysisModal, setShowAnalysisModal] = useState(false);
  
  // Custom template temporarily held for placement
  const [customTemplate, setCustomTemplate] = useState<CustomBodyTemplate | null>(null);

  // Unified body creation logic
  const createBodiesFromData = (position: Vector2, velocity: Vector2, type: StellarCategory | null, anomaly: AnomalyType | null, template: CustomBodyTemplate | null): StellarBody[] => {
    let newBodies: StellarBody[] = [];

    if (template) {
        newBodies.push({
            id: crypto.randomUUID(),
            name: template.name,
            category: StellarCategory.PLANET, // Default category for custom
            mass: template.mass,
            radius: template.radius,
            position,
            velocity,
            color: template.color,
            trail: []
        });
    } 
    else if (anomaly === 'WORMHOLE') {
        const id1 = crypto.randomUUID();
        const id2 = crypto.randomUUID();
        newBodies.push({
            id: id1,
            name: 'Wormhole Alpha',
            category: StellarCategory.ANOMALY,
            anomalyType: 'WORMHOLE',
            linkedBodyId: id2,
            mass: 500,
            radius: 30,
            position,
            velocity,
            color: '#a855f7',
            trail: []
        });
        newBodies.push({
            id: id2,
            name: 'Wormhole Beta',
            category: StellarCategory.ANOMALY,
            anomalyType: 'WORMHOLE',
            linkedBodyId: id1,
            mass: 500,
            radius: 30,
            position: { x: position.x + 200, y: position.y + 200 }, 
            velocity: { x: 0, y: 0 },
            color: '#a855f7',
            trail: []
        });
    }
    else if (anomaly === 'REPULSOR') {
         newBodies.push({
            id: crypto.randomUUID(),
            name: 'Repulsor Node',
            category: StellarCategory.ANOMALY,
            anomalyType: 'REPULSOR',
            mass: 2000, 
            radius: 25,
            position,
            velocity,
            color: '#ef4444',
            trail: []
        });
    }
    else if (type) {
        const preset = STELLAR_PRESETS[type];
        const mass = preset.minMass + Math.random() * (preset.maxMass - preset.minMass);
        const radius = preset.minRadius + Math.random() * (preset.maxRadius - preset.minRadius);
        
        newBodies.push({
          id: crypto.randomUUID(),
          name: `${type} ${Math.floor(Math.random() * 1000)}`,
          category: type,
          mass,
          radius,
          position,
          velocity,
          color: preset.defaultColor,
          trail: []
        });
    }

    return newBodies;
  };

  // Called via Drag & Drop (Velocity is 0)
  const handleDropBody = (position: Vector2, payload: DragPayload) => {
      const bodies = createBodiesFromData(
          position, 
          { x: 0, y: 0 }, 
          payload.data.category || null, 
          payload.data.anomalyType || null, 
          payload.data.template || null
      );
      setBodies(prev => [...prev, ...bodies]);
  };

  // Called via Click & Drag Launch
  const handleBodyPlace = (position: Vector2, velocity: Vector2) => {
    const bodies = createBodiesFromData(
        position, 
        velocity, 
        selectedType, 
        selectedAnomalyType, 
        customTemplate
    );
    
    setBodies(prev => [...prev, ...bodies]);

    // Reset selection after launch
    if (customTemplate) setCustomTemplate(null);
    else if (selectedAnomalyType) setSelectedAnomalyType(null);
    else if (selectedType) setSelectedType(null);
  };

  const handleAddBodyDirectly = (body: StellarBody) => {
      setBodies(prev => [...prev, body]);
  };

  const handleDeleteBody = (id: string) => {
    setBodies(prev => prev.filter(b => b.id !== id));
    if (selectedBodyId === id) setSelectedBodyId(null);
  };

  const handleAnalyze = async () => {
    setIsAnalyzing(true);
    const result = await analyzeSimulationStability(bodies);
    setAnalysisResult(result);
    setIsAnalyzing(false);
    setShowAnalysisModal(true);
  };

  const handleLoadScenario = (scenario: Scenario) => {
      setBodies(scenario.bodies.map(b => ({...b, trail: [], id: crypto.randomUUID()}))); 
      if (scenario.camera) {
          setCamera(prev => ({...prev, ...scenario.camera}));
      }
      if (scenario.settings) {
          setSettings(prev => ({...prev, ...scenario.settings}));
      }
  };

  const handlePlaceCustomBody = (template: CustomBodyTemplate) => {
      setCustomTemplate(template);
      setSelectedType(null);
      setSelectedAnomalyType(null);
  };

  const selectedBody = bodies.find(b => b.id === selectedBodyId) || null;

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-black text-white">
      <SimulationCanvas
        bodies={bodies}
        setBodies={setBodies}
        camera={camera}
        setCamera={setCamera}
        settings={settings}
        placingBodyType={selectedType}
        placingAnomalyType={selectedAnomalyType}
        onBodyPlace={handleBodyPlace}
        selectedBodyId={selectedBodyId}
        setSelectedBodyId={setSelectedBodyId}
        onDropBody={handleDropBody}
      />

      <Sidebar
        onSelectType={setSelectedType}
        selectedType={selectedType}
        selectedBody={selectedBody}
        onDeleteBody={handleDeleteBody}
        onAddBodyDirectly={handleAddBodyDirectly}
        onLoadScenario={handleLoadScenario}
        onSelectAnomaly={setSelectedAnomalyType}
        selectedAnomalyType={selectedAnomalyType}
        onPlaceCustomBody={handlePlaceCustomBody}
      />

      <Controls
        settings={settings}
        setSettings={setSettings}
        camera={camera}
        setCamera={setCamera}
        onAnalyze={handleAnalyze}
        isAnalyzing={isAnalyzing}
      />

      {/* Placing Indicator (for traditional click-to-launch) */}
      {(selectedType || selectedAnomalyType || customTemplate) && (
        <div className="absolute top-4 left-1/2 transform -translate-x-1/2 bg-blue-900/80 border border-blue-500 px-6 py-2 rounded-full text-blue-100 font-bold shadow-[0_0_20px_rgba(0,100,255,0.5)] animate-pulse pointer-events-none z-50">
          LAUNCH MODE: {customTemplate ? customTemplate.name.toUpperCase() : (selectedType || selectedAnomalyType)?.toUpperCase()}
        </div>
      )}

      {/* Analysis Modal */}
      {showAnalysisModal && analysisResult && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-gray-900 border border-purple-500/50 rounded-2xl max-w-2xl w-full p-8 shadow-[0_0_50px_rgba(100,0,255,0.2)]">
            <h2 className="text-2xl font-bold mb-4 flex items-center gap-2 text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-500">
                <span className="text-3xl">✨</span> System Analysis
            </h2>
            
            <div className="space-y-6">
                <div>
                    <div className="flex justify-between mb-1">
                        <span className="text-gray-400 text-sm uppercase tracking-widest">Stability Score</span>
                        <span className={`font-bold ${analysisResult.stabilityScore > 70 ? 'text-green-400' : analysisResult.stabilityScore > 40 ? 'text-yellow-400' : 'text-red-400'}`}>
                            {analysisResult.stabilityScore}/100
                        </span>
                    </div>
                    <div className="h-2 w-full bg-gray-800 rounded-full overflow-hidden">
                        <div 
                            className={`h-full ${analysisResult.stabilityScore > 70 ? 'bg-green-500' : analysisResult.stabilityScore > 40 ? 'bg-yellow-500' : 'bg-red-500'}`} 
                            style={{ width: `${analysisResult.stabilityScore}%` }}
                        ></div>
                    </div>
                </div>

                <div className="bg-black/40 p-4 rounded border border-gray-800">
                    <p className="text-gray-300 leading-relaxed font-serif text-lg italic">
                        "{analysisResult.prediction}"
                    </p>
                </div>

                {analysisResult.notableInteractions.length > 0 && (
                    <div>
                        <h3 className="text-gray-400 text-sm uppercase tracking-widest mb-2">Notable Interactions</h3>
                        <ul className="grid grid-cols-1 gap-2">
                            {analysisResult.notableInteractions.map((note, i) => (
                                <li key={i} className="flex items-center gap-2 text-sm text-purple-300">
                                    <span className="w-1.5 h-1.5 rounded-full bg-purple-500"></span>
                                    {note}
                                </li>
                            ))}
                        </ul>
                    </div>
                )}
            </div>

            <button 
                onClick={() => setShowAnalysisModal(false)}
                className="mt-8 w-full bg-gray-800 hover:bg-gray-700 text-white py-3 rounded-lg font-bold transition uppercase tracking-widest"
            >
                Return to Simulation
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;