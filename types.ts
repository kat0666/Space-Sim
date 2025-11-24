import { Type } from "@google/genai";

export interface Vector2 {
  x: number;
  y: number;
}

export enum StellarCategory {
  ASTEROID = 'Asteroid',
  MOON = 'Moon',
  DWARF_PLANET = 'Dwarf Planet',
  PLANET = 'Planet',
  STAR = 'Star',
  BROWN_DWARF = 'Brown Dwarf',
  WHITE_DWARF = 'White Dwarf',
  NEUTRON_STAR = 'Neutron Star',
  PULSAR = 'Pulsar',
  MAGNETAR = 'Magnetar',
  RED_GIANT = 'Red Giant',
  BLUE_GIANT = 'Blue Giant',
  RED_HYPERGIANT = 'Red Hypergiant',
  BLACK_HOLE = 'Black Hole',
  QUASAR = 'Quasar',
  SUPERMASSIVE_BLACK_HOLE = 'Supermassive Black Hole',
  ANOMALY = 'Anomaly',
}

export interface StellarPreset {
  category: StellarCategory;
  minMass: number;
  maxMass: number;
  minRadius: number;
  maxRadius: number;
  defaultColor: string;
}

export type AnomalyType = 'WORMHOLE' | 'REPULSOR' | 'NONE';

export interface StellarBody {
  id: string;
  name: string;
  category: StellarCategory;
  mass: number;
  radius: number;
  position: Vector2;
  velocity: Vector2;
  color: string;
  trail: Vector2[];
  description?: string;
  temperature?: number;
  
  // Advanced Physics Properties
  anomalyType?: AnomalyType;
  linkedBodyId?: string; // For wormholes (destination)
  lastTeleportTime?: number; // To prevent infinite loops in wormholes
}

export interface CameraState {
  x: number;
  y: number;
  zoom: number;
  rotation: number; // radians
}

export interface SimulationSettings {
  timeScale: number;
  paused: boolean;
  showTrails: boolean;
  gravityConstant: number;
  showGrid: boolean;
}

// AI Service Types
export interface ObjectQueryResult {
  name: string;
  mass: number; 
  radius: number; 
  description: string;
  category: StellarCategory;
}

export interface SimulationAnalysis {
  stabilityScore: number;
  prediction: string;
  notableInteractions: string[];
}

export interface CustomBodyTemplate {
  id: string;
  name: string;
  mass: number;
  radius: number;
  color: string;
}

export interface Scenario {
  id: string;
  name: string;
  description: string;
  bodies: StellarBody[];
  settings?: Partial<SimulationSettings>;
  camera?: Partial<CameraState>;
}

export interface DragPayload {
  type: 'PRESET' | 'CUSTOM' | 'ANOMALY';
  data: {
    category?: StellarCategory;
    anomalyType?: AnomalyType;
    template?: CustomBodyTemplate;
  };
}