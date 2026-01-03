import { CollisionAnimationType, Vector2 } from '../types';

// Global Babylon reference
declare global {
  interface Window {
    BABYLON: any;
  }
}

interface AnimationConfig {
  duration: number;
  intensity: number;
  color?: { r: number; g: number; b: number };
}

/**
 * Create an explosion particle system at collision point
 */
export const createExplosionAnimation = (
  scene: any,
  position: Vector2,
  config: AnimationConfig
): void => {
  const BABYLON = window.BABYLON;
  if (!BABYLON) return;

  // Main explosion burst
  const explosion = new BABYLON.ParticleSystem('explosion', 5000, scene);
  explosion.particleTexture = new BABYLON.Texture(
    'https://www.babylonjs.com/assets/Flare.png',
    scene
  );

  const pos3d = new BABYLON.Vector3(position.x, 0, position.y);
  explosion.emitter = pos3d;
  explosion.minEmitBox = new BABYLON.Vector3(-10, -10, -10);
  explosion.maxEmitBox = new BABYLON.Vector3(10, 10, 10);

  // Colors (orange to red)
  const c = config.color || { r: 1, g: 0.5, b: 0.1 };
  explosion.color1 = new BABYLON.Color4(c.r, c.g, c.b, 1.0);
  explosion.color2 = new BABYLON.Color4(c.r * 0.5, c.g * 0.2, c.b * 0.05, 0.8);
  explosion.colorDead = new BABYLON.Color4(0.2, 0.1, 0.0, 0.0);

  // Size
  explosion.minSize = 5 * config.intensity;
  explosion.maxSize = 25 * config.intensity;

  // Lifetime
  explosion.minLifeTime = 0.3;
  explosion.maxLifeTime = 1.5;

  // Emission
  explosion.emitRate = 3000;
  explosion.blendMode = BABYLON.ParticleSystem.BLENDMODE_ADD;

  // Speed
  explosion.minEmitPower = 30 * config.intensity;
  explosion.maxEmitPower = 100 * config.intensity;
  explosion.updateSpeed = 0.01;

  // Gravity
  explosion.gravity = new BABYLON.Vector3(0, -5, 0);

  // Direction - spherical burst
  explosion.createSphereEmitter(1.0);

  explosion.start();

  // Cleanup after animation
  setTimeout(() => {
    explosion.stop();
    setTimeout(() => explosion.dispose(), 1000);
  }, config.duration);

  // Flash light
  const light = new BABYLON.PointLight('explosion_light', pos3d, scene);
  light.intensity = 50 * config.intensity;
  light.diffuse = new BABYLON.Color3(c.r, c.g, c.b);

  // Animate light intensity down
  const lightAnim = new BABYLON.Animation(
    'lightFade',
    'intensity',
    60,
    BABYLON.Animation.ANIMATIONTYPE_FLOAT,
    BABYLON.Animation.ANIMATIONLOOPMODE_CONSTANT
  );

  lightAnim.setKeys([
    { frame: 0, value: 50 * config.intensity },
    { frame: 30, value: 0 }
  ]);

  light.animations.push(lightAnim);
  scene.beginAnimation(light, 0, 30, false, 1, () => {
    light.dispose();
  });
};

/**
 * Create Gamma Ray Burst animation (bipolar jets)
 * Used for neutron star mergers
 */
