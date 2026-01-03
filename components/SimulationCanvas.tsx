import React, { useRef, useEffect } from 'react';
import { StellarBody, CameraState, SimulationSettings, Vector2, StellarCategory, AnomalyType, DragPayload, CollisionEvent } from '../types';
import { calculateRelativeVelocity, calculateCollisionEnergy } from '../services/collisionService';

// Global declaration for Babylon and Havok loaded via Script tags
declare global {
  interface Window {
    BABYLON: any;
    HavokPhysics: any;
  }
}

interface SimulationCanvasProps {
  bodies: StellarBody[];
  setBodies: React.Dispatch<React.SetStateAction<StellarBody[]>>;
  camera: CameraState;
  setCamera: React.Dispatch<React.SetStateAction<CameraState>>;
  settings: SimulationSettings;
  placingBodyType: StellarCategory | null;
  onBodyPlace: (position: Vector2, velocity: Vector2) => void;
  selectedBodyId: string | null;
  setSelectedBodyId: (id: string | null) => void;
  placingAnomalyType: AnomalyType | null;
  onDropBody: (position: Vector2, payload: DragPayload) => void;
  onCollision: (collision: CollisionEvent) => void;
}

const SimulationCanvas: React.FC<SimulationCanvasProps> = ({
  bodies,
  setBodies,
  camera: cameraState,
  setCamera,
  settings,
  placingBodyType,
  onBodyPlace,
  selectedBodyId,
  setSelectedBodyId,
  placingAnomalyType,
  onDropBody,
  onCollision
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const engineRef = useRef<any>(null);
  const sceneRef = useRef<any>(null);
  const meshMapRef = useRef<Map<string, any>>(new Map());
  const draggingRef = useRef<{ start: any; current: any; active: boolean }>({ start: null, current: null, active: false });
  const launchLineRef = useRef<any>(null);
  const gridMeshRef = useRef<any>(null);

  // Keep track of settings and callbacks for the render loop
  const settingsRef = useRef(settings);
  const onCollisionRef = useRef(onCollision);
  const bodiesRef = useRef(bodies);

  useEffect(() => { settingsRef.current = settings; }, [settings]);
  useEffect(() => { onCollisionRef.current = onCollision; }, [onCollision]);
  useEffect(() => { bodiesRef.current = bodies; }, [bodies]);

  // Black Hole Shader
  const blackHoleVertexShader = `
    precision highp float;
    attribute vec3 position;
    attribute vec2 uv;
    uniform mat4 worldViewProjection;
    varying vec2 vUV;
    void main() {
        gl_Position = worldViewProjection * vec4(position, 1.0);
        vUV = uv;
    }
  `;

  const blackHoleFragmentShader = `
    precision highp float;
    varying vec2 vUV;
    uniform float time;
    
    void main() {
        vec2 center = vec2(0.5, 0.5);
        vec2 uv = vUV - center;
        float dist = length(uv);
        
        // Event Horizon
        if (dist < 0.15) {
            gl_FragColor = vec4(0.0, 0.0, 0.0, 1.0);
            return;
        }

        // Accretion Disk Glow
        float glow = 0.0;
        if (dist < 0.45) {
            glow = sin(dist * 60.0 - time * 8.0) * 0.5 + 0.5;
            glow *= (0.45 - dist) * 4.0;
        }

        gl_FragColor = vec4(vec3(glow * 1.8, glow * 1.0, glow * 0.4), 1.0);
    }
  `;

  // Spacetime Grid Vertex Shader
  const spacetimeVertexShader = `
    precision highp float;
    attribute vec3 position;
    uniform mat4 worldViewProjection;
    
    // Pass up to 10 massive bodies [x, z, mass]
    uniform vec3 massiveBodies[10];
    uniform int bodyCount;

    varying vec3 vPosition;

    void main() {
        vec3 p = position;
        float depression = 0.0;

        for(int i = 0; i < 10; i++) {
            if(i >= bodyCount) break;
            
            vec2 bodyPos = massiveBodies[i].xy;
            float mass = massiveBodies[i].z;
            
            float dist = distance(p.xz, bodyPos);
            // Visual scale factor for gravity well depth
            float effect = (mass * 0.1) / (dist + 50.0);
            depression -= effect;
        }

        p.y += max(depression, -400.0);
        
        vPosition = p;
        gl_Position = worldViewProjection * vec4(p, 1.0);
    }
  `;

  const spacetimeFragmentShader = `
    precision highp float;
    varying vec3 vPosition;
    
    void main() {
        float depth = clamp(-vPosition.y / 200.0, 0.1, 1.0);
        gl_FragColor = vec4(0.0, 0.5 * depth + 0.1, 1.0 * depth + 0.2, 0.4);
    }
  `;

  // Handle Drag Over
  const handleDragOver = (e: React.DragEvent) => {
      e.preventDefault();
      e.dataTransfer.dropEffect = 'copy';
  };

  // Handle Drop
  const handleDrop = (e: React.DragEvent) => {
      e.preventDefault();
      const scene = sceneRef.current;
      const BABYLON = window.BABYLON;
      if (!scene || !BABYLON) return;

      try {
          const payload: DragPayload = JSON.parse(e.dataTransfer.getData('application/json'));
          
          const pickInfo = scene.pick(scene.pointerX, scene.pointerY, (mesh: any) => mesh.name === "groundPlane");
          let worldPos = new BABYLON.Vector3(0, 0, 0);

          if (pickInfo.hit) {
              worldPos = pickInfo.pickedPoint;
          } else {
               const ray = scene.createPickingRay(scene.pointerX, scene.pointerY, BABYLON.Matrix.Identity(), scene.activeCamera);
               const dist = -ray.origin.y / ray.direction.y;
               if (dist > 0 && dist < 100000) {
                    worldPos = ray.origin.add(ray.direction.scale(dist));
               }
          }

          // Grid Snap (50 units)
          const snapSize = 50;
          const snappedX = Math.round(worldPos.x / snapSize) * snapSize;
          const snappedZ = Math.round(worldPos.z / snapSize) * snapSize;

          onDropBody({ x: snappedX, y: snappedZ }, payload);

      } catch (err) {
          console.error("Failed to parse drop payload", err);
      }
  };


  // Initialize Babylon Engine & Havok
  useEffect(() => {
    if (!canvasRef.current || !window.BABYLON || !window.HavokPhysics) return;

    // cleanup previous instance if it exists (React StrictMode double-mount protection)
    if (engineRef.current) {
        engineRef.current.dispose();
    }

    const initEngine = async () => {
      const BABYLON = window.BABYLON;
      
      let engine;
      try {
        engine = new BABYLON.WebGPUEngine(canvasRef.current);
        await engine.initAsync();
      } catch (e) {
        console.warn("Falling back to WebGL2");
        engine = new BABYLON.Engine(canvasRef.current, true);
      }
      engineRef.current = engine;

      const scene = new BABYLON.Scene(engine);
      scene.clearColor = new BABYLON.Color4(0.01, 0.01, 0.03, 1);
      sceneRef.current = scene;

      // Initialize Havok
      const havokInstance = await window.HavokPhysics();
      const havokPlugin = new BABYLON.HavokPlugin(true, havokInstance);
      scene.enablePhysics(new BABYLON.Vector3(0, 0, 0), havokPlugin);

      // --- Universal Camera (FPS Style) ---
      const camera = new BABYLON.UniversalCamera("UniversalCamera", new BABYLON.Vector3(0, 600, -1000), scene);
      camera.setTarget(BABYLON.Vector3.Zero());
      camera.maxZ = 100000; // Far clip plane
      camera.minZ = 1;

      // FPS Key Mapping
      camera.keysUp = [87];    // W 
      camera.keysDown = [83];  // S 
      camera.keysLeft = [65];  // A 
      camera.keysRight = [68]; // D 
      camera.keysUpward = [32]; // SPACE 
      camera.keysDownward = [16]; // SHIFT 
      
      camera.speed = 40; 
      camera.angularSensibility = 2500; 
      camera.inertia = 0.9; 

      camera.attachControl(canvasRef.current, true);
      
      // Lighting
      const glow = new BABYLON.GlowLayer("glow", scene);
      glow.intensity = 1.2;

      const light = new BABYLON.HemisphericLight("light", new BABYLON.Vector3(0, 1, 0), scene);
      light.intensity = 0.4; // Higher ambient
      
      // Spacetime Grid
      const gridMesh = BABYLON.MeshBuilder.CreateGround("spacetimeGrid", { width: 8000, height: 8000, subdivisions: 200 }, scene);
      const gridMat = new BABYLON.ShaderMaterial("spacetimeMat", scene, {
          vertexSource: spacetimeVertexShader,
          fragmentSource: spacetimeFragmentShader,
      }, {
          attributes: ["position"],
          uniforms: ["worldViewProjection", "massiveBodies", "bodyCount"],
          needAlphaBlending: true
      });
      gridMat.wireframe = true;
      gridMat.backFaceCulling = false;
      gridMesh.material = gridMat;
      gridMeshRef.current = gridMesh;

      // Launch Line
      launchLineRef.current = BABYLON.MeshBuilder.CreateLines("launchLine", { points: [BABYLON.Vector3.Zero(), BABYLON.Vector3.Zero()] }, scene);
      launchLineRef.current.color = new BABYLON.Color3(0.4, 0.8, 1);
      launchLineRef.current.isVisible = false;

      // Ground plane for raycasting (invisible)
      const ground = BABYLON.MeshBuilder.CreateGround("groundPlane", { width: 20000, height: 20000 }, scene);
      ground.isVisible = false;

      // --- INPUT HANDLING ---
      scene.onPointerObservable.add((pointerInfo: any) => {
        const type = pointerInfo.type;

        // Zoom
        if (type === BABYLON.PointerEventTypes.POINTERWHEEL) {
            const event = pointerInfo.event;
            const delta = event.deltaY;
            if (camera) {
                const forward = camera.getForwardRay().direction;
                const zoomDir = delta < 0 ? 1 : -1;
                const zoomSpeed = camera.speed * 4.0;
                camera.position.addInPlace(forward.scale(zoomDir * zoomSpeed));
            }
            return;
        }

        // Click & Drag Launching
        if (type === BABYLON.PointerEventTypes.POINTERDOWN) {
             // If clicking on a body, select it
             const pickInfo = scene.pick(scene.pointerX, scene.pointerY);
             if (pickInfo.hit && pickInfo.pickedMesh.metadata?.id) {
                 setSelectedBodyId(pickInfo.pickedMesh.metadata.id);
                 return;
             } else {
                 setSelectedBodyId(null);
             }

             // Launch logic
             const groundPick = scene.pick(scene.pointerX, scene.pointerY, (m: any) => m.name === "groundPlane");
             let startPoint = BABYLON.Vector3.Zero();
             
             if (groundPick.hit) {
                 startPoint = groundPick.pickedPoint;
             } else {
                 const ray = scene.createPickingRay(scene.pointerX, scene.pointerY, BABYLON.Matrix.Identity(), camera);
                 const dist = -ray.origin.y / ray.direction.y;
                 startPoint = ray.origin.add(ray.direction.scale(dist));
             }
             
             draggingRef.current = { start: startPoint, current: startPoint, active: true };
        }
        else if (type === BABYLON.PointerEventTypes.POINTERMOVE && draggingRef.current.active) {
             const ray = scene.createPickingRay(scene.pointerX, scene.pointerY, BABYLON.Matrix.Identity(), camera);
             const planeY = draggingRef.current.start.y;
             
             if (Math.abs(ray.direction.y) > 0.001) {
                const t = (planeY - ray.origin.y) / ray.direction.y;
                const point = ray.origin.add(ray.direction.scale(t));
                draggingRef.current.current = point;

                // Update Visual Line
                launchLineRef.current.dispose();
                launchLineRef.current = BABYLON.MeshBuilder.CreateLines("launchLine", { 
                    points: [draggingRef.current.start, draggingRef.current.current] 
                }, scene);
                launchLineRef.current.color = new BABYLON.Color3(0, 1, 1);
             }
        }
        else if (type === BABYLON.PointerEventTypes.POINTERUP && draggingRef.current.active) {
            const start = draggingRef.current.start;
            const end = draggingRef.current.current;
            const velocityScale = 0.05;
            
            // In Babylon, Z is depth. 
            const vx = (start.x - end.x) * velocityScale;
            const vz = (start.z - end.z) * velocityScale;
            
            // Only fire if there was a drag
            if (BABYLON.Vector3.Distance(start, end) > 2) {
                onBodyPlace({ x: start.x, y: start.z }, { x: vx, y: vz });
            }
            
            draggingRef.current.active = false;
            launchLineRef.current.dispose();
            launchLineRef.current = BABYLON.MeshBuilder.CreateLines("launchLine", { points: [BABYLON.Vector3.Zero(), BABYLON.Vector3.Zero()] }, scene);
        }
      });

      // --- RENDER LOOP ---
      engine.runRenderLoop(() => {
        if (!scene) return;
        
        const currentSettings = settingsRef.current;
        const dtOriginal = engine.getDeltaTime() / 1000;
        const dt = dtOriginal * currentSettings.timeScale;

        // Physics Update
        if (!currentSettings.paused) {
            const meshes = Array.from(meshMapRef.current.values());
            
            for (let i = 0; i < meshes.length; i++) {
                const m1 = meshes[i];
                if (!m1.physicsBody) continue;
                
                const b1Pos = m1.physicsBody.transformNode.position; 
                
                // Keep objects on plane mostly, but allow some float
                if (Math.abs(b1Pos.y) > 2) {
                     m1.physicsBody.applyForce(new BABYLON.Vector3(0, -b1Pos.y * m1.metadata.mass * 2.0, 0), b1Pos);
                }
                
                // Damping
                const vel = m1.physicsBody.getLinearVelocity();
                m1.physicsBody.setLinearVelocity(vel.scale(0.999));

                // N-Body Gravity
                for (let j = 0; j < meshes.length; j++) {
                    if (i === j) continue;
                    const m2 = meshes[j];
                    if (!m2.physicsBody) continue;

                    const b2Pos = m2.physicsBody.transformNode.position;
                    const distVec = b2Pos.subtract(b1Pos);
                    const distSq = distVec.lengthSquared();
                    
                    if (distSq < 1.0) continue; 

                    let forceMag = (currentSettings.gravityConstant * m1.metadata.mass * m2.metadata.mass) / distSq;
                    
                    // Anomalies
                    if (m2.metadata.category === 'Anomaly' && m2.metadata.anomalyType === 'REPULSOR') {
                         forceMag = -forceMag * 20;
                    }

                    const force = distVec.normalize().scale(forceMag);
                    m1.physicsBody.applyImpulse(force.scale(dt), b1Pos);
                }
            }

            // Collision Detection
            for (let i = 0; i < meshes.length; i++) {
                for (let j = i + 1; j < meshes.length; j++) {
                    const m1 = meshes[i];
                    const m2 = meshes[j];
                    if (!m1.physicsBody || !m2.physicsBody) continue;

                    const pos1 = m1.physicsBody.transformNode.position;
                    const pos2 = m2.physicsBody.transformNode.position;
                    const dist = BABYLON.Vector3.Distance(pos1, pos2);
                    const collisionThreshold = m1.metadata.radius + m2.metadata.radius;

                    // Check if bodies are colliding
                    if (dist < collisionThreshold) {
                        // Find corresponding StellarBody objects
                        const body1 = bodiesRef.current.find(b => b.id === m1.metadata.id);
                        const body2 = bodiesRef.current.find(b => b.id === m2.metadata.id);

                        if (body1 && body2) {
                            const relativeVel = calculateRelativeVelocity(body1, body2);
                            const collisionEnergy = calculateCollisionEnergy(body1, body2, relativeVel);

                            const collisionEvent: CollisionEvent = {
                                id: crypto.randomUUID(),
                                body1,
                                body2,
                                impactVelocity: relativeVel,
                                impactPoint: {
                                    x: (pos1.x + pos2.x) / 2,
                                    y: (pos1.z + pos2.z) / 2, // Note: Babylon uses Z for 2D Y
                                },
                                timestamp: Date.now(),
                                relativeEnergy: collisionEnergy,
                            };

                            // Trigger collision handler
                            onCollisionRef.current(collisionEvent);
                        }
                    }
                }
            }
        }

        // Update Shaders
        const bhMat = scene.getMaterialByName("blackHoleMat");
        if (bhMat) bhMat.setFloat("time", performance.now() * 0.001);

        if (currentSettings.showGrid && gridMeshRef.current && gridMeshRef.current.material) {
            gridMeshRef.current.isVisible = true;
            const meshes = Array.from(meshMapRef.current.values());
            const topBodies = meshes
                .sort((a, b) => b.metadata.mass - a.metadata.mass)
                .slice(0, 10);
            
            const bodiesData = [];
            for(let b of topBodies) {
                bodiesData.push(b.position.x, b.position.z, b.metadata.mass);
            }
            while(bodiesData.length < 30) bodiesData.push(0,0,0);

            const gridMat = gridMeshRef.current.material;
            gridMat.setFloats("massiveBodies", bodiesData);
            gridMat.setInt("bodyCount", topBodies.length);
        } else if (gridMeshRef.current) {
            gridMeshRef.current.isVisible = false;
        }

        scene.render();
      });

      window.addEventListener('resize', () => engine.resize());
    };

    initEngine();

    return () => {
       if (engineRef.current) {
           engineRef.current.dispose();
           engineRef.current = null;
       }
    };
  }, []); 

  // Sync React State "bodies" to Babylon Meshes
  useEffect(() => {
    if (!sceneRef.current || !window.BABYLON) return;
    const BABYLON = window.BABYLON;
    const scene = sceneRef.current;
    
    // 1. Mark current meshes
    const currentIds = new Set(bodies.map(b => b.id));
    
    // 2. Remove deleted
    for (const [id, mesh] of meshMapRef.current) {
        if (!currentIds.has(id)) {
            mesh.dispose();
            meshMapRef.current.delete(id);
        }
    }

    // 3. Add/Update
    bodies.forEach(body => {
        let mesh = meshMapRef.current.get(body.id);
        
        // Create if not exists
        if (!mesh) {
            let material;
            
            // 1. Black Holes (Shader)
            if (body.category === StellarCategory.BLACK_HOLE || body.category === StellarCategory.SUPERMASSIVE_BLACK_HOLE) {
                mesh = BABYLON.MeshBuilder.CreateSphere(body.name, { diameter: body.radius * 2, segments: 64 }, scene);
                const shaderMat = new BABYLON.ShaderMaterial("blackHoleMat", scene, {
                    vertexSource: blackHoleVertexShader,
                    fragmentSource: blackHoleFragmentShader,
                }, {
                    attributes: ["position", "uv"],
                    uniforms: ["worldViewProjection", "time"]
                });
                shaderMat.backFaceCulling = false;
                mesh.material = shaderMat;
            } 
            // 2. Stars
            else if (
                body.category === StellarCategory.STAR || 
                body.category === StellarCategory.NEUTRON_STAR ||
                body.category === StellarCategory.PULSAR ||
                body.category === StellarCategory.MAGNETAR ||
                body.category === StellarCategory.RED_GIANT ||
                body.category === StellarCategory.BLUE_GIANT ||
                body.category === StellarCategory.RED_HYPERGIANT ||
                body.category === StellarCategory.WHITE_DWARF ||
                body.category === StellarCategory.BROWN_DWARF ||
                body.category === StellarCategory.QUASAR
            ) {
                mesh = BABYLON.MeshBuilder.CreateSphere(body.name, { diameter: body.radius * 2, segments: 32 }, scene);
                const pbr = new BABYLON.PBRMaterial(body.name + "_mat", scene);
                const c = BABYLON.Color3.FromHexString(body.color);
                pbr.albedoColor = c;
                pbr.emissiveColor = c;
                pbr.metallic = 0.0;
                pbr.roughness = 0.9;
                mesh.material = pbr;
                
                const ps = new BABYLON.ParticleSystem("particles", 2000, scene);
                ps.emitter = mesh;
                ps.particleTexture = new BABYLON.Texture("https://www.babylonjs.com/assets/Flare.png", scene);
                ps.minEmitBox = new BABYLON.Vector3(-body.radius, -body.radius, -body.radius); 
                ps.maxEmitBox = new BABYLON.Vector3(body.radius, body.radius, body.radius);
                ps.color1 = new BABYLON.Color4(c.r, c.g, c.b, 1.0);
                ps.color2 = new BABYLON.Color4(1, 1, 1, 0.0);
                ps.minSize = body.radius * 0.2;
                ps.maxSize = body.radius * 0.5;
                ps.minLifeTime = 0.2;
                ps.maxLifeTime = 0.5;
                ps.emitRate = 100;
                ps.start();
            }
            // 3. Anomalies
            else if (body.category === StellarCategory.ANOMALY) {
                 mesh = BABYLON.MeshBuilder.CreateTorus(body.name, { diameter: body.radius * 2, thickness: body.radius * 0.5 }, scene);
                 const pbr = new BABYLON.PBRMaterial("anomalyMat", scene);
                 const c = BABYLON.Color3.FromHexString(body.color);
                 pbr.emissiveColor = c;
                 pbr.albedoColor = c;
                 pbr.metallic = 1.0;
                 pbr.roughness = 0.2;
                 mesh.material = pbr;
                 mesh.rotation.x = Math.PI / 2; 
            }
            // 4. Planets/Others
            else {
                if (body.category === StellarCategory.ASTEROID) {
                    mesh = BABYLON.MeshBuilder.CreatePolyhedron(body.name, { type: 1, size: body.radius }, scene);
                } else {
                    mesh = BABYLON.MeshBuilder.CreateSphere(body.name, { diameter: body.radius * 2, segments: 32 }, scene);
                }
                const pbr = new BABYLON.PBRMaterial(body.name + "_mat", scene);
                const c = BABYLON.Color3.FromHexString(body.color);
                pbr.albedoColor = c;
                pbr.metallic = 0.1;
                pbr.roughness = 0.6;
                mesh.material = pbr;
            }

            mesh.position.x = body.position.x;
            mesh.position.z = body.position.y; 
            mesh.position.y = 0;

            const physicsAggregate = new BABYLON.PhysicsAggregate(
                mesh, 
                BABYLON.PhysicsShapeType.SPHERE, 
                { mass: body.mass, restitution: 0.5, friction: 0.1 }, 
                scene
            );
            
            physicsAggregate.body.setLinearVelocity(new BABYLON.Vector3(body.velocity.x, 0, body.velocity.y));
            
            mesh.metadata = { 
                id: body.id, 
                mass: body.mass, 
                radius: body.radius, 
                category: body.category, 
                anomalyType: body.anomalyType 
            };
            
            meshMapRef.current.set(body.id, mesh);
        } else {
            // Visual Updates (Selection Halo)
            if (selectedBodyId === body.id) {
                mesh.renderOverlay = true;
                mesh.overlayColor = new BABYLON.Color3(0, 1, 0);
                mesh.overlayAlpha = 0.3;
            } else {
                mesh.renderOverlay = false;
            }
        }
    });

  }, [bodies, selectedBodyId]);

  return (
    <canvas
      ref={canvasRef}
      id="renderCanvas"
      className="block w-full h-full cursor-crosshair outline-none"
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    />
  );
};

export default SimulationCanvas;