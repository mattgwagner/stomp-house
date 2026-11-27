// Finds a Playwright install: this repo first, then sibling checkouts that have one. Chromium comes from /usr/bin/chromium.
import { createRequire } from "node:module";
const bases = [new URL("../", import.meta.url).pathname, "/home/matt/Code/killsaws/", "/home/matt/Code/readerful/"];
let found = null;
for (const b of bases) for (const m of ["playwright-core", "playwright"]) { if (found) break; try { found = createRequire(b + "noop.js")(m); } catch { } }
if (!found) throw new Error("No playwright or playwright-core found in " + bases.join(", "));
export const chromium = found.chromium;
export const launch = () => chromium.launch({ executablePath: process.env.CHROMIUM || "/usr/bin/chromium" });
export const pageUrl = (q = "") => "file://" + new URL("../public/index.html", import.meta.url).pathname + q;
