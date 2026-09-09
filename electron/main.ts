import { app, BrowserWindow, dialog, ipcMain, Menu, nativeTheme, shell, type MenuItemConstructorOptions } from 'electron';
// electron-updater is CommonJS; Node's ESM loader can't always synthesize its named exports
// when the package is left external (see electron.vite.config.ts's externalizeDepsPlugin), so
// this packaged main process only sees a default export at runtime. Destructure from that
// instead of `import { autoUpdater } from 'electron-updater'`, which throws once packaged
// even though it type-checks and works fine under electron-vite's dev transform.
import electronUpdaterPkg from 'electron-updater';
import { access, mkdir, readFile, writeFile } from 'node:fs/promises';
import { basename, join } from 'node:path';

const { autoUpdater } = electronUpdaterPkg;

type ThemeMode = 'light' | 'dark' | 'system';
type RememberToolInput = 'never' | 'session' | 'forever';
type IndentStyle = '2-spaces' | '4-spaces' | 'tabs';
type SidebarDensity = 'comfortable' | 'compact';

interface AppSettings {
  themeMode: ThemeMode;
  rememberToolInput: RememberToolInput;
  defaultIndentStyle: IndentStyle;
  defaultPreserveComments: boolean;
  defaultPreserveBlankLines: boolean;
  defaultCaseSensitive: boolean;
  defaultSortKeys: boolean;
  pinnedToolIds: string[];
  sidebarDensity: SidebarDensity;
}

const DEFAULT_SETTINGS: AppSettings = {
  themeMode: 'system',
  rememberToolInput: 'never',
  defaultIndentStyle: '2-spaces',
  defaultPreserveComments: true,
  defaultPreserveBlankLines: false,
  defaultCaseSensitive: false,
  defaultSortKeys: false,
  pinnedToolIds: [],
  sidebarDensity: 'comfortable',
};
const REMEMBER_TOOL_INPUT_MODES: RememberToolInput[] = ['never', 'session', 'forever'];
const INDENT_STYLES: IndentStyle[] = ['2-spaces', '4-spaces', 'tabs'];
const SIDEBAR_DENSITIES: SidebarDensity[] = ['comfortable', 'compact'];

// Electron falls back to package.json's "name" field ("codys-dev-tools") for the
// app/menu-bar name during development, since productName is only read from the
// electron-builder config once packaged. Force it here so dev and packaged builds match.
app.setName("Cody's Dev Tools");

const isDev = !app.isPackaged;
const isMacOS = process.platform === 'darwin';
const isWindows = process.platform === 'win32';
// Points at the release the update check found. Used for the manual/"View Release" flow below.
const GITHUB_RELEASES_URL = 'https://github.com/codysechelski/codys-dev-tools-two/releases';

// Windows only: electron's Window Controls Overlay lets us draw our own titlebar content
// (icon + menu, see CustomTitleBar.vue) while Windows still paints the native minimize/
// maximize/close buttons, tinted to match. These hexes mirror the dark/light
// --app-shell-background and --app-text tokens in src/styles/_tokens.scss / main.scss —
// duplicated here because the main process can't read the renderer's CSS custom properties.
const TITLEBAR_OVERLAY_HEIGHT = 32;
const TITLEBAR_OVERLAY_COLORS = {
  dark: { color: '#0c0d1f', symbolColor: '#eef2ff' },
  light: { color: '#e9eef8', symbolColor: '#111936' },
};

function resolveTitleBarOverlay(): { color: string; symbolColor: string; height: number } {
  const isDark = currentThemeMode === 'system' ? nativeTheme.shouldUseDarkColors : currentThemeMode === 'dark';
  return { ...TITLEBAR_OVERLAY_COLORS[isDark ? 'dark' : 'light'], height: TITLEBAR_OVERLAY_HEIGHT };
}

function applyTitleBarOverlay(): void {
  if (!isWindows) return;
  mainWindowRef?.setTitleBarOverlay(resolveTitleBarOverlay());
}

const textFileExtensions = [
  'txt', 'md', 'json', 'yml', 'yaml', 'xml', 'svg', 'csv', 'log', 'ini', 'conf',
  'js', 'jsx', 'ts', 'tsx', 'css', 'scss', 'html', 'htm', 'py', 'lua', 'sh', 'sql',
];
let currentThemeMode: ThemeMode = 'system';
let mainWindowRef: BrowserWindow | null = null;

// Checked once shortly after launch (so it doesn't compete with initial window load) and then
// periodically, in case the app is left open for a long time.
const UPDATE_CHECK_DELAY_MS = 10_000;
const UPDATE_CHECK_INTERVAL_MS = 4 * 60 * 60 * 1000;

