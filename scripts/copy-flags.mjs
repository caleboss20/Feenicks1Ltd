/**
 * Copies country flag SVGs from the `country-flag-icons` package (MIT
 * licence) into `public/flags/`, so the app serves them itself: no
 * third-party requests, and each flag loads only when it's shown.
 *
 * Run after updating the package:  npm run flags:copy
 */
import { copyFileSync, existsSync, mkdirSync, readdirSync } from "node:fs";
import { join } from "node:path";

const SOURCE = "node_modules/country-flag-icons/3x2";
const LICENCE = "node_modules/country-flag-icons/LICENSE";
const TARGET = "public/flags";

if (!existsSync(SOURCE)) {
  console.error("country-flag-icons is not installed. Run: npm install");
  process.exit(1);
}

mkdirSync(TARGET, { recursive: true });

// Only real two-letter country codes (skips extras like regional flags).
const flags = readdirSync(SOURCE).filter((file) => /^[A-Z]{2}\.svg$/.test(file));
for (const file of flags) copyFileSync(join(SOURCE, file), join(TARGET, file));

// The MIT licence requires keeping its notice with the files.
if (existsSync(LICENCE)) copyFileSync(LICENCE, join(TARGET, "LICENSE.txt"));

console.log(`Copied ${flags.length} flags to ${TARGET}/`);
