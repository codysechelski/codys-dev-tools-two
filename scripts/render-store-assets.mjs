// Renders the Microsoft Store package's tile and logo images (build/appx/) from the 1024 px app
// icon. electron-builder copies build/appx/ into the .appx; without these it uses generic
// placeholders. Needs ImageMagick (`brew install imagemagick`). Run with `npm run store-assets`
// after the icon changes, and commit the output.
import { execFileSync } from 'node:child_process';
import { mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const source = fileURLToPath(new URL('../build/icons/1024x1024.png', import.meta.url));
const outDir = fileURLToPath(new URL('../build/appx/', import.meta.url));

// Name, canvas size at 100% scale, and the icon's share of the canvas height. Each is also written
// at 200% (`.scale-200`), which Windows uses on high-DPI displays.
const TILES = [
  { name: 'StoreLogo', width: 50, height: 50, iconScale: 1 },
  { name: 'Square44x44Logo', width: 44, height: 44, iconScale: 1 },
  { name: 'SmallTile', width: 71, height: 71, iconScale: 0.75 },
  { name: 'Square150x150Logo', width: 150, height: 150, iconScale: 0.66 },
  { name: 'Wide310x150Logo', width: 310, height: 150, iconScale: 0.66 },
  { name: 'LargeTile', width: 310, height: 310, iconScale: 0.66 },
];
// Taskbar, Start list, and Explorer sizes for Square44x44Logo. `altform-unplated` is the version
// shown without a tile plate behind it; the icon has its own background, so it's the same image.
const TARGET_SIZES = [16, 24, 32, 48, 256];

function render(path, width, height, iconSize) {
  execFileSync('magick', [
    source,
    '-resize', `${iconSize}x${iconSize}`,
    '-background', 'none',
    '-gravity', 'center',
    '-extent', `${width}x${height}`,
    path,
  ]);
  console.log(`Wrote build/appx/${path.slice(outDir.length)}`);
}

mkdirSync(outDir, { recursive: true });
for (const { name, width, height, iconScale } of TILES) {
  for (const scale of [1, 2]) {
    const suffix = scale === 1 ? '' : '.scale-200';
    render(`${outDir}${name}${suffix}.png`, width * scale, height * scale, Math.round(height * scale * iconScale));
  }
}
for (const size of TARGET_SIZES) {
  for (const variant of ['', '_altform-unplated']) {
    render(`${outDir}Square44x44Logo.targetsize-${size}${variant}.png`, size, size, size);
  }
}
