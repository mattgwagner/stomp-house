# Stomp House

A spooky side-scrolling jump-and-stomp game for one player, or two playing together on one keyboard. Four doors:
The Front Yard, The Hallways (when the lights flicker, hide in a closet before the Rush comes through), The Basement
(dark, and lanterns light it up) and The Attic (the Landlord boss). It's all original: the heroes Sprout, Mitts,
Zip and Moxie, the pumpkins, bats, spiders, the Rush, Tinker the robot frog and the Landlord.

## Run it

- `bun server.ts` (or `npm start`) serves it on http://127.0.0.1:4856
- `npm run check` runs both gates. If Chromium closes itself on launch, run `TMPDIR=$HOME/.cache/pw-tmp npm run check`.
- Deploy: `npx -y wrangler@4 deploy`, then compare `sha256sum public/index.html` with `curl -s https://stomp-house.mattgwagner.workers.dev | sha256sum`.

## Controls

Two players: P1 uses `A`/`D` to move, `W` to jump, `S` to hide and `F` to throw light. P2 uses the arrow keys, `↑` to jump,
`↓` to hide and `/` or `Enter` to throw light. One player can use either set, plus `Space`. Gamepads also work: pad 1 is P1 and pad 2 is P2.
Menus all work with the mouse. `Esc`/`P` pauses (or click ⏸).

## How it's built

Everything is in `public/index.html`: Canvas 2D and Web Audio, no image or audio files. It runs a fixed 120 Hz step
on a 960×540 world (30 px tiles, 18 rows) scaled to fit the window.

- **Levels** are built in code (`LEVELS[].build()`) on a tile grid: `#` ground, `S` block (tombstone, bookshelf,
  pillar or crate depending on the theme), `B` brick (breaks if you're holding a lantern), `?` candy box, `L` lantern
  box, `u` used box, `=` one-way ledge, `^` spikes, `C` closet (2×3), `D` exit (2×3).
- **No lives, no game over.** In 2-player mode a hit puts you in a bubble that floats to your friend, and you jump to
  pop out. If both are bubbled, or you're playing alone, you go back to the last lamp post you lit. A lantern takes
  one hit for you.
- **Friends bounce off each other's heads.** Candy is counted per player and the cleared screen crowns the candy champ.
- **The Rush** (Hallways only): flickering lights and a rumble give 3.4 s of warning, then a fog face sweeps across
  the screen. Anyone not in a closet gets hit.
- **Saves:** `stomphouse.v1` holds `{open, cleared}`, and `?test` uses `stomphouse.test`.

## Tests

- `e2e/bot.mjs`: with baddies switched off, a simple runner (hold right, jump at walls, pits and ledges) has to reach
  the exit of Doors 1–3, and the Landlord has to go down to stomps with the exit opening.
- `e2e/play.mjs`: a real keyboard-and-mouse playthrough at 1920×1080. It covers both players' keys, a box bonk, pause,
  hiding from the Rush while the other player gets bubbled and pops back out, the Basement, the boss win screen, and a
  1366×768 fit check. Screenshots go to `shots/`.
