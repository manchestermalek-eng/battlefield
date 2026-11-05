import * as THREE from 'three';

const MATS = {
  steel: new THREE.MeshStandardMaterial({ color: '#3d4147', metalness: 0.88, roughness: 0.3 }),
  darkSteel: new THREE.MeshStandardMaterial({ color: '#23252a', metalness: 0.82, roughness: 0.42 }),
  iron: new THREE.MeshStandardMaterial({ color: '#31343a', metalness: 0.72, roughness: 0.5 }),
  brass: new THREE.MeshStandardMaterial({ color: '#a67f3c', metalness: 0.88, roughness: 0.32 }),
  wood: new THREE.MeshStandardMaterial({ color: '#6d4726', metalness: 0.05, roughness: 0.72 }),
  darkWood: new THREE.MeshStandardMaterial({ color: '#422e1c', metalness: 0.05, roughness: 0.82 }),
  olive: new THREE.MeshStandardMaterial({ color: '#4d5139', metalness: 0.15, roughness: 0.75 }),
  khaki: new THREE.MeshStandardMaterial({ color: '#6f6748', metalness: 0.1, roughness: 0.85 }),
};

function box(w: number, h: number, d: number, mat: THREE.Material): THREE.Mesh {
  return new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
}

function cylinderH(r: number, len: number, mat: THREE.Material, segs = 14): THREE.Mesh {
  const mesh = new THREE.Mesh(new THREE.CylinderGeometry(r, r, len, segs), mat);
  mesh.rotation.z = Math.PI / 2;
  return mesh;
}

function cylinderV(rt: number, rb: number, len: number, mat: THREE.Material, segs = 14): THREE.Mesh {
  return new THREE.Mesh(new THREE.CylinderGeometry(rt, rb, len, segs), mat);
}

function group(...children: (THREE.Object3D | null | undefined)[]): THREE.Group {
  const g = new THREE.Group();
  children.filter(Boolean).forEach((c) => g.add(c!));
  return g;
}

function normalizeWeapon(obj: THREE.Group, targetSize = 3.1): THREE.Group {
  const box3 = new THREE.Box3().setFromObject(obj);
  const size = box3.getSize(new THREE.Vector3());
  const center = box3.getCenter(new THREE.Vector3());
  const parent = new THREE.Group();
  obj.position.set(-center.x, -center.y, -center.z);
  parent.add(obj);
  const maxDim = Math.max(size.x, size.y, size.z) || 1;
  parent.scale.setScalar(targetSize / maxDim);
  return parent;
}

// 1. SMLE
function buildSMLE(): THREE.Group {
  const st = MATS.steel;
  const wd = MATS.wood;
  const dw = MATS.darkWood;

  const butt = box(0.24, 0.17, 0.085, wd);
  butt.position.set(-0.68, -0.04, 0);
  butt.rotation.z = 0.1;

  const stock = box(0.62, 0.13, 0.09, wd);
  stock.position.set(-0.27, -0.03, 0);

  const wrist = box(0.17, 0.17, 0.075, wd);
  wrist.position.set(-0.19, -0.08, 0);
  wrist.rotation.z = -0.28;

  const fore = box(0.74, 0.1, 0.076, wd);
  fore.position.set(0.33, 0.005, 0);

  const nose = box(0.13, 0.065, 0.082, st);
  nose.position.set(0.72, 0.02, 0);

  const bbl = cylinderH(0.019, 0.6, st);
  bbl.position.set(0.95, 0.028, 0);

  const rec = box(0.19, 0.085, 0.08, st);
  rec.position.set(0.02, 0.038, 0);

  const bolt = cylinderH(0.016, 0.17, dw);
  bolt.position.set(-0.05, 0.075, 0.055);

  const knob = box(0.028, 0.085, 0.028, dw);
  knob.position.set(-0.13, 0.055, 0.085);

  const mag = box(0.1, 0.14, 0.062, dw);
  mag.position.set(0.1, -0.085, 0);

  const sight = box(0.016, 0.04, 0.02, st);
  sight.position.set(0.62, 0.068, 0);

  return group(butt, stock, wrist, fore, nose, bbl, rec, bolt, knob, mag, sight);
}

