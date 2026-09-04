import { app, BrowserWindow, dialog, ipcMain, Menu, shell, type MenuItemConstructorOptions } from 'electron';
import { readFile } from 'node:fs/promises';
import { basename, join } from 'node:path';

type ThemeMode = 'light' | 'dark' | 'system';

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
