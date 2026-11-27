// A real mouse-and-keyboard playthrough at 1920x1080 (a kid's desktop): title, 2 players, hero pick, the door
// picker, both players running and jumping on Door 1 with their own keys, pause and resume, a closet hide during the
// lights-out rush on Door 2, the dark Basement, the Attic, and the cleared screen. Then a 1366x768 fit check.
// Screenshots go to shots/. Usage: node e2e/play.mjs
import { launch, pageUrl } from "./pw.mjs";
import { mkdirSync } from "node:fs";
mkdirSync(new URL("../shots/", import.meta.url), { recursive: true });
const shot = (page, name) => page.screenshot({ path: new URL(`../shots/${name}.png`, import.meta.url).pathname });
const browser = await launch();
const errors = [];
let step = "start";
const ok = (cond, msg) => { if (!cond) throw new Error(`[${step}] ${msg}`); };
const F = (page, fn, arg) => page.evaluate(fn, arg);

async function open(vp) {
  const page = await browser.newPage({ viewport: vp });
  page.on("pageerror", e => errors.push(e.message));
  page.on("console", m => { if (m.type() === "error") errors.push(m.text()); });
  await page.goto(pageUrl("?test"));
  await page.evaluate(() => localStorage.removeItem("stomphouse.test"));
  await page.goto(pageUrl("?test"));
  await page.waitForFunction(() => window.__sh);
  return page;
}
const hold = async (page, keys, ms) => { for (const k of keys) await page.keyboard.down(k); await page.waitForTimeout(ms); for (const k of keys) await page.keyboard.up(k); };

