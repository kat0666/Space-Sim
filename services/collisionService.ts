import {
  StellarBody,
  StellarCategory,
  CollisionEvent,
  CollisionResult,
  FusionRule,
  CollisionAnimationType,
  Vector2,
  MergerMetadata
} from '../types';

/**
 * Fusion Rules Engine - Astrophysically Accurate Collision Outcomes
 *
 * Based on real stellar physics:
 * - Neutron Star + Neutron Star = Black Hole + Gamma Ray Burst
 * - Black Hole + Anything = Larger Black Hole
 * - Massive Star + Massive Star = Supernova or Black Hole
 * - Planet + Planet (high velocity) = Fragmentation
 * - Planet + Planet (low velocity) = Merger
 */
export const FUSION_RULES: FusionRule[] = [
  // ========== NEUTRON STAR COLLISIONS ==========
  {
    category1: StellarCategory.NEUTRON_STAR,
    category2: StellarCategory.NEUTRON_STAR,
    resultType: () => StellarCategory.BLACK_HOLE,
    animation: 'GRB', // Gamma Ray Burst - most energetic event in universe
    timeDilation: 0.05, // Super slow-mo (5% speed)
  },
  {
    category1: StellarCategory.NEUTRON_STAR,
    category2: StellarCategory.PULSAR,
    resultType: () => StellarCategory.BLACK_HOLE,
    animation: 'GRB',
    timeDilation: 0.05,
  },
  {
    category1: StellarCategory.PULSAR,
    category2: StellarCategory.PULSAR,
    resultType: () => StellarCategory.BLACK_HOLE,
    animation: 'GRB',
    timeDilation: 0.05,
  },

  // ========== BLACK HOLE ABSORPTION ==========
  {
    category1: StellarCategory.BLACK_HOLE,
    category2: '*',
    resultType: (m1) => m1 > 5000 ? StellarCategory.SUPERMASSIVE_BLACK_HOLE : StellarCategory.BLACK_HOLE,
    animation: 'ABSORPTION',
    timeDilation: 0.2,
  },
  {
    category1: StellarCategory.SUPERMASSIVE_BLACK_HOLE,
    category2: '*',
    resultType: () => StellarCategory.SUPERMASSIVE_BLACK_HOLE,
    animation: 'ABSORPTION',
    timeDilation: 0.15,
  },

  // ========== MASSIVE STELLAR COLLISIONS ==========
  {
    category1: StellarCategory.STAR,
    category2: StellarCategory.STAR,
    resultType: (m1, m2) => {
      const totalMass = m1 + m2;
      if (totalMass > 4000) return StellarCategory.SUPERMASSIVE_BLACK_HOLE;
      if (totalMass > 2000) return StellarCategory.BLACK_HOLE;
      if (totalMass > 1200) return StellarCategory.NEUTRON_STAR;
      return StellarCategory.STAR;
    },
    animation: 'SUPERNOVA',
    timeDilation: 0.1,
  },
  {
    category1: StellarCategory.BLUE_GIANT,
    category2: StellarCategory.BLUE_GIANT,
    resultType: (m1, m2) => {
      const totalMass = m1 + m2;
      if (totalMass > 3500) return StellarCategory.BLACK_HOLE;
      return StellarCategory.NEUTRON_STAR;
    },
    animation: 'SUPERNOVA',
    timeDilation: 0.1,
  },
  {
    category1: StellarCategory.RED_GIANT,
    category2: StellarCategory.RED_GIANT,
    resultType: (m1, m2) => {
      const totalMass = m1 + m2;
      if (totalMass > 2500) return StellarCategory.BLACK_HOLE;
      if (totalMass > 1500) return StellarCategory.NEUTRON_STAR;
      return StellarCategory.STAR;
    },
    animation: 'SUPERNOVA',
    timeDilation: 0.1,
  },
  {
    category1: StellarCategory.RED_HYPERGIANT,
    category2: StellarCategory.RED_HYPERGIANT,
    resultType: () => StellarCategory.BLACK_HOLE,
    animation: 'SUPERNOVA',
    timeDilation: 0.08,
  },

  // ========== STELLAR REMNANT COLLISIONS ==========
  {
    category1: StellarCategory.WHITE_DWARF,
    category2: StellarCategory.WHITE_DWARF,
    resultType: (m1, m2) => {
      const totalMass = m1 + m2;
      if (totalMass > 800) return StellarCategory.NEUTRON_STAR;
      return StellarCategory.WHITE_DWARF;
    },
    animation: 'SUPERNOVA',
    timeDilation: 0.15,
  },

  // ========== PLANETARY COLLISIONS ==========
  {
    category1: StellarCategory.PLANET,
    category2: StellarCategory.PLANET,
    resultType: (m1, m2) => StellarCategory.PLANET,
    animation: 'MERGE',
    timeDilation: 0.3,
    shouldFragment: (m1, m2, velocity) => velocity > 8.0, // High velocity = fragmentation
    fragmentCount: 5,
  },
  {
    category1: StellarCategory.DWARF_PLANET,
    category2: StellarCategory.DWARF_PLANET,
    resultType: () => StellarCategory.DWARF_PLANET,
    animation: 'MERGE',
    timeDilation: 0.4,
    shouldFragment: (m1, m2, velocity) => velocity > 6.0,
    fragmentCount: 4,
  },

  // ========== STAR + PLANET ==========
  {
    category1: StellarCategory.STAR,
    category2: StellarCategory.PLANET,
    resultType: () => StellarCategory.STAR,
    animation: 'ABSORPTION',
    timeDilation: 0.4,
  },
  {
    category1: StellarCategory.RED_GIANT,
    category2: StellarCategory.PLANET,
    resultType: () => StellarCategory.RED_GIANT,
    animation: 'ABSORPTION',
    timeDilation: 0.4,
  },

  // ========== ASTEROID COLLISIONS ==========
  {
    category1: StellarCategory.ASTEROID,
    category2: StellarCategory.ASTEROID,
    resultType: () => StellarCategory.ASTEROID,
    animation: 'EXPLOSION',
    timeDilation: 0.5,
    shouldFragment: (m1, m2, velocity) => velocity > 3.0,
    fragmentCount: 8,
  },
  {
    category1: StellarCategory.ASTEROID,
    category2: StellarCategory.PLANET,
    resultType: (m1, m2) => m1 > m2 * 0.5 ? StellarCategory.DWARF_PLANET : StellarCategory.PLANET,
    animation: 'EXPLOSION',
    timeDilation: 0.4,
    shouldFragment: (m1, m2, velocity) => velocity > 10.0,
    fragmentCount: 6,
  },

  // ========== EXOTIC COLLISIONS ==========
  {
    category1: StellarCategory.QUASAR,
    category2: '*',
    resultType: () => StellarCategory.QUASAR,
    animation: 'ABSORPTION',
    timeDilation: 0.1,
  },
  {
    category1: StellarCategory.MAGNETAR,
    category2: StellarCategory.NEUTRON_STAR,
    resultType: () => StellarCategory.BLACK_HOLE,
    animation: 'GRB',
    timeDilation: 0.05,
  },
];

