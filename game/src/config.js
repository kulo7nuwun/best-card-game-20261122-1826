// config.js — tuning, colours and element wheel for Emberclash.
// One clear job: every number the rest of the game reads lives here.

export const CANVAS_W = 1280;
export const CANVAS_H = 720;

export const START_LIFE = 20;
export const MAX_HAND = 7;
export const DECK_SIZE = 30;
export const MAX_MANA = 10;
export const START_HAND = 4;

// The four sparks. Each beats the next one in the wheel:
// Ember > Leaf > Stone > Tide > Ember. An attack whose element beats the
// defender's ward element deals +2 damage.
export const ELEMENTS = {
  ember: { name: 'Ember', color: '#e8491d', dark: '#8f2a0e', light: '#ffb199', glyph: 'flame' },
  tide:  { name: 'Tide',  color: '#2b9fd8', dark: '#145a80', light: '#a8dcf5', glyph: 'drop' },
  leaf:  { name: 'Leaf',  color: '#58b368', dark: '#2c6b38', light: '#b7e8bf', glyph: 'leaf' },
  stone: { name: 'Stone', color: '#d9a441', dark: '#7d5a16', light: '#f2d492', glyph: 'gem' },
};
export const ELEMENT_ORDER = ['ember', 'leaf', 'stone', 'tide'];
export const BEATS = { ember: 'leaf', leaf: 'stone', stone: 'tide', tide: 'ember' };

export const CARD_W = 128;
export const CARD_H = 178;
export const CARD_GAP = 14;

export const COLORS = {
  table: '#20301f',
  tableEdge: '#101a10',
  felt: '#2a4a2c',
  feltLight: '#33593a',
  gold: '#f2c14e',
  cream: '#fff3d6',
  ink: '#241a10',
  panel: 'rgba(12, 18, 12, 0.82)',
  panelEdge: '#f2c14e',
  player: '#58b368',
  opponent: '#e8491d',
  mana: '#4db2ff',
  armor: '#b8c4cc',
  danger: '#ff5a4e',
};

export const TUNING = {
  aiThinkMs: 520,      // pause between the opponent's plays
  floatTextMs: 1100,   // floating damage numbers
  bannerMs: 1400,      // "SUPER EFFECTIVE!" banner
  cardFlyMs: 420,      // played card flight to the table centre
};
