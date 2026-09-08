import { app, BrowserWindow, dialog, ipcMain, Menu, shell, type MenuItemConstructorOptions } from 'electron';
import { access, mkdir, readFile, writeFile } from 'node:fs/promises';
import { basename, join } from 'node:path';

type ThemeMode = 'light' | 'dark' | 'system';
type RememberToolInput = 'never' | 'session' | 'forever';
type IndentStyle = '2-spaces' | '4-spaces' | 'tabs';

interface AppSettings {
  themeMode: ThemeMode;
  rememberToolInput: RememberToolInput;
  defaultIndentStyle: IndentStyle;
  defaultPreserveComments: boolean;
  defaultPreserveBlankLines: boolean;
  defaultCaseSensitive: boolean;
  defaultSortKeys: boolean;
  pinnedToolIds: string[];
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
};
const REMEMBER_TOOL_INPUT_MODES: RememberToolInput[] = ['never', 'session', 'forever'];
const INDENT_STYLES: IndentStyle[] = ['2-spaces', '4-spaces', 'tabs'];

const isDev = !app.isPackaged;
const textFileExtensions = [
  'txt', 'md', 'json', 'yml', 'yaml', 'xml', 'csv', 'log', 'ini', 'conf',
  'js', 'jsx', 'ts', 'tsx', 'css', 'scss', 'html', 'htm', 'py', 'lua', 'sh', 'sql',
];
let currentThemeMode: ThemeMode = 'system';
let mainWindowRef: BrowserWindow | null = null;

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
});

function setThemeFromMenu(mode: ThemeMode): void {
  currentThemeMode = mode;
  mainWindowRef?.webContents.send('set-theme', mode);
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

  return {
    themeMode,
    rememberToolInput,
    defaultIndentStyle,
    defaultPreserveComments,
    defaultPreserveBlankLines,
    defaultCaseSensitive,
    defaultSortKeys,
    pinnedToolIds,
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
              { role: 'about' },
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
      submenu: [isMac ? { role: 'close' } : { role: 'quit' }] as MenuItemConstructorOptions[],
    },
    {
      label: 'Edit',
      submenu: [
        { role: 'undo' },
        { role: 'redo' },
        { type: 'separator' },
        { role: 'cut' },
        { role: 'copy' },
        { role: 'paste' },
        ...(isMac
          ? [{ role: 'pasteAndMatchStyle' }, { role: 'delete' }, { role: 'selectAll' }]
          : [{ role: 'delete' }, { type: 'separator' }, { role: 'selectAll' }]),
      ] as MenuItemConstructorOptions[],
    },
    {
      label: 'View',
      submenu: [
        { role: 'reload' },
        { role: 'forceReload' },
        { role: 'toggleDevTools' },
        { type: 'separator' },
        { role: 'resetZoom' },
        { role: 'zoomIn' },
        { role: 'zoomOut' },
        { type: 'separator' },
        { role: 'togglefullscreen' },
        { type: 'separator' },
        { label: 'Theme', submenu: themeSubmenu },
      ] as MenuItemConstructorOptions[],
    },
    {
      label: 'Window',
      submenu: [
        { role: 'minimize' },
        { role: 'zoom' },
        ...(isMac
          ? [{ type: 'separator' }, { role: 'front' }, { type: 'separator' }, { role: 'window' }]
          : [{ role: 'close' }]),
      ] as MenuItemConstructorOptions[],
    },
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
    titleBarStyle: process.platform === 'darwin' ? 'hiddenInset' : 'default',
    vibrancy: process.platform === 'darwin' ? 'sidebar' : undefined,
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
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