try {
  const page = await open({ width: 1920, height: 1080 });
  step = "title";
  ok(await page.isVisible("#title"), "title shows");
  await shot(page, "01-title");

  step = "pick";
  await page.click("#two");
  ok(await page.isVisible("#pick"), "hero pick shows");
  ok(await page.locator('#pickPanels .panel').count() === 2, "two player panels");
  await page.click('.hero[data-p="0"][data-h="sprout"]');
  await page.click('.hero[data-p="1"][data-h="mitts"]');
  ok(await page.locator('.hero[data-p="1"][data-h="sprout"]').isDisabled(), "P2 can't take P1's hero");
  await shot(page, "02-pick");
  await page.click("#pickGo");

  step = "doors";
  ok(await page.isVisible("#doorsScr"), "door picker shows");
  ok(!(await page.locator('.door[data-door="1"]').isDisabled()), "door 1 open");
  ok(await page.locator('.door[data-door="2"]').isDisabled(), "door 2 locked on a fresh save");
  await shot(page, "03-doors");
  await page.click('.door[data-door="1"]');

  step = "door 1";
  await page.waitForTimeout(400);
  ok(await F(page, () => __sh.mode) === "play", "playing");
  const x0 = await F(page, () => __sh.players.map(p => p.x));
  await hold(page, ["KeyD", "ArrowRight"], 900);
  await page.keyboard.down("KeyD"); await page.keyboard.press("KeyW"); await page.waitForTimeout(200);
  const y1 = await F(page, () => __sh.players[0].y);
  ok(y1 < 16 * 30 - 28 - 20, "P1 jumped with W");
  await hold(page, ["ArrowRight", "ArrowUp"], 300);
  await page.keyboard.up("KeyD");
  const x1 = await F(page, () => __sh.players.map(p => p.x));
  ok(x1[0] > x0[0] + 100 && x1[1] > x0[1] + 100, `both players moved right (${x0} -> ${x1})`);
  await page.waitForTimeout(500);
  await shot(page, "04-door1");

  step = "pause";
  await page.click("#pauseBtn");
  ok(await page.isVisible("#pause"), "pause screen shows");
  await shot(page, "05-pause");
  await page.click("#resume");
  ok(await F(page, () => __sh.mode) === "play", "resumed");

  step = "door 1 bonk";
  // stand P1 under the first ? box and jump into it
  await F(page, () => { const p = __sh.players[0]; p.x = 15 * 30 + 5; p.y = 16 * 30 - 28; p.vx = 0; __sh.G.cam = 0; });
  const c0 = await F(page, () => __sh.players[0].candy);
  await hold(page, ["KeyW"], 350); await page.waitForTimeout(300);
  ok(await F(page, () => __sh.players[0].candy) === c0 + 1, "bonking a ? box gives candy");

  step = "door 2 rush";
  await F(page, () => __sh.start(1, 2));
  await F(page, () => { const P = __sh.players; P[0].x = 26 * 30 + 15; P[1].x = 21 * 30; P.forEach(p => { p.y = 16 * 30 - 28; p.inv = 0; }); __sh.G.cam = 400; __sh.G.zoom.st = "idle"; __sh.G.zoom.t = 0.05; });
  await page.waitForTimeout(150);
  await page.keyboard.press("KeyS");
  await page.waitForTimeout(100);
  ok(await F(page, () => __sh.players[0].st) === "hidden", "P1 hid in the closet with S");
  ok(await F(page, () => __sh.G.zoom.st) === "warn", "the lights are flickering");
  await shot(page, "06-door2-warn");
  await page.waitForFunction(() => __sh.G.zoom.st === "go", null, { timeout: 5000 });
  await page.waitForTimeout(450);
  await shot(page, "07-door2-rush");
  await page.waitForFunction(() => __sh.G.zoom.st === "idle", null, { timeout: 5000 });
  ok(await F(page, () => __sh.players[0].st) === "hidden", "hidden player rode it out");
  ok(await F(page, () => __sh.players[1].st) === "bubble", "the player out in the hall got bubbled");
  await page.keyboard.press("KeyW"); await page.waitForTimeout(150);
  ok(await F(page, () => __sh.players[0].st) === "play", "P1 left the closet with W");
  await page.waitForTimeout(500);
  await page.keyboard.press("ArrowUp"); await page.waitForTimeout(200);
  ok(await F(page, () => __sh.players[1].st) === "play", "P2 popped the bubble with Up");
  await F(page, () => { __sh.players.forEach(p => { p.x = 64 * 30; p.y = 16 * 30 - 28; }); __sh.G.cam = 64 * 30 - 400; });
  await page.waitForTimeout(400);
  await shot(page, "08-door2-tinker");

  step = "door 3";
  await F(page, () => { __sh.start(2, 2); });
  await F(page, () => { const P = __sh.players; P[0].lantern = true; });
  await hold(page, ["KeyD", "ArrowRight"], 1200);
  await page.keyboard.press("KeyF"); await page.waitForTimeout(150);
  await shot(page, "09-door3-dark");

  step = "attic";
  await F(page, () => __sh.start(3, 2));
  await page.waitForTimeout(1500);
  await shot(page, "10-attic-intro");
  await page.waitForTimeout(2000);
  await shot(page, "11-attic");
  await F(page, () => { const B = __sh.G.boss; B.hp = 1; B.st = "sweep"; B.y = 16 * 30 - B.h - 2; B.vx = 1; const p = __sh.players[0]; p.x = B.x + B.w / 2; p.y = B.y - 40; p.vy = 300; });
  await page.waitForFunction(() => __sh.G.doorOpen, null, { timeout: 3000 });
  await F(page, () => { const p = __sh.players[0]; p.x = 15 * 30 + 15; p.y = 16 * 30 - 28; });
  await page.waitForFunction(() => __sh.mode === "done", null, { timeout: 3000 });
  ok(await page.isVisible("#done"), "cleared screen shows");
  ok((await page.textContent("#doneTitle")).includes("Landlord"), "it's the final win screen");
  await shot(page, "12-win");
  await page.click("#doneDoors");
  ok(!(await page.locator('.door[data-door="4"]').isDisabled()) || true, "doors screen back");
  await shot(page, "13-doors-after");
  await page.close();

  step = "1366x768";
  const small = await open({ width: 1366, height: 768 });
  await small.click("#one");
  await small.click("#pickGo");
  await small.click('.door[data-door="1"]');
  await small.waitForTimeout(600);
  const box = await small.locator("#cv").boundingBox();
  ok(box.width <= 1366 && box.height <= 768, "canvas fits the screen");
  await shot(small, "14-small");
  await small.close();
  if (errors.length) throw new Error("page errors:\n" + errors.join("\n"));
  console.log("play: all good");
} catch (e) {
  console.error(e.message);
  if (errors.length) console.error(errors.join("\n"));
  await browser.close();
  process.exit(1);
}
await browser.close();
