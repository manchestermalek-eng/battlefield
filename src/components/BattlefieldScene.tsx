import React, { useRef, useEffect, useImperativeHandle, forwardRef } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { HOTSPOTS, SECTORS_META } from '../data/battlefield';
import { Hotspot } from '../types';

export interface BattlefieldSceneRef {
  resetView: () => void;
}

interface BattlefieldSceneProps {
  onSelect: (hotspot: Hotspot) => void;
  activeId?: string | null;
  isLowGraphics?: boolean;
}

// ---------------- PROCEDURAL TERRAIN & PROPS MATH ----------------
function smoothstep(min: number, max: number, value: number): number {
  const x = Math.min(1, Math.max(0, (value - min) / (max - min)));
  return x * x * (3 - 2 * x);
}

function pseudoRandom(seed: number): number {
  const t = Math.sin(seed * 78.233 + 12.9898) * 43758.5453;
  return t - Math.floor(t);
}

interface TrenchDef {
  key: string;
  ax: number;
  az: number;
  bx: number;
  bz: number;
  half: number;
  depth: number;
  berm: number;
  side: 'british' | 'german';
  seed: number;
}

const TRENCHES: TrenchDef[] = [
  { key: 'british-front', ax: -16, az: -33, bx: -16, bz: 33, half: 2, depth: 1.85, berm: 0.55, side: 'british', seed: 0.4 },
  { key: 'british-support', ax: -25, az: -33, bx: -25, bz: 33, half: 1.75, depth: 1.7, berm: 0.44, side: 'british', seed: 1.9 },
  { key: 'british-comm-a', ax: -25, az: 19, bx: -16, bz: 19, half: 1.35, depth: 1.5, berm: 0.32, side: 'british', seed: 3.1 },
  { key: 'british-comm-b', ax: -25, az: -12, bx: -16, bz: -12, half: 1.35, depth: 1.5, berm: 0.32, side: 'british', seed: 4.7 },
  { key: 'german-front', ax: 16, az: -33, bx: 16, bz: 33, half: 2, depth: 2, berm: 0.6, side: 'german', seed: 5.3 },
  { key: 'german-support', ax: 25, az: -33, bx: 25, bz: 33, half: 1.75, depth: 1.85, berm: 0.46, side: 'german', seed: 6.8 },
  { key: 'german-comm-a', ax: 16, az: -20, bx: 25, bz: -20, half: 1.35, depth: 1.6, berm: 0.34, side: 'german', seed: 8.2 },
  { key: 'german-comm-b', ax: 16, az: 12, bx: 25, bz: 12, half: 1.35, depth: 1.6, berm: 0.34, side: 'german', seed: 9.4 },
];

interface CraterDef {
  x: number;
  z: number;
  r: number;
  depth: number;
}

const CRATERS: CraterDef[] = [
  { x: 0, z: -4, r: 4.5, depth: 1.8 },
  { x: -5, z: 8, r: 3.8, depth: 1.4 },
  { x: 4, z: 14, r: 3.5, depth: 1.3 },
  { x: -2, z: -18, r: 4.2, depth: 1.6 },
  { x: 6, z: -12, r: 3.2, depth: 1.1 },
  { x: -7, z: -25, r: 3.6, depth: 1.2 },
  { x: 3, z: 24, r: 3.9, depth: 1.5 },
  { x: -4, z: 21, r: 2.8, depth: 0.9 },
  { x: 7, z: -27, r: 3.4, depth: 1.2 },
  { x: -9, z: -2, r: 3.1, depth: 1.0 },
  { x: 8, z: 2, r: 3.3, depth: 1.1 },
  { x: 1, z: 31, r: 3.0, depth: 1.0 },
  { x: -1, z: -31, r: 3.2, depth: 1.1 },
];

function getTrenchDir(trench: TrenchDef) {
  const dx = trench.bx - trench.ax;
  const dz = trench.bz - trench.az;
  const len = Math.hypot(dx, dz) || 1;
  const ux = dx / len;
  const uz = dz / len;
  return {
    len,
    ux,
    uz,
    nx: -uz,
    nz: ux,
    ry: Math.atan2(ux, uz),
  };
}

function getTrenchMeander(trench: TrenchDef, t: number): number {
  const amp = 0.3 + 0.26 * Math.min(1, trench.half / 2);
  return (Math.sin(t * 0.23 + trench.seed) * 0.62 + Math.sin(t * 0.085 + trench.seed * 1.7) * 0.38) * amp;
}

function projectOnTrench(trench: TrenchDef, x: number, z: number) {
  const dir = getTrenchDir(trench);
  const dist = (x - trench.ax) * dir.ux + (z - trench.az) * dir.uz;
  const clamped = Math.max(0, Math.min(dir.len, dist));
  const ox = trench.ax + dir.ux * clamped;
  const oz = trench.az + dir.uz * clamped;
  const eff = (x - ox) * dir.nx + (z - oz) * dir.nz - getTrenchMeander(trench, clamped);
  return { d: clamped, eff };
}

function getTerrainHeight(x: number, z: number): number {
  let h =
    0.34 * Math.sin(x * 0.075 + 0.6) * Math.cos(z * 0.062) +
    0.16 * Math.sin(x * 0.21 + z * 0.17) +
    0.08 * Math.sin(x * 0.5 - z * 0.44) +
    0.055 * Math.sin(x * 1.05) * Math.cos(z * 0.92);

  // Craters
  for (let i = 0; i < CRATERS.length; i++) {
    const c = CRATERS[i];
    const dist = Math.hypot(x - c.x, z - c.z);
    if (dist < c.r * 1.8) {
      const craterDepth = -c.depth * Math.max(0, 1 - (dist / (c.r * 1.15)) ** 2) ** 0.8;
      const rim = c.depth * 0.3 * Math.exp(-(((dist - c.r) / (c.r * 0.55)) ** 2));
      h += craterDepth + rim;
    }
  }

  // Trenches
  let maxDug = 0;
  let maxBerm = 0;
  for (let i = 0; i < TRENCHES.length; i++) {
    const tr = TRENCHES[i];
    const proj = projectOnTrench(tr, x, z);
    const effAbs =
      Math.abs(proj.eff) +
      0.13 * Math.sin(proj.d * 1.63 + tr.seed * 2.3) +
      0.1 * Math.sin(proj.d * 0.57 + tr.seed * 4.1);

    if (effAbs > tr.half * 2.2) continue;

    let dug = tr.depth * (1 - smoothstep(tr.half * 0.56, tr.half * 1.14, effAbs));
    if (effAbs < tr.half) {
      dug -= (0.05 * Math.sin(proj.d * 2.7 + tr.seed) + 0.04 * Math.sin(proj.d * 1.15 + x * 0.9)) * (1 - effAbs / tr.half);
    }
    if (dug > maxDug) maxDug = dug;

    const bermDist = Math.abs(effAbs - tr.half * 1.15);
    const berm = tr.berm * Math.exp(-((bermDist / 0.72) ** 2));
    if (berm > maxBerm) maxBerm = berm;
  }

  return h + maxBerm - maxDug;
}

