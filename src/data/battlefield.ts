import { Hotspot, SectorSide } from '../types';

export interface SectorMeta {
  side: SectorSide;
  label: string;
  color: string;
  hexNumber: number;
  badgeClass: string;
}

export const SECTORS_META: Record<SectorSide, SectorMeta> = {
  'British sector': {
    side: 'British sector',
    label: 'British sector (Trenches)',
    color: '#ef4444', // Red as requested
    hexNumber: 0xef4444,
    badgeClass: 'hs-label-british',
  },
  'No Man’s Land': {
    side: 'No Man’s Land',
    label: 'No Man’s Land (Shells & Craters)',
    color: '#eab308', // Yellow as requested
    hexNumber: 0xeab308,
    badgeClass: 'hs-label-nml',
  },
  'German sector': {
    side: 'German sector',
    label: 'German sector (Deep Dugouts & MGs)',
    color: '#22c55e', // Green as requested
    hexNumber: 0x22c55e,
    badgeClass: 'hs-label-german',
  },
};

export const SECTORS_LEGEND = [
  { label: 'British sector', color: '#ef4444', desc: 'Red markers' },
  { label: 'No Man’s Land', color: '#eab308', desc: 'Yellow markers' },
  { label: 'German sector', color: '#22c55e', desc: 'Green markers' },
];

