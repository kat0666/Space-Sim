import { StellarCategory, StellarPreset, Scenario, StellarBody } from './types';

export const G_CONSTANT = 0.5; // Visual gravity constant, not real G

// Visual Scale Factors
export const MASS_SCALE = 1; 
export const RADIUS_SCALE = 1;

export const STELLAR_PRESETS: Record<StellarCategory, StellarPreset> = {
  [StellarCategory.ASTEROID]: {
    category: StellarCategory.ASTEROID,
    minMass: 0.001,
    maxMass: 0.05,
    minRadius: 1,
    maxRadius: 3,
    defaultColor: '#888888',
  },
  [StellarCategory.MOON]: {
    category: StellarCategory.MOON,
    minMass: 0.1,
    maxMass: 0.5,
    minRadius: 3,
    maxRadius: 6,
    defaultColor: '#cccccc',
  },
  [StellarCategory.DWARF_PLANET]: {
    category: StellarCategory.DWARF_PLANET,
    minMass: 0.5,
    maxMass: 2,
    minRadius: 5,
    maxRadius: 8,
    defaultColor: '#aaddff',
  },
  [StellarCategory.PLANET]: {
    category: StellarCategory.PLANET,
    minMass: 5,
    maxMass: 100,
    minRadius: 10,
    maxRadius: 25,
    defaultColor: '#4488ff',
  },
  [StellarCategory.BROWN_DWARF]: {
    category: StellarCategory.BROWN_DWARF,
    minMass: 150,
    maxMass: 300,
    minRadius: 30,
    maxRadius: 40,
    defaultColor: '#aa5500',
  },
  [StellarCategory.STAR]: {
    category: StellarCategory.STAR,
    minMass: 500,
    maxMass: 2000,
    minRadius: 50,
    maxRadius: 80,
    defaultColor: '#ffffaa',
  },
  [StellarCategory.WHITE_DWARF]: {
    category: StellarCategory.WHITE_DWARF,
    minMass: 800,
    maxMass: 1400,
    minRadius: 10,
    maxRadius: 15,
    defaultColor: '#ffffff',
  },
  [StellarCategory.NEUTRON_STAR]: {
    category: StellarCategory.NEUTRON_STAR,
    minMass: 2000,
    maxMass: 4000,
    minRadius: 5,
    maxRadius: 8,
    defaultColor: '#00ffff',
  },
  [StellarCategory.PULSAR]: {
    category: StellarCategory.PULSAR,
    minMass: 2000,
    maxMass: 4000,
    minRadius: 5,
    maxRadius: 8,
    defaultColor: '#00ffaa',
  },
  [StellarCategory.MAGNETAR]: {
    category: StellarCategory.MAGNETAR,
    minMass: 2500,
    maxMass: 4500,
    minRadius: 5,
    maxRadius: 8,
    defaultColor: '#ff00ff',
  },
  [StellarCategory.RED_GIANT]: {
    category: StellarCategory.RED_GIANT,
    minMass: 2000,
    maxMass: 5000,
    minRadius: 100,
    maxRadius: 200,
    defaultColor: '#ff4444',
  },
  [StellarCategory.BLUE_GIANT]: {
    category: StellarCategory.BLUE_GIANT,
    minMass: 5000,
    maxMass: 10000,
    minRadius: 80,
    maxRadius: 150,
    defaultColor: '#4444ff',
  },
  [StellarCategory.RED_HYPERGIANT]: {
    category: StellarCategory.RED_HYPERGIANT,
    minMass: 10000,
    maxMass: 30000,
    minRadius: 250,
    maxRadius: 500,
    defaultColor: '#aa0000',
  },
  [StellarCategory.BLACK_HOLE]: {
    category: StellarCategory.BLACK_HOLE,
    minMass: 5000,
    maxMass: 20000,
    minRadius: 10, // Event horizon
    maxRadius: 30,
    defaultColor: '#333333', // Will have white accretion disk
  },
  [StellarCategory.QUASAR]: {
    category: StellarCategory.QUASAR,
    minMass: 50000,
    maxMass: 200000,
    minRadius: 20,
    maxRadius: 50,
    defaultColor: '#ffffff',
  },
  [StellarCategory.SUPERMASSIVE_BLACK_HOLE]: {
    category: StellarCategory.SUPERMASSIVE_BLACK_HOLE,
    minMass: 500000,
    maxMass: 2000000,
    minRadius: 100,
    maxRadius: 300,
    defaultColor: '#000000',
  },
  [StellarCategory.ANOMALY]: {
    category: StellarCategory.ANOMALY,
    minMass: 100,
    maxMass: 50000,
    minRadius: 5,
    maxRadius: 200,
    defaultColor: '#00ff00',
  },
};