/**
 * Find the appropriate fusion rule for two colliding bodies
 */
export const findFusionRule = (body1: StellarBody, body2: StellarBody): FusionRule | null => {
  for (const rule of FUSION_RULES) {
    const match1 = rule.category1 === '*' || rule.category1 === body1.category;
    const match2 = rule.category2 === '*' || rule.category2 === body2.category;
    const match1Rev = rule.category1 === '*' || rule.category1 === body2.category;
    const match2Rev = rule.category2 === '*' || rule.category2 === body1.category;

    if ((match1 && match2) || (match1Rev && match2Rev)) {
      // Check mass constraints if they exist
      if (rule.minMass && (body1.mass < rule.minMass || body2.mass < rule.minMass)) continue;
      if (rule.maxMass && (body1.mass > rule.maxMass || body2.mass > rule.maxMass)) continue;

      return rule;
    }
  }

  // Default fallback rule
  return {
    category1: '*',
    category2: '*',
    resultType: (m1, m2) => m1 > m2 ? body1.category : body2.category,
    animation: 'MERGE',
    timeDilation: 0.3,
  };
};

/**
 * Calculate relative velocity between two bodies
 */
export const calculateRelativeVelocity = (body1: StellarBody, body2: StellarBody): number => {
  const dvx = body1.velocity.x - body2.velocity.x;
  const dvy = body1.velocity.y - body2.velocity.y;
  return Math.sqrt(dvx * dvx + dvy * dvy);
};

