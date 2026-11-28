// Renders the Microsoft Store listing art (store/microsoft/) from the app icon, the vendored Ubuntu
// font, and a Windows screenshot: HTML laid out at each image's exact pixel size and captured with
// Playwright's Chromium. Run with `npm run store-art` after the icon or screenshots change, and
// commit the output. store/microsoft/README.md says where each image goes in Partner Center.
import { chromium } from '@playwright/test';
import { execFileSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const repo = fileURLToPath(new URL('..', import.meta.url));
const outDir = join(repo, 'store/microsoft');
const asset = (path) => pathToFileURL(join(repo, path)).href;
const icon = asset('build/icons/1024x1024.png');
const screenshot = asset('store/screenshots/windows/01-regex-tester-dark.png');

const base = `
  @font-face { font-family: Ubuntu; font-weight: 500; src: url('${asset('src/assets/fonts/ubuntu/ubuntu-500-latin.woff2')}'); }
  @font-face { font-family: Ubuntu; font-weight: 700; src: url('${asset('src/assets/fonts/ubuntu/ubuntu-700-latin.woff2')}'); }
  * { margin: 0; box-sizing: border-box; }
  body {
    width: 100vw; height: 100vh; overflow: hidden; font-family: Ubuntu, sans-serif; color: #f4f2ff;
    /* The app's dark theme: nearly black, with purple and blue atmosphere. */
    background:
      radial-gradient(ellipse 70% 60% at 22% 18%, rgba(124, 58, 237, 0.42), transparent 70%),
      radial-gradient(ellipse 65% 55% at 82% 88%, rgba(37, 99, 235, 0.34), transparent 70%),
      #05050a;
    display: flex; flex-direction: column; align-items: center; justify-content: center;
  }
  .icon { filter: drop-shadow(0 0.04em 0.08em rgba(0, 0, 0, 0.55)); }
  h1 { font-weight: 700; letter-spacing: -0.01em; white-space: nowrap; }
  p { font-weight: 500; color: #b9b3d6; white-space: nowrap; }
`;

const ART = [
  {
    file: '02-box-art-2160x2160.png', width: 2160, height: 2160,
    body: `<img class="icon" src="${icon}" style="width:1024px;font-size:400px">
      <h1 style="font-size:176px;margin-top:40px">Cody's Dev Tools</h1>`,
  },
  {
    file: '03-poster-art-1440x2160.png', width: 1440, height: 2160,
    body: `<img class="icon" src="${icon}" style="width:1000px;font-size:400px;margin-top:-120px">
      <h1 style="font-size:136px;margin-top:40px">Cody's Dev Tools</h1>
      <p style="font-size:68px;margin-top:28px">Offline tools for developers</p>`,
  },
  {
    // No text: the Store overlays the product title on hero art. Key content stays out of the
    // bottom quarter, where that overlay goes.
    file: '04-super-hero-art-3840x2160.png', width: 3840, height: 2160,
    body: `<div style="position:absolute;inset:0 0 25% 0;display:flex;align-items:center;justify-content:center;gap:180px">
        <img class="icon" src="${icon}" style="width:860px;font-size:400px">
        <img src="${screenshot}" style="width:2160px;border-radius:24px;box-shadow:0 40px 120px rgba(0,0,0,0.6),0 0 0 2px rgba(255,255,255,0.08)">
      </div>`,
  },
];

mkdirSync(outDir, { recursive: true });
const tempDir = mkdtempSync(join(tmpdir(), 'codys-dev-tools-store-art-'));
const browser = await chromium.launch();
for (const art of ART) {
  const page = await browser.newPage({ viewport: { width: art.width, height: art.height } });
  // Loaded from a file:// page so it can read the local icon, font, and screenshot.
  const html = join(tempDir, `${art.file}.html`);
  writeFileSync(html, `<!doctype html><meta charset="utf-8"><style>${base}</style><body>${art.body}</body>`);
  await page.goto(pathToFileURL(html).href);
  await page.evaluate(() => document.fonts.ready);
  await page.waitForLoadState('networkidle');
  await page.screenshot({ path: join(outDir, art.file) });
  await page.close();
  console.log(`Wrote store/microsoft/${art.file}`);
}
await browser.close();
rmSync(tempDir, { recursive: true, force: true });

// The required 1:1 app tile icon is the plain icon.
execFileSync('magick', [fileURLToPath(icon), '-filter', 'Lanczos', '-resize', '300x300', join(outDir, '01-app-tile-icon-300x300.png')]);
console.log('Wrote store/microsoft/01-app-tile-icon-300x300.png');