// Helper for Procedural Generation
const createRing = (count: number, centerMass: number, radiusMin: number, radiusMax: number): StellarBody[] => {
    const bodies: StellarBody[] = [];
    for(let i=0; i<count; i++) {
        const angle = Math.random() * Math.PI * 2;
        const dist = radiusMin + Math.random() * (radiusMax - radiusMin);
        const velocity = Math.sqrt(G_CONSTANT * centerMass / dist);
        
        bodies.push({
            id: crypto.randomUUID(),
            name: `Debris-${i}`,
            category: StellarCategory.ASTEROID,
            mass: 0.1,
            radius: 1 + Math.random(),
            position: { x: Math.cos(angle) * dist, y: Math.sin(angle) * dist },
            velocity: { x: -Math.sin(angle) * velocity, y: Math.cos(angle) * velocity },
            color: '#555',
            trail: []
        });
    }
    return bodies;
};

export const SCENARIOS: Scenario[] = [
    {
        id: 'solar-system',
        name: 'Our Solar System',
        description: 'A simplified scale model of our home system.',
        bodies: [
            { id: 'sun', name: 'Sun', category: StellarCategory.STAR, mass: 5000, radius: 100, position: {x:0, y:0}, velocity: {x:0, y:0}, color: '#ffff00', trail: [] },
            { id: 'mercury', name: 'Mercury', category: StellarCategory.PLANET, mass: 5, radius: 8, position: {x:150, y:0}, velocity: {x:0, y:4}, color: '#aaaaaa', trail: [] },
            { id: 'venus', name: 'Venus', category: StellarCategory.PLANET, mass: 40, radius: 15, position: {x:250, y:0}, velocity: {x:0, y:3.1}, color: '#ffcc00', trail: [] },
            { id: 'earth', name: 'Earth', category: StellarCategory.PLANET, mass: 50, radius: 16, position: {x:350, y:0}, velocity: {x:0, y:2.6}, color: '#00aaff', trail: [] },
            { id: 'mars', name: 'Mars', category: StellarCategory.PLANET, mass: 10, radius: 10, position: {x:500, y:0}, velocity: {x:0, y:2.2}, color: '#ff4400', trail: [] },
            { id: 'jupiter', name: 'Jupiter', category: StellarCategory.PLANET, mass: 1000, radius: 50, position: {x:800, y:0}, velocity: {x:0, y:1.7}, color: '#ddaa88', trail: [] },
        ],
        camera: { zoom: 0.3 }
    },
    {
        id: 'planetary-migration',
        name: 'Planetary Migration',
        description: 'A gas giant spiraling inwards, disrupting inner planets.',
        bodies: [
            { id: 'star-mig', name: 'Host Star', category: StellarCategory.STAR, mass: 3000, radius: 80, position: {x:0, y:0}, velocity: {x:0, y:0}, color: '#ffaa00', trail: [] },
            { id: 'planet-1', name: 'Inner World', category: StellarCategory.PLANET, mass: 10, radius: 10, position: {x:200, y:0}, velocity: {x:0, y:2.7}, color: '#00ffaa', trail: [] },
            { id: 'planet-2', name: 'Water World', category: StellarCategory.PLANET, mass: 20, radius: 15, position: {x:300, y:0}, velocity: {x:0, y:2.2}, color: '#00aaff', trail: [] },
            // Gas giant with retrograde orbit or slight eccentricity to cause chaos
            { id: 'rogue-giant', name: 'Migrating Giant', category: StellarCategory.PLANET, mass: 800, radius: 40, position: {x:600, y:0}, velocity: {x:0, y:1.3}, color: '#ff88aa', trail: [] },
        ]
    },
    {
        id: 'galactic-merger',
        name: 'Galactic Merger',
        description: 'Two clusters of stars colliding.',
        bodies: [
            // Core 1
            { id: 'core-1', name: 'Galaxy A Core', category: StellarCategory.SUPERMASSIVE_BLACK_HOLE, mass: 5000, radius: 20, position: {x:-400, y:0}, velocity: {x:0.5, y:0.5}, color: '#000', trail: [] },
            // Core 2
            { id: 'core-2', name: 'Galaxy B Core', category: StellarCategory.SUPERMASSIVE_BLACK_HOLE, mass: 5000, radius: 20, position: {x:400, y:0}, velocity: {x:-0.5, y:-0.5}, color: '#000', trail: [] },
            ...createRing(20, 5000, 50, 200).map(b => ({ ...b, position: { x: b.position.x - 400, y: b.position.y }, velocity: { x: b.velocity.x + 0.5, y: b.velocity.y + 0.5 } })),
            ...createRing(20, 5000, 50, 200).map(b => ({ ...b, position: { x: b.position.x + 400, y: b.position.y }, velocity: { x: b.velocity.x - 0.5, y: b.velocity.y - 0.5 } }))
        ],
        camera: { zoom: 0.4 }
    },
    {
        id: 'accretion-disk',
        name: 'Accretion Disk',
        description: 'Matter spiraling into a supermassive black hole.',
        bodies: [
            { id: 'bh-main', name: 'Singularity', category: StellarCategory.SUPERMASSIVE_BLACK_HOLE, mass: 10000, radius: 50, position: {x:0, y:0}, velocity: {x:0, y:0}, color: '#000', trail: [] },
            ...createRing(100, 10000, 150, 600)
        ],
        camera: { zoom: 0.2 }
    }
];