// deck.js — the card catalogue and the deck.
// Original cards, original names. Each card is one idea: an attack, a
// guard, or a trick that draws, heals or breaks armour.
// kind: 'attack' | 'guard' | 'trick'
// trick: 'draw' (draw 2) | 'heal' (restore 3 life) | 'shatter' (ignore armour)

export const CARD_DEFS = [
  { id: 'cinder-imp',    name: 'Cinder Imp',    element: 'ember', cost: 1, kind: 'attack', attack: 2, copies: 3, text: 'A small spark with a big temper.' },
  { id: 'flame-lash',    name: 'Flame Lash',    element: 'ember', cost: 2, kind: 'attack', attack: 4, copies: 2, text: 'A whip of living fire.' },
  { id: 'pyre-drake',    name: 'Pyre Drake',    element: 'ember', cost: 5, kind: 'attack', attack: 8, copies: 1, text: 'Its wings are the whole horizon burning.' },
  { id: 'spark-sprite',  name: 'Spark Sprite',  element: 'ember', cost: 1, kind: 'trick',  trick: 'draw', copies: 2, text: 'Draw 2 cards. It giggles as it goes.' },
  { id: 'ash-phoenix',   name: 'Ash Phoenix',   element: 'ember', cost: 6, kind: 'attack', attack: 9, copies: 1, text: 'Heal 3 life when it strikes.' , heal: 3 },
  { id: 'tidecaller',    name: 'Tidecaller',    element: 'tide',  cost: 2, kind: 'attack', attack: 3, copies: 2, text: 'Heal 2 life when it strikes.', heal: 2 },
  { id: 'deep-current',  name: 'Deep Current',  element: 'tide',  cost: 3, kind: 'attack', attack: 5, copies: 2, text: 'The river does not argue. It wins.' },
  { id: 'mist-wisp',     name: 'Mist Wisp',     element: 'tide',  cost: 1, kind: 'guard',  armor: 2, copies: 2, text: 'Gain 2 armour. Hard to hold, harder to hit.' },
  { id: 'thorn-vine',    name: 'Thorn Vine',    element: 'leaf',  cost: 2, kind: 'attack', attack: 3, copies: 2, text: 'It grows back faster than you cut it.' },
  { id: 'grove-guard',   name: 'Grove Guardian',element: 'leaf',  cost: 3, kind: 'guard',  armor: 5, copies: 2, text: 'Gain 5 armour. The old tree stands.' },
  { id: 'spore-burst',   name: 'Spore Burst',   element: 'leaf',  cost: 4, kind: 'attack', attack: 6, copies: 1, text: 'A cloud of spores, every one of them angry.' },
  { id: 'pebble-guard',  name: 'Pebble Guard',  element: 'stone', cost: 1, kind: 'guard',  armor: 3, copies: 3, text: 'Gain 3 armour. Small, round, unmoved.' },
  { id: 'boulder-throw', name: 'Boulder Throw', element: 'stone', cost: 3, kind: 'attack', attack: 5, copies: 2, text: 'Simple. Heavy. Final.' },
  { id: 'quake-fist',    name: 'Quake Fist',    element: 'stone', cost: 4, kind: 'trick',  trick: 'shatter', attack: 6, copies: 1, text: 'Deal 6 damage, ignoring armour.' },
  { id: 'spring-well',   name: 'Spring Well',   element: 'tide',  cost: 2, kind: 'trick',  trick: 'heal', copies: 2, text: 'Restore 4 life. Drink deep.' },
];

// Build one fresh 30-card deck (copies per definition), shuffled with rng.
export function buildDeck(rng) {
  const deck = [];
  for (const def of CARD_DEFS) {
    for (let i = 0; i < def.copies; i++) {
      deck.push({ ...def, uid: `${def.id}-${i}-${Math.floor(rng() * 1e9)}` });
    }
  }
  return shuffleDeck(deck, rng);
}

export function shuffleDeck(deck, rng) {
  for (let i = deck.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }
  return deck;
}

// Draw up to n cards into a hand, respecting the hand-size cap.
export function drawCards(hand, deck, n, maxHand) {
  const drawn = [];
  while (drawn.length < n && hand.length < maxHand && deck.length > 0) {
    const card = deck.pop();
    hand.push(card);
    drawn.push(card);
  }
  return drawn;
}
