import { create } from 'zustand';
import type { Collection, CollectionRequest, ScenarioResult, HistoryEntry, AuthProfile, HttpRequest, HttpResponse } from '@flint/core';

export interface ActiveRequest {
  collection: CollectionRequest;
  request?: HttpRequest;
  response?: HttpResponse;
}

export interface AppState {
  // Workspaces
  workspaces: string[];
  activeWorkspace: string;
  setWorkspaces: (workspaces: string[], active: string) => void;
  setActiveWorkspace: (path: string) => void;

  // Environment
  activeEnv: string;
  envList: string[];
  setActiveEnv: (env: string) => void;
  setEnvList: (envs: string[]) => void;

  // Collections (grouped by folder)
  collections: Collection[];
  setCollections: (collections: Collection[]) => void;

  // Active request editor
  activeRequest: ActiveRequest | null;
  setActiveRequest: (req: ActiveRequest | null) => void;
  setResponse: (response: HttpResponse) => void;

  // Scenario results
  lastScenarioResult: ScenarioResult | null;
  setLastScenarioResult: (result: ScenarioResult | null) => void;

  // History
  history: Record<string, HistoryEntry[]>;
  setHistory: (operationId: string, entries: HistoryEntry[]) => void;

  // Auth profiles
  authProfiles: AuthProfile[];
  setAuthProfiles: (profiles: AuthProfile[]) => void;

  // UI state
  activePanel: 'request' | 'scenarios' | 'history' | 'bench' | 'graphql' | 'websocket' | 'docs' | 'env' | 'auth';
  setActivePanel: (panel: AppState['activePanel']) => void;

  sidebarCollapsed: boolean;
  setSidebarCollapsed: (collapsed: boolean) => void;
}

export const useAppStore = create<AppState>((set) => ({
  // Workspaces
  workspaces: [],
  activeWorkspace: '',
  setWorkspaces: (workspaces, active) => set({ workspaces, activeWorkspace: active }),
  setActiveWorkspace: (activeWorkspace) => set({ activeWorkspace }),

  // Environment
  activeEnv: 'base',
  envList: ['base'],
  setActiveEnv: (activeEnv) => set({ activeEnv }),
  setEnvList: (envList) => set({ envList }),

  // Collections
  collections: [],
  setCollections: (collections) => set({ collections }),

  // Active request editor
  activeRequest: null,
  setActiveRequest: (activeRequest) => set({ activeRequest }),
  setResponse: (response) =>
    set((state) =>
      state.activeRequest ? { activeRequest: { ...state.activeRequest, response } } : {},
    ),

  // Scenario results
  lastScenarioResult: null,
  setLastScenarioResult: (lastScenarioResult) => set({ lastScenarioResult }),

  // History
  history: {},
  setHistory: (operationId, entries) =>
    set((state) => ({ history: { ...state.history, [operationId]: entries } })),

  // Auth profiles
  authProfiles: [],
  setAuthProfiles: (authProfiles) => set({ authProfiles }),

  // UI state
  activePanel: 'request',
  setActivePanel: (activePanel) => set({ activePanel }),

  sidebarCollapsed: false,
  setSidebarCollapsed: (sidebarCollapsed) => set({ sidebarCollapsed }),
}));
