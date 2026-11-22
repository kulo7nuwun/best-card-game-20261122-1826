# Emberclash — Duel of the Four Sparks

An original duel card game, built for the make.fun "Make the best card game" bounty. You face Vex, the Cinder Witch, across a felt table. Both duelists have 20 life; reduce Vex to 0 to win.

## How to play

- **Each turn:** draw a card, gain mana (1 more each turn, up to 10), play as many cards as you can afford, then end your turn.
- **Cards:** click a card (or press `1`–`7`) to play it. Attacks deal damage, guards grant armour, tricks draw cards, heal, or shatter through armour.
- **The four sparks:** Ember beats Leaf beats Stone beats Tide beats Ember. Every card you play sets your *ward* to its spark — attack with the spark that beats your rival's ward for +2 damage.
- **Controls:** mouse to click cards and buttons, `Space`/`Enter` to end your turn, `R` to play again after a duel, `M` to mute. Sound is synthesised live (WebAudio) — no audio files.

## Running it

No build step, no network. Serve `game/` with any static server (or `node serve.ts`) and open `game/index.html` in desktop Chrome.

## Files

- `game/index.html` — the page, one canvas
- `game/src/config.js` — tuning, colours, the spark wheel
- `game/src/deck.js` — the original card catalogue (15 cards, 30-card decks)
- `game/src/state.js` — the duel rules: turns, damage, armour, wards
- `game/src/ai.js` — the rival's brain (lethal first, guards when hurt)
- `game/src/render.js` — all canvas drawing: table, hands, cards, screens
- `game/src/input.js` — mouse + keyboard
- `game/src/audio.js` — synthesised WebAudio sounds
- `game/src/stage.js` — `?shot=start|play|win|lose` staging for screenshots
- `game/src/main.js` — entrypoint and frame loop

Screenshots are staged with `?shot=...&seed=1` (see `shots.json`); the staged frames are frozen poses of the real game.

MIT licensed.
