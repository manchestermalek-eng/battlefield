import React, { useState } from 'react';
import { FUN_FACTS } from '../data/funFacts';
import { FunFact } from '../types';
import { ChevronLeft, ChevronRight, Shuffle, Quote, BookOpen, X } from 'lucide-react';

interface FunFactsWidgetProps {
  isOpen: boolean;
  onClose: () => void;
}

export function FunFactsWidget({ isOpen, onClose }: FunFactsWidgetProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedCategory, setSelectedCategory] = useState<string>('All');

  const categories = [
    'All',
    'Haig’s "Dumb" Plan',
    'Trench Humor & Morale',
    'Bizarre Trench Life',
    'Somme Curiosities',
  ];

  const filteredFacts: FunFact[] = selectedCategory === 'All'
    ? FUN_FACTS
    : FUN_FACTS.filter((f) => f.category === selectedCategory);

  const safeIndex = currentIndex >= filteredFacts.length ? 0 : currentIndex;
  const currentFact = filteredFacts[safeIndex] || FUN_FACTS[0];

  const handleNext = () => {
    setCurrentIndex((prev) => (prev + 1) % filteredFacts.length);
  };

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev - 1 + filteredFacts.length) % filteredFacts.length);
  };

  const handleRandom = () => {
    const nextIdx = Math.floor(Math.random() * filteredFacts.length);
    setCurrentIndex(nextIdx);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed bottom-16 left-4 z-40 max-w-[94vw] sm:max-w-[420px]">
      <div className="somme-panel somme-fade-up w-full rounded-2xl p-5 border border-amber-300/30 shadow-[0_20px_50px_rgba(0,0,0,0.85)] flex flex-col max-h-[75vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-start justify-between border-b border-amber-200/15 pb-3">
          <div className="flex items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-400/15 text-amber-300 border border-amber-300/30">
              <BookOpen className="h-4 w-4" />
            </span>
            <div>
              <span className="somme-kicker text-amber-300/90 text-[10px]">Year 9 History · Trench Dispatches</span>
              <h3 className="font-heading text-xl font-bold uppercase tracking-wider text-[#f9efe1] leading-none mt-0.5">
                Trench Lore & Fun Facts
              </h3>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-7 w-7 items-center justify-center rounded-full border border-amber-200/20 text-amber-100/70 transition hover:border-amber-200/50 hover:bg-white/5 hover:text-white"
            aria-label="Close Fun Facts"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>

        {/* Category Filter Chips */}
        <div className="flex items-center gap-1.5 py-2.5 overflow-x-auto somme-scroll border-b border-amber-200/10">
          {categories.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => {
                setSelectedCategory(cat);
                setCurrentIndex(0);
              }}
              className={`px-2.5 py-1 rounded-full text-[10.5px] font-heading uppercase tracking-wider whitespace-nowrap transition ${
                selectedCategory === cat
                  ? 'bg-amber-300/25 text-amber-200 border border-amber-300/50 font-semibold'
                  : 'text-amber-100/50 hover:text-amber-100/80 hover:bg-white/5 border border-transparent'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Main Card Content */}
        <div className="flex-1 overflow-y-auto somme-scroll py-3.5 space-y-3">
          <div className="flex items-center justify-between text-[10.5px] font-mono">
            <span className="text-amber-300/90 font-semibold uppercase tracking-wider">
              {currentFact.category}
            </span>
            <span className="px-2 py-0.5 rounded-full bg-amber-950/60 border border-amber-400/30 text-amber-300 text-[9.5px]">
              {currentFact.humorLevel}
            </span>
          </div>

          <h4 className="font-heading text-lg sm:text-xl font-bold text-[#fff7ed] leading-snug">
            {currentFact.title}
          </h4>

          <p className="text-xs font-medium text-amber-200/90 leading-relaxed bg-amber-500/10 p-2.5 rounded-lg border border-amber-300/20">
            {currentFact.summary}
          </p>

          <p className="text-xs text-amber-100/75 leading-relaxed">
            {currentFact.details}
          </p>

          {currentFact.quote && (
            <div className="relative mt-2 p-3 rounded-lg bg-black/40 border-l-2 border-amber-400 text-xs italic text-amber-100/85">
              <Quote className="h-3 w-3 text-amber-400/50 absolute top-2 right-2" />
              <p>"{currentFact.quote}"</p>
              {currentFact.quoteSource && (
                <div className="not-italic text-[10px] font-mono text-amber-300/70 mt-1 text-right">
                  — {currentFact.quoteSource}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Navigation Controls */}
        <div className="pt-3 border-t border-amber-200/15 flex items-center justify-between">
          <span className="font-mono text-[11px] text-amber-200/60">
            {safeIndex + 1} / {filteredFacts.length}
          </span>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={handleRandom}
              title="Random Fact"
              className="flex h-8 items-center gap-1 px-2.5 rounded-full border border-amber-200/25 bg-black/40 text-amber-200 text-[11px] font-heading uppercase hover:border-amber-300 hover:text-white transition"
            >
              <Shuffle className="h-3 w-3" />
              <span>Shuffle</span>
            </button>
            <button
              type="button"
              onClick={handlePrev}
              title="Previous Fact"
              className="flex h-8 w-8 items-center justify-center rounded-full border border-amber-200/25 bg-black/40 text-amber-200 hover:border-amber-300 hover:text-white transition"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={handleNext}
              title="Next Fact"
              className="flex h-8 w-8 items-center justify-center rounded-full border border-amber-200/25 bg-black/40 text-amber-200 hover:border-amber-300 hover:text-white transition"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
