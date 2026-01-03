import { StellarCategory } from '../types';

// Global Babylon reference
declare global {
  interface Window {
    BABYLON: any;
  }
}

/**
 * Perlin-like noise generator for procedural textures
 */
class NoiseGenerator {
  private permutation: number[];

  constructor(seed: number = 0) {
    this.permutation = [];
    for (let i = 0; i < 256; i++) {
      this.permutation[i] = i;
    }

    // Shuffle with seed
    let random = this.seededRandom(seed);
    for (let i = 255; i > 0; i--) {
      const j = Math.floor(random() * (i + 1));
      [this.permutation[i], this.permutation[j]] = [this.permutation[j], this.permutation[i]];
    }

    // Duplicate for overflow
    for (let i = 0; i < 256; i++) {
      this.permutation[256 + i] = this.permutation[i];
    }
  }

  private seededRandom(seed: number) {
    return function() {
      seed = (seed * 9301 + 49297) % 233280;
      return seed / 233280;
    };
  }

  private fade(t: number): number {
    return t * t * t * (t * (t * 6 - 15) + 10);
  }

  private lerp(t: number, a: number, b: number): number {
    return a + t * (b - a);
  }

  private grad(hash: number, x: number, y: number): number {
    const h = hash & 15;
    const u = h < 8 ? x : y;
    const v = h < 4 ? y : h === 12 || h === 14 ? x : 0;
    return ((h & 1) === 0 ? u : -u) + ((h & 2) === 0 ? v : -v);
  }

  noise(x: number, y: number): number {
    const X = Math.floor(x) & 255;
    const Y = Math.floor(y) & 255;

    x -= Math.floor(x);
    y -= Math.floor(y);

    const u = this.fade(x);
    const v = this.fade(y);

    const a = this.permutation[X] + Y;
    const b = this.permutation[X + 1] + Y;

    return this.lerp(v,
      this.lerp(u, this.grad(this.permutation[a], x, y), this.grad(this.permutation[b], x - 1, y)),
      this.lerp(u, this.grad(this.permutation[a + 1], x, y - 1), this.grad(this.permutation[b + 1], x - 1, y - 1))
    );
  }

  octaveNoise(x: number, y: number, octaves: number, persistence: number): number {
    let total = 0;
    let frequency = 1;
    let amplitude = 1;
    let maxValue = 0;

    for (let i = 0; i < octaves; i++) {
      total += this.noise(x * frequency, y * frequency) * amplitude;
      maxValue += amplitude;
      amplitude *= persistence;
      frequency *= 2;
    }

    return total / maxValue;
  }
}

/**
 * Create procedural star texture with solar activity
 */
export const createStarTexture = (scene: any, size: number = 512, seed: number = Math.random() * 1000): any => {
  const BABYLON = window.BABYLON;
  if (!BABYLON) return null;

  const texture = new BABYLON.DynamicTexture('star_texture', size, scene, false);
  const context = texture.getContext();
  const noise = new NoiseGenerator(seed);

  // Create gradient for solar surface
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      // Normalize coordinates
      const nx = x / size;
      const ny = y / size;

      // Multi-octave noise for surface detail
      const n = noise.octaveNoise(nx * 8, ny * 8, 6, 0.5);

      // Solar granulation (small cells)
      const granulation = noise.octaveNoise(nx * 32, ny * 32, 3, 0.6);

      // Sunspots (darker regions)
      const spots = noise.octaveNoise(nx * 4, ny * 4, 2, 0.7);

      // Combine
      let intensity = (n + 1) * 0.5; // 0-1 range
      intensity = intensity * 0.7 + granulation * 0.2 + (spots < 0.3 ? -0.3 : 0);
      intensity = Math.max(0, Math.min(1, intensity));

      // Color (yellow-orange star)
      const r = Math.floor(255 * Math.min(1, intensity + 0.2));
      const g = Math.floor(255 * Math.min(1, intensity * 0.9));
      const b = Math.floor(255 * intensity * 0.6);

      context.fillStyle = `rgb(${r},${g},${b})`;
      context.fillRect(x, y, 1, 1);
    }
  }

  texture.update();
  return texture;
};

/**
 * Create procedural planet texture with continents and oceans
 */