// macOS's native updater (Squirrel.Mac/ShipIt) refuses to install an update whose code signature
// doesn't validate, and this app isn't code-signed — so on mac, downloading (let alone
// installing) an update automatically would just fail silently every time. Instead, mac gets a
// lighter "a new version exists" notice that sends the user to the Releases page to download and
// reinstall by hand; Windows/Linux keep the full automatic download-and-install flow.
autoUpdater.autoDownload = !isMacOS;
autoUpdater.autoInstallOnAppQuit = true;

autoUpdater.on('update-available', (info) => {
  if (!isMacOS) return; // non-mac waits for "update-downloaded" below instead

  mainWindowRef?.webContents.send('update-notice', { version: info.version, action: 'manual', releasesUrl: GITHUB_RELEASES_URL });
});

autoUpdater.on('update-downloaded', (info) => {
  mainWindowRef?.webContents.send('update-notice', { version: info.version, action: 'install', releasesUrl: GITHUB_RELEASES_URL });
});

autoUpdater.on('error', (error) => {
  // Background checks fail silently (no network, rate-limited, unsupported platform, etc.) —
  // only the user-initiated "Check for Updates..." menu action surfaces a dialog.
  console.error('Auto-update error:', error);
});

function checkForUpdatesInBackground(): void {
  if (!app.isPackaged) return;

  autoUpdater.checkForUpdates().catch((error: unknown) => {
    console.error('Failed to check for updates:', error);
  });
}

async function checkForUpdatesFromMenu(): Promise<void> {
  if (!app.isPackaged) {
    await dialog.showMessageBox({ type: 'info', message: 'Updates are not available in development builds.' });
    return;
  }

  try {
    const result = await autoUpdater.checkForUpdates();
    const latestVersion = result?.updateInfo.version;
    if (!latestVersion || latestVersion === app.getVersion()) {
      await dialog.showMessageBox({
        type: 'info',
        message: "You're up to date",
        detail: `${app.name} ${app.getVersion()} is the latest version.`,
      });
    }
    // If a newer version *was* found, autoUpdater's own "update-downloaded" event (wired above)
    // notifies the renderer once it finishes downloading — same as a background check.
  } catch (error) {
    await dialog.showMessageBox({
      type: 'error',
      message: 'Unable to check for updates',
      detail: error instanceof Error ? error.message : String(error),
    });
  }
}

ipcMain.on('quit-and-install-update', () => {
  autoUpdater.quitAndInstall();
});

ipcMain.handle('load-text-file', async () => {
  const result = await dialog.showOpenDialog({
    properties: ['openFile'],
    filters: [
      { name: 'Text Files', extensions: textFileExtensions },
      { name: 'All Files', extensions: ['*'] },
    ],
  });

  if (result.canceled || !result.filePaths[0]) return null;

  const filePath = result.filePaths[0];
  const name = basename(filePath);
  const buffer = await readFile(filePath);

  if (looksLikeBinary(buffer)) {
    return { name, error: `"${name}" doesn't look like a text file.` };
  }

  return { name, content: buffer.toString('utf-8') };
});

function looksLikeBinary(buffer: Buffer): boolean {
  return buffer.subarray(0, 8000).includes(0);
}

ipcMain.on('theme-mode-changed', (_event, mode: ThemeMode) => {
  currentThemeMode = mode;
  syncThemeMenuChecked();
  applyTitleBarOverlay();
});

ipcMain.on('trigger-menu-action', (_event, id: string) => {
  Menu.getApplicationMenu()?.getMenuItemById(id)?.click();
});

nativeTheme.on('updated', () => {
  if (currentThemeMode === 'system') applyTitleBarOverlay();
});

function setThemeFromMenu(mode: ThemeMode): void {
  currentThemeMode = mode;
  mainWindowRef?.webContents.send('set-theme', mode);
  applyTitleBarOverlay();
}

function showHome(): void {
  mainWindowRef?.webContents.send('navigate-home');
}

function showSettings(): void {
  mainWindowRef?.webContents.send('navigate-settings');
}

function syncThemeMenuChecked(): void {
  const menu = Menu.getApplicationMenu();

  for (const mode of ['light', 'dark', 'system'] as const) {
    const item = menu?.getMenuItemById(`theme-${mode}`);
    if (item) item.checked = currentThemeMode === mode;
  }
}

