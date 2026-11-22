// state.js — the duel itself: sides, turns, damage, armour, wards.
// One clear job: the rules. Rendering never mutates this; input calls
// these functions and the renderer reads the result.

import { BEATS, MAX_HAND, MAX_MANA, START_HAND, START_LIFE } from './config.js';
import { buildDeck, drawCards } from './deck.js';
import { makeRng } from './rng.js';

export function makeSide(rng) {
  return {
    life: START_LIFE,
    maxLife: START_LIFE,
    mana: 0,
    maxMana: 0,
    armor: 0,
    ward: null,      // element of the last card this side played
    hand: [],
    deck: buildDeck(rng),
    played: [],      // cards played this turn, shown on the table
    damageDealt: 0,
  };
}

export function createGame(seed) {
  const rng = makeRng(seed ?? null);
  const game = {
    rng,
    seed: seed ?? null,
    phase: 'title',        // 'title' | 'playing' | 'won' | 'lost'
    turn: 0,
    playerTurn: true,
    aiBusy: false,
    player: makeSide(rng),
    opponent: makeSide(rng),
    log: ['Welcome to Emberclash.'],
    floats: [],            // floating damage numbers {x, y, text, color, t}
    banner: null,          // {text, t} centre-screen flash
    flyCard: null,         // {card, fromX, fromY, t} played-card flight
    winner: null,
    turnsPlayed: 0,
    muted: false,
    frozen: false,         // screenshot staging freezes the frame
    selectedUid: null,     // card hovered/selected for the detail pane
    message: '',
  };
  drawCards(game.player.hand, game.player.deck, START_HAND, MAX_HAND);
  drawCards(game.opponent.hand, game.opponent.deck, START_HAND, MAX_HAND);
  return game;
}

export function startDuel(game) {
  game.phase = 'playing';
  game.turn = 1;
  game.turnsPlayed = 0;
  game.playerTurn = true;
  game.log = ['The duel begins. Your turn — play a card, then end your turn.'];
  startPlayerTurn(game);
}

export function startPlayerTurn(game) {
  game.playerTurn = true;
  game.player.maxMana = Math.min(game.turn, MAX_MANA);
  game.player.mana = game.player.maxMana;
  game.player.played = [];
  game.opponent.played = [];
  drawCards(game.player.hand, game.player.deck, 1, MAX_HAND);
  game.log.push(`Turn ${game.turn}: you draw a card and gain ${game.player.maxMana} mana.`);
}

export function endPlayerTurn(game) {
  if (game.phase !== 'playing' || !game.playerTurn || game.aiBusy) return false;
  game.playerTurn = false;
  game.turnsPlayed += 1;
  game.log.push('You end your turn.');
  return true;
}

export function startOpponentTurn(game) {
  game.turn += 1;
  game.opponent.maxMana = Math.min(game.turn, MAX_MANA);
  game.opponent.mana = game.opponent.maxMana;
  game.opponent.played = [];
  drawCards(game.opponent.hand, game.opponent.deck, 1, MAX_HAND);
  game.log.push(`Turn ${game.turn}: the rival draws and gains ${game.opponent.maxMana} mana.`);
}

export function finishOpponentTurn(game) {
  game.aiBusy = false;
  if (game.phase === 'playing') startPlayerTurn(game);
}

// Element advantage: an attack beats the defender's ward element.
export function elementBonus(attackElement, defenderWard) {
  if (!defenderWard) return 0;
  return BEATS[attackElement] === defenderWard ? 2 : 0;
}

function addFloat(game, x, y, text, color) {
  game.floats.push({ x, y, text, color, t: 0 });
}

export function dealDamage(game, attacker, defender, amount, opts = {}) {
  let remaining = amount;
  let absorbed = 0;
  if (!opts.ignoreArmor && defender.armor > 0) {
    absorbed = Math.min(defender.armor, remaining);
    defender.armor -= absorbed;
    remaining -= absorbed;
  }
  defender.life = Math.max(0, defender.life - remaining);
  attacker.damageDealt += remaining;
  return { dealt: remaining, absorbed };
}

