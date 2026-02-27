import { app, BrowserWindow, shell, dialog } from 'electron';
import { join, resolve } from 'node:path';
import { existsSync } from 'node:fs';

import { startMcpServer } from '@flint/mcp';
import type { McpServerHandle } from '@flint/mcp';

import { registerIpcHandlers } from './ipcHandlers.js';

const MCP_PORT = 3141;

let mcpHandle: McpServerHandle | null = null;
let mainWindow: BrowserWindow | null = null;

// Determine workspace root: directory containing a `collections/` folder,
// falling back to the user's home directory.
function resolveWorkspaceRoot(): string {
  const cwd = process.cwd();
  if (existsSync(join(cwd, 'collections'))) return cwd;
  return app.getPath('home');
}

async function createWindow(workspaceRoot: string): Promise<void> {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 800,
    minHeight: 600,
    title: 'Flint',
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
    },
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  // Open external links in default browser
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    void shell.openExternal(url);
    return { action: 'deny' };
  });

  if (process.env['VITE_DEV_SERVER_URL']) {
    await mainWindow.loadURL(process.env['VITE_DEV_SERVER_URL']);
    mainWindow.webContents.openDevTools();
  } else {
    const indexPath = join(__dirname, '../renderer/index.html');
    await mainWindow.loadFile(indexPath);
  }
}

app.whenReady().then(async () => {
  const workspaceRoot = resolveWorkspaceRoot();

  // Start MCP server
  try {
    mcpHandle = await startMcpServer(MCP_PORT, workspaceRoot);
  } catch (err) {
    console.error('[flint] Failed to start MCP server:', err);
  }

  // Register all IPC handlers
  registerIpcHandlers(workspaceRoot);

  await createWindow(workspaceRoot);

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      void createWindow(workspaceRoot);
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('quit', async () => {
  if (mcpHandle) {
    await mcpHandle.stop().catch(() => undefined);
    mcpHandle = null;
  }
});