// ---------------- PROCEDURAL ASSET GENERATORS ----------------
function createProceduralTerrain(lowPoly: boolean = false): THREE.Mesh {
  const segments = lowPoly ? 54 : 260;
  const geo = new THREE.PlaneGeometry(92, 92, segments, segments);
  geo.rotateX(-Math.PI / 2);
  const pos = geo.attributes.position;
  const colors = new Float32Array(pos.count * 3);

  const colTrenchFloor = new THREE.Color('#241c14');
  const colMud = new THREE.Color('#54402d');
  const colDirt = new THREE.Color('#7b6447');
  const colChalk = new THREE.Color('#a29880');
  const tempCol = new THREE.Color();

  for (let i = 0; i < pos.count; i++) {
    const px = pos.getX(i);
    const pz = pos.getZ(i);
    const py = getTerrainHeight(px, pz);
    pos.setY(i, py);

    const noise = Math.sin(px * 0.46 + 1.4) * Math.cos(pz * 0.41) * 0.5 + 0.5;
    tempCol.copy(colMud).lerp(colDirt, noise);

    let trenchProximity = 0;
    for (let t = 0; t < TRENCHES.length; t++) {
      const tr = TRENCHES[t];
      const eff = Math.abs(projectOnTrench(tr, px, pz).eff);
      const factor = Math.exp(-(((eff - (tr.half + 0.5)) / 0.85) ** 2));
      if (factor > trenchProximity) trenchProximity = factor;
    }

    if (trenchProximity > 0.02) {
      tempCol.lerp(colChalk, Math.min(0.7, trenchProximity * 0.62));
    }
    if (noise > 0.9) {
      tempCol.lerp(colChalk, 0.18);
    }
    if (py < -0.3) {
      tempCol.lerp(colTrenchFloor, Math.min(1, (-py - 0.2) / 1.55));
    }

    colors[i * 3] = tempCol.r;
    colors[i * 3 + 1] = tempCol.g;
    colors[i * 3 + 2] = tempCol.b;
  }

  geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  geo.computeVertexNormals();

  const mat = new THREE.MeshStandardMaterial({
    vertexColors: true,
    roughness: lowPoly ? 0.92 : 0.98,
    metalness: 0.01,
    flatShading: true,
  });

  const terrain = new THREE.Mesh(geo, mat);
  terrain.receiveShadow = !lowPoly;
  terrain.castShadow = !lowPoly;
  return terrain;
}

// Subterranean Plinth & Foundation underneath the landscape
function createTerrainFoundation(lowPoly: boolean = false): THREE.Group {
  const g = new THREE.Group();
  const half = 46;
  const bottomY = -7.5;
  const segs = lowPoly ? 18 : 46;

  const skirtPositions: number[] = [];
  const skirtColors: number[] = [];

  const colTop = new THREE.Color('#54402d');
  const colChalk = new THREE.Color('#988f7c');
  const colDeep = new THREE.Color('#1d1712');

  const addQuad = (x1: number, z1: number, y1: number, x2: number, z2: number, y2: number) => {
    skirtPositions.push(
      x1, y1, z1,
      x1, bottomY, z1,
      x2, y2, z2,
      x2, y2, z2,
      x1, bottomY, z1,
      x2, bottomY, z2
    );
    for (let k = 0; k < 6; k++) {
      const isBottom = k === 1 || k === 4 || k === 5;
      const c = isBottom ? colDeep : (Math.random() > 0.4 ? colChalk : colTop);
      skirtColors.push(c.r, c.g, c.b);
    }
  };

  // 4 perimeter walls
  for (let i = 0; i < segs; i++) {
    const t1 = i / segs;
    const t2 = (i + 1) / segs;
    const p1 = -half + t1 * (half * 2);
    const p2 = -half + t2 * (half * 2);
    // Edge 1: Z = -half
    addQuad(p1, -half, getTerrainHeight(p1, -half), p2, -half, getTerrainHeight(p2, -half));
    // Edge 2: X = +half
    addQuad(half, p1, getTerrainHeight(half, p1), half, p2, getTerrainHeight(half, p2));
    // Edge 3: Z = +half
    addQuad(-p1, half, getTerrainHeight(-p1, half), -p2, half, getTerrainHeight(-p2, half));
    // Edge 4: X = -half
    addQuad(-half, -p1, getTerrainHeight(-half, -p1), -half, -p2, getTerrainHeight(-half, -p2));
  }

  const skirtGeo = new THREE.BufferGeometry();
  skirtGeo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(skirtPositions), 3));
  skirtGeo.setAttribute('color', new THREE.BufferAttribute(new Float32Array(skirtColors), 3));
  skirtGeo.computeVertexNormals();

  const skirtMat = new THREE.MeshStandardMaterial({
    vertexColors: true,
    roughness: 0.98,
    metalness: 0.02,
    flatShading: true,
  });

  const skirtMesh = new THREE.Mesh(skirtGeo, skirtMat);
  skirtMesh.receiveShadow = !lowPoly;
  g.add(skirtMesh);

  // Bottom Base Slab at y = -7.5
  const baseGeo = new THREE.PlaneGeometry(92, 92, 4, 4);
  baseGeo.rotateX(Math.PI / 2);
  const baseMat = new THREE.MeshStandardMaterial({
    color: '#1a140f',
    roughness: 0.98,
    metalness: 0.01,
  });
  const baseMesh = new THREE.Mesh(baseGeo, baseMat);
  baseMesh.position.y = bottomY;
  g.add(baseMesh);

  // Extended wide ambient earth floor underneath the diorama (size 280x280 at y = -7.55)
  const ambientGeo = new THREE.PlaneGeometry(280, 280, 8, 8);
  ambientGeo.rotateX(-Math.PI / 2);
  const ambientMat = new THREE.MeshStandardMaterial({
    color: '#140f0c',
    roughness: 1.0,
    metalness: 0.0,
  });
  const ambientFloor = new THREE.Mesh(ambientGeo, ambientMat);
  ambientFloor.position.y = bottomY - 0.05;
  g.add(ambientFloor);

  return g;
}