// Play one card from a side's hand. Returns a result object or null when
// the play is illegal (wrong phase, not enough mana, card not in hand).
export function playCard(game, side, cardUid, origin = { x: 640, y: 360 }) {
  if (game.phase !== 'playing') return null;
  const hand = side.hand;
  const index = hand.findIndex((c) => c.uid === cardUid);
  if (index < 0) return null;
  const card = hand[index];
  if (card.cost > side.mana) return null;

  const foe = side === game.player ? game.opponent : game.player;
  const isPlayer = side === game.player;
  side.mana -= card.cost;
  hand.splice(index, 1);
  side.played.push(card);
  side.ward = card.element;

  const fx = isPlayer ? 640 : 640;
  const fy = isPlayer ? 300 : 420;
  game.flyCard = { card, fromX: origin.x, fromY: origin.y, t: 0 };
  let result = { card, bonus: 0, dealt: 0, absorbed: 0, healed: 0, armor: 0, drawn: 0 };

  if (card.kind === 'attack') {
    const bonus = elementBonus(card.element, foe.ward);
    const total = card.attack + bonus;
    result.bonus = bonus;
    const hit = dealDamage(game, side, foe, total);
    result.dealt = hit.dealt;
    result.absorbed = hit.absorbed;
    addFloat(game, fx, fy, `-${hit.dealt}`, bonus > 0 ? '#ffd94d' : '#ff6b5e');
    if (bonus > 0) game.banner = { text: 'SUPER EFFECTIVE! +2', t: 0 };
    if (card.heal) {
      side.life = Math.min(side.maxLife, side.life + card.heal);
      result.healed = card.heal;
    }
    game.log.push(`${isPlayer ? 'You play' : 'Rival plays'} ${card.name} (${card.element}) — ${total} damage${bonus ? ' (ward break!)' : ''}.`);
  } else if (card.kind === 'guard') {
    side.armor += card.armor;
    result.armor = card.armor;
    addFloat(game, fx, fy, `+${card.armor} armour`, '#b8c4cc');
    game.log.push(`${isPlayer ? 'You play' : 'Rival plays'} ${card.name} — +${card.armor} armour.`);
  } else if (card.kind === 'trick') {
    if (card.trick === 'draw') {
      const drawn = drawCards(side.hand, side.deck, 2, MAX_HAND);
      result.drawn = drawn.length;
      addFloat(game, fx, fy, `Draw ${drawn.length}`, '#a8dcf5');
      game.log.push(`${isPlayer ? 'You play' : 'Rival plays'} ${card.name} — draws ${drawn.length}.`);
    } else if (card.trick === 'heal') {
      const healed = Math.min(4, side.maxLife - side.life);
      side.life += healed;
      result.healed = healed;
      addFloat(game, fx, fy, `+${healed} life`, '#7be495');
      game.log.push(`${isPlayer ? 'You play' : 'Rival plays'} ${card.name} — restores ${healed} life.`);
    } else if (card.trick === 'shatter') {
      const hit = dealDamage(game, side, foe, card.attack, { ignoreArmor: true });
      result.dealt = hit.dealt;
      addFloat(game, fx, fy, `-${hit.dealt} (shatter!)`, '#ffd94d');
      game.log.push(`${isPlayer ? 'You play' : 'Rival plays'} ${card.name} — ${hit.dealt} damage through armour!`);
    }
  }

  checkEnd(game);
  return result;
}

export function checkEnd(game) {
  if (game.phase !== 'playing') return;
  if (game.opponent.life <= 0) {
    game.phase = 'won';
    game.winner = 'player';
    game.log.push('Victory! The rival’s last spark goes out.');
  } else if (game.player.life <= 0) {
    game.phase = 'lost';
    game.winner = 'opponent';
    game.log.push('Defeat. Your last spark goes out.');
  }
}

export function resetGame(game) {
  const fresh = createGame(game.seed);
  Object.keys(fresh).forEach((k) => { game[k] = fresh[k]; });
  game.frozen = false;
}