/**
 * Calculate kinetic energy of collision
 */
export const calculateCollisionEnergy = (body1: StellarBody, body2: StellarBody, relativeVelocity: number): number => {
  const reducedMass = (body1.mass * body2.mass) / (body1.mass + body2.mass);
  return 0.5 * reducedMass * relativeVelocity * relativeVelocity;
};

/**
 * Create merged body from collision with proper physics conservation
 */
export const createMergedBody = (
  body1: StellarBody,
  body2: StellarBody,
  rule: FusionRule,
  relativeVelocity: number
): StellarBody => {
  // Conservation of mass
  const totalMass = body1.mass + body2.mass;

  // Conservation of momentum (vector addition)
  const p1x = body1.velocity.x * body1.mass;
  const p1y = body1.velocity.y * body1.mass;
  const p2x = body2.velocity.x * body2.mass;
  const p2y = body2.velocity.y * body2.mass;

  const finalVelocity: Vector2 = {
    x: (p1x + p2x) / totalMass,
    y: (p1y + p2y) / totalMass,
  };

  // Center of mass
  const centerOfMass: Vector2 = {
    x: (body1.position.x * body1.mass + body2.position.x * body2.mass) / totalMass,
    y: (body1.position.y * body1.mass + body2.position.y * body2.mass) / totalMass,
  };

  // Determine new category
  const newCategory = rule.resultType(body1.mass, body2.mass, relativeVelocity);

  // Radius from volume conservation (approximate)
  const volume1 = (4 / 3) * Math.PI * Math.pow(body1.radius, 3);
  const volume2 = (4 / 3) * Math.PI * Math.pow(body2.radius, 3);
  const totalVolume = volume1 + volume2;
  const newRadius = Math.cbrt((3 * totalVolume) / (4 * Math.PI));

  // Color based on new category
  const newColor = determineColorForCategory(newCategory, totalMass);

  // Generation depth for tracking merger history
  const depth1 = body1.mergerMetadata?.generationDepth ?? 0;
  const depth2 = body2.mergerMetadata?.generationDepth ?? 0;
  const newDepth = Math.max(depth1, depth2) + 1;

  return {
    id: crypto.randomUUID(),
    name: generateMergerName(body1, body2, newCategory),
    category: newCategory,
    mass: totalMass,
    radius: newRadius,
    position: centerOfMass,
    velocity: finalVelocity,
    color: newColor,
    trail: [],
    mergerMetadata: {
      formedBy: [body1.id, body2.id],
      formationTime: Date.now(),
      formationType: rule.animation,
      generationDepth: newDepth,
    },
  };
};

/**
 * Create debris field from fragmentation
 */