// 2. Gewehr 98
function buildGewehr98(): THREE.Group {
  const st = MATS.steel;
  const wd = MATS.wood;
  const dw = MATS.darkWood;

  const butt = box(0.26, 0.16, 0.08, wd);
  butt.position.set(-0.7, -0.05, 0);
  butt.rotation.z = 0.13;

  const stock = box(0.6, 0.12, 0.085, wd);
  stock.position.set(-0.28, -0.04, 0);

  const wrist = box(0.16, 0.16, 0.07, wd);
  wrist.position.set(-0.2, -0.09, 0);
  wrist.rotation.z = -0.3;

  const fore = box(0.8, 0.09, 0.07, wd);
  fore.position.set(0.36, -0.005, 0);

  const nose = box(0.06, 0.085, 0.082, st);
  nose.position.set(0.62, 0, 0);

  const bbl = cylinderH(0.017, 0.56, st);
  bbl.position.set(0.94, 0.02, 0);

  const rec = box(0.22, 0.08, 0.075, st);
  rec.position.set(0.01, 0.03, 0);

  const bolt = cylinderH(0.015, 0.2, dw);
  bolt.position.set(-0.04, 0.065, 0.05);

  const knob = box(0.026, 0.03, 0.026, dw);
  knob.position.set(-0.13, 0.055, 0.06);

  const sight = box(0.014, 0.035, 0.018, st);
  sight.position.set(0.58, 0.058, 0);

  return group(butt, stock, wrist, fore, nose, bbl, rec, bolt, knob, sight);
}

// 3. Webley Revolver
function buildWebley(): THREE.Group {
  const st = MATS.steel;
  const dw = MATS.darkWood;
  const wd = MATS.wood;

  const bbl = cylinderH(0.032, 0.42, st);
  bbl.position.set(0.22, 0.06, 0);

  const rib = box(0.42, 0.028, 0.055, st);
  rib.position.set(0.22, 0.098, 0);

  const cyl = new THREE.Mesh(new THREE.CylinderGeometry(0.105, 0.105, 0.2, 8), st);
  cyl.rotation.z = Math.PI / 2;
  cyl.position.set(-0.02, 0.05, 0);

  const frame = box(0.14, 0.14, 0.075, st);
  frame.position.set(-0.1, 0.02, 0);

  const grip = box(0.12, 0.34, 0.085, wd);
  grip.position.set(-0.15, -0.17, 0);
  grip.rotation.z = 0.24;

  const hammer = box(0.05, 0.08, 0.04, dw);
  hammer.position.set(-0.17, 0.11, 0);
  hammer.rotation.z = -0.3;

  const guard = box(0.05, 0.055, 0.03, dw);
  guard.position.set(-0.02, -0.06, 0);

  return group(bbl, rib, cyl, frame, grip, hammer, guard);
}

// 4. Luger P08
function buildLuger(): THREE.Group {
  const st = MATS.steel;
  const dw = MATS.darkWood;

  const bbl = cylinderH(0.028, 0.36, st);
  bbl.position.set(0.24, 0.06, 0);

  const rec = box(0.26, 0.1, 0.075, st);
  rec.position.set(0, 0.045, 0);

  const toggle = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.11, 10), st);
  toggle.rotation.z = Math.PI / 2;
  toggle.position.set(-0.06, 0.115, 0);

  const knobL = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 0.03, 10), dw);
  knobL.rotation.z = Math.PI / 2;
  knobL.position.set(-0.06, 0.115, 0.07);

  const knobR = knobL.clone();
  knobR.position.z = -0.07;

  const grip = box(0.11, 0.34, 0.085, dw);
  grip.position.set(-0.1, -0.15, 0);
  grip.rotation.z = 0.32;

  const guard = box(0.045, 0.05, 0.03, st);
  guard.position.set(0.02, -0.04, 0);

  const sight = box(0.014, 0.03, 0.018, st);
  sight.position.set(0.36, 0.085, 0);

  return group(bbl, rec, toggle, knobL, knobR, grip, guard, sight);
}

