import React, { useRef, useEffect, useCallback } from 'react';
import { StellarBody, CameraState, SimulationSettings, Vector2, StellarCategory } from '../types';

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
  placingAnomalyType: 'WORMHOLE' | 'REPULSOR' | null;
}

const SimulationCanvas: React.FC<SimulationCanvasProps> = ({
  bodies,
  setBodies,
  camera,
  setCamera,
  settings,
  placingBodyType,
  onBodyPlace,
  selectedBodyId,
  setSelectedBodyId,
  placingAnomalyType
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const requestRef = useRef<number>();
  const dragRef = useRef<{ start: Vector2, current: Vector2, isDown: boolean, type: 'pan' | 'launch' }>({ 
    start: {x:0, y:0}, 
    current: {x:0, y:0}, 
    isDown: false, 
    type: 'pan' 
  });
  const bodiesRef = useRef<StellarBody[]>(bodies);
  const timeRef = useRef<number>(0);

  // Sync ref with props for animation loop
  useEffect(() => {
    bodiesRef.current = bodies;
  }, [bodies]);

  // Coordinate transformation helpers
  const screenToWorld = useCallback((sx: number, sy: number): Vector2 => {
    if (!canvasRef.current) return { x: 0, y: 0 };
    const cx = canvasRef.current.width / 2;
    const cy = canvasRef.current.height / 2;
    
    // Inverse Rotation
    const dx = sx - cx;
    const dy = sy - cy;
    const cos = Math.cos(-camera.rotation);
    const sin = Math.sin(-camera.rotation);
    const rx = dx * cos - dy * sin;
    const ry = dx * sin + dy * cos;

    return {
      x: (rx / camera.zoom) + camera.x,
      y: (ry / camera.zoom) + camera.y
    };
  }, [camera]);

  const worldToScreen = useCallback((wx: number, wy: number): Vector2 => {
    if (!canvasRef.current) return { x: 0, y: 0 };
    const cx = canvasRef.current.width / 2;
    const cy = canvasRef.current.height / 2;
    
    const relX = (wx - camera.x) * camera.zoom;
    const relY = (wy - camera.y) * camera.zoom;

    // Rotation
    const cos = Math.cos(camera.rotation);
    const sin = Math.sin(camera.rotation);
    const rx = relX * cos - relY * sin;
    const ry = relX * sin + relY * cos;

    return {
      x: cx + rx,
      y: cy + ry
    };
  }, [camera]);

  // Physics Step
  const updatePhysics = () => {
    if (settings.paused) return;

    const dt = settings.timeScale;
    const now = Date.now();
    let newBodies = bodiesRef.current.map(b => ({ ...b, trail: [...b.trail] }));

    // Apply Gravity & Anomalies
    for (let i = 0; i < newBodies.length; i++) {
      const b1 = newBodies[i];
      
      // Wormhole Check
      if (b1.anomalyType === 'WORMHOLE' && b1.linkedBodyId) {
          // Check for bodies entering wormhole
          for (let k = 0; k < newBodies.length; k++) {
              if (i === k) continue;
              const victim = newBodies[k];
              if (victim.anomalyType === 'WORMHOLE') continue; // Wormholes don't eat wormholes

              const dx = victim.position.x - b1.position.x;
              const dy = victim.position.y - b1.position.y;
              const dist = Math.sqrt(dx*dx + dy*dy);
              
              if (dist < b1.radius) {
                  // Teleport!
                  const exitNode = newBodies.find(n => n.id === b1.linkedBodyId);
                  // Only teleport if exit exists and cooldown passed
                  if (exitNode && (!victim.lastTeleportTime || now - victim.lastTeleportTime > 2000)) {
                      victim.position.x = exitNode.position.x + (Math.random() - 0.5) * (exitNode.radius * 2.5);
                      victim.position.y = exitNode.position.y + (Math.random() - 0.5) * (exitNode.radius * 2.5);
                      victim.lastTeleportTime = now;
                      // Add a trail jump
                      victim.trail = [];
                  }
              }
          }
      }

      for (let j = 0; j < newBodies.length; j++) {
        if (i === j) continue;
        const b2 = newBodies[j];
        
        const dx = b2.position.x - b1.position.x;
        const dy = b2.position.y - b1.position.y;
        const distSq = dx * dx + dy * dy;
        const dist = Math.sqrt(distSq);

        if (dist < (b1.radius + b2.radius) * 0.5) {
             // Collision logic (soft)
             continue;
        }

        // F = G * m1 * m2 / r^2
        // a = F / m1 = G * m2 / r^2
        let forceMagnitude = (settings.gravityConstant * b2.mass) / (distSq + 100); 

        // REPULSOR LOGIC
        if (b2.anomalyType === 'REPULSOR') {
            forceMagnitude = -forceMagnitude * 5; // Strong repulsion
        }

        const ax = (dx / dist) * forceMagnitude;
        const ay = (dy / dist) * forceMagnitude;

        b1.velocity.x += ax * dt;
        b1.velocity.y += ay * dt;
      }
    }

    // Move Bodies
    newBodies.forEach(b => {
      // Don't move static anomalies if we want them fixed, but let's allow them to drift if they have mass
      // For gameplay, wormholes usually static? Let's treat them as massive objects that move.
      b.position.x += b.velocity.x * dt;
      b.position.y += b.velocity.y * dt;

      if (settings.showTrails && Math.random() > 0.8) {
        b.trail.push({ ...b.position });
        if (b.trail.length > 50) b.trail.shift();
      }
    });

    bodiesRef.current = newBodies;
  };

  // The Loop
  const animate = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    timeRef.current += 0.05;

    // Clear
    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Grid
    ctx.strokeStyle = '#1a1a1a';
    ctx.lineWidth = 1;
    ctx.beginPath();
    const gridSize = 100 * camera.zoom;
    const offsetX = (camera.x * camera.zoom) % gridSize;
    const offsetY = (camera.y * camera.zoom) % gridSize;
    
    // Draw rendering logic here...
    
    updatePhysics();

    // Render Bodies
    bodiesRef.current.forEach(body => {
      const pos = worldToScreen(body.position.x, body.position.y);
      const r = body.radius * camera.zoom;

      // Offscreen check
      if (pos.x < -r - 100 || pos.x > canvas.width + r + 100 || pos.y < -r - 100 || pos.y > canvas.height + r + 100) return;

      // Trail
      if (settings.showTrails && body.trail.length > 1) {
        ctx.beginPath();
        ctx.strokeStyle = body.anomalyType === 'WORMHOLE' ? '#a0f' : body.color;
        ctx.globalAlpha = 0.3;
        ctx.lineWidth = 2 * camera.zoom;
        body.trail.forEach((p, index) => {
          const tp = worldToScreen(p.x, p.y);
          if (index === 0) ctx.moveTo(tp.x, tp.y);
          else ctx.lineTo(tp.x, tp.y);
        });
        ctx.stroke();
        ctx.globalAlpha = 1.0;
      }

      // Draw Body Base
      if (body.anomalyType === 'WORMHOLE') {
          // Wormhole Visual
          ctx.beginPath();
          ctx.arc(pos.x, pos.y, r, 0, Math.PI * 2);
          ctx.strokeStyle = '#a855f7'; // Purple
          ctx.lineWidth = 3;
          ctx.stroke();
          
          // Swirl effect
          ctx.beginPath();
          const swirlOffset = (timeRef.current % (Math.PI * 2));
          for(let i=0; i<3; i++) {
            ctx.ellipse(pos.x, pos.y, r * (0.3 + i*0.2), r, swirlOffset + i, 0, Math.PI * 2);
          }
          ctx.strokeStyle = `rgba(168, 85, 247, 0.5)`;
          ctx.stroke();
      } else if (body.anomalyType === 'REPULSOR') {
          // Repulsor Visual
          ctx.beginPath();
          ctx.arc(pos.x, pos.y, r, 0, Math.PI * 2);
          ctx.fillStyle = '#ef4444'; // Red
          ctx.fill();
          
          // Pulse
          ctx.beginPath();
          const pulse = (Math.sin(timeRef.current * 2) + 1) * 0.5 * 10 * camera.zoom;
          ctx.arc(pos.x, pos.y, r + pulse, 0, Math.PI * 2);
          ctx.strokeStyle = `rgba(239, 68, 68, ${1 - pulse/(20*camera.zoom)})`;
          ctx.stroke();
      } else {
          // Standard Body (Wireframe style)
          ctx.beginPath();
          ctx.arc(pos.x, pos.y, Math.max(r, 2), 0, Math.PI * 2);
          ctx.fillStyle = '#000';
          ctx.fill();
          ctx.strokeStyle = body.color;
          ctx.lineWidth = 2;
          ctx.stroke();

          // Inner wireframe details
          ctx.beginPath();
          ctx.arc(pos.x, pos.y, Math.max(r * 0.6, 1), 0, Math.PI * 2);
          ctx.strokeStyle = body.color;
          ctx.globalAlpha = 0.5;
          ctx.stroke();
          ctx.globalAlpha = 1.0;
      }

      // Selection Highlight
      if (selectedBodyId === body.id) {
        ctx.beginPath();
        ctx.arc(pos.x, pos.y, Math.max(r * 1.5, 10), 0, Math.PI * 2);
        ctx.strokeStyle = '#fff';
        ctx.setLineDash([5, 5]);
        ctx.stroke();
        ctx.setLineDash([]);
      }
      
      // Name label
      if (r > 5 || selectedBodyId === body.id) {
        ctx.fillStyle = '#fff';
        ctx.font = '10px Courier New';
        ctx.fillText(body.name, pos.x + r + 5, pos.y);
      }
    });

    // Render Drag Line (Launch vector)
    if (dragRef.current.isDown && dragRef.current.type === 'launch' && (placingBodyType || placingAnomalyType)) {
        const startPos = dragRef.current.start; // Screen coords
        const currentPos = dragRef.current.current; // Screen coords
        
        ctx.beginPath();
        ctx.moveTo(startPos.x, startPos.y);
        ctx.lineTo(currentPos.x, currentPos.y);
        ctx.strokeStyle = '#fff';
        ctx.setLineDash([5, 5]);
        ctx.lineWidth = 2;
        ctx.stroke();
        ctx.setLineDash([]);

        // Force label
        const dx = startPos.x - currentPos.x;
        const dy = startPos.y - currentPos.y;
        const force = Math.sqrt(dx*dx + dy*dy);
        ctx.fillStyle = '#fff';
        ctx.fillText(`Velocity: ${force.toFixed(1)}`, currentPos.x + 10, currentPos.y + 10);
    }

    requestRef.current = requestAnimationFrame(animate);
  }, [camera, settings, placingBodyType, selectedBodyId, updatePhysics, worldToScreen, placingAnomalyType]);

  useEffect(() => {
    requestRef.current = requestAnimationFrame(animate);
    return () => {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
  }, [animate]);


  // Event Handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    const rect = canvasRef.current!.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    if (placingBodyType || placingAnomalyType) {
      dragRef.current = { start: {x, y}, current: {x, y}, isDown: true, type: 'launch' };
    } else {
      // Check for object click
      const worldPos = screenToWorld(x, y);
      const clickedBody = bodiesRef.current.find(b => {
        const dist = Math.sqrt(Math.pow(b.position.x - worldPos.x, 2) + Math.pow(b.position.y - worldPos.y, 2));
        return dist < Math.max(b.radius, 10 / camera.zoom); // easier clicking
      });

      if (clickedBody) {
        setSelectedBodyId(clickedBody.id);
        dragRef.current = { start: {x, y}, current: {x, y}, isDown: false, type: 'pan' }; 
      } else {
        setSelectedBodyId(null);
        dragRef.current = { start: {x, y}, current: {x, y}, isDown: true, type: 'pan' };
      }
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    const rect = canvasRef.current!.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    if (dragRef.current.isDown) {
      dragRef.current.current = {x, y};

      if (dragRef.current.type === 'pan') {
        const dx = x - dragRef.current.start.x;
        const dy = y - dragRef.current.start.y;
        
        // Adjust camera
        // Need to account for rotation in panning
        const cos = Math.cos(-camera.rotation);
        const sin = Math.sin(-camera.rotation);
        const rx = dx * cos - dy * sin;
        const ry = dx * sin + dy * cos;

        setCamera(prev => ({
          ...prev,
          x: prev.x - rx / prev.zoom,
          y: prev.y - ry / prev.zoom
        }));
        dragRef.current.start = {x, y}; // Reset start for relative delta
      }
    }
  };

  const handleMouseUp = (e: React.MouseEvent) => {
    if (dragRef.current.isDown && dragRef.current.type === 'launch' && (placingBodyType || placingAnomalyType)) {
      // Calculate velocity based on drag distance
      const start = dragRef.current.start;
      const end = dragRef.current.current;
      const velocityScale = 0.05;
      
      const vx = (start.x - end.x) * velocityScale;
      const vy = (start.y - end.y) * velocityScale;

      // Rotation adjustment
      const cos = Math.cos(-camera.rotation);
      const sin = Math.sin(-camera.rotation);
      const rvx = vx * cos - vy * sin;
      const rvy = vx * sin + vy * cos;

      const worldPos = screenToWorld(start.x, start.y);
      onBodyPlace(worldPos, { x: rvx, y: rvy });
    }
    dragRef.current.isDown = false;
  };

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const zoomSensitivity = 0.001;
    const newZoom = Math.max(0.01, Math.min(10, camera.zoom - e.deltaY * zoomSensitivity));
    setCamera(prev => ({ ...prev, zoom: newZoom }));
  };

  useEffect(() => {
    const interval = setInterval(() => {
        if (!settings.paused) setBodies([...bodiesRef.current]);
    }, 1000);
    return () => clearInterval(interval);
  }, [settings.paused, setBodies]);

  useEffect(() => {
      bodiesRef.current = bodies;
  }, [bodies.length]); 

  return (
    <canvas
      ref={canvasRef}
      width={window.innerWidth}
      height={window.innerHeight}
      className="block cursor-crosshair"
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onWheel={handleWheel}
      onContextMenu={(e) => e.preventDefault()}
    />
  );
};

export default SimulationCanvas;