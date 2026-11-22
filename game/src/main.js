// main.js — the entrypoint: wire the canvas, the loop and the staging.
// One clear job: own the frame. Rules live in state.js, drawing in
// render.js, decisions in ai.js, input in input.js.

import { TUNING } from './config.js';
import { createGame } from './state.js';
import { drawGame } from './render.js';
import { attachInput } from './input.js';
import { applyStage } from './stage.js';

const canvas = document.getElementById('game');
const params = new URLSearchParams(window.location.search);
const seedParam = params.get('seed');
const seed = seedParam === null ? null : Number.parseInt(seedParam, 10) || 1;

const game = createGame(seed);
applyStage(game, params);

let hoverUid = null;
const input = attachInput(canvas, game, () => { /* state changed; loop redraws */ });

let lastTime = performance.now();

function advanceAnimations(dt) {
  if (game.frozen) return;
  for (const f of game.floats) f.t += dt;
  game.floats = game.floats.filter((f) => f.t < TUNING.floatTextMs);
  if (game.banner) {
    game.banner.t += dt;
    if (game.banner.t >= TUNING.bannerMs) game.banner = null;
  }
  if (game.flyCard) {
    game.flyCard.t += dt;
    if (game.flyCard.t >= TUNING.cardFlyMs) game.flyCard = null;
  }
}

function frame(now) {
  const dt = Math.min(100, now - lastTime);
  lastTime = now;
  advanceAnimations(dt);
  hoverUid = input.getHoverUid();
  drawGame(canvas, game, hoverUid);
  requestAnimationFrame(frame);
}

// Expose the game for play-testing and debugging from the console.
window.__emberclash = game;

requestAnimationFrame(frame);
