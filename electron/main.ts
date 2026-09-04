import { app, BrowserWindow, dialog, ipcMain, shell } from 'electron';
import { readFile } from 'node:fs/promises';
import { basename, join } from 'node:path';

const isDev = !app.isPackaged;
const textFileExtensions = [
  'txt', 'md', 'json', 'yml', 'yaml', 'xml', 'csv', 'log', 'ini', 'conf',
  'js', 'jsx', 'ts', 'tsx', 'css', 'scss', 'html', 'htm', 'py', 'lua', 'sh', 'sql',
];

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

  if (isDev && process.env.ELECTRON_RENDERER_URL) {
    mainWindow.loadURL(process.env.ELECTRON_RENDERER_URL);
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'));
  }
}

app.whenReady().then(() => {
  app.setAppUserModelId('com.codysdevtools.app');
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
