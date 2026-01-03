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

// Collision System Types (forward declarations)
export type CollisionAnimationType =
  | 'EXPLOSION'      // High-velocity planetary impacts
  | 'MERGE'          // Gentle stellar mergers
  | 'ABSORPTION'     // Black hole accretion
  | 'SUPERNOVA'      // Massive stellar collision
  | 'GRB'            // Gamma Ray Burst (neutron star merger)
  | 'FRAGMENTATION'; // Catastrophic breakup

export interface MergerMetadata {
  formedBy: string[];      // IDs of parent bodies
  formationTime: number;   // Timestamp
  formationType: CollisionAnimationType;
  generationDepth: number; // How many mergers deep
}

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

  // Collision/Merger Metadata
  mergerMetadata?: MergerMetadata;
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

// Collision System Types (continued)
export interface CollisionEvent {
  id: string;
  body1: StellarBody;
  body2: StellarBody;
  impactVelocity: number;
  impactPoint: Vector2;
  timestamp: number;
  relativeEnergy: number; // Kinetic energy of collision
}

export interface FusionRule {
  category1: StellarCategory | '*';
  category2: StellarCategory | '*';
  minMass?: number;
  maxMass?: number;
  resultType: (mass1: number, mass2: number, velocity: number) => StellarCategory;
  animation: CollisionAnimationType;
  timeDilation: number; // Slow-mo factor (0.1 = 10% speed)
  shouldFragment?: (mass1: number, mass2: number, velocity: number) => boolean;
  fragmentCount?: number;
}

export interface CollisionResult {
  resultBodies: StellarBody[];
  animation: CollisionAnimationType;
  timeDilation: number;
  removeBodyIds: string[];
}