export const createDebrisField = (
  body1: StellarBody,
  body2: StellarBody,
  fragmentCount: number,
  impactPoint: Vector2
): StellarBody[] => {
  const fragments: StellarBody[] = [];
  const totalMass = body1.mass + body2.mass;
  const avgVelocity = {
    x: (body1.velocity.x + body2.velocity.x) / 2,
    y: (body1.velocity.y + body2.velocity.y) / 2,
  };

  for (let i = 0; i < fragmentCount; i++) {
    const fragmentMass = (totalMass / fragmentCount) * (0.5 + Math.random() * 0.5);
    const fragmentRadius = Math.cbrt(fragmentMass / 10);

    // Random ejection direction
    const angle = (Math.PI * 2 * i) / fragmentCount + (Math.random() - 0.5) * 0.5;
    const speed = 5 + Math.random() * 10;

    fragments.push({
      id: crypto.randomUUID(),
      name: `Fragment ${i + 1}`,
      category: StellarCategory.ASTEROID,
      mass: fragmentMass,
      radius: fragmentRadius,
      position: {
        x: impactPoint.x + Math.cos(angle) * 50,
        y: impactPoint.y + Math.sin(angle) * 50,
      },
      velocity: {
        x: avgVelocity.x + Math.cos(angle) * speed,
        y: avgVelocity.y + Math.sin(angle) * speed,
      },
      color: '#888888',
      trail: [],
      mergerMetadata: {
        formedBy: [body1.id, body2.id],
        formationTime: Date.now(),
        formationType: 'FRAGMENTATION',
        generationDepth: 1,
      },
    });
  }

  return fragments;
};

/**
 * Determine color based on category and mass
 */
const determineColorForCategory = (category: StellarCategory, mass: number): string => {
  switch (category) {
    case StellarCategory.BLACK_HOLE:
      return '#000000';
    case StellarCategory.SUPERMASSIVE_BLACK_HOLE:
      return '#1a0033';
    case StellarCategory.NEUTRON_STAR:
      return '#ffffff';
    case StellarCategory.PULSAR:
      return '#00ffff';
    case StellarCategory.STAR:
      return mass > 2000 ? '#4488ff' : '#ffffaa';
    case StellarCategory.RED_GIANT:
      return '#ff4444';
    case StellarCategory.BLUE_GIANT:
      return '#4488ff';
    case StellarCategory.WHITE_DWARF:
      return '#ffffff';
    case StellarCategory.PLANET:
      return '#4488ff';
    case StellarCategory.ASTEROID:
      return '#888888';
    default:
      return '#ffffff';
  }
};

/**
 * Generate creative name for merged body
 */
const generateMergerName = (body1: StellarBody, body2: StellarBody, category: StellarCategory): string => {
  const prefixes = ['Nova', 'Hyper', 'Ultra', 'Mega', 'Giga', 'Titan'];
  const suffixes = ['Prime', 'Alpha', 'Omega', 'Genesis', 'Nexus'];

  const prefix = prefixes[Math.floor(Math.random() * prefixes.length)];
  const suffix = suffixes[Math.floor(Math.random() * suffixes.length)];

  if (category === StellarCategory.BLACK_HOLE) {
    return `${prefix} Black Hole ${suffix}`;
  } else if (category === StellarCategory.NEUTRON_STAR) {
    return `${prefix} Neutron Star`;
  } else if (category === StellarCategory.STAR) {
    return `${prefix} Star ${suffix}`;
  } else {
    return `${category} ${suffix}`;
  }
};

/**
 * Process collision and return result
 */
export const processCollision = (collision: CollisionEvent): CollisionResult => {
  const { body1, body2, impactVelocity } = collision;

  const rule = findFusionRule(body1, body2);
  if (!rule) {
    throw new Error('No fusion rule found for collision');
  }

  const resultBodies: StellarBody[] = [];

  // Check if should fragment
  if (rule.shouldFragment && rule.shouldFragment(body1.mass, body2.mass, impactVelocity)) {
    const fragments = createDebrisField(body1, body2, rule.fragmentCount || 5, collision.impactPoint);
    resultBodies.push(...fragments);

    return {
      resultBodies,
      animation: 'FRAGMENTATION',
      timeDilation: rule.timeDilation,
      removeBodyIds: [body1.id, body2.id],
    };
  }

  // Normal merger
  const mergedBody = createMergedBody(body1, body2, rule, impactVelocity);
  resultBodies.push(mergedBody);

  return {
    resultBodies,
    animation: rule.animation,
    timeDilation: rule.timeDilation,
    removeBodyIds: [body1.id, body2.id],
  };
};