// Settings can live in a user-chosen directory (for dotfile management), but we need a
// fixed, well-known place to remember *which* directory that is. This tiny pointer file
// always lives in the default userData folder, even when the real settings.json doesn't.
interface SettingsLocationPointer {
  customDirectory: string | null;
}

function getPointerFilePath(): string {
  return join(app.getPath('userData'), 'settings-location.json');
}

async function readSettingsLocationPointer(): Promise<SettingsLocationPointer> {
  try {
    const raw = await readFile(getPointerFilePath(), 'utf-8');
    const parsed = JSON.parse(raw) as Partial<SettingsLocationPointer>;
    return { customDirectory: typeof parsed.customDirectory === 'string' ? parsed.customDirectory : null };
  } catch {
    return { customDirectory: null };
  }
}

async function writeSettingsLocationPointer(customDirectory: string | null): Promise<void> {
  const userDataDir = app.getPath('userData');
  await mkdir(userDataDir, { recursive: true });
  await writeFile(getPointerFilePath(), JSON.stringify({ customDirectory }, null, 2), 'utf-8');
}

interface ResolvedSettingsDir {
  dir: string;
  isCustom: boolean;
  warning?: string;
}

async function resolveSettingsDir(): Promise<ResolvedSettingsDir> {
  const pointer = await readSettingsLocationPointer();
  if (!pointer.customDirectory) return { dir: app.getPath('userData'), isCustom: false };

  try {
    await access(pointer.customDirectory);
    return { dir: pointer.customDirectory, isCustom: true };
  } catch {
    return {
      dir: app.getPath('userData'),
      isCustom: false,
      warning: `Custom settings location "${pointer.customDirectory}" is unavailable; using the default location instead.`,
    };
  }
}

function getSettingsFilePath(dir: string): string {
  return join(dir, 'settings.json');
}

function mergeSettings(raw: unknown): AppSettings {
  if (typeof raw !== 'object' || raw === null) return { ...DEFAULT_SETTINGS };

  const candidate = raw as Partial<AppSettings>;
  const themeMode: ThemeMode =
    candidate.themeMode === 'light' || candidate.themeMode === 'dark' || candidate.themeMode === 'system' ? candidate.themeMode : DEFAULT_SETTINGS.themeMode;
  const rememberToolInput: RememberToolInput = REMEMBER_TOOL_INPUT_MODES.includes(candidate.rememberToolInput as RememberToolInput)
    ? (candidate.rememberToolInput as RememberToolInput)
    : DEFAULT_SETTINGS.rememberToolInput;
  const defaultIndentStyle: IndentStyle = INDENT_STYLES.includes(candidate.defaultIndentStyle as IndentStyle)
    ? (candidate.defaultIndentStyle as IndentStyle)
    : DEFAULT_SETTINGS.defaultIndentStyle;
  const defaultPreserveComments = typeof candidate.defaultPreserveComments === 'boolean' ? candidate.defaultPreserveComments : DEFAULT_SETTINGS.defaultPreserveComments;
  const defaultPreserveBlankLines =
    typeof candidate.defaultPreserveBlankLines === 'boolean' ? candidate.defaultPreserveBlankLines : DEFAULT_SETTINGS.defaultPreserveBlankLines;
  const defaultCaseSensitive = typeof candidate.defaultCaseSensitive === 'boolean' ? candidate.defaultCaseSensitive : DEFAULT_SETTINGS.defaultCaseSensitive;
  const defaultSortKeys = typeof candidate.defaultSortKeys === 'boolean' ? candidate.defaultSortKeys : DEFAULT_SETTINGS.defaultSortKeys;
  const pinnedToolIds = Array.isArray(candidate.pinnedToolIds)
    ? [...new Set(candidate.pinnedToolIds.filter((id): id is string => typeof id === 'string'))]
    : DEFAULT_SETTINGS.pinnedToolIds;
  const sidebarDensity: SidebarDensity = SIDEBAR_DENSITIES.includes(candidate.sidebarDensity as SidebarDensity)
    ? (candidate.sidebarDensity as SidebarDensity)
    : DEFAULT_SETTINGS.sidebarDensity;

  return {
    themeMode,
    rememberToolInput,
    defaultIndentStyle,
    defaultPreserveComments,
    defaultPreserveBlankLines,
    defaultCaseSensitive,
    defaultSortKeys,
    pinnedToolIds,
    sidebarDensity,
  };
}