export const createGammaRayBurstAnimation = (
  scene: any,
  position: Vector2,
  config: AnimationConfig
): void => {
  const BABYLON = window.BABYLON;
  if (!BABYLON) return;

  const pos3d = new BABYLON.Vector3(position.x, 0, position.y);

  // Create two jets (north and south poles)
  for (let dir of [-1, 1]) {
    const jet = new BABYLON.ParticleSystem('grb_jet', 8000, scene);
    jet.particleTexture = new BABYLON.Texture(
      'https://www.babylonjs.com/assets/Flare.png',
      scene
    );

    jet.emitter = pos3d;

    // Jet colors (purple/blue for high-energy gamma rays)
    jet.color1 = new BABYLON.Color4(0.8, 0.2, 1.0, 1.0);
    jet.color2 = new BABYLON.Color4(0.3, 0.1, 0.8, 0.9);
    jet.colorDead = new BABYLON.Color4(0.1, 0.0, 0.3, 0.0);

    // Particle size
    jet.minSize = 3;
    jet.maxSize = 15;

    // Lifetime
    jet.minLifeTime = 1.0;
    jet.maxLifeTime = 2.5;

    // High emission rate
    jet.emitRate = 4000;
    jet.blendMode = BABYLON.ParticleSystem.BLENDMODE_ADD;

    // Very high speed for jets
    jet.minEmitPower = 150;
    jet.maxEmitPower = 300;
    jet.updateSpeed = 0.005;

    // Collimated jet direction (up or down)
    jet.direction1 = new BABYLON.Vector3(-0.1, dir * 1.0, -0.1);
    jet.direction2 = new BABYLON.Vector3(0.1, dir * 1.0, 0.1);

    jet.start();

    setTimeout(() => {
      jet.stop();
      setTimeout(() => jet.dispose(), 2000);
    }, config.duration);
  }

  // Central flash (extremely bright)
  const flash = new BABYLON.PointLight('grb_flash', pos3d, scene);
  flash.intensity = 200;
  flash.diffuse = new BABYLON.Color3(1.0, 0.5, 1.0);
  flash.range = 2000;

  // Pulsating light
  const flashAnim = new BABYLON.Animation(
    'flashPulse',
    'intensity',
    60,
    BABYLON.Animation.ANIMATIONTYPE_FLOAT,
    BABYLON.Animation.ANIMATIONLOOPMODE_CYCLE
  );

  flashAnim.setKeys([
    { frame: 0, value: 200 },
    { frame: 10, value: 250 },
    { frame: 20, value: 180 },
    { frame: 30, value: 220 },
    { frame: 60, value: 0 }
  ]);

  flash.animations.push(flashAnim);
  scene.beginAnimation(flash, 0, 60, false, 2, () => {
    flash.dispose();
  });

  // Add equatorial ring (accretion disk remnant)
  createAccretionDiskRing(scene, pos3d, config);
};

/**
 * Create Supernova animation
 * Massive expanding shell of particles
 */
export const createSupernovaAnimation = (
  scene: any,
  position: Vector2,
  config: AnimationConfig
): void => {
  const BABYLON = window.BABYLON;
  if (!BABYLON) return;

  const pos3d = new BABYLON.Vector3(position.x, 0, position.y);

  // Main expanding shell
  const supernova = new BABYLON.ParticleSystem('supernova', 15000, scene);
  supernova.particleTexture = new BABYLON.Texture(
    'https://www.babylonjs.com/assets/Flare.png',
    scene
  );

  supernova.emitter = pos3d;

  // Supernova colors (white-blue-yellow)
  supernova.color1 = new BABYLON.Color4(1.0, 1.0, 0.9, 1.0);
  supernova.color2 = new BABYLON.Color4(1.0, 0.7, 0.3, 0.8);
  supernova.colorDead = new BABYLON.Color4(0.8, 0.4, 0.1, 0.0);

  // Large particles
  supernova.minSize = 10;
  supernova.maxSize = 50;

  // Long lifetime
  supernova.minLifeTime = 2.0;
  supernova.maxLifeTime = 4.0;

  // Very high emission
  supernova.emitRate = 5000;
  supernova.blendMode = BABYLON.ParticleSystem.BLENDMODE_ADD;

  // Extremely high ejection speed
  supernova.minEmitPower = 100;
  supernova.maxEmitPower = 250;
  supernova.updateSpeed = 0.008;

  // Spherical expansion
  supernova.createSphereEmitter(2.0);

  supernova.start();

  setTimeout(() => {
    supernova.stop();
    setTimeout(() => supernova.dispose(), 3000);
  }, config.duration);

  // Blinding flash
  const light = new BABYLON.PointLight('supernova_light', pos3d, scene);
  light.intensity = 500;
  light.diffuse = new BABYLON.Color3(1.0, 0.9, 0.7);
  light.range = 5000;

  const lightAnim = new BABYLON.Animation(
    'supernovaFlash',
    'intensity',
    60,
    BABYLON.Animation.ANIMATIONTYPE_FLOAT,
    BABYLON.Animation.ANIMATIONLOOPMODE_CONSTANT
  );

  lightAnim.setKeys([
    { frame: 0, value: 500 },
    { frame: 5, value: 800 },
    { frame: 20, value: 300 },
    { frame: 60, value: 0 }
  ]);

  light.animations.push(lightAnim);
  scene.beginAnimation(light, 0, 60, false, 2, () => {
    light.dispose();
  });

  // Create remnant nebula
  setTimeout(() => {
    createNebulaRemnant(scene, pos3d, config);
  }, config.duration / 2);
};

/**
 * Create accretion spiral animation
 * Used for black hole absorption
 */