// 5. Vickers Machine Gun
function buildVickers(): THREE.Group {
  const st = MATS.steel;
  const dst = MATS.darkSteel;
  const ol = MATS.olive;

  const jacket = cylinderH(0.1, 0.85, st, 16);
  jacket.position.set(0.16, 0.5, 0);

  const muzzle = cylinderH(0.032, 0.34, dst);
  muzzle.position.set(0.76, 0.5, 0);

  const body = box(0.34, 0.2, 0.22, st);
  body.position.set(-0.28, 0.48, 0);

  const feed = box(0.2, 0.16, 0.3, dst);
  feed.position.set(-0.12, 0.56, 0.02);

  const belt = box(0.05, 0.1, 0.42, MATS.khaki);
  belt.position.set(-0.1, 0.56, 0.26);

  const handleL = box(0.05, 0.18, 0.05, dst);
  handleL.position.set(-0.42, 0.4, 0.07);
  const handleR = handleL.clone();
  handleR.position.z = -0.07;

  const legGeo = new THREE.CylinderGeometry(0.028, 0.028, 1, 6);
  const leg1 = new THREE.Mesh(legGeo, ol);
  leg1.position.set(0.22, 0.05, 0.32);
  leg1.rotation.set(0.32, 0, -0.3);

  const leg2 = new THREE.Mesh(legGeo, ol);
  leg2.position.set(0.22, 0.05, -0.32);
  leg2.rotation.set(-0.32, 0, -0.3);

  const leg3 = new THREE.Mesh(legGeo, ol);
  leg3.position.set(-0.4, 0.05, 0);
  leg3.rotation.set(0, 0, 0.5);

  const mount = box(0.16, 0.14, 0.16, st);
  mount.position.set(0.05, 0.28, 0);

  const pivot = cylinderV(0.035, 0.045, 0.4, st);
  pivot.position.set(0.05, 0.24, 0);

  return group(jacket, muzzle, body, feed, belt, handleL, handleR, leg1, leg2, leg3, mount, pivot);
}

// 6. MG 08 Machine Gun
function buildMG08(): THREE.Group {
  const st = MATS.steel;
  const dst = MATS.darkSteel;
  const dw = MATS.darkWood;

  const sled = box(1.15, 0.1, 0.5, dw);
  sled.position.set(0, 0.05, 0);

  const rails = box(1, 0.08, 0.14, dst);
  rails.position.set(0, 0.13, 0);

  const body = box(0.55, 0.22, 0.22, st);
  body.position.set(-0.05, 0.3, 0);

  const jacket = cylinderH(0.1, 0.62, st, 16);
  jacket.position.set(0.42, 0.32, 0);

  const booster = cylinderH(0.034, 0.5, dst);
  booster.position.set(0.92, 0.32, 0);

  const cap = cylinderH(0.055, 0.12, st);
  cap.position.set(1.2, 0.32, 0);

  const shield = box(0.05, 0.5, 0.68, st);
  shield.position.set(0.15, 0.4, 0);

  const boxAmmo = box(0.14, 0.1, 0.28, MATS.khaki);
  boxAmmo.position.set(-0.12, 0.42, 0.24);

  const spadeL = box(0.05, 0.16, 0.05, dst);
  spadeL.position.set(-0.36, 0.26, 0.08);
  const spadeR = spadeL.clone();
  spadeR.position.z = -0.08;

  return group(sled, rails, body, jacket, booster, cap, shield, boxAmmo, spadeL, spadeR);
}

// 7. Lewis Light Machine Gun
function buildLewis(): THREE.Group {
  const st = MATS.steel;
  const dst = MATS.darkSteel;
  const wd = MATS.wood;

  const shroud = cylinderH(0.1, 0.72, st, 16);
  shroud.position.set(0.16, 0.16, 0);

  const bbl = cylinderH(0.03, 0.3, dst);
  bbl.position.set(0.62, 0.16, 0);

  const rec = box(0.42, 0.16, 0.16, dst);
  rec.position.set(-0.28, 0.15, 0);

  const pan = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.22, 0.09, 18), st);
  pan.position.set(-0.2, 0.3, 0);

  const centerPin = cylinderV(0.05, 0.05, 0.12, dst);
  centerPin.position.set(-0.2, 0.32, 0);

  const butt = box(0.5, 0.12, 0.09, wd);
  butt.position.set(-0.7, 0.1, 0);
  butt.rotation.z = 0.06;

  const grip = box(0.09, 0.2, 0.08, wd);
  grip.position.set(-0.42, -0.02, 0);
  grip.rotation.z = -0.22;

  const bipodGeo = new THREE.CylinderGeometry(0.02, 0.02, 0.5, 6);
  const bipod1 = new THREE.Mesh(bipodGeo, st);
  bipod1.position.set(0.42, -0.05, 0.14);
  bipod1.rotation.set(0.4, 0, 0);

  const bipod2 = new THREE.Mesh(bipodGeo, st);
  bipod2.position.set(0.42, -0.05, -0.14);
  bipod2.rotation.set(-0.4, 0, 0);

  const strap = box(0.5, 0.05, 0.02, MATS.khaki);
  strap.position.set(-0.1, 0.02, 0.14);

  return group(shroud, bbl, rec, pan, centerPin, butt, grip, bipod1, bipod2, strap);
}

