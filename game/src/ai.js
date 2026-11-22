// ai.js — the rival's brain.
// One clear job: decide which cards the opponent plays each turn.
// Readable and counterable by design: it goes for lethal, guards when
// hurt, otherwise spends its mana on its biggest attacks first.

import { BEATS, TUNING } from './config.js';
import { finishOpponentTurn, playCard } from './state.js';

function scoreCard(game, card) {
  const foe = game.player;
  const me = game.opponent;
  if (card.kind === 'attack') {
    let value = card.attack * 2;
    if (BEATS[card.element] === foe.ward) value += 4; // break the ward
    if (card.attack >= foe.life) value += 100;        // lethal
    if (card.heal) value += 3;
    return value;
  }
  if (card.kind === 'guard') {
    if (me.life <= 8) return 30 + card.armor * 2;
    if (foe.damageDealt > 0 && me.life <= 12) return 12 + card.armor;
    return 2;
  }
  if (card.trick === 'draw') return me.hand.length <= 2 ? 18 : 4;
  if (card.trick === 'heal') return me.life <= me.maxLife - 3 ? 22 : 1;
  if (card.trick === 'shatter') {
    let value = card.attack * 2 + (foe.armor > 0 ? 8 : 0);
    if (card.attack >= foe.life) value += 100;
    return value;
  }
  return 0;
}

// Pick the rival's next play: the best affordable card by score, or null.
export function chooseAiCard(game) {
  const affordable = game.opponent.hand.filter((c) => c.cost <= game.opponent.mana);
  if (affordable.length === 0) return null;
  let best = null;
  let bestScore = -1;
  for (const card of affordable) {
    const score = scoreCard(game, card);
    if (score > bestScore) {
      bestScore = score;
      best = card;
    }
  }
  // A cautious rival sometimes holds a weak guard for later.
  if (best && best.kind === 'guard' && bestScore < 5 && game.rng() < 0.5) return null;
  return best;
}

// Run the opponent's whole turn as timed steps so the player can watch
// each card land. Calls onDone when the turn is over (or the duel ends).
export function runAiTurn(game, onDone) {
  game.aiBusy = true;
  let steps = 0;
  const step = () => {
    if (game.phase !== 'playing') { game.aiBusy = false; onDone(); return; }
    const card = chooseAiCard(game);
    steps += 1;
    if (!card || steps > 12) {
      game.log.push('The rival ends their turn.');
      finishOpponentTurn(game);
      onDone();
      return;
    }
    playCard(game, game.opponent, card.uid, { x: 640, y: 130 });
    setTimeout(step, TUNING.aiThinkMs);
  };
  setTimeout(step, TUNING.aiThinkMs);
}