export const createAccretionSpiralAnimation = (
  scene: any,
  position: Vector2,
  config: AnimationConfig
): void => {
  const BABYLON = window.BABYLON;
  if (!BABYLON) return;

  const pos3d = new BABYLON.Vector3(position.x, 0, position.y);

  // Spiraling particles
  const spiral = new BABYLON.ParticleSystem('accretion_spiral', 6000, scene);
  spiral.particleTexture = new BABYLON.Texture(
    'https://www.babylonjs.com/assets/Flare.png',
    scene
  );

  spiral.emitter = pos3d;

  // Accretion disk colors (orange-red hot matter)
  spiral.color1 = new BABYLON.Color4(1.0, 0.6, 0.2, 1.0);
  spiral.color2 = new BABYLON.Color4(1.0, 0.3, 0.1, 0.9);
  spiral.colorDead = new BABYLON.Color4(0.3, 0.0, 0.0, 0.0);

  spiral.minSize = 8;
  spiral.maxSize = 20;

  spiral.minLifeTime = 1.5;
  spiral.maxLifeTime = 3.0;

  spiral.emitRate = 2000;
  spiral.blendMode = BABYLON.ParticleSystem.BLENDMODE_ADD;

  // Moderate inward speed
  spiral.minEmitPower = 20;
  spiral.maxEmitPower = 60;
  spiral.updateSpeed = 0.01;

  // Custom update function for spiral motion
  spiral.updateFunction = function(particles: any) {
    for (let p of particles) {
      p.age += this._scaledUpdateSpeed;

      if (p.age >= p.lifeTime) {
        particles.splice(particles.indexOf(p), 1);
        continue;
      }

      // Spiral motion towards center
      const toCenter = pos3d.subtract(p.position);
      const dist = toCenter.length();

      if (dist > 1) {
        // Tangential velocity (creates spiral)
        const tangent = new BABYLON.Vector3(-toCenter.z, 0, toCenter.x);
        tangent.normalize();

        // Combine inward and tangential motion
        const inward = toCenter.scale(0.5);
        const spiral = tangent.scale(dist * 0.1);

        p.position.addInPlace(inward.add(spiral).scale(this._scaledUpdateSpeed));
      }

      p.position.y += p.direction.y * this._scaledUpdateSpeed;
    }
  };

  spiral.start();

  setTimeout(() => {
    spiral.stop();
    setTimeout(() => spiral.dispose(), 2000);
  }, config.duration);

  // Disk ring
  createAccretionDiskRing(scene, pos3d, config);
};

/**
 * Create shockwave effect
 */
export const createShockwaveAnimation = (
  scene: any,
  position: Vector2,
  config: AnimationConfig
): void => {
  const BABYLON = window.BABYLON;
  if (!BABYLON) return;

  const pos3d = new BABYLON.Vector3(position.x, 0, position.y);

  // Create expanding ring
  const ring = BABYLON.MeshBuilder.CreateTorus(
    'shockwave',
    { diameter: 10, thickness: 5, tessellation: 64 },
    scene
  );
  ring.position = pos3d;
  ring.rotation.x = Math.PI / 2;

  const mat = new BABYLON.StandardMaterial('shockwave_mat', scene);
  mat.emissiveColor = new BABYLON.Color3(0.5, 0.8, 1.0);
  mat.alpha = 0.7;
  ring.material = mat;

  // Expand animation
  const scaleAnim = new BABYLON.Animation(
    'shockwaveExpand',
    'scaling',
    60,
    BABYLON.Animation.ANIMATIONTYPE_VECTOR3,
    BABYLON.Animation.ANIMATIONLOOPMODE_CONSTANT
  );

  scaleAnim.setKeys([
    { frame: 0, value: new BABYLON.Vector3(1, 1, 1) },
    { frame: 60, value: new BABYLON.Vector3(50, 50, 50) }
  ]);

  // Fade animation
  const alphaAnim = new BABYLON.Animation(
    'shockwaveFade',
    'material.alpha',
    60,
    BABYLON.Animation.ANIMATIONTYPE_FLOAT,
    BABYLON.Animation.ANIMATIONLOOPMODE_CONSTANT
  );

  alphaAnim.setKeys([
    { frame: 0, value: 0.7 },
    { frame: 60, value: 0.0 }
  ]);

  ring.animations.push(scaleAnim);
  ring.animations.push(alphaAnim);

  scene.beginAnimation(ring, 0, 60, false, 1, () => {
    ring.dispose();
  });
};

/**
 * Create nebula remnant (lingering particle cloud)
 */