export const createPlanetTexture = (scene: any, mass: number, size: number = 512, seed: number = Math.random() * 1000): any => {
  const BABYLON = window.BABYLON;
  if (!BABYLON) return null;

  const texture = new BABYLON.DynamicTexture('planet_texture', size, scene, false);
  const context = texture.getContext();
  const noise = new NoiseGenerator(seed);

  // Determine planet type based on mass
  const waterLevel = 0.3 + (mass % 100) / 200; // Varies by mass

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const nx = x / size;
      const ny = y / size;

      // Latitude for polar caps
      const lat = Math.abs(ny - 0.5) * 2;

      // Terrain height
      const terrain = noise.octaveNoise(nx * 6, ny * 6, 6, 0.5);
      const detail = noise.octaveNoise(nx * 24, ny * 24, 4, 0.6);

      let height = (terrain + 1) * 0.5 + detail * 0.2;

      let r, g, b;

      // Polar ice caps
      if (lat > 0.8 && height > 0.4) {
        r = 240 + Math.floor(Math.random() * 15);
        g = 245 + Math.floor(Math.random() * 10);
        b = 250 + Math.floor(Math.random() * 5);
      }
      // Ocean
      else if (height < waterLevel) {
        const depth = (waterLevel - height) / waterLevel;
        r = Math.floor(20 + depth * 30);
        g = Math.floor(50 + depth * 80);
        b = Math.floor(120 + depth * 100);
      }
      // Land
      else {
        const landHeight = (height - waterLevel) / (1 - waterLevel);

        // Green lowlands
        if (landHeight < 0.3) {
          r = Math.floor(40 + landHeight * 80);
          g = Math.floor(100 + landHeight * 120);
          b = Math.floor(30 + landHeight * 40);
        }
        // Rocky highlands
        else if (landHeight < 0.7) {
          r = Math.floor(120 + landHeight * 80);
          g = Math.floor(110 + landHeight * 60);
          b = Math.floor(70 + landHeight * 40);
        }
        // Mountain peaks
        else {
          r = Math.floor(180 + landHeight * 60);
          g = Math.floor(170 + landHeight * 60);
          b = Math.floor(160 + landHeight * 60);
        }
      }

      context.fillStyle = `rgb(${r},${g},${b})`;
      context.fillRect(x, y, 1, 1);
    }
  }

  texture.update();
  return texture;
};

/**
 * Create procedural asteroid texture (rocky with craters)
 */
export const createAsteroidTexture = (scene: any, size: number = 256, seed: number = Math.random() * 1000): any => {
  const BABYLON = window.BABYLON;
  if (!BABYLON) return null;

  const texture = new BABYLON.DynamicTexture('asteroid_texture', size, scene, false);
  const context = texture.getContext();
  const noise = new NoiseGenerator(seed);

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const nx = x / size;
      const ny = y / size;

      // Rocky surface
      const rock = noise.octaveNoise(nx * 10, ny * 10, 5, 0.5);

      // Add craters
      let crater = 0;
      const numCraters = 8;
      for (let i = 0; i < numCraters; i++) {
        const cx = ((seed + i * 37) % 100) / 100;
        const cy = ((seed + i * 73) % 100) / 100;
        const dx = nx - cx;
        const dy = ny - cy;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const craterRadius = 0.05 + ((seed + i * 17) % 30) / 300;

        if (dist < craterRadius) {
          const depth = 1 - (dist / craterRadius);
          crater = Math.max(crater, depth * 0.4);
        }
      }

      let intensity = (rock + 1) * 0.5 - crater;
      intensity = Math.max(0, Math.min(1, intensity));

      // Gray-brown rocky color
      const r = Math.floor(80 + intensity * 70);
      const g = Math.floor(70 + intensity * 60);
      const b = Math.floor(60 + intensity * 50);

      context.fillStyle = `rgb(${r},${g},${b})`;
      context.fillRect(x, y, 1, 1);
    }
  }

  texture.update();
  return texture;
};

/**
 * Create normal map from height data for relief
 */
export const createNormalMap = (scene: any, size: number = 256, seed: number = Math.random() * 1000): any => {
  const BABYLON = window.BABYLON;
  if (!BABYLON) return null;

  const texture = new BABYLON.DynamicTexture('normal_map', size, scene, false);
  const context = texture.getContext();
  const noise = new NoiseGenerator(seed);

  // Generate height map first
  const heightMap: number[][] = [];
  for (let y = 0; y < size; y++) {
    heightMap[y] = [];
    for (let x = 0; x < size; x++) {
      const nx = x / size;
      const ny = y / size;
      heightMap[y][x] = noise.octaveNoise(nx * 10, ny * 10, 5, 0.5);
    }
  }

  // Calculate normals
  const strength = 2.0;
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      // Sample neighbors (with wrapping)
      const left = heightMap[y][(x - 1 + size) % size];
      const right = heightMap[y][(x + 1) % size];
      const up = heightMap[(y - 1 + size) % size][x];
      const down = heightMap[(y + 1) % size][x];

      // Calculate gradient
      const dx = (right - left) * strength;
      const dy = (down - up) * strength;

      // Normal vector
      const nx = -dx;
      const ny = -dy;
      const nz = 1;

      // Normalize
      const len = Math.sqrt(nx * nx + ny * ny + nz * nz);
      const normX = (nx / len + 1) * 0.5;
      const normY = (ny / len + 1) * 0.5;
      const normZ = (nz / len + 1) * 0.5;

      // RGB = XYZ normal
      const r = Math.floor(normX * 255);
      const g = Math.floor(normY * 255);
      const b = Math.floor(normZ * 255);

      context.fillStyle = `rgb(${r},${g},${b})`;
      context.fillRect(x, y, 1, 1);
    }
  }

  texture.update();
  return texture;
};

/**
 * Create gas giant texture with bands
 */
