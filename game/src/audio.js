// audio.js — all sound is synthesised with WebAudio, no audio files.
// One clear job: tiny bleeps and chords for play, hit, win and loss.

let ctx = null;
let muted = false;

export function setMuted(value) { muted = value; }
export function isMuted() { return muted; }

function ensureContext() {
  if (!ctx) {
    try {
      const AC = window.AudioContext || window.webkitAudioContext;
      ctx = new AC();
    } catch {
      ctx = null;
    }
  }
  if (ctx && ctx.state === 'suspended') ctx.resume();
  return ctx;
}

function tone(freq, dur, type = 'sine', gain = 0.12, when = 0) {
  if (muted) return;
  const ac = ensureContext();
  if (!ac) return;
  const t0 = ac.currentTime + when;
  const osc = ac.createOscillator();
  const g = ac.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t0);
  g.gain.setValueAtTime(gain, t0);
  g.gain.exponentialRampToValueAtTime(0.001, t0 + dur);
  osc.connect(g).connect(ac.destination);
  osc.start(t0);
  osc.stop(t0 + dur + 0.02);
}

export function playCardSound() { tone(520, 0.12, 'triangle', 0.14); tone(780, 0.1, 'triangle', 0.1, 0.05); }
export function hitSound() { tone(160, 0.18, 'sawtooth', 0.12); tone(90, 0.22, 'square', 0.08, 0.02); }
export function guardSound() { tone(340, 0.15, 'sine', 0.12); tone(440, 0.15, 'sine', 0.1, 0.07); }
export function drawSound() { tone(660, 0.08, 'sine', 0.08); tone(880, 0.08, 'sine', 0.08, 0.06); }
export function turnSound() { tone(440, 0.1, 'triangle', 0.1); }
export function errorSound() { tone(140, 0.15, 'square', 0.08); }
export function winSound() {
  [523, 659, 784, 1047].forEach((f, i) => tone(f, 0.35, 'triangle', 0.13, i * 0.12));
}
export function loseSound() {
  [392, 330, 262, 196].forEach((f, i) => tone(f, 0.35, 'sine', 0.12, i * 0.14));
}