// Radiant Atmospheric Sun
function createSun(): THREE.Group {
  const g = new THREE.Group();
  const sunPos = new THREE.Vector3(105, 76, 52);

  // 1. Core Sun Sphere
  const sunGeo = new THREE.SphereGeometry(4.2, 16, 16);
  const sunMat = new THREE.MeshBasicMaterial({
    color: 0xfffaea,
    fog: false,
  });
  const sunMesh = new THREE.Mesh(sunGeo, sunMat);
  sunMesh.position.copy(sunPos);
  g.add(sunMesh);

  // 2. Sun Corona Sprite with warm golden gradient
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = 256;
  const ctx = canvas.getContext('2d')!;
  const grad = ctx.createRadialGradient(128, 128, 0, 128, 128, 128);
  grad.addColorStop(0, 'rgba(255, 255, 230, 1)');
  grad.addColorStop(0.2, 'rgba(255, 215, 125, 0.88)');
  grad.addColorStop(0.5, 'rgba(255, 170, 70, 0.42)');
  grad.addColorStop(0.8, 'rgba(230, 135, 45, 0.12)');
  grad.addColorStop(1, 'rgba(190, 95, 25, 0)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 256, 256);

  const glowTex = new THREE.CanvasTexture(canvas);
  glowTex.colorSpace = THREE.SRGBColorSpace;

  const corona = new THREE.Sprite(
    new THREE.SpriteMaterial({
      map: glowTex,
      color: 0xffd28e,
      transparent: true,
      opacity: 0.95,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      fog: false,
    })
  );
  corona.position.copy(sunPos);
  corona.scale.set(48, 48, 1);
  g.add(corona);

  // 3. Ambient Atmospheric Solar Flare Halo
  const outerFlare = new THREE.Sprite(
    new THREE.SpriteMaterial({
      map: glowTex,
      color: 0xffa438,
      transparent: true,
      opacity: 0.45,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      fog: false,
    })
  );
  outerFlare.position.copy(sunPos);
  outerFlare.scale.set(96, 96, 1);
  g.add(outerFlare);

  return g;
}

function createCraterWater(): THREE.Group {
  const g = new THREE.Group();
  const mat = new THREE.MeshStandardMaterial({
    color: '#46534b',
    roughness: 0.1,
    metalness: 0.6,
    transparent: true,
    opacity: 0.85,
  });

  CRATERS.forEach((c) => {
    if (c.depth < 0.7 || c.r < 1.7) return;
    const plane = new THREE.CircleGeometry(c.r * 0.5, 16);
    plane.rotateX(-Math.PI / 2);
    const m = new THREE.Mesh(plane, mat);
    m.position.set(c.x, getTerrainHeight(c.x, c.z) + 0.16, c.z);
    g.add(m);
  });

  return g;
}

// Crunched, Tangled Barbed Wire Entanglements
function createBarbedWire(lowPoly: boolean = false): THREE.Group {
  const g = new THREE.Group();
  const rows = [
    { x: -13.6, step: 2.8 },
    { x: -11.1, step: 2.4 },
    { x: -8.7, step: 2.6 },
    { x: 8.7, step: 2.6 },
    { x: 11.1, step: 2.4 },
    { x: 13.6, step: 2.8 },
  ];

  const picketTransforms: THREE.Matrix4[] = [];
  const linePoints: number[] = [];

  const m4 = new THREE.Matrix4();
  const quat = new THREE.Quaternion();
  const euler = new THREE.Euler();
  const pos = new THREE.Vector3();
  const scale = new THREE.Vector3(1, 1, 1);

  const p1 = new THREE.Vector3();
  const p2 = new THREE.Vector3();
  const mid = new THREE.Vector3();

  rows.forEach((row, rowIdx) => {
    const pickets: THREE.Vector3[] = [];
    let pIdx = 0;
    for (let z = -33; z <= 33; z += row.step) {
      pIdx++;
      // Uneven blasted offsets and steep tilts for crunched battlefield realism
      const xJitter = (pseudoRandom(pIdx * 3 + rowIdx * 11) - 0.5) * 0.75;
      const x = row.x + xJitter;
      const y = getTerrainHeight(x, z);
      // Pickets bent and knocked sideways by artillery blasts
      const tiltX = (pseudoRandom(pIdx * 7 + rowIdx) - 0.5) * 0.48;
      const tiltZ = (pseudoRandom(pIdx * 9 + rowIdx) - 0.5) * 0.44;
      euler.set(tiltX, 0, tiltZ);
      quat.setFromEuler(euler);
      // Some pickets splintered shorter
      const isShort = pseudoRandom(pIdx + 17) > 0.75;
      const hScale = isShort ? 0.65 : 1.0;
      scale.set(1, hScale, 1);
      pos.set(x, y + 0.65 * hScale, z);
      m4.compose(pos, quat, scale);
      picketTransforms.push(m4.clone());
      pickets.push(new THREE.Vector3(x, y, z));
    }

    // Tangled Crunched Strands & Helical Corkscrews between pickets
    for (let i = 0; i < pickets.length - 1; i++) {
      p1.copy(pickets[i]);
      p2.copy(pickets[i + 1]);

      // 1. Crunched sagging longitudinal strands with jagged kinks
      [0.28, 0.62, 0.95].forEach((heightOff) => {
        const segCount = lowPoly ? 3 : 5;
        let prevX = p1.x;
        let prevY = p1.y + heightOff;
        let prevZ = p1.z;

        for (let seg = 1; seg <= segCount; seg++) {
          const t = seg / segCount;
          mid.lerpVectors(p1, p2, t);
          // Crunched jagged kink offset
          const kink = (pseudoRandom(i * 13 + seg + rowIdx) - 0.5) * 0.35;
          const sag = Math.sin(t * Math.PI) * 0.22;
          const currX = mid.x + kink;
          const currY = mid.y + heightOff - sag + (pseudoRandom(i * 7 + seg) - 0.5) * 0.18;
          const currZ = mid.z;
          linePoints.push(prevX, prevY, prevZ, currX, currY, currZ);
          prevX = currX;
          prevY = currY;
          prevZ = currZ;
        }
      });

      // 2. Crunched concertina spiral coils (mangled coiled wire)
      const coilSteps = lowPoly ? 6 : 12;
      let prevCoilX = p1.x;
      let prevCoilY = p1.y + 0.5;
      let prevCoilZ = p1.z;

      for (let s = 1; s <= coilSteps; s++) {
        const t = s / coilSteps;
        mid.lerpVectors(p1, p2, t);
        const angle = t * Math.PI * 6 + pseudoRandom(i + s) * 1.5;
        const radius = 0.32 + (pseudoRandom(i * 9 + s) - 0.5) * 0.22;
        const cX = mid.x + Math.cos(angle) * radius;
        const cY = mid.y + 0.52 + Math.sin(angle) * radius - Math.sin(t * Math.PI) * 0.16;
        const cZ = mid.z + (pseudoRandom(s + 5) - 0.5) * 0.12;

        linePoints.push(prevCoilX, prevCoilY, prevCoilZ, cX, cY, cZ);
        prevCoilX = cX;
        prevCoilY = cY;
        prevCoilZ = cZ;
      }
    }
  });

  // Pickets instanced
  const picketGeo = new THREE.CylinderGeometry(0.045, 0.062, 1.45, lowPoly ? 3 : 5);
  const picketMat = new THREE.MeshStandardMaterial({
    color: '#4a3d2e',
    roughness: 0.98,
    flatShading: true,
  });
  const instPickets = new THREE.InstancedMesh(picketGeo, picketMat, picketTransforms.length);
  picketTransforms.forEach((m, idx) => instPickets.setMatrixAt(idx, m));
  instPickets.instanceMatrix.needsUpdate = true;
  instPickets.castShadow = !lowPoly;
  instPickets.receiveShadow = !lowPoly;
  g.add(instPickets);

  // Wire lines
  const lineGeo = new THREE.BufferGeometry();
  lineGeo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(linePoints), 3));
  const lineMat = new THREE.LineBasicMaterial({
    color: 0x7a6e5b,
    transparent: true,
    opacity: 0.92,
  });
  g.add(new THREE.LineSegments(lineGeo, lineMat));

  return g;
}

