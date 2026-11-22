// rng.js — one tiny deterministic random source.
// The game uses Math.random in live play; the screenshot staging hook
// (stage.js) seeds this instead so a staged frame is reproducible.

export function mulberry32(seed) {
  let a = seed >>> 0;
  return function nextRandom() {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function makeRng(seed) {
  if (seed === null || seed === undefined) return Math.random;
  return mulberry32(seed);
}
