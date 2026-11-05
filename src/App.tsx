import React, { useState, useRef, useEffect } from 'react';
import { Volume2, VolumeX, RotateCcw, Crosshair, Box, BookOpen, Sparkles } from 'lucide-react';
import { BattlefieldScene, BattlefieldSceneRef } from './components/BattlefieldScene';
import { HotspotDrawer } from './components/HotspotDrawer';
import { ArsenalModal } from './components/ArsenalModal';
import { FunFactsWidget } from './components/FunFactsWidget';
import { GeminiAssistantModal } from './components/GeminiAssistantModal';
import { HOTSPOTS, SECTORS_LEGEND } from './data/battlefield';
import { Hotspot } from './types';
import { createBattlefieldAudio, BattlefieldAudioController } from './audio/battlefieldAudio';

export default function App() {
  const [selectedHotspot, setSelectedHotspot] = useState<Hotspot | null>(null);
  const [isArsenalOpen, setIsArsenalOpen] = useState(false);
  const [isSoundOn, setIsSoundOn] = useState(false);
  const [isLowGraphics, setIsLowGraphics] = useState(false);
  const [isLoreOpen, setIsLoreOpen] = useState(false);
  const [isGeminiOpen, setIsGeminiOpen] = useState(false);

  const sceneRef = useRef<BattlefieldSceneRef>(null);
  const audioCtrlRef = useRef<BattlefieldAudioController | null>(null);

  useEffect(() => {
    audioCtrlRef.current = createBattlefieldAudio();
    return () => {
      audioCtrlRef.current?.stop();
    };
  }, []);

  const handleToggleSound = () => {
    if (!audioCtrlRef.current) return;
    const playing = audioCtrlRef.current.toggle();
    setIsSoundOn(playing);
  };

  const handleResetView = () => {
    sceneRef.current?.resetView();
    setSelectedHotspot(null);
  };

  const handleSelectHotspot = (hs: Hotspot) => {
    setSelectedHotspot(hs);
    setIsLoreOpen(false); // Close lore if opening sector detail
  };

  return (
    <main className="relative h-screen w-screen overflow-hidden bg-[#120f0b] text-[#f7efe0] select-none font-sans">
      {/* 3D Battlefield Diorama Viewport */}
      <BattlefieldScene
        ref={sceneRef}
        onSelect={handleSelectHotspot}
        activeId={selectedHotspot?.id}
        isLowGraphics={isLowGraphics}
      />

      {/* Top HUD Header */}
      <header className="pointer-events-none absolute inset-x-0 top-0 z-20 flex flex-col gap-3 p-4 sm:flex-row sm:items-start sm:justify-between sm:gap-6 sm:p-6">
        <div className="somme-fade-up">
          <div className="flex items-center gap-2">
            <span className="h-px w-7 bg-amber-200/45" />
            <span className="somme-kicker text-amber-200/75">France · Somme · 1916</span>
          </div>
          {/* Main Title formatted with Black Ops One as requested */}
          <h1 className="mt-1.5 font-military text-2xl sm:text-4xl uppercase leading-[1.05] tracking-[0.035em] text-[#f6efe1] drop-shadow-[0_4px_12px_rgba(0,0,0,0.8)]">
            The Battle of the Somme
          </h1>
          <p className="mt-2 max-w-[42ch] text-[11px] leading-relaxed text-amber-50/60 sm:text-xs">
            Interactive 3D battlefield diorama · 1916 Western Front · Year 9 History
          </p>
        </div>

        {/* Action Controls */}
        <div className="pointer-events-auto flex shrink-0 items-center gap-2 self-end sm:self-auto flex-wrap justify-end">
          {/* Graphics Mode Toggle - Placed right beside sound button as requested */}
          <button
            type="button"
            onClick={() => setIsLowGraphics((prev) => !prev)}
            className={`flex h-9 items-center gap-1.5 rounded-full border px-3 backdrop-blur-md transition ${
              isLowGraphics
                ? 'border-emerald-400/70 bg-emerald-950/80 text-emerald-200 shadow-[0_0_15px_rgba(34,197,94,0.3)]'
                : 'border-amber-200/25 bg-black/40 text-amber-100/80 hover:border-amber-200/50 hover:bg-black/60 hover:text-amber-50'
            }`}
            aria-label="Toggle Graphics Mode"
            title="Switch between HD and Low-Poly mode"
          >
            <Box className="h-3.5 w-3.5 text-amber-300" />
            <span className="font-heading text-[11px] font-semibold uppercase tracking-wider">
              {isLowGraphics ? 'Graphics: Low-Poly' : 'Graphics: HD'}
            </span>
          </button>

          {/* Audio Ambience Toggle */}
          <button
            type="button"
            onClick={handleToggleSound}
            className={`flex h-9 w-9 items-center justify-center rounded-full border backdrop-blur-md transition ${
              isSoundOn
                ? 'border-amber-300 bg-amber-500/20 text-amber-200 shadow-[0_0_15px_rgba(245,158,11,0.3)]'
                : 'border-amber-200/20 bg-black/40 text-amber-100/80 hover:border-amber-200/50 hover:bg-black/60 hover:text-amber-50'
            }`}
            aria-label={isSoundOn ? 'Mute battlefield ambience' : 'Play battlefield ambience'}
            title={isSoundOn ? 'Mute battlefield ambience' : 'Play battlefield ambience'}
          >
            {isSoundOn ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
          </button>

          {/* Reset Camera View */}
          <button
            type="button"
            onClick={handleResetView}
            className="flex h-9 w-9 items-center justify-center rounded-full border border-amber-200/20 bg-black/40 text-amber-100/80 backdrop-blur-md transition hover:border-amber-200/50 hover:bg-black/60 hover:text-amber-50"
            aria-label="Reset battlefield camera view"
            title="Reset overview"
          >
            <RotateCcw className="h-4 w-4" />
          </button>

          {/* Arsenal & Technology Modal Button */}
          <button
            type="button"
            onClick={() => setIsArsenalOpen(true)}
            className="group flex items-center gap-2 rounded-full border border-amber-200/35 bg-gradient-to-b from-[#3b3122]/95 to-[#221c14]/95 px-3.5 py-2 font-heading text-[11.5px] font-semibold uppercase tracking-[0.16em] text-[#f3e4c6] shadow-[0_10px_30px_-14px_rgba(0,0,0,0.9)] backdrop-blur-md transition hover:border-amber-200/70 hover:text-white sm:px-4"
          >
            <Crosshair className="h-4 w-4 text-amber-300 transition group-hover:scale-110" />
            <span className="hidden sm:inline">Arsenal & Technology</span>
            <span className="sm:hidden">Arsenal</span>
          </button>
        </div>
      </header>

      {/* Bottom Right: Sectors Legend */}
      <aside className="pointer-events-none absolute bottom-4 right-4 z-20 hidden md:block">
        <div className="somme-panel rounded-xl px-4 py-3.5 shadow-xl">
          <div className="somme-kicker text-amber-200/50">Interactive Sectors</div>
          <ul className="mt-2 space-y-2">
            {SECTORS_LEGEND.map((sec) => (
              <li key={sec.label} className="flex items-center gap-2.5 text-xs text-amber-50/80">
                <span
                  className="h-2 w-2 rounded-full ring-2 ring-white/10 shrink-0"
                  style={{ backgroundColor: sec.color }}
                />
                <span className="font-medium">{sec.label}</span>
                <span className="font-mono text-[9.5px] text-amber-200/40">({sec.desc})</span>
              </li>
            ))}
          </ul>
          <div className="mt-3 border-t border-amber-200/10 pt-2.5 text-[10.5px] leading-relaxed text-amber-50/45 font-mono">
            Drag to orbit · Scroll to zoom
            <br />
            Click glowing marker to inspect
          </div>
        </div>
      </aside>

      {/* Bottom Left Controls: Trench Lore & Fun Facts Button + Gemini AI Historian Button */}
      <div className="fixed bottom-4 left-4 z-30 flex items-center gap-2">
        {/* Trench Lore & Fun Facts Button */}
        <button
          type="button"
          onClick={() => {
            setIsLoreOpen((prev) => !prev);
            if (selectedHotspot) setSelectedHotspot(null);
          }}
          className={`flex h-9 w-9 items-center justify-center rounded-full border backdrop-blur-md transition ${
            isLoreOpen
              ? 'border-amber-300 bg-amber-500/25 text-amber-200 shadow-[0_0_15px_rgba(245,158,11,0.35)]'
              : 'border-amber-200/20 bg-black/45 text-amber-100/80 hover:border-amber-200/50 hover:bg-black/60 hover:text-amber-50'
          }`}
          aria-label="Trench Lore and Fun Facts"
          title="Trench Lore & Fun Facts (Year 9 History)"
        >
          <BookOpen className="h-4 w-4" />
        </button>

        {/* Gemini WW1 AI Field Historian & Web Intelligence Button */}
        <button
          type="button"
          onClick={() => {
            setIsGeminiOpen(true);
            if (selectedHotspot) setSelectedHotspot(null);
          }}
          className={`relative flex h-9 w-9 items-center justify-center rounded-full border backdrop-blur-md transition ${
            isGeminiOpen
              ? 'border-amber-300 bg-amber-500/25 text-amber-200 shadow-[0_0_15px_rgba(245,158,11,0.35)]'
              : 'border-amber-200/20 bg-black/45 text-amber-100/80 hover:border-amber-200/50 hover:bg-black/60 hover:text-amber-50'
          }`}
          aria-label="Ask Gemini WW1 Field Historian"
          title="Ask Gemini Field Historian & Web Intelligence"
        >
          <Sparkles className="h-4 w-4 text-amber-300" />
          <span className="absolute -top-0.5 -right-0.5 flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-400"></span>
          </span>
        </button>
      </div>

      {/* Fun Facts Drawer / Modal */}
      <FunFactsWidget
        isOpen={isLoreOpen}
        onClose={() => setIsLoreOpen(false)}
      />

      {/* Gemini AI Historian & Web Assistant Modal */}
      <GeminiAssistantModal
        isOpen={isGeminiOpen}
        onClose={() => setIsGeminiOpen(false)}
      />

      {/* Hotspot Drawer */}
      <HotspotDrawer
        hotspot={selectedHotspot}
        onClose={() => setSelectedHotspot(null)}
      />

      {/* Arsenal Modal */}
      <ArsenalModal
        isOpen={isArsenalOpen}
        onClose={() => setIsArsenalOpen(false)}
      />

      {/* Mobile Interaction Hint */}
      <div className="pointer-events-none absolute inset-x-0 bottom-1 z-10 flex justify-center sm:hidden">
        <span className="rounded-full border border-amber-200/20 bg-black/55 px-3 py-1 font-mono text-[9px] uppercase tracking-[0.16em] text-amber-50/60 backdrop-blur-md">
          Tap marker to inspect · Drag to orbit
        </span>
      </div>
    </main>
  );
}
