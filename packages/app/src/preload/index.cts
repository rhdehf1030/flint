import { contextBridge, ipcRenderer } from 'electron';
import type { FlintBridge, IpcChannel, IpcPushEvent, IpcRequest, IpcResponse } from '../shared/ipc.js';

const flint: FlintBridge = {
  invoke<C extends IpcChannel>(
    channel: C,
    args: Extract<IpcRequest, { channel: C }>,
  ): Promise<IpcResponse<C>> {
    return ipcRenderer.invoke(channel, args) as Promise<IpcResponse<C>>;
  },

  on(event: IpcPushEvent, listener: () => void): () => void {
    const handler = () => listener();
    ipcRenderer.on(event, handler);
    return () => { ipcRenderer.removeListener(event, handler); };
  },
};

contextBridge.exposeInMainWorld('flint', flint);
