import { contextBridge, ipcRenderer } from 'electron';
import type { FlintBridge, IpcChannel, IpcRequest, IpcResponse } from '../shared/ipc.js';

const flint: FlintBridge = {
  invoke<C extends IpcChannel>(
    channel: C,
    args: Extract<IpcRequest, { channel: C }>,
  ): Promise<IpcResponse<C>> {
    return ipcRenderer.invoke(channel, args) as Promise<IpcResponse<C>>;
  },
};

contextBridge.exposeInMainWorld('flint', flint);