function createDeadTrees(lowPoly: boolean = false): THREE.Group {
  const g = new THREE.Group();
  const treeMat = new THREE.MeshStandardMaterial({ color: '#3b2a1d', roughness: 1, flatShading: true });

  const treeCoords: [number, number][] = [
    [-20.5, -27], [-28, 10], [-19.5, -2], [-31, -21], [-22, 25], [-13.5, -30.5],
    [-27, -8], [-35, 2], [20.5, -27], [28.5, 9], [19.5, -3], [31, 21],
    [22.5, -30], [27, 26], [13.8, 31], [-14, 31],
  ];

  treeCoords.forEach(([tx, tz], i) => {
    const ty = getTerrainHeight(tx, tz);
    const height = 1.1 + pseudoRandom(i) * 2.6;
    const radius = 0.11 + pseudoRandom(i + 3) * 0.13;
    const trunk = new THREE.Mesh(new THREE.CylinderGeometry(radius, radius + 0.13, height, lowPoly ? 4 : 6), treeMat);
    trunk.position.set(tx, ty + height / 2, tz);
    trunk.rotation.z = (pseudoRandom(i + 9) - 0.5) * 0.22;
    trunk.rotation.x = (pseudoRandom(i + 11) - 0.5) * 0.18;
    trunk.castShadow = !lowPoly;
    trunk.receiveShadow = !lowPoly;
    g.add(trunk);

    // Broken limbs
    for (let b = 0; b < (lowPoly ? 2 : 3); b++) {
      const limb = new THREE.Mesh(new THREE.ConeGeometry(0.06, 0.6, lowPoly ? 3 : 4), treeMat);
      limb.position.set(
        tx + (pseudoRandom(b + i) - 0.5) * 0.3,
        ty + height - 0.1 + pseudoRandom(b + 2) * 0.3,
        tz + (pseudoRandom(b + 5 + i) - 0.5) * 0.3
      );
      limb.rotation.set((pseudoRandom(b + 7) - 0.5) * 1.2, 0, (pseudoRandom(b + 9) - 0.5) * 1.2);
      limb.castShadow = !lowPoly;
      limb.receiveShadow = !lowPoly;
      g.add(limb);
    }
  });

  return g;
}