// 8. Mills Bomb
function buildMills(): THREE.Group {
  const ir = MATS.iron;
  const br = MATS.brass;

  const egg = new THREE.Mesh(new THREE.DodecahedronGeometry(0.24, 1), ir);
  const neck = cylinderV(0.09, 0.11, 0.1, ir);
  neck.position.y = 0.24;

  const plug = cylinderV(0.075, 0.075, 0.06, br);
  plug.position.y = 0.31;

  const lever = box(0.03, 0.34, 0.03, br);
  lever.position.set(0.1, 0.2, 0);
  lever.rotation.z = -0.35;

  const pin = cylinderH(0.012, 0.14, br);
  pin.position.set(0.02, 0.3, 0.06);

  const ring = new THREE.Mesh(new THREE.TorusGeometry(0.045, 0.012, 6, 14), br);
  ring.position.set(0.02, 0.3, 0.14);

  const g = group(egg, neck, plug, lever, pin, ring);
  g.rotation.z = 0.05;
  return g;
}

// 9. Stielhandgranate 24
function buildStickGrenade(): THREE.Group {
  const dw = MATS.darkWood;
  const st = MATS.steel;
  const ir = MATS.iron;

  const handle = cylinderV(0.045, 0.05, 0.86, dw);
  handle.position.y = -0.1;

  const warhead = cylinderV(0.13, 0.13, 0.26, ir, 14);
  warhead.position.y = 0.44;

  const cap = cylinderV(0.135, 0.135, 0.05, st, 14);
  cap.position.y = 0.59;

  const baseRing = cylinderV(0.132, 0.132, 0.03, st, 14);
  baseRing.position.y = 0.32;

  const bead = cylinderV(0.022, 0.022, 0.12, MATS.brass, 8);
  bead.position.set(0, 0.05, 0);

  const cord = box(0.02, 0.24, 0.02, MATS.khaki);
  cord.position.set(0.05, 0.02, 0.02);
  cord.rotation.z = 0.4;

  const g = group(handle, warhead, cap, baseRing, bead, cord);
  g.rotation.z = 0.22;
  return g;
}

// 10. Stokes Mortar
function buildStokes(): THREE.Group {
  const ol = MATS.olive;
  const dst = MATS.darkSteel;

  const barrel = cylinderV(0.115, 0.115, 1.1, ol, 18);
  barrel.position.y = 0.62;

  const baseplate = box(0.44, 0.06, 0.34, dst);
  baseplate.position.y = 0.03;

  const collar = cylinderV(0.14, 0.14, 0.1, dst, 18);
  collar.position.y = 0.2;

  const legGeo = new THREE.CylinderGeometry(0.022, 0.022, 0.85, 6);
  const leg1 = new THREE.Mesh(legGeo, ol);
  leg1.position.set(0.24, 0.28, 0.16);
  leg1.rotation.set(0.28, 0, -0.3);

  const leg2 = new THREE.Mesh(legGeo, ol);
  leg2.position.set(0.24, 0.28, -0.16);
  leg2.rotation.set(-0.28, 0, -0.3);

  const clamp = new THREE.Mesh(new THREE.CylinderGeometry(0.075, 0.075, 0.16, 6), dst);
  clamp.position.set(0.62, 0.62, 0);
  clamp.rotation.z = -0.5;

  const screw = box(0.02, 0.16, 0.16, dst);
  screw.position.set(0.7, 0.72, 0);
  screw.rotation.z = -0.5;

  const g = group(barrel, baseplate, collar, leg1, leg2, clamp, screw);
  g.rotation.z = 0.06;
  return g;
}

