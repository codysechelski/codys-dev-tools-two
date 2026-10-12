// Regenerates every app icon from the hand-tuned exports in assets/icons/final.
//
//   node scripts/generate-icons.mjs
//
// Requires `resvg`/`usvg` (brew install resvg) and ImageMagick 7 (brew install imagemagick).
// Everything is rasterized from the per-size SVGs rather than the PNG exports: Illustrator
// wrote the "square" PNGs one pixel too wide (17x16, 1025x1024, ...), which shifts and blurs
// them once they're forced into a square icon frame.
//
// The small exports are not scaled-down copies of the big ones (text and detail drop out,
// shadows change), so each output size is rendered from the export it was designed closest to
// — see SOURCE_SIZE_FOR below. Never touches build/installerHeader.bmp / installerSidebar.bmp.
//
// macOS: build/AppIcon.icon is an Icon Composer document (open it in Xcode's Icon Composer to
// tweak). This script only refreshes its Assets/ layers; icon.json is edited by hand or in
// Icon Composer. electron-builder compiles it with actool (Xcode 26+) into Assets.car (Liquid
// Glass, with Default/Dark/Clear/Tinted appearances) plus a legacy .icns for older macOS.
import { execFileSync } from 'node:child_process';
import { mkdtempSync, mkdirSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const finalDir = join(root, 'assets/icons/final');
const buildDir = join(root, 'build');
const tmp = mkdtempSync(join(tmpdir(), 'cdt-icons-'));

const source = (variant, size) => join(finalDir, `icon_${variant}_${size}.svg`);
const run = (cmd, args) => execFileSync(cmd, args, { stdio: ['ignore', 'ignore', 'inherit'] });

function render(svg, size, out) {
  run('resvg', ['-w', String(size), '-h', String(size), svg, out]);
  return out;
}

// Which hand-tuned export each output size is rendered from. 16/20 use the simplified 16px
// art; 24-48 use the 32px art (the 64px export's band text turns to noise below 64);
// 96 renders the 128px art down, which reads better than blowing the 64px art up.
const SOURCE_SIZE_FOR = {
  16: 16, 20: 16, 24: 32, 32: 32, 40: 32, 48: 32, 64: 64,
  96: 128, 128: 128, 256: 256, 512: 512, 1024: 1024,
};

// Windows: free-form wrench (no plate), per Windows 11 icon conventions, so it sits well in
// Explorer (light or dark), on the desktop, and in the taskbar. Frames cover every size the
// shell asks for across 100-200% display scaling.
function buildWindowsIco() {
  const sizes = [16, 20, 24, 32, 40, 48, 64, 96, 128, 256];
  const frames = sizes.map((size) =>
    render(source('square_no_bg', SOURCE_SIZE_FOR[size]), size, join(tmp, `win-${size}.png`)),
  );
  // ImageMagick stores the 256 frame PNG-compressed and the rest as 32-bit BMP, which is what
  // Windows expects.
  run('magick', [...frames, join(buildDir, 'icon.ico')]);
}

// Linux: desktop environments don't mask icons, so ship the pre-rounded dark plate. These
// feed the .deb (electron-builder reads build/icons/NxN.png) and the runtime window icon.
function buildLinuxPngs() {
  const iconsDir = join(buildDir, 'icons');
  rmSync(iconsDir, { recursive: true, force: true });
  mkdirSync(iconsDir, { recursive: true });
  for (const size of [16, 24, 32, 48, 64, 128, 256, 512, 1024]) {
    render(source('square_bg_rounded', SOURCE_SIZE_FOR[size]), size, join(iconsDir, `${size}x${size}.png`));
  }
  render(source('square_bg_rounded', 1024), 1024, join(buildDir, 'icon.png'));
}

// macOS: refresh the Icon Composer layers. The wrench SVG is flattened with usvg (resolves
// Illustrator's CSS classes into plain attributes for CoreSVG). The glow layers reproduce the
// plated exports' outer glow (#2f277c on the light background, #afa7d8 on the dark one, 50%,
// blur 40 at 1024) around the wrench at the 68% scale icon.json places it at.
function buildMacIconLayers() {
  const assets = join(buildDir, 'AppIcon.icon/Assets');
  mkdirSync(assets, { recursive: true });
  run('usvg', [source('square_no_bg', 1024), join(assets, 'wrench.svg')]);

  const silhouette = join(tmp, 'mac-silhouette.png');
  run('magick', [
    render(source('square_no_bg', 1024), 696, join(tmp, 'mac-wrench.png')),
    '-background', 'none', '-gravity', 'center', '-extent', '1024x1024',
    silhouette,
  ]);
  for (const [name, color] of [['glow_light', '#2f277c'], ['glow_dark', '#afa7d8']]) {
    run('magick', [
      silhouette,
      '-channel', 'A', '-blur', '0x40', '-evaluate', 'multiply', '0.5', '+channel',
      '-fill', color, '-colorize', '100',
      join(assets, `${name}.png`),
    ]);
  }
}

// Windows custom title bar (CustomTitleBar.vue, drawn at 16 CSS px): SVGs stay crisp at any
// display scaling. The light-silver 16px art reads on the dark title bar but washes out on the
// light one, where the 32px art's dark band holds up instead.
function buildTitleBarIcons() {
  const imagesDir = join(root, 'src/assets/images');
  run('usvg', [source('square_no_bg', 16), join(imagesDir, 'titlebar-icon-dark.svg')]);
  run('usvg', [source('square_no_bg', 32), join(imagesDir, 'titlebar-icon-light.svg')]);
}

try {
  buildWindowsIco();
  buildTitleBarIcons();
  buildLinuxPngs();
  buildMacIconLayers();
  console.log('Icons regenerated in build/.');
} finally {
  rmSync(tmp, { recursive: true, force: true });
}