function createBattlefieldProps(lowPoly: boolean = false): THREE.Group {
  const g = new THREE.Group();
  const woodMat = new THREE.MeshStandardMaterial({ color: '#4a3625', roughness: 0.95, flatShading: true });
  const darkMetal = new THREE.MeshStandardMaterial({ color: '#3a3d40', roughness: 0.55, metalness: 0.72, flatShading: true });
  const oliveMat = new THREE.MeshStandardMaterial({ color: '#4b4a35', roughness: 0.85, flatShading: true });
  const sandbagMat = new THREE.MeshStandardMaterial({ color: '#8a7c5b', roughness: 0.95, flatShading: true });
  const chalkMat = new THREE.MeshBasicMaterial({ color: '#0b0907' });

  // 1. Dugout Entrances
  const addDugout = (x: number, z: number, rotY: number, deep = false) => {
    const dugout = new THREE.Group();
    const w = deep ? 1.9 : 1.45;
    const h = deep ? 1.4 : 1.05;

    const opening = new THREE.Mesh(new THREE.PlaneGeometry(w, h), chalkMat);
    opening.position.set(0, h / 2, 0.02);
    dugout.add(opening);

    const postGeo = new THREE.BoxGeometry(0.1, h + 0.2, 0.12);
    const postL = new THREE.Mesh(postGeo, woodMat);
    postL.position.set(-w / 2 - 0.06, h / 2, 0.08);
    postL.castShadow = !lowPoly;
    postL.receiveShadow = !lowPoly;

    const postR = new THREE.Mesh(postGeo, woodMat);
    postR.position.set(w / 2 + 0.06, h / 2, 0.08);
    postR.castShadow = !lowPoly;
    postR.receiveShadow = !lowPoly;

    const lintel = new THREE.Mesh(new THREE.BoxGeometry(w + 0.4, 0.14, 0.18), woodMat);
    lintel.position.set(0, h + 0.1, 0.08);
    lintel.castShadow = !lowPoly;
    lintel.receiveShadow = !lowPoly;

    dugout.add(postL, postR, lintel);
    dugout.position.set(x, getTerrainHeight(x, z), z);
    dugout.rotation.y = rotY;
    g.add(dugout);
  };

  addDugout(-17.5, -16, Math.PI / 2, false);
  addDugout(-17.45, 3, Math.PI / 2, false);
  addDugout(-23.5, -4, Math.PI / 2, false);
  addDugout(17.5, -13, -Math.PI / 2, true);
  addDugout(17.5, 6, -Math.PI / 2, true);

  // 2. German MG 08 Bunker / Nest
  const mgNest = new THREE.Group();
  const mgSled = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.2, 0.6), woodMat);
  mgSled.position.set(0, 0.1, 0);
  mgSled.castShadow = !lowPoly;
  mgSled.receiveShadow = !lowPoly;

  const mgGun = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 1.2, lowPoly ? 5 : 8), darkMetal);
  mgGun.rotation.z = Math.PI / 2;
  mgGun.position.set(0.3, 0.45, 0);
  mgGun.castShadow = !lowPoly;
  mgGun.receiveShadow = !lowPoly;

  mgNest.add(mgSled, mgGun);
  mgNest.position.set(12.6, getTerrainHeight(12.6, 4), 4);
  mgNest.rotation.y = Math.PI * 0.08;
  g.add(mgNest);

  // Sandbags around MG nest
  const sbCount = lowPoly ? 8 : 12;
  for (let i = 0; i < sbCount; i++) {
    const angle = (i / sbCount) * Math.PI * 2;
    const sb = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.3, 0.46), sandbagMat);
    sb.position.set(12.6 + Math.cos(angle) * 1.5, getTerrainHeight(12.6, 4) + 0.17, 4 + Math.sin(angle) * 1.5);
    sb.rotation.y = angle;
    sb.castShadow = !lowPoly;
    sb.receiveShadow = !lowPoly;
    g.add(sb);
  }

  // 3. British 18-Pounder Artillery Guns
  const addArtillery = (x: number, z: number, rotY: number) => {
    const gun = new THREE.Group();
    const barrel = new THREE.Mesh(new THREE.CylinderGeometry(0.075, 0.095, 2.4, lowPoly ? 6 : 12), darkMetal);
    barrel.rotation.z = Math.PI / 2 - 0.22;
    barrel.position.set(0.55, 0.95, 0);
    barrel.castShadow = !lowPoly;
    barrel.receiveShadow = !lowPoly;

    const shield = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.95, 1.3), oliveMat);
    shield.position.set(0.28, 0.7, 0);
    shield.castShadow = !lowPoly;
    shield.receiveShadow = !lowPoly;

    const carriage = new THREE.Mesh(new THREE.BoxGeometry(1.9, 0.14, 0.16), oliveMat);
    carriage.position.set(-1, 0.5, 0);
    carriage.castShadow = !lowPoly;
    carriage.receiveShadow = !lowPoly;

    const wheelGeo = new THREE.TorusGeometry(0.52, 0.075, lowPoly ? 4 : 8, lowPoly ? 10 : 22);
    const wheelL = new THREE.Mesh(wheelGeo, woodMat);
    wheelL.position.set(-0.1, 0.55, 0.66);
    wheelL.castShadow = !lowPoly;
    wheelL.receiveShadow = !lowPoly;

    const wheelR = new THREE.Mesh(wheelGeo, woodMat);
    wheelR.position.set(-0.1, 0.55, -0.66);
    wheelR.castShadow = !lowPoly;
    wheelR.receiveShadow = !lowPoly;

    gun.add(barrel, shield, carriage, wheelL, wheelR);
    gun.position.set(x, getTerrainHeight(x, z), z);
    gun.rotation.y = rotY;
    g.add(gun);
  };

  addArtillery(-33, 16, Math.PI * 0.16);
  addArtillery(-34.5, 20, Math.PI * 0.1);

  // 4. Mark I Tank on No Man's Land
  const tank = new THREE.Group();
  const shape = new THREE.Shape();
  shape.moveTo(-1.7, -0.3);
  shape.lineTo(-1.56, 0.36);
  shape.lineTo(-0.6, 0.8);
  shape.lineTo(0.9, 0.9);
  shape.lineTo(1.68, 0.34);
  shape.lineTo(1.56, -0.2);
  shape.lineTo(0.9, -0.34);
  shape.lineTo(-1.2, -0.34);
  shape.lineTo(-1.7, -0.3);

  const extrude = new THREE.ExtrudeGeometry(shape, { depth: 0.36, bevelEnabled: false });
  extrude.translate(0, 0, -0.18);

  const trackL = new THREE.Mesh(extrude, darkMetal);
  trackL.position.z = 0.62;
  trackL.castShadow = !lowPoly;
  trackL.receiveShadow = !lowPoly;

  const trackR = new THREE.Mesh(extrude, darkMetal);
  trackR.position.z = -0.62;
  trackR.castShadow = !lowPoly;
  trackR.receiveShadow = !lowPoly;

  const hull = new THREE.Mesh(new THREE.BoxGeometry(2.5, 0.62, 1.2), oliveMat);
  hull.position.set(-0.1, 0.16, 0);
  hull.castShadow = !lowPoly;
  hull.receiveShadow = !lowPoly;

  const sponsonL = new THREE.Mesh(new THREE.BoxGeometry(0.62, 0.44, 0.34), oliveMat);
  sponsonL.position.set(0.1, 0.22, 0.92);
  sponsonL.castShadow = !lowPoly;
  sponsonL.receiveShadow = !lowPoly;

  const sponsonR = new THREE.Mesh(new THREE.BoxGeometry(0.62, 0.44, 0.34), oliveMat);
  sponsonR.position.set(0.1, 0.22, -0.92);
  sponsonR.castShadow = !lowPoly;
  sponsonR.receiveShadow = !lowPoly;

  tank.name = 'mark1-tank';
  tank.add(trackL, trackR, hull, sponsonL, sponsonR);
  tank.scale.setScalar(1.25);
  tank.position.set(3, getTerrainHeight(3, -8), -8);
  tank.rotation.y = -0.35;
  g.add(tank);

  return g;
}

