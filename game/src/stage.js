// stage.js — screenshot staging for the maker's own screenshots.
// A ?shot=... query param poses the game for a still frame: it sets the
// duel to a moment worth showing. It only runs when the page is opened
// with the parameter, never during normal play. The frame is frozen so
// the pose does not drift while the screenshot is taken.

import { startDuel } from './state.js';

function pickHandCards(game, side, ids) {
  // Pull named cards out of the side's deck into its hand, so the staged
  // hand shows readable, varied cards instead of a random draw.
  const hand = [];
  for (const id of ids) {
    const i = side.deck.findIndex((c) => c.id === id);
    if (i >= 0) hand.push(side.deck.splice(i, 1)[0]);
  }
  while (hand.length < 5 && side.deck.length > 0) hand.push(side.deck.pop());
  side.hand = hand.slice(0, 5);
}

export function applyStage(game, params) {
  const shot = params.get('shot');
  if (!shot) return;
  game.frozen = true;

  if (shot === 'start') {
    game.phase = 'title';
    return;
  }

  // Every other shot is a duel already under way.
  startDuel(game);
  game.turn = 4;
  game.player.maxMana = 4;
  game.player.mana = 4;
  game.opponent.maxMana = 4;
  game.opponent.mana = 3;

  if (shot === 'play') {
    // Mid-game, both hands full, life totals dented, wards set, and a
    // card already on the table so the cover reads as a real duel.
    game.player.life = 14;
    game.player.armor = 2;
    game.opponent.life = 11;
    game.opponent.armor = 1;
    game.player.ward = 'ember';
    game.opponent.ward = 'leaf';
    pickHandCards(game, game.player, ['flame-lash', 'cinder-imp', 'grove-guard', 'deep-current', 'spark-sprite']);
    pickHandCards(game, game.opponent, ['thorn-vine', 'mist-wisp', 'boulder-throw', 'cinder-imp', 'pebble-guard']);
    game.player.played = [game.player.deck.find((c) => c.id === 'pyre-drake') || game.player.hand[0]];
    game.opponent.played = [game.opponent.deck.find((c) => c.id === 'quake-fist') || game.opponent.hand[0]];
    game.player.damageDealt = 9;
    game.opponent.damageDealt = 6;
    game.turnsPlayed = 3;
    game.selectedUid = game.player.hand[0] ? game.player.hand[0].uid : null;
    game.log = [
      'The duel begins. Your turn — play a card, then end your turn.',
      'Turn 2: you play Flame Lash (ember) — 4 damage.',
      'Turn 2: the rival plays Thorn Vine (leaf) — 3 damage.',
      'Turn 3: you play Pyre Drake (ember) — 8 damage (ward break!).',
      'Turn 3: the rival plays Quake Fist — 6 damage through armour!',
      'Turn 4: you draw a card and gain 4 mana.',
    ];
    return;
  }

  if (shot === 'win') {
    game.phase = 'won';
    game.winner = 'player';
    game.player.life = 6;
    game.player.armor = 0;
    game.opponent.life = 0;
    game.opponent.armor = 0;
    game.player.damageDealt = 26;
    game.opponent.damageDealt = 14;
    game.turnsPlayed = 9;
    game.turn = 9;
    game.log = [
      'Turn 9: you play Pyre Drake (ember) — 8 damage (ward break!).',
      'Victory! The rival’s last spark goes out.',
    ];
    return;
  }

  if (shot === 'lose') {
    game.phase = 'lost';
    game.winner = 'opponent';
    game.player.life = 0;
    game.player.armor = 0;
    game.opponent.life = 9;
    game.opponent.armor = 2;
    game.player.damageDealt = 11;
    game.opponent.damageDealt = 23;
    game.turnsPlayed = 8;
    game.turn = 8;
    game.log = [
      'Turn 8: the rival plays Deep Current (tide) — 5 damage.',
      'Defeat. Your last spark goes out.',
    ];
    return;
  }
}
