import React, { useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import type { FlintBridge } from '../shared/ipc.js';
import type { CollectionRequest, ScenarioResult, HistoryEntry, HttpRequest, HttpResponse, BenchmarkResult } from '@flint/core';

import { CollectionTree } from './components/CollectionTree.js';
import { RequestEditor } from './components/RequestEditor.js';
import { ResponseViewer } from './components/ResponseViewer.js';
import { ScenarioList } from './components/ScenarioList.js';
import { ScenarioResultView } from './components/ScenarioResultView.js';
import { EnvironmentSelector } from './components/EnvironmentSelector.js';
import { EnvVarTable } from './components/EnvVarTable.js';
import { CodeSnippetPanel } from './components/CodeSnippetPanel.js';
import { HistoryPanel } from './components/HistoryPanel.js';
import { AuthManagerPanel } from './components/AuthManagerPanel.js';
import { GraphQLEditor } from './components/GraphQLEditor.js';
import { WebSocketPanel } from './components/WebSocketPanel.js';
import { BenchmarkPanel } from './components/BenchmarkPanel.js';
import { DocViewer } from './components/DocViewer.js';
import { useAppStore } from './store/appStore.js';
import { getOperationInfo } from './utils/collectionUtils.js';

declare global {
  interface Window {
    flint: FlintBridge;
  }
}

const flint = window.flint;

type MainPanel = 'request' | 'scenarios' | 'history' | 'bench' | 'graphql' | 'websocket' | 'docs' | 'env' | 'auth';

const NAV_ITEMS: { id: MainPanel; icon: string; label: string }[] = [
  { id: 'request', icon: '⚡', label: 'Request' },
  { id: 'scenarios', icon: '▶', label: 'Scenarios' },
  { id: 'graphql', icon: '◆', label: 'GraphQL' },
  { id: 'websocket', icon: '⇄', label: 'WebSocket' },
  { id: 'bench', icon: '⏱', label: 'Bench' },
  { id: 'history', icon: '⏮', label: 'History' },
  { id: 'docs', icon: '📄', label: 'Docs' },
  { id: 'env', icon: '⚙', label: 'Env' },
  { id: 'auth', icon: '🔑', label: 'Auth' },
];

function App(): React.ReactElement {
  const {
    collections, setCollections,
    activeEnv, setActiveEnv, envList, setEnvList,
    activeRequest, setActiveRequest, setResponse,
    lastScenarioResult, setLastScenarioResult,
    history, setHistory,
    authProfiles, setAuthProfiles,
  } = useAppStore();

  const [panel, setPanel] = useState<MainPanel>('request');
  const [loading, setLoading] = useState(false);
  const [scenarios, setScenarios] = useState<{ path: string; name: string }[]>([]);
  const [runningScenario, setRunningScenario] = useState<string | null>(null);
  const [envMap, setEnvMap] = useState<Record<string, string>>({});
  const [docContent, setDocContent] = useState('');
  const [docFormat, setDocFormat] = useState<'markdown' | 'html'>('markdown');

  // Load initial data
  useEffect(() => {
    void loadCollections();
    void loadEnvList();
    void loadAuthProfiles();
  }, []);

  useEffect(() => {
    void loadEnvMap();
  }, [activeEnv]);

  const loadCollections = async () => {
    try {
      const cols = await flint.invoke('get-collections', { channel: 'get-collections' });
      setCollections(cols);
    } catch (err) {
      console.error('Failed to load collections:', err);
    }
  };

  const loadEnvList = async () => {
    try {
      const envs = await flint.invoke('list-environments', { channel: 'list-environments' });
      setEnvList(envs.length > 0 ? envs : ['base']);
      if (envs.length > 0 && !envs.includes(activeEnv)) setActiveEnv(envs[0]);
    } catch {
      setEnvList(['base']);
    }
  };

  const loadEnvMap = async () => {
    try {
      const map = await flint.invoke('load-env', { channel: 'load-env', envName: activeEnv });
      setEnvMap(map as Record<string, string>);
    } catch {
      setEnvMap({});
    }
  };

  const loadAuthProfiles = async () => {
    try {
      const profiles = await flint.invoke('get-auth-profiles', { channel: 'get-auth-profiles' });
      setAuthProfiles(profiles);
    } catch {
      setAuthProfiles([]);
    }
  };

  const handleCollectionSelect = (collection: CollectionRequest) => {
    const op = getOperationInfo(collection);
    setActiveRequest({ collection });
    setPanel('request');
    // Load history for the selected operation
    void flint.invoke('get-history', { channel: 'get-history', operationId: op.operationId })
      .then((h) => setHistory(op.operationId, h))
      .catch(() => undefined);
  };

  const handleSendRequest = async (url: string, method: string, headers: Record<string, string>, body?: string) => {
    setLoading(true);
    try {
      const req: HttpRequest = {
        method: method as HttpRequest['method'],
        url,
        headers,
        queryParams: {},
        body: body ? { type: 'raw', raw: body } : { type: 'none' },
        timeoutMs: 30000,
      };
      const res = await flint.invoke('execute-request', { channel: 'execute-request', request: req });
      setResponse(res);
      // Load history for the active operation
      if (activeRequest?.collection) {
        const op = getOperationInfo(activeRequest.collection);
        const h = await flint.invoke('get-history', {
          channel: 'get-history',
          operationId: op.operationId,
        });
        setHistory(op.operationId, h);
      }
    } catch (err) {
      console.error('Request failed:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleRunScenario = async (scenarioPath: string) => {
    setRunningScenario(scenarioPath);
    setPanel('scenarios');
    try {
      const result = await flint.invoke('run-scenario', {
        channel: 'run-scenario',
        scenarioPath,
        env: activeEnv,
      });
      setLastScenarioResult(result);
    } catch (err) {
      console.error('Scenario failed:', err);
    } finally {
      setRunningScenario(null);
    }
  };

  const handleGenerateDocs = async (fmt: 'markdown' | 'html') => {
    try {
      const output = await flint.invoke('generate-docs', { channel: 'generate-docs', format: fmt });
      setDocContent(output.content);
      setDocFormat(fmt);
    } catch (err) {
      console.error('Docs generation failed:', err);
    }
  };

  const handleGenerateSnippet = async (target: Parameters<typeof flint.invoke<'generate-snippet'>>[1]['target']) => {
    if (!activeRequest?.request) return '';
    try {
      const snippet = await flint.invoke('generate-snippet', {
        channel: 'generate-snippet',
        request: activeRequest.request,
        target,
      });
      return snippet.code;
    } catch {
      return '';
    }
  };

  const activeHistory = activeRequest?.collection
    ? (history[getOperationInfo(activeRequest.collection).operationId] ?? [])
    : [];

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden' }}>
      {/* Sidebar nav */}
      <div style={{
        width: 56, background: '#181825', display: 'flex', flexDirection: 'column',
        alignItems: 'center', paddingTop: 8, borderRight: '1px solid #313244', flexShrink: 0,
      }}>
        <div style={{ color: '#89b4fa', fontWeight: 900, fontSize: 18, marginBottom: 16, cursor: 'default' }} title="Flint">
          F
        </div>
        {NAV_ITEMS.map((item) => (
          <button
            key={item.id}
            onClick={() => setPanel(item.id)}
            title={item.label}
            style={{
              background: panel === item.id ? '#313244' : 'transparent',
              border: 'none',
              color: panel === item.id ? '#cdd6f4' : '#585b70',
              width: 40, height: 40, borderRadius: 6,
              fontSize: 16, cursor: 'pointer', marginBottom: 4,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
          >
            {item.icon}
          </button>
        ))}
      </div>

      {/* Left panel: collection tree */}
      <div style={{ width: 240, borderRight: '1px solid #313244', display: 'flex', flexDirection: 'column', overflow: 'hidden', flexShrink: 0 }}>
        <div style={{ padding: '6px 0', borderBottom: '1px solid #313244' }}>
          <EnvironmentSelector />
        </div>
        <div style={{ flex: 1, overflow: 'hidden' }}>
          <CollectionTree
            collections={collections}
            activeOperationId={activeRequest?.collection ? getOperationInfo(activeRequest.collection).operationId : undefined}
            onSelect={handleCollectionSelect}
          />
        </div>
      </div>

      {/* Main content */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {panel === 'request' && (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            {activeRequest ? (
              <>
                <div style={{ flex: '0 0 280px', borderBottom: '1px solid #313244', overflow: 'hidden' }}>
                  <RequestEditor
                    collection={activeRequest.collection}
                    env={activeEnv}
                    onSend={handleSendRequest}
                    loading={loading}
                  />
                </div>
                <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                  {activeRequest.response ? (
                    <ResponseViewer response={activeRequest.response} />
                  ) : (
                    <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#585b70', fontSize: 13 }}>
                      Send a request to see the response
                    </div>
                  )}
                </div>
                {activeRequest.request && (
                  <div style={{ height: 200, borderTop: '1px solid #313244', overflow: 'hidden' }}>
                    <CodeSnippetPanel
                      request={activeRequest.request}
                      onGenerate={handleGenerateSnippet}
                    />
                  </div>
                )}
              </>
            ) : (
              <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#585b70', fontSize: 13 }}>
                Select a collection to get started
              </div>
            )}
          </div>
        )}

        {panel === 'scenarios' && (
          <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
            <div style={{ width: 260, borderRight: '1px solid #313244', overflow: 'hidden' }}>
              <ScenarioList
                scenarios={scenarios}
                onRun={handleRunScenario}
                running={runningScenario}
              />
            </div>
            <div style={{ flex: 1, overflow: 'auto' }}>
              {lastScenarioResult ? (
                <ScenarioResultView result={lastScenarioResult} />
              ) : (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#585b70', fontSize: 13 }}>
                  Run a scenario to see results
                </div>
              )}
            </div>
          </div>
        )}

        {panel === 'graphql' && (
          <div style={{ flex: 1, overflow: 'hidden' }}>
            <GraphQLEditor
              loading={loading}
              onExecute={async (endpoint, query, variables) => {
                setLoading(true);
                try {
                  let vars: Record<string, unknown> = {};
                  try { vars = JSON.parse(variables) as Record<string, unknown>; } catch { /* ignore */ }
                  return await flint.invoke('execute-graphql', {
                    channel: 'execute-graphql',
                    endpoint,
                    request: { query, variables: vars, operationType: 'query' },
                    env: activeEnv,
                  });
                } finally {
                  setLoading(false);
                }
              }}
            />
          </div>
        )}

        {panel === 'websocket' && (
          <div style={{ flex: 1, overflow: 'hidden' }}>
            <WebSocketPanel />
          </div>
        )}

        {panel === 'bench' && (
          <div style={{ flex: 1, overflow: 'hidden' }}>
            <BenchmarkPanel
              scenarios={scenarios}
              onRun={async (scenarioPath, concurrent, duration, rampUp) => {
                const result = await flint.invoke('run-bench', {
                  channel: 'run-bench',
                  scenarioPath,
                  options: { concurrent, duration, rampUpSeconds: rampUp },
                  env: activeEnv,
                });
                return result;
              }}
            />
          </div>
        )}

        {panel === 'history' && (
          <div style={{ flex: 1, overflow: 'hidden' }}>
            <HistoryPanel entries={activeHistory} />
          </div>
        )}

        {panel === 'docs' && (
          <div style={{ flex: 1, overflow: 'hidden' }}>
            <DocViewer
              content={docContent}
              format={docFormat}
              onExport={handleGenerateDocs}
            />
          </div>
        )}

        {panel === 'env' && (
          <div style={{ flex: 1, overflow: 'auto' }}>
            <EnvVarTable envMap={envMap} />
          </div>
        )}

        {panel === 'auth' && (
          <div style={{ flex: 1, overflow: 'hidden' }}>
            <AuthManagerPanel profiles={authProfiles} />
          </div>
        )}
      </div>
    </div>
  );
}

const container = document.getElementById('root');
if (container) {
  const root = createRoot(container);
  root.render(<App />);
}