const createNebulaRemnant = (scene: any, position: any, config: AnimationConfig): void => {
  const BABYLON = window.BABYLON;
  if (!BABYLON) return;

  const nebula = new BABYLON.ParticleSystem('nebula', 3000, scene);
  nebula.particleTexture = new BABYLON.Texture(
    'https://www.babylonjs.com/assets/Flare.png',
    scene
  );

  nebula.emitter = position;
  nebula.minEmitBox = new BABYLON.Vector3(-50, -50, -50);
  nebula.maxEmitBox = new BABYLON.Vector3(50, 50, 50);

  // Nebula colors (purple-pink)
  nebula.color1 = new BABYLON.Color4(0.6, 0.2, 0.4, 0.4);
  nebula.color2 = new BABYLON.Color4(0.3, 0.1, 0.2, 0.3);
  nebula.colorDead = new BABYLON.Color4(0.1, 0.0, 0.1, 0.0);

  nebula.minSize = 30;
  nebula.maxSize = 80;

  nebula.minLifeTime = 5.0;
  nebula.maxLifeTime = 10.0;

  nebula.emitRate = 100;
  nebula.blendMode = BABYLON.ParticleSystem.BLENDMODE_ADD;

  // Very slow drift
  nebula.minEmitPower = 1;
  nebula.maxEmitPower = 5;
  nebula.updateSpeed = 0.02;

  nebula.createSphereEmitter(10);

  nebula.start();

  // Keep nebula for a while
  setTimeout(() => {
    nebula.stop();
    setTimeout(() => nebula.dispose(), 8000);
  }, 15000);
};

/**
 * Create accretion disk ring
 */
const createAccretionDiskRing = (scene: any, position: any, config: AnimationConfig): void => {
  const BABYLON = window.BABYLON;
  if (!BABYLON) return;

  const ring = BABYLON.MeshBuilder.CreateTorus(
    'accretion_ring',
    { diameter: 80, thickness: 3, tessellation: 64 },
    scene
  );
  ring.position = position;
  ring.rotation.x = Math.PI / 2;

  const mat = new BABYLON.StandardMaterial('ring_mat', scene);
  mat.emissiveColor = new BABYLON.Color3(1.0, 0.5, 0.2);
  mat.alpha = 0.6;
  ring.material = mat;

  // Rotate animation
  const rotAnim = new BABYLON.Animation(
    'ringRotate',
    'rotation.y',
    60,
    BABYLON.Animation.ANIMATIONTYPE_FLOAT,
    BABYLON.Animation.ANIMATIONLOOPMODE_CYCLE
  );

  rotAnim.setKeys([
    { frame: 0, value: 0 },
    { frame: 120, value: Math.PI * 2 }
  ]);

  ring.animations.push(rotAnim);
  scene.beginAnimation(ring, 0, 120, true);

  // Fade out over time
  setTimeout(() => {
    const fadeAnim = new BABYLON.Animation(
      'ringFade',
      'material.alpha',
      60,
      BABYLON.Animation.ANIMATIONTYPE_FLOAT,
      BABYLON.Animation.ANIMATIONLOOPMODE_CONSTANT
    );

    fadeAnim.setKeys([
      { frame: 0, value: 0.6 },
      { frame: 60, value: 0.0 }
    ]);

    ring.animations.push(fadeAnim);
    scene.beginAnimation(ring, 0, 60, false, 1, () => {
      ring.dispose();
    });
  }, config.duration);
};

/**
 * Main animation dispatcher
 */
export const playCollisionAnimation = (
  scene: any,
  animationType: CollisionAnimationType,
  position: Vector2,
  intensity: number = 1.0
): void => {
  const config: AnimationConfig = {
    duration: 3000,
    intensity,
  };

  switch (animationType) {
    case 'EXPLOSION':
      createExplosionAnimation(scene, position, { ...config, color: { r: 1, g: 0.6, b: 0.2 } });
      createShockwaveAnimation(scene, position, config);
      break;

    case 'GRB':
      createGammaRayBurstAnimation(scene, position, config);
      createShockwaveAnimation(scene, position, { ...config, intensity: intensity * 2 });
      break;

    case 'SUPERNOVA':
      createSupernovaAnimation(scene, position, config);
      createShockwaveAnimation(scene, position, { ...config, intensity: intensity * 1.5 });
      break;

    case 'ABSORPTION':
      createAccretionSpiralAnimation(scene, position, config);
      break;

    case 'MERGE':
      createExplosionAnimation(scene, position, { ...config, color: { r: 0.8, g: 0.8, b: 1.0 } });
      break;

    case 'FRAGMENTATION':
      createExplosionAnimation(scene, position, { ...config, color: { r: 0.6, g: 0.6, b: 0.6 } });
      createShockwaveAnimation(scene, position, config);
      break;

    default:
      createExplosionAnimation(scene, position, config);
  }
};