// Atmosphere haze sprite
function createSmokeHaze(lowPoly: boolean = false): THREE.Sprite[] {
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = 128;
  const ctx = canvas.getContext('2d')!;
  const grad = ctx.createRadialGradient(64, 64, 0, 64, 64, 64);
  grad.addColorStop(0, 'rgba(214, 204, 188, 0.55)');
  grad.addColorStop(0.45, 'rgba(160, 150, 134, 0.24)');
  grad.addColorStop(1, 'rgba(120, 112, 98, 0)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 128, 128);

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;

  const sprites: THREE.Sprite[] = [];
  const count = lowPoly ? 5 : 16;
  for (let i = 0; i < count; i++) {
    const sprite = new THREE.Sprite(
      new THREE.SpriteMaterial({
        map: tex,
        color: 0xd9cbbd,
        transparent: true,
        opacity: 0.14 + pseudoRandom(i) * 0.16,
        depthWrite: false,
      })
    );
    const px = -34 + pseudoRandom(i + 1) * 68;
    const pz = -34 + pseudoRandom(i + 21) * 68;
    const py = 1.5 + pseudoRandom(i + 33) * 13;
    sprite.position.set(px, py, pz);
    const s = 7 + pseudoRandom(i + 44) * 13;
    sprite.scale.set(s, s * 0.72, 1);
    sprite.userData = { speed: 0.12 + pseudoRandom(i + 55) * 0.22, top: 24 };
    sprites.push(sprite);
  }
  return sprites;
}

// Glowing Halo Texture Generator
function createMarkerGlowTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = 128;
  const ctx = canvas.getContext('2d')!;

  // Outer ring
  const gradOuter = ctx.createRadialGradient(64, 64, 33, 64, 64, 64);
  gradOuter.addColorStop(0, 'rgba(255, 255, 255, 0)');
  gradOuter.addColorStop(0.62, 'rgba(255, 255, 255, 0.95)');
  gradOuter.addColorStop(1, 'rgba(255, 255, 255, 0)');
  ctx.fillStyle = gradOuter;
  ctx.beginPath();
  ctx.arc(64, 64, 64, 0, Math.PI * 2);
  ctx.fill();

  // Core glow
  const gradInner = ctx.createRadialGradient(64, 64, 0, 64, 64, 25.6);
  gradInner.addColorStop(0, 'rgba(255, 255, 255, 1)');
  gradInner.addColorStop(1, 'rgba(255, 255, 255, 0)');
  ctx.fillStyle = gradInner;
  ctx.beginPath();
  ctx.arc(64, 64, 25.6, 0, Math.PI * 2);
  ctx.fill();

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

// Horizon Cylinder
function createHorizon(): THREE.Mesh {
  const canvas = document.createElement('canvas');
  canvas.width = 8;
  canvas.height = 256;
  const ctx = canvas.getContext('2d')!;
  const grad = ctx.createLinearGradient(0, 0, 0, 256);
  grad.addColorStop(0, '#6e7078');
  grad.addColorStop(0.4, '#96938c');
  grad.addColorStop(0.62, '#bdb19b');
  grad.addColorStop(1, '#a2977f');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 8, 256);

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  const mesh = new THREE.Mesh(
    new THREE.CylinderGeometry(330, 330, 32, 24),
    new THREE.MeshBasicMaterial({ map: tex, side: THREE.BackSide, fog: false, depthWrite: false })
  );
  mesh.position.y = 30;
  return mesh;
}