export const createGasGiantTexture = (scene: any, size: number = 512, seed: number = Math.random() * 1000): any => {
  const BABYLON = window.BABYLON;
  if (!BABYLON) return null;

  const texture = new BABYLON.DynamicTexture('gas_giant_texture', size, scene, false);
  const context = texture.getContext();
  const noise = new NoiseGenerator(seed);

  // Color palette (Jupiter-like)
  const bandColors = [
    { r: 200, g: 170, b: 140 }, // Beige
    { r: 160, g: 120, b: 80 },  // Brown
    { r: 220, g: 190, b: 150 }, // Light tan
    { r: 140, g: 100, b: 60 },  // Dark brown
  ];

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const nx = x / size;
      const ny = y / size;

      // Horizontal bands
      const bandIndex = Math.floor((ny + noise.noise(nx * 15, ny * 2) * 0.1) * 12) % 4;
      const baseColor = bandColors[bandIndex];

      // Add turbulence
      const turbulence = noise.octaveNoise(nx * 20, ny * 8, 4, 0.5);
      const storm = noise.octaveNoise(nx * 8, ny * 8, 3, 0.6);

      let r = baseColor.r + turbulence * 40;
      let g = baseColor.g + turbulence * 35;
      let b = baseColor.b + turbulence * 30;

      // Great Red Spot simulation (if in range)
      const spotX = 0.3;
      const spotY = 0.6;
      const dx = nx - spotX;
      const dy = (ny - spotY) * 2; // Elliptical
      const spotDist = Math.sqrt(dx * dx + dy * dy);

      if (spotDist < 0.15) {
        const spotIntensity = (0.15 - spotDist) / 0.15;
        r = r * (1 - spotIntensity) + 200 * spotIntensity;
        g = g * (1 - spotIntensity) + 80 * spotIntensity;
        b = b * (1 - spotIntensity) + 60 * spotIntensity;
      }

      r = Math.max(0, Math.min(255, r));
      g = Math.max(0, Math.min(255, g));
      b = Math.max(0, Math.min(255, b));

      context.fillStyle = `rgb(${Math.floor(r)},${Math.floor(g)},${Math.floor(b)})`;
      context.fillRect(x, y, 1, 1);
    }
  }

  texture.update();
  return texture;
};

/**
 * Create red planet texture (Mars-like)
 */
export const createRedPlanetTexture = (scene: any, size: number = 512, seed: number = Math.random() * 1000): any => {
  const BABYLON = window.BABYLON;
  if (!BABYLON) return null;

  const texture = new BABYLON.DynamicTexture('red_planet_texture', size, scene, false);
  const context = texture.getContext();
  const noise = new NoiseGenerator(seed);

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const nx = x / size;
      const ny = y / size;

      const terrain = noise.octaveNoise(nx * 8, ny * 8, 6, 0.5);
      const craters = noise.octaveNoise(nx * 16, ny * 16, 4, 0.6);
      const dust = noise.octaveNoise(nx * 32, ny * 32, 3, 0.7);

      let height = (terrain + 1) * 0.5;
      height = height * 0.7 + craters * 0.2 + dust * 0.1;

      // Mars colors (rusty red)
      const r = Math.floor(150 + height * 80);
      const g = Math.floor(80 + height * 50);
      const b = Math.floor(50 + height * 30);

      context.fillStyle = `rgb(${r},${g},${b})`;
      context.fillRect(x, y, 1, 1);
    }
  }

  texture.update();
  return texture;
};

/**
 * Main texture generator - returns appropriate texture for body category
 */
export const generateTextureForBody = (
  scene: any,
  category: StellarCategory,
  mass: number,
  seed?: number
): { albedo: any; normal?: any } => {
  const textureSeed = seed || Math.random() * 10000;

  switch (category) {
    case StellarCategory.STAR:
    case StellarCategory.RED_GIANT:
    case StellarCategory.BLUE_GIANT:
    case StellarCategory.RED_HYPERGIANT:
    case StellarCategory.BROWN_DWARF:
    case StellarCategory.WHITE_DWARF:
      return {
        albedo: createStarTexture(scene, 512, textureSeed),
      };

    case StellarCategory.PLANET:
      // Decide planet type based on mass
      if (mass > 100) {
        // Gas giant
        return {
          albedo: createGasGiantTexture(scene, 512, textureSeed),
        };
      } else if (mass < 30) {
        // Rocky red planet
        return {
          albedo: createRedPlanetTexture(scene, 512, textureSeed),
          normal: createNormalMap(scene, 256, textureSeed),
        };
      } else {
        // Earth-like
        return {
          albedo: createPlanetTexture(scene, mass, 512, textureSeed),
          normal: createNormalMap(scene, 256, textureSeed),
        };
      }

    case StellarCategory.DWARF_PLANET:
    case StellarCategory.MOON:
      return {
        albedo: createAsteroidTexture(scene, 256, textureSeed),
        normal: createNormalMap(scene, 256, textureSeed),
      };

    case StellarCategory.ASTEROID:
      return {
        albedo: createAsteroidTexture(scene, 256, textureSeed),
        normal: createNormalMap(scene, 128, textureSeed),
      };

    default:
      return {
        albedo: createPlanetTexture(scene, mass, 512, textureSeed),
      };
  }
};
