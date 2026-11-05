export type SectorSide = 'British sector' | 'No Man’s Land' | 'German sector';

export interface Hotspot {
  id: string;
  index: number;
  side: SectorSide;
  title: string;
  intro: string;
  pos: [number, number]; // [x, z]
  cam: [number, number, number]; // [camX, camY, camZ]
  bullets: string[];
}

export interface WeaponSpec {
  label: string;
  value: string;
}

export interface Weapon {
  id: string;
  name: string;
  short: string;
  category: 'Rifles & sidearms' | 'Machine guns' | 'Trench assault' | 'Armour';
  nation: 'British & Empire' | 'German' | 'British';
  year: number;
  summary: string;
  specs: WeaponSpec[];
  points: string[];
}

export interface FunFact {
  id: string;
  category: 'Haig’s "Dumb" Plan' | 'Trench Humor & Morale' | 'Bizarre Trench Life' | 'Somme Curiosities';
  title: string;
  summary: string;
  details: string;
  quote?: string;
  quoteSource?: string;
  humorLevel: 'Absurd' | 'Tragicomedy' | 'Ingenious' | 'Mind-boggling';
}