export const HOTSPOTS: Hotspot[] = [
  {
    id: 'british-front-line',
    index: 1,
    side: 'British sector',
    title: 'British Front Line',
    intro: 'The forward fire trench, held by British and Empire infantry.',
    pos: [-16, 8],
    cam: [-28, 9, 20],
    bullets: [
      '“Stand-to” happened in the hour before dawn. Every man climbed onto the fire step with his bayonet fixed, in case the enemy attacked at first light.',
      'A battalion typically spent just a few days in the front line at a time before rotating back through support and reserve, with short rests behind the lines in between.',
      'Dawn and dusk were the most dangerous hours: the light was too poor to aim well, so raids and attacks often began then.',
    ],
  },
  {
    id: 'british-fire-step',
    index: 2,
    side: 'British sector',
    title: 'The Fire Step',
    intro: 'A raised platform that let a soldier see over the parapet.',
    pos: [-14.2, -4],
    cam: [-23, 7, 9],
    bullets: [
      'The fire step was built up from earth and timber so a man could stand high enough to fire over the sandbag parapet.',
      'Sentries watched No Man’s Land through a periscope — a box with two mirrors — so they could look without showing their heads.',
      'Loopholes were left between sandbags, sometimes protected by a steel plate, for shooting through.',
      'German snipers watched the same gaps. A head raised above the parapet could be hit within seconds, even in near-darkness.',
    ],
  },
  {
    id: 'british-comms',
    index: 3,
    side: 'British sector',
    title: 'Communications Trench',
    intro: 'The narrow supply routes linking the front line to the rear.',
    pos: [-20.5, 19],
    cam: [-22, 8, 33],
    bullets: [
      'Communication trenches ran backwards at an angle, connecting the front line to the support and reserve lines.',
      'Rations came up at night: bully beef (tinned corned beef), hard biscuits, tins of water, jam and a small rum ration.',
      'Carrying parties could walk miles in the dark with heavy loads — and still be shelled on the way.',
      'Stretcher-bearers brought the wounded back down the same narrow trenches, which often flooded with mud and water.',
    ],
  },
  {
    id: 'british-dugout',
    index: 4,
    side: 'British sector',
    title: 'British Dugout',
    intro: 'Shelters cut into the trench wall — damp, cramped and crowded.',
    pos: [-17.4, -16],
    cam: [-27, 7, -7],
    bullets: [
      'British dugouts on the Somme were usually shallow: a few steps down, roofed with timber and soil. They offered very little protection from heavy shells.',
      'German dugouts were far deeper, which is one reason the week-long British bombardment did not destroy the defenders.',
      'Rats came for the food and the corpses; lice lived in the seams of uniforms and spread trench fever.',
      'Days standing in cold, wet mud caused “trench foot”, which could turn gangrenous and lead to amputation.',
    ],
  },
  {
    id: 'british-command',
    index: 5,
    side: 'British sector',
    title: 'British Command Post',
    intro: 'Where the plan for 1 July 1916 was made.',
    pos: [-28.8, -4.6],
    cam: [-30.5, 9, 8],
    bullets: [
      'General Douglas Haig, commander of the British Expeditionary Force, ordered a seven-day artillery bombardment before the infantry attack.',
      'About 1.5 million shells were fired to cut the German wire and smash the trenches, dugouts and guns.',
      'It failed. Roughly a third of British shells did not explode, much of the wire survived, and the deep German shelters protected most defenders.',
      'The bombardment also warned the Germans that an attack was coming, giving them time to bring up more machine guns.',
      'At 7:30 a.m. on 1 July the infantry were ordered forward in long lines across No Man’s Land.',
    ],
  },
  {
    id: 'nml-wire',
    index: 6,
    side: 'No Man’s Land',
    title: 'Barbed Wire Belt',
    intro: 'Multiple belts of German wire covering every approach.',
    pos: [-9.6, 6],
    cam: [-20, 7, 17],
    bullets: [
      'German wire was often two or three metres high and many rows deep, fixed to screw pickets that were hard for shells to hit.',
      'Wire-cutting patrols crawled out at night to cut gaps, but those gaps were exactly where machine guns were aimed.',
      'Both sides repaired and extended their wire at night — stringing new coils across No Man’s Land in the dark.',
      'Wire slowed attackers to walking pace and held them in the open while machine guns swept the field.',
    ],
  },
  {
    id: 'nml-craters',
    index: 7,
    side: 'No Man’s Land',
    title: 'Shell Craters & Bombardment',
    intro: 'The churned, waterlogged ground between the armies.',
    pos: [0, 1],
    cam: [3, 12, 16],
    bullets: [
      'Heavy shells dug craters several metres deep. After rain they filled with muddy, brown water.',
      'Craters gave some cover, but they also broke up formations and made it almost impossible to move quickly.',
      'On 1 July 1916 the British army suffered 57,470 casualties, of whom 19,240 were killed — the bloodiest day in its history.',
      'Many soldiers carried about 30 kg of kit. Once a man fell into deep mud or water, he often could not get up again.',
    ],
  },
  {
    id: 'nml-tank',
    index: 8,
    side: 'No Man’s Land',
    title: 'Mark I Tank Track',
    intro: 'The first tanks in history, 15 September 1916.',
    pos: [8.8, -7.4],
    cam: [17, 8.5, -0.5],
    bullets: [
      'Tanks first went into action at Flers-Courcelette on 15 September 1916, during the Battle of the Somme.',
      'The Mark I was designed to crush barbed wire and cross trenches, with a rhomboid shape and tracks running right around the body.',
      'It moved at walking pace — about 6 km/h — and broke down constantly. Of 49 machines shipped, only a handful reached the start line.',
      'Its real weapon was fear: German soldiers had never seen anything like it. It also showed a way forward for later battles.',
    ],
  },
  {
    id: 'german-mg',
    index: 9,
    side: 'German sector',
    title: 'MG 08 Emplacement',
    intro: 'The machine-gun nest that stopped the advance.',
    pos: [13, 4],
    cam: [3, 7, 13],
    bullets: [
      'German defenders sited their machine guns to fire across No Man’s Land in overlapping arcs, so every gap was covered by another gun.',
      'The MG 08 was water-cooled and could fire 400–500 rounds a minute from long belts of ammunition.',
      'Guns were protected by concrete shelters and steel plates, often placed on rising ground or behind a slope.',
      'Machine guns caused a large share of British losses on 1 July. Survivors described the shelling stopping, then the rattle of machine guns beginning.',
    ],
  },
  {
    id: 'german-stollen',
    index: 10,
    side: 'German sector',
    title: 'Deep Chalk Dugout (Stollen)',
    intro: 'German shelters dug far below the trench floor.',
    pos: [17.4, -13],
    cam: [26, 8, -2],
    bullets: [
      'German engineers dug shelters up to 10–15 metres down into the chalk, far below the reach of most British shells.',
      'Some had stairways, bunks, ventilation, electric light and telephone lines, so whole companies could shelter through hours of bombardment.',
      'When the shelling stopped, the defenders climbed back up and manned their machine guns before the infantry arrived.',
      'This is one of the most important reasons the first day of the Somme went so badly for the British.',
    ],
  },
  {
    id: 'german-reserve',
    index: 11,
    side: 'German sector',
    title: 'German Reserve Line',
    intro: 'Fresh troops waiting behind the front.',
    pos: [25, 9],
    cam: [35, 9, 21],
    bullets: [
      'Behind the front line the Germans held support and reserve trenches, where fresh troops waited out of range of the heaviest shelling.',
      'Reserves were rushed forward to plug gaps and to counter-attack before the attackers could reorganise.',
      'German commanders used telephone lines, runners and flares to coordinate — so British artillery tried to cut those links.',
      'Deep communication trenches let defenders move men forward much faster than attackers could cross open ground.',
    ],
  },
  {
    id: 'artillery-battery',
    index: 12,
    side: 'British sector',
    title: 'Artillery Battery',
    intro: 'The guns that caused most of the war’s casualties.',
    pos: [-33, 16],
    cam: [-22, 9, 28],
    bullets: [
      'Artillery caused more than 60% of all battlefield casualties in the First World War.',
      'British field artillery used the 18-pounder gun and heavier howitzers, which fired shells in a high arc down into trenches.',
      'Counter-battery fire tried to knock out enemy guns, using sound-ranging and flash-spotting to work out where they were hidden.',
      'On the Somme the guns fired a “creeping barrage” — a wall of exploding shells that moved forward just ahead of the infantry. On 1 July many soldiers were too slow in the mud to keep up with it.',
    ],
  },
  {
    id: 'listening-post',
    index: 13,
    side: 'No Man’s Land',
    title: 'Listening Post',
    intro: 'A hidden outpost in a crater, ahead of the wire.',
    pos: [-6.5, -18],
    cam: [-13, 6.5, -7],
    bullets: [
      'A listening post was a small, hidden position pushed out into No Man’s Land to hear the enemy before they were seen.',
      'Men lay still for hours, sometimes pressing a listening device to the ground to pick up digging or troop movement.',
      'Raids on enemy trenches were mounted to capture prisoners, who could be questioned about units, plans and morale.',
      'Life in a listening post was cold, wet and lonely — and it was one of the most dangerous jobs in the trench system.',
    ],
  },
];
