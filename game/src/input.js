// input.js — mouse and keyboard.
// One clear job: turn pointer and key events into game actions, using
// the same layout the renderer draws so clicks land where the eye sees.

import { computeLayout } from './render.js';
import { endPlayerTurn, playCard, resetGame, startDuel, startOpponentTurn } from './state.js';
import { runAiTurn } from './ai.js';
import * as audio from './audio.js';

function toGameCoords(canvas, clientX, clientY) {
  const rect = canvas.getBoundingClientRect();
  return {
    x: ((clientX - rect.left) / rect.width) * canvas.width,
    y: ((clientY - rect.top) / rect.height) * canvas.height,
  };
}

function inside(point, rect) {
  return point.x >= rect.x && point.x <= rect.x + rect.w
    && point.y >= rect.y && point.y <= rect.y + rect.h;
}

export function attachInput(canvas, game, onAction) {
  let hoverUid = null;

  function tryPlayCard(card, origin) {
    if (!game.playerTurn || game.aiBusy) return;
    const result = playCard(game, game.player, card.uid, origin);
    if (!result) { audio.errorSound(); return; }
    if (result.card.kind === 'attack' || result.card.trick === 'shatter') audio.hitSound();
    else if (result.card.kind === 'guard') audio.guardSound();
    else audio.drawSound();
    if (game.phase === 'won') audio.winSound();
    if (game.phase === 'lost') audio.loseSound();
    onAction();
  }

  function endTurn() {
    if (!endPlayerTurn(game)) return;
    audio.turnSound();
    onAction();
    startOpponentTurn(game);
    runAiTurn(game, () => {
      if (game.phase === 'won') audio.winSound();
      if (game.phase === 'lost') audio.loseSound();
      onAction();
    });
  }

  canvas.addEventListener('mousemove', (event) => {
    const point = toGameCoords(canvas, event.clientX, event.clientY);
    const layout = computeLayout(game);
    hoverUid = null;
    if (game.phase === 'playing' && game.playerTurn) {
      for (const slot of layout.cards) {
        if (inside(point, slot)) { hoverUid = slot.card.uid; break; }
      }
    }
    game.selectedUid = hoverUid;
  });

  canvas.addEventListener('click', (event) => {
    const point = toGameCoords(canvas, event.clientX, event.clientY);
    const layout = computeLayout(game);
    if (inside(point, layout.muteButton) && game.phase !== 'title') {
      game.muted = !game.muted;
      audio.setMuted(game.muted);
      onAction();
      return;
    }
    if (game.phase === 'title') {
      if (inside(point, layout.startButton)) {
        audio.turnSound();
        startDuel(game);
        onAction();
      }
      return;
    }
    if (game.phase === 'won' || game.phase === 'lost') {
      if (inside(point, layout.againButton)) {
        audio.turnSound();
        resetGame(game);
        startDuel(game);
        onAction();
      }
      return;
    }
    if (!game.playerTurn || game.aiBusy) return;
    if (inside(point, layout.endTurn)) { endTurn(); return; }
    for (const slot of layout.cards) {
      if (inside(point, slot)) {
        tryPlayCard(slot.card, { x: slot.x + slot.w / 2, y: slot.y + slot.h / 2 });
        return;
      }
    }
  });

  window.addEventListener('keydown', (event) => {
    if (event.repeat) return;
    const key = event.key.toLowerCase();
    if (key === 'm') {
      game.muted = !game.muted;
      audio.setMuted(game.muted);
      onAction();
      return;
    }
    if (game.phase === 'title' && (key === 'enter' || key === ' ')) {
      audio.turnSound();
      startDuel(game);
      onAction();
      return;
    }
    if ((game.phase === 'won' || game.phase === 'lost') && (key === 'r' || key === 'enter')) {
      audio.turnSound();
      resetGame(game);
      startDuel(game);
      onAction();
      return;
    }
    if (game.phase !== 'playing' || !game.playerTurn || game.aiBusy) return;
    if (key === ' ' || key === 'enter') { endTurn(); return; }
    const n = Number.parseInt(key, 10);
    if (n >= 1 && n <= game.player.hand.length) {
      const slot = computeLayout(game).cards[n - 1];
      if (slot) tryPlayCard(slot.card, { x: slot.x + slot.w / 2, y: slot.y + slot.h / 2 });
    }
  });

  return { getHoverUid: () => hoverUid };
}
