/**
 * Smoke checks for Meta Pixel integration.
 * Run: npx tsx scripts/verify-meta-pixel.ts
 * or:  node --experimental-strip-types scripts/verify-meta-pixel.ts
 */
import fs from "fs";
import path from "path";

const root = process.cwd();
const PIXEL_ID = "1765251828052032";

const requiredFiles = [
  "src/lib/meta-pixel.ts",
  "src/components/analytics/MetaPixel.tsx",
  "src/components/analytics/MetaPixelPageView.tsx",
  "src/app/layout.tsx",
];

let failed = 0;

function assert(condition: boolean, message: string) {
  if (condition) {
    console.log(`PASS  ${message}`);
  } else {
    console.error(`FAIL  ${message}`);
    failed += 1;
  }
}

for (const file of requiredFiles) {
  const full = path.join(root, file);
  assert(fs.existsSync(full), `exists: ${file}`);
}

const metaLib = fs.readFileSync(path.join(root, "src/lib/meta-pixel.ts"), "utf8");
assert(
  metaLib.includes(PIXEL_ID),
  `pixel id ${PIXEL_ID} present in meta-pixel.ts`,
);

const metaComponent = fs.readFileSync(
  path.join(root, "src/components/analytics/MetaPixel.tsx"),
  "utf8",
);
assert(metaComponent.includes("fbq('init'"), "MetaPixel initializes fbq");
assert(metaComponent.includes("fbq('track', 'PageView')"), "MetaPixel tracks PageView");
assert(
  metaComponent.includes("connect.facebook.net/en_US/fbevents.js"),
  "MetaPixel loads fbevents.js",
);
assert(
  metaComponent.includes("META_PIXEL_ID") &&
    metaComponent.includes("facebook.com/tr?id=") &&
    metaComponent.includes("ev=PageView"),
  "noscript fallback uses pixel id + PageView",
);

const pageView = fs.readFileSync(
  path.join(root, "src/components/analytics/MetaPixelPageView.tsx"),
  "utf8",
);
assert(pageView.includes('fbq("track", "PageView")'), "SPA PageView tracker present");
assert(pageView.includes("usePathname"), "SPA tracker listens to pathname");

const layout = fs.readFileSync(path.join(root, "src/app/layout.tsx"), "utf8");
assert(layout.includes("MetaPixel"), "Root layout mounts MetaPixel");
assert(
  fs
    .readFileSync(path.join(root, "src/components/analytics/MetaPixel.tsx"), "utf8")
    .includes("Suspense"),
  "MetaPixel wraps SPA tracker in Suspense",
);

if (failed > 0) {
  console.error(`\n${failed} check(s) failed.`);
  process.exit(1);
}

console.log("\nAll Meta Pixel checks passed.");