ipcMain.handle('load-settings', async () => {
  const { dir, isCustom, warning } = await resolveSettingsDir();
  await mkdir(dir, { recursive: true });
  const filePath = getSettingsFilePath(dir);

  let settings = DEFAULT_SETTINGS;
  try {
    const raw = await readFile(filePath, 'utf-8');
    settings = mergeSettings(JSON.parse(raw));
  } catch {
    await writeFile(filePath, JSON.stringify(settings, null, 2), 'utf-8');
  }

  currentThemeMode = settings.themeMode;
  syncThemeMenuChecked();

  return { settings, settingsPath: filePath, isCustomLocation: isCustom, warning };
});

ipcMain.handle('save-settings', async (_event, settings: AppSettings) => {
  const { dir } = await resolveSettingsDir();
  await mkdir(dir, { recursive: true });
  const filePath = getSettingsFilePath(dir);
  await writeFile(filePath, JSON.stringify(settings, null, 2), 'utf-8');

  return { settingsPath: filePath };
});

ipcMain.handle('choose-settings-directory', async () => {
  const result = await dialog.showOpenDialog({ properties: ['openDirectory', 'createDirectory'] });
  if (result.canceled || !result.filePaths[0]) return null;

  const chosenDir = result.filePaths[0];
  await writeSettingsLocationPointer(chosenDir);

  return { settingsPath: getSettingsFilePath(chosenDir), isCustomLocation: true };
});

ipcMain.handle('reset-settings-directory', async () => {
  await writeSettingsLocationPointer(null);
  const dir = app.getPath('userData');

  return { settingsPath: getSettingsFilePath(dir), isCustomLocation: false };
});

// Tool state (the "Remember tool input" feature) always lives in the default userData
// folder, unlike settings.json — it's bulk restorable data, not something meant to be
// relocated alongside a dotfile-managed settings.json.
function getToolStateFilePath(): string {
  return join(app.getPath('userData'), 'tool-state.json');
}

ipcMain.handle('load-tool-state', async () => {
  try {
    const raw = await readFile(getToolStateFilePath(), 'utf-8');
    const parsed = JSON.parse(raw);
    return typeof parsed === 'object' && parsed !== null ? parsed : {};
  } catch {
    return {};
  }
});

ipcMain.handle('save-tool-state', async (_event, state: Record<string, Record<string, unknown>>) => {
  const dir = app.getPath('userData');
  await mkdir(dir, { recursive: true });
  await writeFile(getToolStateFilePath(), JSON.stringify(state, null, 2), 'utf-8');
});

ipcMain.handle('clear-tool-state', async () => {
  const dir = app.getPath('userData');
  await mkdir(dir, { recursive: true });
  await writeFile(getToolStateFilePath(), JSON.stringify({}, null, 2), 'utf-8');
});

