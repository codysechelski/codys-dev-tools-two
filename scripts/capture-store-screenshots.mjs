// Captures the Mac App Store screenshots (2880 x 1800) from the real app window: launches the
// Electron build with Playwright, fills each tool with sample input, and captures the window with
// macOS `screencapture`, then flattens the transparent rounded corners (App Store Connect rejects
// transparency). Each shot uses a throwaway settings folder, so your own settings aren't touched.
//
//   npm run store-screenshots            all shots, into store/screenshots/mac/
//   npm run store-screenshots -- regex   only shots whose file name contains "regex"
//
// macOS only. Needs ImageMagick, and Screen Recording permission for your terminal the first time.
// Windows steal focus while it runs, so don't type until it finishes.
import { _electron } from '@playwright/test';
import { execFileSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const repo = fileURLToPath(new URL('..', import.meta.url));
const outDir = join(repo, 'store/screenshots/mac');
const userDataRoot = mkdtempSync(join(tmpdir(), 'codys-dev-tools-screenshots-'));
const only = process.argv[2];

const EMAIL_TEXT = `Last Thursday morning, Daniel Mercer arrived at the office earlier than usual. He had been working for several weeks on a community project that connected local volunteers with families who needed assistance. His longtime friend, Rebecca Collins, could always be reached at rebecca.collins@example.com. Daniel had originally proposed building a small website to coordinate volunteers, but as more people became interested, the project quickly grew beyond its expectations. By the time he finished his first cup of coffee, he had already received messages from daniel.mercer@example.org, volunteers@communityhub.test, and sarah.johnson@example.net.

Around lunchtime, Daniel met with his colleague Marcus Bennett at a small café near the town square. Marcus suggested contacting several local businesses, including a bakery managed by someone using orders@sunrisebakery.example and a printing company whose general mailbox was support@brightprint.example. Marcus also recommended reaching out to Emily Parker, a retired teacher who had volunteered at similar events for years. Her email address, emily.parker@example.net, was already in Daniel's contact list.

By Friday afternoon, the project was gaining momentum. A local technology company offered to donate several refurbished laptops, provided that Daniel could arrange transportation. The company's representative, Olivia Chen, sent the details from olivia.chen@techbridge.example, explaining that the equipment would be available the following Wednesday. Meanwhile, a local photographer named James Wilson volunteered to document the event and promised to deliver edited photographs within a week through jwilson.photography@example.org.

On Saturday, everything came together. Volunteers checked in at the front desk, where a sign-up sheet listed team.leads@communityhub.test for questions, and dispatch@greenwaytransport.example confirmed the delivery schedule.`;

const MESSY_JSON = `{"order":{"id":"ORD-20481","placed":"2026-11-27T14:32:08Z","status":"shipped","customer":{"name":"Avery Brooks","email":"avery@example.com","tier":"gold","addresses":[{"type":"shipping","line1":"1200 Market St","city":"San Francisco","region":"CA","postal":"94102","country":"US"}]},"items":[{"sku":"KB-75-BLK","name":"Mechanical Keyboard","qty":1,"price":129.0,"options":{"switches":"tactile","layout":"ANSI"}},{"sku":"MS-ERG-02","name":"Ergonomic Mouse","qty":1,"price":59.5},{"sku":"CB-USBC-2M","name":"USB-C Cable (2 m)","qty":3,"price":12.99}],"totals":{"subtotal":227.47,"tax":20.47,"shipping":0,"grand":247.94,"currency":"USD"},"tracking":{"carrier":"UPS","number":"1Z999AA10123456784","events":[{"at":"2026-11-27T18:05:00Z","status":"label_created"},{"at":"2026-11-28T02:41:00Z","status":"in_transit","location":"Oakland, CA"}]},"gift":false,"notes":null}}`;

const DIFF_BEFORE = `export async function fetchUser(id) {
  const response = await fetch('/api/users/' + id);
  const data = await response.json();
  return data;
}

export function formatName(user) {
  return user.first + ' ' + user.last;
}

export function isAdmin(user) {
  return user.role == 'admin';
}`;
const DIFF_AFTER = `export async function fetchUser(id, { signal } = {}) {
  const response = await fetch(\`/api/users/\${encodeURIComponent(id)}\`, { signal });
  if (!response.ok) throw new Error(\`Request failed: \${response.status}\`);
  return response.json();
}

export function formatName(user) {
  return [user.first, user.middle, user.last].filter(Boolean).join(' ');
}

export function isAdmin(user) {
  return user.roles?.includes('admin') ?? false;
}`;

const SQL = `select c.id, c.name, c.email, count(o.id) as order_count, sum(o.total) as lifetime_value, max(o.placed_at) as last_order from customers c left join orders o on o.customer_id = c.id and o.status in ('paid', 'shipped', 'delivered') where c.created_at >= '2025-01-01' and c.region = 'us-west' group by c.id, c.name, c.email having sum(o.total) > 500 order by lifetime_value desc, last_order desc limit 25;`;

// Hard-wraps prose so it reads without horizontal scrolling in the narrower editors.
function wrap(text, width = 58) {
  return text.split('\n').map((paragraph) => {
    const lines = [];
    let line = '';
    for (const word of paragraph.split(' ')) {
      if (line && (line + ' ' + word).length > width) { lines.push(line); line = word; }
      else line = line ? line + ' ' + word : word;
    }
    lines.push(line);
    return lines.join('\n');
  }).join('\n');
}

const SHOTS = [
  { file: '01-regex-tester-dark.png', theme: 'dark', tool: 'Regex Tester', inputs: ['\\b[\\w.+-]+@[\\w-]+\\.[a-zA-Z]{2,}\\b', wrap(EMAIL_TEXT)] },
  { file: '02-json-formatter-dark.png', theme: 'dark', tool: 'JSON Formatter', inputs: [MESSY_JSON] },
  { file: '03-diff-tool-light.png', theme: 'light', tool: 'Diff Tool', inputs: [DIFF_BEFORE, DIFF_AFTER] },
  { file: '04-sql-formatter-dark.png', theme: 'dark', tool: 'SQL Formatter', inputs: [SQL] },
  { file: '05-time-zone-converter-dark.png', theme: 'dark', tool: 'Time Zone Converter', inputs: [] },
  { file: '06-qr-code-generator-light.png', theme: 'light', tool: 'QR Code Generator', inputs: [], prepare: (page) => page.locator('textarea').first().fill('https://devtools.codystools.online/') },
  { file: '07-unicode-character-map-dark.png', theme: 'dark', tool: 'Unicode Character Map', inputs: [], prepare: (page) => page.getByPlaceholder('Search by Unicode name, code, or character').fill('rightwards arrow') },
];

mkdirSync(outDir, { recursive: true });
for (const shot of SHOTS) {
  if (only && !only.split(',').some((name) => shot.file.includes(name))) continue;
  const userData = join(userDataRoot, shot.file);
  mkdirSync(userData, { recursive: true });
  writeFileSync(join(userData, 'settings.json'), JSON.stringify({ themeMode: shot.theme }));

  const app = await _electron.launch({
    executablePath: join(repo, 'node_modules/electron/dist/Electron.app/Contents/MacOS/Electron'),
    args: ['.', `--user-data-dir=${userData}`],
    cwd: repo,
  });
  const page = await app.firstWindow();
  await page.waitForSelector('.sidebar');
  await app.evaluate(({ BrowserWindow }) => {
    const win = BrowserWindow.getAllWindows()[0];
    win.setBounds({ x: 120, y: 120, width: 1440, height: 900 });
  });
  await page.locator('.sidebar').getByText(shot.tool, { exact: true }).first().click();
  await page.waitForTimeout(500);
  for (const [index, text] of shot.inputs.entries()) {
    await page.locator('.cm-content').nth(index).click();
    await page.keyboard.press('Meta+A');
    await page.keyboard.insertText(text);
    // Back to the top-left so the editor isn't left scrolled to the end.
    await page.keyboard.press('Meta+ArrowUp');
  }
  if (shot.prepare) await shot.prepare(page);
  // No hover states from wherever the real mouse pointer happens to be.
  await page.addStyleTag({ content: '* { pointer-events: none !important; }' });
  await page.waitForTimeout(1200);
  // A focused window has colored traffic lights; retry in case another app takes focus back.
  for (let attempt = 0; attempt < 20; attempt++) {
    const focused = await app.evaluate(({ app, BrowserWindow }) => {
      app.focus({ steal: true });
      BrowserWindow.getAllWindows()[0].focus();
      return BrowserWindow.getAllWindows()[0].isFocused();
    });
    await page.waitForTimeout(300);
    if (focused && (await app.evaluate(({ BrowserWindow }) => BrowserWindow.getAllWindows()[0].isFocused()))) break;
  }

  const sourceId = await app.evaluate(({ BrowserWindow }) => BrowserWindow.getAllWindows()[0].getMediaSourceId());
  const windowId = sourceId.split(':')[1];
  const file = join(outDir, shot.file);
  execFileSync('screencapture', ['-x', '-o', `-l${windowId}`, file]);
  await app.close();
  const backdrop = shot.theme === 'dark' ? '#05050a' : '#e8e8f0';
  execFileSync('magick', [file, '-background', backdrop, '-flatten', '-alpha', 'off', file]);
  console.log(`Wrote store/screenshots/mac/${shot.file}`);
}
rmSync(userDataRoot, { recursive: true, force: true });