// ---------------- COMPONENT EXPORT ----------------
export const BattlefieldScene = forwardRef<BattlefieldSceneRef, BattlefieldSceneProps>(function BattlefieldScene(
  { onSelect, activeId, isLowGraphics = false },
  ref
) {
  const mountRef = useRef<HTMLDivElement>(null);
  const labelsContainerRef = useRef<HTMLDivElement>(null);

  const resetViewFnRef = useRef<() => void>(() => {});
  const flyToFnRef = useRef<(camPos: [number, number, number], targetPos: [number, number], duration?: number) => void>(() => {});
  const applyGraphicsModeFnRef = useRef<(lowPoly: boolean) => void>(() => {});
  const selectCallbackRef = useRef(onSelect);
  selectCallbackRef.current = onSelect;

  useImperativeHandle(ref, () => ({
    resetView: () => resetViewFnRef.current(),
  }));

  useEffect(() => {
    const container = mountRef.current;
    const labelsContainer = labelsContainerRef.current;
    if (!container || !labelsContainer) return;

    // 1. Scene & Camera Setup
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xb3a894);
    scene.fog = new THREE.FogExp2(0xb3a894, 0.0091);

    const initialPos = [0, 33, 46];
    const camera = new THREE.PerspectiveCamera(45, (container.clientWidth || 1) / (container.clientHeight || 1), 0.1, 900);
    camera.position.set(initialPos[0], initialPos[1], initialPos[2]);

    // 2. Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
    renderer.setPixelRatio(isLowGraphics ? 1 : Math.min(window.devicePixelRatio, 2));
    renderer.setSize(container.clientWidth || 1, container.clientHeight || 1);
    renderer.shadowMap.enabled = !isLowGraphics;
    renderer.shadowMap.autoUpdate = !isLowGraphics;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 0.99;
    renderer.domElement.style.cssText = 'position:absolute;inset:0;display:block;touch-action:none;';
    container.innerHTML = '';
    container.appendChild(renderer.domElement);

    // 3. Lighting
    const hemiLight = new THREE.HemisphereLight(0xd8d0bd, 0x2f2518, 0.7);
    scene.add(hemiLight);

    const dirLight = new THREE.DirectionalLight(0xffe1b2, 2.15);
    dirLight.position.set(38, 29, 20);
    dirLight.castShadow = !isLowGraphics;
    dirLight.shadow.mapSize.set(2048, 2048);
    dirLight.shadow.camera.left = -52;
    dirLight.shadow.camera.right = 52;
    dirLight.shadow.camera.top = 52;
    dirLight.shadow.camera.bottom = -52;
    dirLight.shadow.camera.near = 1;
    dirLight.shadow.camera.far = 200;
    dirLight.shadow.bias = -0.0009;
    scene.add(dirLight);

    const fillLight = new THREE.DirectionalLight(0xbca884, 0.5);
    fillLight.position.set(-30, 22, -36);
    scene.add(fillLight);

    // Radiant Sun & Horizon Sky
    scene.add(createSun());
    scene.add(createHorizon());

    // Terrain & Assets Group
    const terrainGroup = new THREE.Group();
    scene.add(terrainGroup);

    let activeSmoke: THREE.Sprite[] = [];

    const applyGraphics = (lowPoly: boolean) => {
      while (terrainGroup.children.length > 0) {
        const child = terrainGroup.children[0];
        terrainGroup.remove(child);
        if ('geometry' in child && (child as THREE.Mesh).geometry) {
          (child as THREE.Mesh).geometry.dispose();
        }
        if ('material' in child && (child as THREE.Mesh).material) {
          const mat = (child as THREE.Mesh).material;
          if (Array.isArray(mat)) mat.forEach((m) => m.dispose());
          else mat.dispose();
        }
      }

      // 1. Terrain & Subterranean Foundation Base underneath the landscape
      terrainGroup.add(createProceduralTerrain(lowPoly));
      terrainGroup.add(createTerrainFoundation(lowPoly));
      terrainGroup.add(createCraterWater());
      terrainGroup.add(createBarbedWire(lowPoly));
      terrainGroup.add(createDeadTrees(lowPoly));
      terrainGroup.add(createBattlefieldProps(lowPoly));

      activeSmoke = createSmokeHaze(lowPoly);
      activeSmoke.forEach((s) => terrainGroup.add(s));

      // Optimized shadow configuration for LOW-POLY mode
      renderer.shadowMap.enabled = !lowPoly;
      renderer.shadowMap.autoUpdate = !lowPoly;
      renderer.setPixelRatio(lowPoly ? 1 : Math.min(window.devicePixelRatio, 2));
      dirLight.castShadow = !lowPoly;
    };

    applyGraphicsModeFnRef.current = applyGraphics;
    applyGraphics(isLowGraphics);

    // 4. Hotspots (Markers with user requested sector colors)
    const markerTex = createMarkerGlowTexture();
    const hotspotMarkers: {
      hs: Hotspot;
      group: THREE.Group;
      core: THREE.Mesh;
      halo: THREE.Sprite;
      beam: THREE.Mesh;
      phase: number;
      active: boolean;
      el?: HTMLButtonElement;
      hitTarget: THREE.Mesh;
    }[] = [];

    const hitTargets: THREE.Mesh[] = [];

    labelsContainer.innerHTML = '';

    HOTSPOTS.forEach((hs, idx) => {
      const sectorMeta = SECTORS_META[hs.side];
      const sectorHex = sectorMeta.hexNumber;

      const group = new THREE.Group();
      const hsY = Math.max(getTerrainHeight(hs.pos[0], hs.pos[1]) + 1.3, 0.9);
      group.position.set(hs.pos[0], hsY, hs.pos[1]);

      // Core sphere
      const core = new THREE.Mesh(
        new THREE.SphereGeometry(0.16, 14, 14),
        new THREE.MeshBasicMaterial({ color: sectorHex })
      );
      core.userData = { hotspotId: hs.id };

      // Halo Sprite
      const halo = new THREE.Sprite(
        new THREE.SpriteMaterial({
          map: markerTex,
          color: sectorHex,
          transparent: true,
          opacity: 0.85,
          depthWrite: false,
          blending: THREE.AdditiveBlending,
        })
      );
      halo.scale.set(1.9, 1.9, 1);

      // Light beam
      const beam = new THREE.Mesh(
        new THREE.CylinderGeometry(0.028, 0.028, 1.05, 6),
        new THREE.MeshBasicMaterial({ color: sectorHex, transparent: true, opacity: 0.35 })
      );
      beam.position.y = -0.55;

      // Clickable proxy sphere
      const hitTarget = new THREE.Mesh(
        new THREE.SphereGeometry(0.85, 8, 8),
        new THREE.MeshBasicMaterial({ transparent: true, opacity: 0, depthWrite: false })
      );
      hitTarget.userData = { hotspotId: hs.id };

      group.add(core, halo, beam, hitTarget);
      scene.add(group);

      hitTargets.push(hitTarget);

      // HTML label tag with sector specific color styling
      const labelBtn = document.createElement('button');
      labelBtn.type = 'button';
      labelBtn.className = `hs-label ${sectorMeta.badgeClass}`;

      // Colored indicator dot
      const dot = document.createElement('span');
      dot.className = 'w-1.5 h-1.5 rounded-full inline-block shrink-0';
      dot.style.backgroundColor = sectorMeta.color;
      labelBtn.appendChild(dot);

      const titleSpan = document.createElement('span');
      titleSpan.textContent = hs.title;
      labelBtn.appendChild(titleSpan);

      labelBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        flyTo(hs.cam, hs.pos, 1.25);
        selectCallbackRef.current(hs);
      });
      labelsContainer.appendChild(labelBtn);

      hotspotMarkers.push({
        hs,
        group,
        core,
        halo,
        beam,
        phase: idx * 1.9,
        active: false,
        el: labelBtn,
        hitTarget,
      });
    });

    // 5. Controls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.06;
    controls.rotateSpeed = 0.6;
    controls.zoomSpeed = 0.8;
    controls.panSpeed = 0.6;
    controls.minDistance = 7;
    controls.maxDistance = 96;
    controls.maxPolarAngle = Math.PI * 0.47;
    controls.target.set(0, 0.4, 0);
    controls.update();

    // 6. Camera Transition State
    interface TransitionState {
      t: number;
      duration: number;
      fromP: THREE.Vector3;
      toP: THREE.Vector3;
      fromT: THREE.Vector3;
      toT: THREE.Vector3;
    }
    let camTransition: TransitionState | null = null;

    const flyTo = (camPos: [number, number, number], targetPos: [number, number], duration = 1.25) => {
      camTransition = {
        t: 0,
        duration,
        fromP: camera.position.clone(),
        toP: new THREE.Vector3(camPos[0], camPos[1], camPos[2]),
        fromT: controls.target.clone(),
        toT: new THREE.Vector3(targetPos[0], getTerrainHeight(targetPos[0], targetPos[1]) + 0.5, targetPos[1]),
      };
      controls.enabled = false;
    };
    flyToFnRef.current = flyTo;

    const resetView = () => {
      flyTo([0, 33, 46], [0, 0], 1.25);
    };
    resetViewFnRef.current = resetView;

    // 7. Raycasting for Clicking 3D Marker Hit Targets
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();

    const onPointerClick = (event: MouseEvent) => {
      const rect = renderer.domElement.getBoundingClientRect();
      mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

      raycaster.setFromCamera(mouse, camera);
      const intersects = raycaster.intersectObjects(hitTargets, false);

      if (intersects.length > 0) {
        const hit = intersects[0].object;
        const hsId = hit.userData?.hotspotId;
        const found = HOTSPOTS.find((h) => h.id === hsId);
        if (found) {
          flyTo(found.cam, found.pos, 1.25);
          selectCallbackRef.current(found);
        }
      }
    };
    renderer.domElement.addEventListener('click', onPointerClick);

    // 8. Main Render Loop
    const clock = new THREE.Clock();
    let animId: number;
    const tempVec = new THREE.Vector3();

    const renderLoop = () => {
      const delta = clock.getDelta();
      const elapsed = clock.getElapsedTime();

      // Camera Fly-To Animation
      if (camTransition) {
        camTransition.t += delta / camTransition.duration;
        const rawT = Math.min(1, camTransition.t);
        const t = smoothstep(0, 1, rawT);

        camera.position.lerpVectors(camTransition.fromP, camTransition.toP, t);
        controls.target.lerpVectors(camTransition.fromT, camTransition.toT, t);

        if (rawT >= 1) {
          camTransition = null;
          controls.enabled = true;
        }
      }

      controls.update();

      // Atmospheric smoke drifting
      activeSmoke.forEach((s) => {
        s.position.x += s.userData.speed * delta * 1.5;
        if (s.position.x > 34) {
          s.position.x = -34;
        }
      });

      // Marker Pulsing & Label Coordinate Projection
      const width = container.clientWidth || 1;
      const height = container.clientHeight || 1;

      hotspotMarkers.forEach((item) => {
        const isActive = item.hs.id === activeId;
        const pulse = Math.sin(elapsed * 3 + item.phase) * 0.18 + 0.82;

        // Camera distance to marker for responsive scaling
        const camDist = camera.position.distanceTo(item.group.position);

        if (isLowGraphics) {
          // Low-poly mode: make it smaller and simpler when zooming in close
          const zoomScale = Math.min(1.0, Math.max(0.32, camDist / 35));
          const lowPolyScale = (isActive ? 1.0 : 0.62) * pulse * zoomScale;
          item.halo.scale.set(lowPolyScale, lowPolyScale, 1);
          item.core.scale.set(0.52 * zoomScale, 0.52 * zoomScale, 0.52 * zoomScale);
          (item.beam.material as THREE.MeshBasicMaterial).opacity = isActive ? 0.3 : 0.08;
        } else {
          // HD mode
          const scaleVal = isActive ? 2.5 * pulse : 1.7 * pulse;
          item.halo.scale.set(scaleVal, scaleVal, 1);
          item.core.scale.set(1, 1, 1);
          (item.beam.material as THREE.MeshBasicMaterial).opacity = isActive ? 0.65 : 0.35;
        }

        if (item.el) {
          tempVec.setFromMatrixPosition(item.group.matrixWorld);
          tempVec.y += 0.45;
          tempVec.project(camera);

          // Visible check: in front of camera
          const isFront = tempVec.z < 1;
          const x = (tempVec.x * 0.5 + 0.5) * width;
          const y = (-(tempVec.y * 0.5) + 0.5) * height;

          if (isFront && x >= -50 && x <= width + 50 && y >= -50 && y <= height + 50) {
            item.el.style.transform = `translate3d(${x}px, ${y}px, 0px) translate(-50%, -50%)`;
            item.el.style.opacity = '1';
            item.el.style.pointerEvents = 'auto';
            if (isActive) {
              item.el.classList.add('is-active');
            } else {
              item.el.classList.remove('is-active');
            }
          } else {
            item.el.style.opacity = '0';
            item.el.style.pointerEvents = 'none';
          }
        }
      });

      renderer.render(scene, camera);
      animId = requestAnimationFrame(renderLoop);
    };

    animId = requestAnimationFrame(renderLoop);

    // 9. Resize Handling
    const handleResize = () => {
      if (!container) return;
      const w = container.clientWidth || 1;
      const h = container.clientHeight || 1;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', handleResize);
      renderer.domElement.removeEventListener('click', onPointerClick);
      controls.dispose();
      renderer.dispose();
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, []);

  // Update graphics mode live
  useEffect(() => {
    applyGraphicsModeFnRef.current(isLowGraphics);
  }, [isLowGraphics]);

  return (
    <div className="relative h-full w-full">
      <div ref={mountRef} className="h-full w-full cursor-grab active:cursor-grabbing" />
      <div ref={labelsContainerRef} className="pointer-events-none absolute inset-0 z-10 overflow-hidden" />
    </div>
  );
});
