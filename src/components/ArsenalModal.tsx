import React, { useState, useRef, useEffect } from 'react';
import * as THREE from 'three';
import { WEAPONS } from '../data/weapons';
import { Weapon } from '../types';
import { createProceduralWeaponModel } from './weaponModels';
import { X, RotateCcw, Shield, Crosshair } from 'lucide-react';

interface ArsenalModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ArsenalModal({ isOpen, onClose }: ArsenalModalProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [selectedWeaponId, setSelectedWeaponId] = useState<string>('smle');

  const categories = ['All', 'Rifles & sidearms', 'Machine guns', 'Trench assault', 'Armour'];

  const filteredWeapons = selectedCategory === 'All'
    ? WEAPONS
    : WEAPONS.filter((w) => w.category === selectedCategory);

  const selectedWeapon = WEAPONS.find((w) => w.id === selectedWeaponId) || WEAPONS[0];

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-md">
      <div className="somme-panel relative w-full max-w-5xl max-h-[92vh] flex flex-col rounded-2xl overflow-hidden border border-amber-200/25 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-amber-200/15 px-6 py-4 bg-black/40">
          <div>
            <div className="flex items-center gap-2">
              <span className="h-px w-6 bg-amber-200/50" />
              <span className="somme-kicker text-amber-200/80">Imperial War Archive · 1916</span>
            </div>
            <h2 className="font-heading text-2xl sm:text-3xl font-semibold uppercase tracking-wider text-[#f5ebd7] mt-0.5">
              Arsenal & Trench Warfare Technology
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center rounded-full border border-amber-200/20 text-amber-100/70 transition hover:border-amber-200/50 hover:bg-white/5 hover:text-white"
            aria-label="Close arsenal"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Category Tabs */}
        <div className="flex items-center gap-1.5 px-6 py-3 border-b border-amber-200/10 overflow-x-auto somme-scroll bg-[#15120e]/60">
          {categories.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setSelectedCategory(cat)}
              className={`px-3.5 py-1.5 rounded-full font-heading text-xs uppercase tracking-wider transition whitespace-nowrap ${
                selectedCategory === cat
                  ? 'bg-amber-200/20 text-amber-100 border border-amber-200/50 font-semibold'
                  : 'text-amber-100/50 hover:text-amber-100/80 hover:bg-white/5 border border-transparent'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-hidden grid grid-cols-1 lg:grid-cols-12">
          {/* Weapon Selector List */}
          <div className="lg:col-span-4 border-b lg:border-b-0 lg:border-r border-amber-200/10 overflow-y-auto max-h-[35vh] lg:max-h-none p-3 space-y-1.5 somme-scroll bg-black/25">
            {filteredWeapons.map((weapon) => {
              const active = weapon.id === selectedWeaponId;
              return (
                <button
                  key={weapon.id}
                  type="button"
                  onClick={() => setSelectedWeaponId(weapon.id)}
                  className={`w-full text-left p-3 rounded-xl border transition ${
                    active
                      ? 'border-amber-200/50 bg-amber-200/10 shadow-sm'
                      : 'border-transparent hover:border-amber-200/20 hover:bg-white/5'
                  }`}
                >
                  <div className="flex items-center justify-between text-[10px] font-mono uppercase text-amber-200/60">
                    <span>{weapon.nation}</span>
                    <span>{weapon.year}</span>
                  </div>
                  <div className="font-heading text-base font-medium text-[#f6efe0] mt-0.5">
                    {weapon.name}
                  </div>
                  <div className="text-xs text-amber-100/50 line-clamp-1 mt-0.5">
                    {weapon.summary}
                  </div>
                </button>
              );
            })}
          </div>

          {/* 3D Viewer & Weapon Details */}
          <div className="lg:col-span-8 flex flex-col overflow-y-auto somme-scroll p-6 space-y-6">
            {/* 3D Canvas Box */}
            <div className="relative h-64 sm:h-72 w-full rounded-xl border border-amber-200/20 bg-gradient-to-b from-[#1b1712] to-[#0d0b09] overflow-hidden flex items-center justify-center">
              <WeaponCanvas weaponId={selectedWeapon.id} />
              <div className="absolute top-3 left-3 flex items-center gap-2 pointer-events-none">
                <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-black/60 border border-amber-200/20 text-[10px] font-mono text-amber-200/80">
                  <Crosshair className="h-3 w-3 text-amber-300" />
                  Interactive 3D Diagram · Drag to inspect
                </span>
              </div>
            </div>

            {/* Weapon Information */}
            <div className="space-y-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-mono text-amber-200/70 uppercase">
                    {selectedWeapon.category} · {selectedWeapon.nation} · {selectedWeapon.year}
                  </span>
                </div>
                <h3 className="font-heading text-3xl font-bold uppercase tracking-wide text-[#f6efe1] mt-1">
                  {selectedWeapon.name}
                </h3>
                <p className="text-sm text-amber-100/75 leading-relaxed mt-2 border-l-2 border-amber-200/30 pl-3">
                  {selectedWeapon.summary}
                </p>
              </div>

              {/* Technical Specifications */}
              <div>
                <h4 className="font-mono text-xs uppercase tracking-widest text-amber-200/60 mb-2">
                  Technical Specifications
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  {selectedWeapon.specs.map((spec) => (
                    <div
                      key={spec.label}
                      className="p-2.5 rounded-lg border border-amber-200/15 bg-black/30"
                    >
                      <div className="text-[10px] font-mono text-amber-200/50 uppercase">
                        {spec.label}
                      </div>
                      <div className="font-heading text-sm font-semibold text-[#f5ebd7] mt-0.5">
                        {spec.value}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Battlefield Deployment Notes */}
              <div>
                <h4 className="font-mono text-xs uppercase tracking-widest text-amber-200/60 mb-2">
                  Battle of the Somme Deployment Notes
                </h4>
                <ul className="space-y-2">
                  {selectedWeapon.points.map((point, idx) => (
                    <li key={idx} className="flex items-start gap-2.5 text-xs text-amber-100/75 leading-relaxed">
                      <span className="h-1.5 w-1.5 rounded-full bg-amber-400 mt-1.5 shrink-0" />
                      <span>{point}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function WeaponCanvas({ weaponId }: { weaponId: string }) {
  const mountRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(36, container.clientWidth / container.clientHeight, 0.1, 100);
    camera.position.set(1.4, 1.5, 4.6);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.15;
    renderer.domElement.style.cssText = 'position:absolute;inset:0;display:block;touch-action:none;';
    container.innerHTML = '';
    container.appendChild(renderer.domElement);

    // Lights
    const hemi = new THREE.HemisphereLight(0xfff3db, 0x221a12, 1.2);
    scene.add(hemi);

    const key = new THREE.DirectionalLight(0xfffaed, 2.2);
    key.position.set(4, 5, 3);
    scene.add(key);

    const rim = new THREE.DirectionalLight(0xd9b37a, 1.1);
    rim.position.set(-4, -2, -3);
    scene.add(rim);

    // Model
    const model = createProceduralWeaponModel(weaponId);
    scene.add(model);

    // Controls
    let isDragging = false;
    let prevMouseX = 0;
    let prevMouseY = 0;
    let rotY = 0.4;
    let rotX = 0.2;

    const onPointerDown = (e: PointerEvent) => {
      isDragging = true;
      prevMouseX = e.clientX;
      prevMouseY = e.clientY;
    };

    const onPointerMove = (e: PointerEvent) => {
      if (!isDragging) return;
      const dx = e.clientX - prevMouseX;
      const dy = e.clientY - prevMouseY;
      rotY += dx * 0.01;
      rotX += dy * 0.01;
      rotX = Math.max(-Math.PI * 0.4, Math.min(Math.PI * 0.4, rotX));
      prevMouseX = e.clientX;
      prevMouseY = e.clientY;
    };

    const onPointerUp = () => {
      isDragging = false;
    };

    renderer.domElement.addEventListener('pointerdown', onPointerDown);
    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);

    let animId = 0;
    const animate = () => {
      if (!isDragging) {
        rotY += 0.006;
      }
      model.rotation.y = rotY;
      model.rotation.x = rotX;
      camera.lookAt(0, 0, 0);
      renderer.render(scene, camera);
      animId = requestAnimationFrame(animate);
    };
    animId = requestAnimationFrame(animate);

    const handleResize = () => {
      if (!container) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', handleResize);
      renderer.domElement.removeEventListener('pointerdown', onPointerDown);
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
      renderer.dispose();
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, [weaponId]);

  return <div ref={mountRef} className="absolute inset-0 cursor-grab active:cursor-grabbing" />;
}