// 11. Livens Flame Projector
function buildLivens(): THREE.Group {
  const st = MATS.steel;
  const dst = MATS.darkSteel;
  const br = MATS.brass;

  const tank = cylinderV(0.26, 0.26, 0.9, st, 18);
  tank.position.set(-0.35, 0.3, 0);

  const dome = new THREE.Mesh(new THREE.SphereGeometry(0.26, 18, 10, 0, Math.PI * 2, 0, Math.PI / 2), st);
  dome.position.set(-0.35, 0.75, 0);

  const base = box(0.6, 0.07, 0.6, dst);
  base.position.set(-0.35, 0.03, 0);

  const valve = box(0.14, 0.2, 0.14, br);
  valve.position.set(0.05, 0.66, 0);

  const wheel = new THREE.Mesh(new THREE.TorusGeometry(0.22, 0.045, 8, 18, Math.PI), dst);
  wheel.position.set(-0.05, 0.66, 0);
  wheel.rotation.set(Math.PI / 2, 0, 0);

  const pipe = cylinderH(0.07, 1, st, 14);
  pipe.position.set(0.66, 0.42, 0);
  pipe.rotation.z = -0.18;

  const nozzle = cylinderH(0.1, 0.16, br, 14);
  nozzle.position.set(1.16, 0.33, 0);
  nozzle.rotation.z = -0.18;

  const support = cylinderH(0.05, 0.7, dst);
  support.position.set(0.3, 0.5, 0);
  support.rotation.z = 0.5;

  const g = group(tank, dome, base, valve, wheel, pipe, nozzle, support);
  g.rotation.z = -0.04;
  return g;
}

// 12. Mark I Tank
function buildMark1(): THREE.Group {
  const dst = MATS.darkSteel;
  const ol = MATS.olive;
  const st = MATS.steel;

  const shape = new THREE.Shape();
  shape.moveTo(-1.7, -0.34);
  shape.lineTo(-1.56, 0.34);
  shape.lineTo(-0.62, 0.78);
  shape.lineTo(0.9, 0.88);
  shape.lineTo(1.68, 0.32);
  shape.lineTo(1.56, -0.22);
  shape.lineTo(0.9, -0.34);
  shape.lineTo(-1.2, -0.34);
  shape.lineTo(-1.7, -0.34);

  const extrude = new THREE.ExtrudeGeometry(shape, {
    depth: 0.34,
    bevelEnabled: true,
    bevelThickness: 0.03,
    bevelSize: 0.03,
    bevelSegments: 1,
  });
  extrude.translate(0, 0, -0.17);

  const trackL = new THREE.Mesh(extrude, dst);
  trackL.position.z = 0.62;

  const trackR = new THREE.Mesh(extrude, dst);
  trackR.position.z = -0.62;

  const hull = box(2.5, 0.62, 1.2, ol);
  hull.position.set(-0.08, 0.15, 0);

  const cab = box(0.8, 0.36, 0.72, ol);
  cab.position.set(0.3, 0.62, 0);

  const sponsonL = box(0.64, 0.46, 0.34, ol);
  sponsonL.position.set(0.1, 0.2, 0.92);

  const sponsonR = box(0.64, 0.46, 0.34, ol);
  sponsonR.position.set(0.1, 0.2, -0.92);

  const gunL = cylinderH(0.05, 0.42, st);
  gunL.position.set(0.5, 0.22, 0.95);

  const gunR = cylinderH(0.05, 0.42, st);
  gunR.position.set(0.5, 0.22, -0.95);

  const hatch = cylinderV(0.045, 0.045, 0.3, st);
  hatch.position.set(0.34, 0.9, 0);

  const rollers: THREE.Mesh[] = [];
  for (let i = 0; i < 7; i++) {
    const r1 = box(0.06, 0.14, 0.4, st);
    r1.position.set(-1.35 + i * 0.45, -0.24, 0.62);
    rollers.push(r1);

    const r2 = box(0.06, 0.14, 0.4, st);
    r2.position.set(-1.35 + i * 0.45, -0.24, -0.62);
    rollers.push(r2);
  }

  return group(trackL, trackR, hull, cab, sponsonL, sponsonR, gunL, gunR, hatch, ...rollers);
}

const WEAPON_BUILDERS: Record<string, () => THREE.Group> = {
  smle: buildSMLE,
  gewehr98: buildGewehr98,
  webley: buildWebley,
  luger: buildLuger,
  vickers: buildVickers,
  mg08: buildMG08,
  lewis: buildLewis,
  mills: buildMills,
  stielhandgranate: buildStickGrenade,
  stokes: buildStokes,
  livens: buildLivens,
  mark1: buildMark1,
};

export function createProceduralWeaponModel(id: string): THREE.Group {
  const builder = WEAPON_BUILDERS[id] || buildSMLE;
  const raw = builder();
  return normalizeWeapon(raw, 3.2);
}
