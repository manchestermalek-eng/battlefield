import React from 'react';
import { Hotspot } from '../types';
import { SECTORS_META } from '../data/battlefield';
import { X, MapPin } from 'lucide-react';

interface HotspotDrawerProps {
  hotspot: Hotspot | null;
  onClose: () => void;
}

export function HotspotDrawer({ hotspot, onClose }: HotspotDrawerProps) {
  if (!hotspot) return null;

  const sector = SECTORS_META[hotspot.side];

  return (
    <aside
      className="somme-fade-up fixed bottom-3 left-3 right-3 z-40 sm:bottom-6 sm:left-6 sm:right-auto sm:w-[410px]"
      aria-label="Sector Details"
    >
      <div className="somme-panel max-h-[62vh] overflow-y-auto rounded-2xl p-5 somme-scroll sm:max-h-[75vh] sm:p-6 border shadow-2xl relative">
        {/* Top Header */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span
                className="flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 font-mono text-[10px] font-semibold text-white shadow-sm"
                style={{ backgroundColor: sector?.color || '#ef4444' }}
              >
                {String(hotspot.index).padStart(2, '0')}
              </span>
              <span
                className="somme-kicker font-bold"
                style={{ color: sector?.color || '#fef08a' }}
              >
                {hotspot.side}
              </span>
            </div>
            <h2 className="mt-2 font-heading text-[26px] font-semibold uppercase leading-none tracking-[0.05em] text-[#f7efe0]">
              {hotspot.title}
            </h2>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close information"
            className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-amber-200/20 text-amber-100/70 transition hover:border-amber-200/50 hover:bg-white/5 hover:text-white"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>

        {/* Intro */}
        <p
          className="mt-3 border-l-2 pl-3 text-[13px] leading-relaxed text-amber-50/75"
          style={{ borderColor: sector?.color || '#eab308' }}
        >
          {hotspot.intro}
        </p>

        {/* Bullets */}
        <ul className="mt-4 space-y-3">
          {hotspot.bullets.map((bullet, idx) => (
            <li key={idx} className="flex gap-2.5 text-[12.5px] leading-relaxed text-amber-50/85">
              <span
                className="mt-[7px] h-1.5 w-1.5 shrink-0 rounded-full"
                style={{ backgroundColor: sector?.color || '#eab308' }}
              />
              <span>{bullet}</span>
            </li>
          ))}
        </ul>

        {/* Tactical Coordinates */}
        <div className="mt-5 pt-3 border-t border-amber-200/10 flex items-center justify-between text-[10px] font-mono text-amber-200/40">
          <span className="flex items-center gap-1">
            <MapPin className="h-3 w-3" /> Grid [{hotspot.pos[0]}, {hotspot.pos[1]}]
          </span>
          <span>Somme Sector 1916</span>
        </div>
      </div>
    </aside>
  );
}
