import { createRequire } from 'node:module';
import { spawn } from 'node:child_process';
import { dirname, join } from 'node:path';

const require = createRequire(import.meta.url);
const electron = require('electron');
const electronPath = typeof electron === 'function' ? electron() : electron;
const electronViteBin = join(dirname(require.resolve('electron-vite/package.json')), 'bin/electron-vite.js');

const child = spawn(process.execPath, [electronViteBin, 'dev'], {
  env: {
    ...process.env,
    ELECTRON_EXEC_PATH: electronPath,
  },
  stdio: 'inherit',
});

child.on('exit', (code, signal) => {
  if (signal) {
    process.kill(process.pid, signal);
    return;
  }

  process.exit(code ?? 0);
});