function buildAppMenu(): Menu {
  const isMac = process.platform === 'darwin';
  const themeSubmenu: MenuItemConstructorOptions[] = [
    { id: 'theme-light', label: 'Light', type: 'radio', checked: currentThemeMode === 'light', click: () => setThemeFromMenu('light') },
    { id: 'theme-dark', label: 'Dark', type: 'radio', checked: currentThemeMode === 'dark', click: () => setThemeFromMenu('dark') },
    { id: 'theme-system', label: 'System', type: 'radio', checked: currentThemeMode === 'system', click: () => setThemeFromMenu('system') },
  ];

  const template: MenuItemConstructorOptions[] = [
    ...(isMac
      ? [
          {
            label: app.name,
            submenu: [
              { label: `About ${app.name}`, click: () => showHome() },
              { label: 'Check for Updates...', click: () => void checkForUpdatesFromMenu() },
              { type: 'separator' },
              { label: 'Settings', accelerator: 'Cmd+,', click: () => showSettings() },
              { type: 'separator' },
              { role: 'services' },
              { type: 'separator' },
              { role: 'hide' },
              { role: 'hideOthers' },
              { role: 'unhide' },
              { type: 'separator' },
              { role: 'quit' },
            ] as MenuItemConstructorOptions[],
          },
        ]
      : []),
    {
      label: 'File',
      submenu: (isMac
        ? [{ role: 'close' }]
        : [
            { id: 'menu-settings', label: 'Settings', accelerator: 'Ctrl+,', click: () => showSettings() },
            { type: 'separator' },
            { id: 'menu-quit', role: 'quit' },
          ]) as MenuItemConstructorOptions[],
    },
    {
      label: 'Edit',
      submenu: [
        { id: 'menu-undo', role: 'undo' },
        { id: 'menu-redo', role: 'redo' },
        { type: 'separator' },
        { id: 'menu-cut', role: 'cut' },
        { id: 'menu-copy', role: 'copy' },
        { id: 'menu-paste', role: 'paste' },
        ...(isMac
          ? [{ role: 'pasteAndMatchStyle' }, { role: 'delete' }, { role: 'selectAll' }]
          : [
              { id: 'menu-delete', role: 'delete' },
              { type: 'separator' },
              { id: 'menu-select-all', role: 'selectAll' },
            ]),
      ] as MenuItemConstructorOptions[],
    },
    {
      label: 'View',
      submenu: [
        { label: 'Theme', submenu: themeSubmenu },
        { type: 'separator' },
        { id: 'menu-reload', role: 'reload' },
        { id: 'menu-force-reload', role: 'forceReload' },
        { id: 'menu-toggle-devtools', role: 'toggleDevTools' },
        { type: 'separator' },
        { id: 'menu-reset-zoom', role: 'resetZoom' },
        { id: 'menu-zoom-in', role: 'zoomIn' },
        { id: 'menu-zoom-out', role: 'zoomOut' },
        // macOS already adds an "Enter Full Screen" item to the Window menu itself for any
        // fullscreenable window, so a second entry here would just duplicate it.
        ...(isMac ? [] : [{ type: 'separator' }, { id: 'menu-toggle-fullscreen', role: 'togglefullscreen' }]),
      ] as MenuItemConstructorOptions[],
    },
    {
      label: 'Window',
      submenu: [
        { id: 'menu-minimize', role: 'minimize' },
        { id: 'menu-maximize', role: 'zoom' },
        ...(isMac
          ? [{ type: 'separator' }, { role: 'front' }, { type: 'separator' }, { role: 'window' }]
          : [{ id: 'menu-close', role: 'close' }]),
      ] as MenuItemConstructorOptions[],
    },
    ...(isMac
      ? []
      : [
          {
            label: 'Help',
            submenu: [
              { id: 'menu-about', label: `About ${app.name}`, click: () => showHome() },
              { id: 'menu-check-updates', label: 'Check for Updates...', click: () => void checkForUpdatesFromMenu() },
            ] as MenuItemConstructorOptions[],
          },
        ]),
  ];

  return Menu.buildFromTemplate(template);
}

function createWindow(): void {
  const mainWindow = new BrowserWindow({
    width: 1200,
    height: 780,
    minWidth: 900,
    minHeight: 620,
    title: "Cody's Dev Tools",
    // Windows' installer/exe resource icon comes from build/icon.ico automatically at package
    // time, but the *running* window/taskbar icon is whatever this option points at — point it
    // at the same .ico there so they match instead of the running window falling back to the
    // plain (mac/linux) icon.png.
    icon: join(__dirname, '../../build/', isWindows ? 'icon.ico' : 'icon.png'),
    // mac: native inset title bar with traffic lights. Windows: hidden native title bar +
    // Window Controls Overlay, so our own CustomTitleBar.vue can draw the icon/menu inline
    // while Windows still paints (and themes, via titleBarOverlay below) the native
    // minimize/maximize/close buttons. Linux keeps the plain default chrome for now — no
    // titleBarOverlay support, and window-control conventions vary too much by desktop
    // environment to safely draw our own.
    titleBarStyle: isMacOS ? 'hiddenInset' : isWindows ? 'hidden' : 'default',
    titleBarOverlay: isWindows ? resolveTitleBarOverlay() : undefined,
    vibrancy: isMacOS ? 'sidebar' : undefined,
    backgroundColor: '#0b1026',
    trafficLightPosition: { x: 16, y: 16 },
    webPreferences: {
      preload: join(__dirname, '../preload/index.mjs'),
      sandbox: false,
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: 'deny' };
  });

  // The native menu bar row is replaced by CustomTitleBar.vue on Windows; Menu.setApplicationMenu
  // stays wired up below regardless, since keyboard accelerators and the trigger-menu-action
  // IPC handler both still route through it.
  if (isWindows) mainWindow.setMenuBarVisibility(false);

  mainWindowRef = mainWindow;
  mainWindow.on('closed', () => {
    if (mainWindowRef === mainWindow) mainWindowRef = null;
  });

  if (isDev && process.env.ELECTRON_RENDERER_URL) {
    mainWindow.loadURL(process.env.ELECTRON_RENDERER_URL);
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'));
  }
}

app.whenReady().then(() => {
  app.setAppUserModelId('com.codysdevtools.app');
  Menu.setApplicationMenu(buildAppMenu());
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });

  setTimeout(checkForUpdatesInBackground, UPDATE_CHECK_DELAY_MS);
  setInterval(checkForUpdatesInBackground, UPDATE_CHECK_INTERVAL_MS);
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
