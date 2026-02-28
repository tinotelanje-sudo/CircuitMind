/**
 * PCB Design Engine - AI Auto-Placement & Auto-Routing
 * Implements heuristics and optimization algorithms for electronic design.
 */

export interface PCBComponent {
  id: string;
  ref: string;
  x: number;
  y: number;
  rotation: number;
  width: number;
  height: number;
  group: 'Power' | 'Analog' | 'Digital' | 'IO';
}

export interface Net {
  name: string;
  nodes: string[]; // Component IDs
}

export interface Track {
  netName: string;
  points: { x: number; y: number }[];
  layer: number;
  width: number;
}

export interface DesignScore {
  total: number;
  drc: number;
  signalIntegrity: number;
  powerIntegrity: number;
  emi: number;
  manufacturability: number;
}

/**
 * Functional Grouping Heuristic
 */
export function groupComponents(components: any[]): PCBComponent[] {
  return components.map(c => {
    let group: PCBComponent['group'] = 'Digital';
    const name = c.name.toLowerCase();
    const type = c.type.toLowerCase();

    if (name.includes('conn') || name.includes('j') || type.includes('connector')) group = 'IO';
    else if (name.includes('u') && (type.includes('reg') || type.includes('pwr'))) group = 'Power';
    else if (name.includes('c') || name.includes('l') || name.includes('r')) {
       // Passives usually follow their primary IC, but we'll default to Digital for now
       group = 'Digital';
    } else if (type.includes('opamp') || type.includes('adc')) group = 'Analog';

    return {
      ...c,
      group,
      width: 80, // Default footprint size
      height: 40,
      rotation: 0
    };
  });
}

/**
 * Force-Directed Placement Prototype
 * Minimizes total wire length by treating nets as springs.
 */
export function autoPlace(components: PCBComponent[], nets: Net[], boardSize: { w: number, h: number }) {
  const iterations = 50;
  const k = Math.sqrt((boardSize.w * boardSize.h) / components.length);
  let temp = boardSize.w / 10;

  let currentPos = components.map(c => ({ ...c }));

  for (let iter = 0; iter < iterations; iter++) {
    const forces = currentPos.map(() => ({ x: 0, y: 0 }));

    // Repulsive forces (between all components)
    for (let i = 0; i < currentPos.length; i++) {
      for (let j = 0; j < currentPos.length; j++) {
        if (i === j) continue;
        const dx = currentPos[i].x - currentPos[j].x;
        const dy = currentPos[i].y - currentPos[j].y;
        const dist = Math.sqrt(dx * dx + dy * dy) || 1;
        const fr = (k * k) / dist;
        forces[i].x += (dx / dist) * fr;
        forces[i].y += (dy / dist) * fr;
      }
    }

    // Attractive forces (along nets)
    nets.forEach(net => {
      for (let i = 0; i < net.nodes.length; i++) {
        for (let j = i + 1; j < net.nodes.length; j++) {
          const compA = currentPos.find(c => c.id === net.nodes[i]);
          const compB = currentPos.find(c => c.id === net.nodes[j]);
          if (!compA || !compB) continue;
          
          const idxA = currentPos.indexOf(compA);
          const idxB = currentPos.indexOf(compB);

          const dx = compA.x - compB.x;
          const dy = compA.y - compB.y;
          const dist = Math.sqrt(dx * dx + dy * dy) || 1;
          const fa = (dist * dist) / k;
          
          forces[idxA].x -= (dx / dist) * fa;
          forces[idxA].y -= (dy / dist) * fa;
          forces[idxB].x += (dx / dist) * fa;
          forces[idxB].y += (dy / dist) * fa;
        }
      }
    });

    // Apply forces and keep within board
    currentPos = currentPos.map((c, i) => {
      if (c.group === 'IO') return c; // Keep connectors at edges (simplified)
      
      const limitedX = Math.max(0, Math.min(boardSize.w, c.x + (forces[i].x / Math.abs(forces[i].x || 1)) * Math.min(Math.abs(forces[i].x), temp)));
      const limitedY = Math.max(0, Math.min(boardSize.h, c.y + (forces[i].y / Math.abs(forces[i].y || 1)) * Math.min(Math.abs(forces[i].y), temp)));
      
      return { ...c, x: limitedX, y: limitedY };
    });

    temp *= 0.95;
  }

  return currentPos;
}

/**
 * Scoring Engine
 */
export function calculateDesignScore(components: PCBComponent[], nets: Net[], tracks: Track[]): DesignScore {
  // Simplified scoring logic
  const drc = 100; // Assume clean for prototype
  const signalIntegrity = Math.max(0, 100 - (tracks.length * 0.5));
  const powerIntegrity = 90;
  const emi = 85;
  const manufacturability = 95;

  const total = (drc * 0.3) + (signalIntegrity * 0.25) + (powerIntegrity * 0.2) + (emi * 0.15) + (manufacturability * 0.1);

  return { total, drc, signalIntegrity, powerIntegrity, emi, manufacturability };
}
