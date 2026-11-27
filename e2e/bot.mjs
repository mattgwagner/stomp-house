// Reachability bot: a dumb runner (hold right, jump at walls, ledges and baddies) must reach the exit of every
// side-scrolling door, with baddies unable to hurt it (pits still count). Then the Attic: the Landlord takes six
// hits and the exit opens. Usage: node e2e/bot.mjs
import { launch, pageUrl } from "./pw.mjs";
const browser = await launch();
const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
const errors = [];
page.on("pageerror", e => errors.push(e.message));
await page.goto(pageUrl("?test"));
await page.waitForFunction(() => window.__sh);
let failed = false;

for (const li of [0, 1, 2]) {
  const r = await page.evaluate(li => {
    const S = window.__sh; S.god = true; S.start(li, 1);
    const T = 30, p = S.players[0];
    let falls = 0, lastSt = "play", jumpHeld = false, t = 0, maxX = 0;
    const solid = (tx, ty) => ["#", "S", "B", "?", "L", "u"].includes(S.G.grid[ty]?.[tx] ?? "#");
    const floor = (tx, ty) => solid(tx, ty) || S.G.grid[ty]?.[tx] === "=";
    while (!S.G.finished && t < 300) {
      const fx = Math.floor((p.x + p.w / 2) / T), fy = Math.floor((p.y + p.h - 1) / T);
      const wallAhead = solid(fx + 1, fy) || solid(fx + 1, fy - 1);
      let pit = true; for (let y = fy + 1; y < 18; y++) if (floor(fx + 1, y)) { pit = false; break; }
      const want = p.ground && (wallAhead || pit);
      let j;
      if (want) j = !jumpHeld; else j = jumpHeld && p.vy < 0;
      S.FAKE[0] = { r: true, j };
      jumpHeld = j;
      S.sim(1 / 60); t += 1 / 60;
      if (p.st !== "play" && lastSt === "play") falls++;
      if (p.st === "hidden") S.FAKE[0] = { j: true };
      lastSt = p.st; maxX = Math.max(maxX, p.x);
    }
    S.FAKE[0] = {};
    return { done: S.G.finished, t: Math.round(t), falls, maxTile: Math.floor(maxX / T), w: S.G.w };
  }, li);
  const ok = r.done;
  if (!ok) failed = true;
  console.log(`${ok ? "ok  " : "FAIL"} door ${li + 1}: finished=${r.done} in ${r.t}s sim, pit falls ${r.falls}, furthest tile ${r.maxTile}/${r.w}`);
}

// the Attic
const boss = await page.evaluate(() => {
  const S = window.__sh; S.god = true; S.start(3, 2);
  S.sim(4);
  let hits = 0, guard = 0;
  while (S.G.boss.st !== "dead" && guard++ < 200) {
    // wait for a swoop, then drop a player onto the hat
    let w = 0; while (S.G.boss.st !== "sweep" && w++ < 1200) S.sim(1 / 60);
    const B = S.G.boss, p = S.players[0];
    p.x = B.x + B.w / 2 - 10; p.y = B.y - 40; p.vy = 300; p.st = "play";
    const hp = B.hp; S.sim(0.2);
    if (B.hp < hp) hits++;
    S.sim(1.6);
  }
  const doorOpen = S.G.doorOpen;
  const p = S.players[0]; p.x = 15 * 30 + 10; p.y = 16 * 30 - 28; p.vy = 0; S.sim(0.1);
  return { dead: S.G.boss.st === "dead", hits, doorOpen, done: S.G.finished };
});
console.log(`${boss.dead && boss.done ? "ok  " : "FAIL"} attic: landlord beaten=${boss.dead} with ${boss.hits} stomps, exit open=${boss.doorOpen}, finished=${boss.done}`);
if (!boss.dead || !boss.done) failed = true;
if (errors.length) { console.log("page errors:\n" + errors.join("\n")); failed = true; }
await browser.close();
process.exit(failed ? 1 : 0);
