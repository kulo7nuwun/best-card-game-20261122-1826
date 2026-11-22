// render.js — everything the player sees, drawn on one canvas.
// One clear job: turn game state into pixels. It never mutates state
// except the tiny animation clocks the main loop advances.

import { CANVAS_H, CANVAS_W, CARD_H, CARD_W, COLORS, ELEMENTS, TUNING } from './config.js';

const ctxCache = new WeakMap();

export function getCtx(canvas) {
  if (!ctxCache.has(canvas)) ctxCache.set(canvas, canvas.getContext('2d'));
  return ctxCache.get(canvas);
}

function rr(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function text(ctx, str, x, y, size, color, align = 'center', weight = 'bold', font = 'system-ui, sans-serif') {
  ctx.fillStyle = color;
  ctx.font = `${weight} ${size}px ${font}`;
  ctx.textAlign = align;
  ctx.textBaseline = 'middle';
  ctx.fillText(str, x, y);
}

// --- element glyphs, drawn as shapes so suits are told apart by
// colour AND shape, never by text alone. ---
export function drawGlyph(ctx, glyph, cx, cy, s, color) {
  ctx.save();
  ctx.fillStyle = color;
  ctx.strokeStyle = color;
  ctx.lineWidth = Math.max(2, s * 0.08);
  ctx.beginPath();
  if (glyph === 'flame') {
    ctx.moveTo(cx, cy - s);
    ctx.bezierCurveTo(cx + s * 0.9, cy - s * 0.2, cx + s * 0.55, cy + s * 0.45, cx, cy + s * 0.8);
    ctx.bezierCurveTo(cx - s * 0.55, cy + s * 0.45, cx - s * 0.9, cy - s * 0.2, cx, cy - s);
  } else if (glyph === 'drop') {
    ctx.moveTo(cx, cy - s);
    ctx.bezierCurveTo(cx + s * 0.8, cy - s * 0.1, cx + s * 0.7, cy + s * 0.75, cx, cy + s * 0.8);
    ctx.bezierCurveTo(cx - s * 0.7, cy + s * 0.75, cx - s * 0.8, cy - s * 0.1, cx, cy - s);
  } else if (glyph === 'leaf') {
    ctx.moveTo(cx - s * 0.8, cy + s * 0.7);
    ctx.quadraticCurveTo(cx - s * 0.9, cy - s * 0.8, cx + s * 0.8, cy - s * 0.7);
    ctx.quadraticCurveTo(cx + s * 0.9, cy + s * 0.8, cx - s * 0.8, cy + s * 0.7);
  } else { // gem
    ctx.moveTo(cx, cy - s);
    ctx.lineTo(cx + s * 0.75, cy);
    ctx.lineTo(cx, cy + s);
    ctx.lineTo(cx - s * 0.75, cy);
  }
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

function drawCardBack(ctx, x, y, w, h) {
  rr(ctx, x, y, w, h, 10);
  ctx.fillStyle = '#3a2417';
  ctx.fill();
  ctx.strokeStyle = COLORS.gold;
  ctx.lineWidth = 2;
  ctx.stroke();
  rr(ctx, x + 8, y + 8, w - 16, h - 16, 7);
  ctx.strokeStyle = 'rgba(242, 193, 78, 0.55)';
  ctx.stroke();
  drawGlyph(ctx, 'flame', x + w / 2, y + h / 2, Math.min(w, h) * 0.22, COLORS.gold);
}

function drawManaGem(ctx, x, y, r, filled) {
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fillStyle = filled ? COLORS.mana : 'rgba(77, 178, 255, 0.18)';
  ctx.fill();
  ctx.strokeStyle = '#0e2a44';
  ctx.lineWidth = 1.5;
  ctx.stroke();
}

function drawLifeBar(ctx, x, y, w, life, maxLife, armor) {
  rr(ctx, x, y, w, 26, 13);
  ctx.fillStyle = 'rgba(0,0,0,0.55)';
  ctx.fill();
  const frac = Math.max(0, life / maxLife);
  if (frac > 0) {
    rr(ctx, x + 2, y + 2, (w - 4) * frac, 22, 11);
    ctx.fillStyle = life <= 5 ? COLORS.danger : '#e8491d';
    if (life > 10) ctx.fillStyle = '#58b368';
    else if (life > 5) ctx.fillStyle = '#f2c14e';
    ctx.fill();
  }
  text(ctx, `${life} / ${maxLife}`, x + w / 2, y + 14, 15, COLORS.cream);
  if (armor > 0) {
    rr(ctx, x + w + 10, y, 58, 26, 13);
    ctx.fillStyle = '#5d6d7a';
    ctx.fill();
    text(ctx, `ARM ${armor}`, x + w + 39, y + 14, 14, '#ffffff');
  }
}

function drawWardBadge(ctx, x, y, ward) {
  if (!ward) {
    text(ctx, 'Ward: —', x, y, 13, 'rgba(255,243,214,0.6)', 'left', 'normal');
    return;
  }
  const el = ELEMENTS[ward];
  text(ctx, 'Ward:', x, y, 13, 'rgba(255,243,214,0.8)', 'left', 'normal');
  drawGlyph(ctx, el.glyph, x + 52, y, 9, el.color);
  text(ctx, el.name, x + 68, y, 13, el.light, 'left');
}

export function drawCard(ctx, card, x, y, w, h, opts = {}) {
  const el = ELEMENTS[card.element];
  const hover = opts.hover ? -16 : 0;
  const yy = y + hover;
  ctx.save();
  if (opts.dim) ctx.globalAlpha = 0.45;
  rr(ctx, x, yy, w, h, 12);
  ctx.fillStyle = '#f7ecd2';
  ctx.fill();
  ctx.strokeStyle = opts.selected ? COLORS.gold : el.dark;
  ctx.lineWidth = opts.selected ? 4 : 2.5;
  ctx.stroke();
  // element band
  rr(ctx, x + 4, yy + 4, w - 8, 30, 8);
  ctx.fillStyle = el.color;
  ctx.fill();
  text(ctx, el.name.toUpperCase(), x + w / 2, yy + 20, 13, '#ffffff');
  // cost gem
  ctx.beginPath();
  ctx.arc(x + 20, yy + 52, 15, 0, Math.PI * 2);
  ctx.fillStyle = '#2b6cb0';
  ctx.fill();
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 2;
  ctx.stroke();
  text(ctx, String(card.cost), x + 20, yy + 53, 16, '#ffffff');
  // art glyph (centred on the card body, sized to the card)
  drawGlyph(ctx, el.glyph, x + w / 2, yy + h * 0.5, Math.min(w, h) * 0.19, el.color);
  // name and value, anchored to the bottom so small and large cards agree
  text(ctx, card.name, x + w / 2, yy + h - 38, 13, COLORS.ink);
  const value = card.kind === 'attack'
    ? `ATK ${card.attack}`
    : card.kind === 'guard'
      ? `ARM +${card.armor}`
      : card.trick === 'draw' ? 'Draw 2 cards'
      : card.trick === 'heal' ? 'Heal 4 life'
      : `ATK ${card.attack} · ignores armour`;
  // value line, shrunk to fit the card's width
  let valueSize = 12;
  ctx.font = `bold ${valueSize}px system-ui, sans-serif`;
  while (ctx.measureText(value).width > w - 10 && valueSize > 8) {
    valueSize -= 1;
    ctx.font = `bold ${valueSize}px system-ui, sans-serif`;
  }
  text(ctx, value, x + w / 2, yy + h - 16, valueSize, el.dark);
  ctx.restore();
}

// --- layout: one function both render and input use, so clicks land
// exactly where the eye sees the cards and buttons. ---
export function computeLayout(game) {
  const hand = game.player.hand;
  const totalW = hand.length * CARD_W + Math.max(0, hand.length - 1) * 14;
  const startX = (CANVAS_W - totalW) / 2;
  const cards = hand.map((card, i) => ({
    card,
    x: startX + i * (CARD_W + 14),
    y: 520,
    w: CARD_W,
    h: CARD_H,
  }));
  const oppTotal = game.opponent.hand.length * 84 + Math.max(0, game.opponent.hand.length - 1) * 10;
  const oppStartX = (CANVAS_W - oppTotal) / 2;
  return {
    cards,
    oppCards: game.opponent.hand.map((_, i) => ({ x: oppStartX + i * 94, y: 78, w: 84, h: 118 })),
    endTurn: { x: 1088, y: 596, w: 150, h: 52 },
    startButton: { x: 490, y: 560, w: 300, h: 64 },
    againButton: { x: 490, y: 540, w: 300, h: 60 },
    muteButton: { x: 1088, y: 664, w: 150, h: 32 },
    playerPanel: { x: 916, y: 16, w: 340, h: 100 },
    oppPanel: { x: 24, y: 16, w: 340, h: 100 },
    logPanel: { x: 1024, y: 216, w: 232, h: 260 },
  };
}

function drawButton(ctx, rect, label, enabled, accent = COLORS.gold) {
  rr(ctx, rect.x, rect.y, rect.w, rect.h, 12);
  ctx.fillStyle = enabled ? accent : 'rgba(120,120,120,0.5)';
  ctx.fill();
  ctx.strokeStyle = 'rgba(0,0,0,0.4)';
  ctx.lineWidth = 2;
  ctx.stroke();
  text(ctx, label, rect.x + rect.w / 2, rect.y + rect.h / 2 + 1, 20, enabled ? '#241a10' : '#dddddd');
}

function drawSidePanel(ctx, game, side, isPlayer, panel) {
  rr(ctx, panel.x, panel.y, panel.w, panel.h, 12);
  ctx.fillStyle = COLORS.panel;
  ctx.fill();
  ctx.strokeStyle = isPlayer ? COLORS.player : COLORS.opponent;
  ctx.lineWidth = 2;
  ctx.stroke();
  const name = isPlayer ? 'YOU — Ember Duelist' : 'RIVAL — Vex, Cinder Witch';
  text(ctx, name, panel.x + 16, panel.y + 20, 15, isPlayer ? '#b7e8bf' : '#ffb199', 'left');
  drawLifeBar(ctx, panel.x + 16, panel.y + 34, 220, side.life, side.maxLife, side.armor);
  // mana pips
  for (let i = 0; i < side.maxMana; i++) {
    drawManaGem(ctx, panel.x + 24 + i * 24, panel.y + 82, 9, i < side.mana);
  }
  text(ctx, `Mana ${side.mana}/${side.maxMana}`, panel.x + panel.w - 16, panel.y + 82, 13, COLORS.mana, 'right', 'normal');
  text(ctx, `Deck ${side.deck.length}`, panel.x + panel.w - 16, panel.y + 20, 13, 'rgba(255,243,214,0.7)', 'right', 'normal');
}

function drawTableCentre(ctx, game, layout) {
  // the felt table
  rr(ctx, 24, 216, 976, 280, 18);
  ctx.fillStyle = COLORS.felt;
  ctx.fill();
  ctx.strokeStyle = COLORS.feltLight;
  ctx.lineWidth = 3;
  ctx.stroke();
  text(ctx, 'THE TABLE', 512, 236, 13, 'rgba(255,243,214,0.5)', 'center', 'normal');
  // last played cards
  const oppPlayed = game.opponent.played[game.opponent.played.length - 1];
  const myPlayed = game.player.played[game.player.played.length - 1];
  if (oppPlayed) drawCard(ctx, oppPlayed, 400, 262, 112, 156);
  if (myPlayed) drawCard(ctx, myPlayed, 640, 262, 112, 156);
  if (!oppPlayed && !myPlayed) {
    text(ctx, 'Play a card — it lands here.', 512, 340, 16, 'rgba(255,243,214,0.55)', 'center', 'normal');
  }
  text(ctx, 'VS', 576, 340, 30, COLORS.gold);
  // element wheel reminder
  const wheel = ['ember', 'leaf', 'stone', 'tide'];
  wheel.forEach((key, i) => {
    const el = ELEMENTS[key];
    const x = 400 + i * 76;
    drawGlyph(ctx, el.glyph, x + 12, 446, 11, el.color);
    text(ctx, '>', x + 46, 446, 15, 'rgba(255,243,214,0.6)');
    text(ctx, el.name, x + 12, 470, 11, el.light, 'center', 'normal');
  });
  text(ctx, 'beats the next spark · +2 damage vs its ward', 640, 490, 11, 'rgba(255,243,214,0.5)', 'center', 'normal');
  // ward badges under the table
  drawWardBadge(ctx, 40, 470, game.opponent.ward);
  drawWardBadge(ctx, 40, 500, game.player.ward);
}

function drawLog(ctx, game, layout) {
  const p = layout.logPanel;
  rr(ctx, p.x, p.y, p.w, p.h, 12);
  ctx.fillStyle = COLORS.panel;
  ctx.fill();
  ctx.strokeStyle = 'rgba(242,193,78,0.4)';
  ctx.lineWidth = 1.5;
  ctx.stroke();
  text(ctx, 'DUEL LOG', p.x + 14, p.y + 18, 13, COLORS.gold, 'left');
  const lines = game.log.slice(-11);
  ctx.save();
  ctx.textAlign = 'left';
  ctx.textBaseline = 'top';
  ctx.font = '12px system-ui, sans-serif';
  ctx.fillStyle = 'rgba(255,243,214,0.85)';
  lines.forEach((line, i) => {
    ctx.fillText(wrapLine(line, 34), p.x + 14, p.y + 36 + i * 19, p.w - 28);
  });
  ctx.restore();
}

function wrapLine(str, max) {
  if (str.length <= max) return str;
  return str.slice(0, max - 1) + '…';
}

function drawFloats(ctx, game) {
  for (const f of game.floats) {
    const alpha = Math.max(0, 1 - f.t / TUNING.floatTextMs);
    ctx.save();
    ctx.globalAlpha = alpha;
    text(ctx, f.text, f.x, f.y - f.t * 0.05, 26, f.color);
    ctx.restore();
  }
  if (game.banner) {
    const alpha = Math.max(0, 1 - game.banner.t / TUNING.bannerMs);
    ctx.save();
    ctx.globalAlpha = alpha;
    text(ctx, game.banner.text, 640, 200, 34, '#ffd94d');
    ctx.restore();
  }
}

function drawTitleScreen(ctx, game, layout) {
  ctx.fillStyle = '#1a120b';
  ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
  // ember glow
  const grad = ctx.createRadialGradient(640, 300, 40, 640, 300, 520);
  grad.addColorStop(0, 'rgba(232,73,29,0.35)');
  grad.addColorStop(1, 'rgba(232,73,29,0)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
  drawGlyph(ctx, 'flame', 640, 130, 46, '#e8491d');
  drawGlyph(ctx, 'drop', 560, 130, 30, '#2b9fd8');
  drawGlyph(ctx, 'leaf', 720, 130, 30, '#58b368');
  text(ctx, 'EMBERCLASH', 640, 220, 72, COLORS.gold);
  text(ctx, 'Duel of the Four Sparks', 640, 272, 26, COLORS.cream, 'center', 'normal');
  text(ctx, 'An original duel card game — you against Vex, the Cinder Witch.', 640, 306, 16, 'rgba(255,243,214,0.75)', 'center', 'normal');
  // how to play
  rr(ctx, 340, 340, 600, 180, 14);
  ctx.fillStyle = COLORS.panel;
  ctx.fill();
  ctx.strokeStyle = COLORS.gold;
  ctx.lineWidth = 2;
  ctx.stroke();
  text(ctx, 'HOW TO PLAY', 640, 366, 16, COLORS.gold);
  const rules = [
    'Both duelists have 20 life. Reduce Vex to 0 to win.',
    'Each turn: draw a card, gain mana, play cards, end your turn.',
    'Ember beats Leaf beats Stone beats Tide beats Ember.',
    'Attacking the spark your rival wards against deals +2 damage.',
    'Click a card (or press 1–7) to play it. Space ends your turn.',
  ];
  rules.forEach((r, i) => text(ctx, r, 640, 396 + i * 24, 15, COLORS.cream, 'center', 'normal'));
  drawButton(ctx, layout.startButton, 'START DUEL', true);
  text(ctx, 'Keyboard: Enter starts · M mutes', 640, 648, 13, 'rgba(255,243,214,0.55)', 'center', 'normal');
}

function drawEndScreen(ctx, game, layout, won) {
  ctx.save();
  ctx.fillStyle = 'rgba(10, 8, 6, 0.72)';
  ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
  rr(ctx, 340, 130, 600, 460, 18);
  ctx.fillStyle = won ? '#1d3a1e' : '#3a1d1d';
  ctx.fill();
  ctx.strokeStyle = won ? COLORS.gold : COLORS.danger;
  ctx.lineWidth = 3;
  ctx.stroke();
  text(ctx, won ? 'VICTORY!' : 'DEFEAT', 640, 200, 54, won ? COLORS.gold : COLORS.danger);
  text(ctx, won ? 'Vex’s last spark goes out. The table is yours.' : 'Your last spark goes out. Vex keeps the table.', 640, 252, 17, COLORS.cream, 'center', 'normal');
  const stats = [
    `Turns played: ${game.turnsPlayed}`,
    `Damage you dealt: ${game.player.damageDealt}`,
    `Damage Vex dealt: ${game.opponent.damageDealt}`,
    `Your life left: ${game.player.life} / ${game.player.maxLife}`,
    `Vex’s life left: ${game.opponent.life} / ${game.opponent.maxLife}`,
    `Cards left in your deck: ${game.player.deck.length}`,
  ];
  stats.forEach((s, i) => text(ctx, s, 640, 300 + i * 30, 17, COLORS.cream, 'center', 'normal'));
  drawButton(ctx, layout.againButton, 'PLAY AGAIN  (R)', true);
  ctx.restore();
}

export function drawGame(canvas, game, hoverUid) {
  const ctx = getCtx(canvas);
  // background
  ctx.fillStyle = COLORS.table;
  ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
  const layout = computeLayout(game);

  if (game.phase === 'title') {
    drawTitleScreen(ctx, game, layout);
    return layout;
  }

  // top bar
  text(ctx, 'EMBERCLASH', 640, 30, 20, 'rgba(242,193,78,0.85)');
  text(ctx, game.playerTurn ? '— YOUR TURN —' : '— RIVAL’S TURN —', 640, 54, 14, game.playerTurn ? '#b7e8bf' : '#ffb199');
  drawSidePanel(ctx, game, game.opponent, false, layout.oppPanel);
  drawSidePanel(ctx, game, game.player, true, layout.playerPanel);
  drawWardBadge(ctx, 40, 130, game.opponent.ward);

  // opponent hand, face down
  layout.oppCards.forEach((r) => drawCardBack(ctx, r.x, r.y, r.w, r.h));
  text(ctx, `Rival’s hand: ${game.opponent.hand.length} cards`, 640, 210, 13, 'rgba(255,243,214,0.6)', 'center', 'normal');

  drawTableCentre(ctx, game, layout);
  drawLog(ctx, game, layout);

  // player hand
  layout.cards.forEach(({ card, x, y, w, h }) => {
    const affordable = game.playerTurn && game.phase === 'playing' && card.cost <= game.player.mana;
    drawCard(ctx, card, x, y, w, h, {
      hover: hoverUid === card.uid,
      selected: game.selectedUid === card.uid,
      dim: !affordable,
    });
  });
  text(ctx, 'YOUR HAND — click a card to play it', 24, 600, 13, 'rgba(255,243,214,0.6)', 'left', 'normal');

  // end turn
  const canEnd = game.phase === 'playing' && game.playerTurn && !game.aiBusy;
  drawButton(ctx, layout.endTurn, 'END TURN', canEnd, '#58b368');
  text(ctx, 'Space also ends your turn', 1163, 656, 12, 'rgba(255,243,214,0.5)', 'center', 'normal');

  // flying played card
  if (game.flyCard) {
    const f = game.flyCard;
    const p = Math.min(1, f.t / TUNING.cardFlyMs);
    const x = f.fromX + (640 - 56 - f.fromX) * p;
    const y = f.fromY + (300 - 78 - f.fromY) * p;
    ctx.save();
    ctx.globalAlpha = 1 - p * 0.4;
    drawCard(ctx, f.card, x, y, 112, 156);
    ctx.restore();
  }

  drawFloats(ctx, game);

  // mute button
  rr(ctx, layout.muteButton.x, layout.muteButton.y, layout.muteButton.w, layout.muteButton.h, 8);
  ctx.fillStyle = COLORS.panel;
  ctx.fill();
  text(ctx, game.muted ? 'MUTED' : 'SOUND ON', layout.muteButton.x + layout.muteButton.w / 2, layout.muteButton.y + 17, 12, COLORS.cream);

  if (game.phase === 'won') drawEndScreen(ctx, game, layout, true);
  if (game.phase === 'lost') drawEndScreen(ctx, game, layout, false);
  return layout;
}
