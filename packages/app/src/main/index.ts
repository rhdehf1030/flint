import { app, BrowserWindow, shell, dialog, ipcMain } from 'electron';
import { join } from 'node:path';
import { existsSync, readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const __dirname = fileURLToPath(new URL('.', import.meta.url));

import { startMcpServer } from '@flint/mcp';
import type { McpServerHandle } from '@flint/mcp';

import { registerIpcHandlers } from './ipcHandlers.js';

const MCP_PORT = 3141;

let mcpHandle: McpServerHandle | null = null;
let mainWindow: BrowserWindow | null = null;

// ---------------------------------------------------------------------------
// Workspace config — persisted in userData/workspaces.json
// ---------------------------------------------------------------------------

export interface WorkspaceConfig {
  workspaces: string[];
  active: string;
}

function getWorkspaceConfigPath(): string {
  return join(app.getPath('userData'), 'workspaces.json');
}

function loadWorkspaceConfig(): WorkspaceConfig {
  const configPath = getWorkspaceConfigPath();
  if (existsSync(configPath)) {
    try {
      return JSON.parse(readFileSync(configPath, 'utf-8')) as WorkspaceConfig;
    } catch {
      // fall through to default
    }
  }
  // Default: detect from cwd or home
  const detected = detectWorkspaceRoot();
  return { workspaces: [detected], active: detected };
}

export function saveWorkspaceConfig(config: WorkspaceConfig): void {
  const configPath = getWorkspaceConfigPath();
  mkdirSync(join(configPath, '..'), { recursive: true });
  writeFileSync(configPath, JSON.stringify(config, null, 2), 'utf-8');
}

function detectWorkspaceRoot(): string {
  const cwd = process.cwd();
  if (existsSync(join(cwd, 'collections'))) return cwd;
  return app.getPath('home');
}

// ---------------------------------------------------------------------------
// Window
// ---------------------------------------------------------------------------

async function createWindow(): Promise<void> {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 800,
    minHeight: 600,
    title: 'Flint',
    webPreferences: {
      preload: join(__dirname, '../preload/index.cjs'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
    },
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    void shell.openExternal(url);
    return { action: 'deny' };
  });

  if (process.env['VITE_DEV_SERVER_URL']) {
    await mainWindow.loadURL(process.env['VITE_DEV_SERVER_URL']);
  } else {
    const indexPath = join(__dirname, '../renderer/index.html');
    await mainWindow.loadFile(indexPath);
  }
  mainWindow.webContents.openDevTools();
}

// ---------------------------------------------------------------------------
// App lifecycle
// ---------------------------------------------------------------------------

app.whenReady().then(async () => {
  const config = loadWorkspaceConfig();
  const workspaceRef = { root: config.active };

  // Start MCP server
  try {
    mcpHandle = await startMcpServer(MCP_PORT, workspaceRef);
  } catch (err) {
    console.error('[flint] Failed to start MCP server:', err);
  }

  // Register all IPC handlers (including workspace management)
  registerIpcHandlers(workspaceRef, config, saveWorkspaceConfig);

  // Workspace dialog handler — pass mainWindow so dialog is not hidden behind it
  ipcMain.handle('open-workspace', async () => {
    const win = BrowserWindow.getFocusedWindow() ?? mainWindow;
    const result = win
      ? await dialog.showOpenDialog(win, { properties: ['openDirectory'], title: 'Open Flint Workspace' })
      : await dialog.showOpenDialog({ properties: ['openDirectory'], title: 'Open Flint Workspace' });
    return result.filePaths[0] ?? null;
  });

  await createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      void createWindow();
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
