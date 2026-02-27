import React, { useState, useEffect } from 'react';
import type { CollectionRequest } from '@flint/core';
import { BodyEditor } from './BodyEditor.js';
import type { BodyType } from './BodyEditor.js';
import { getOperationInfo, getServerUrl } from '../utils/collectionUtils.js';

interface KVPair {
  key: string;
  value: string;
  enabled: boolean;
  [k: string]: unknown;
}

interface Props {
  collection: CollectionRequest;
  env?: string;
  onSend: (url: string, method: string, headers: Record<string, string>, body?: string) => void;
  loading?: boolean;
}

type Tab = 'params' | 'headers' | 'body';

const HTTP_METHODS = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'HEAD', 'OPTIONS'];

export function RequestEditor({ collection, env, onSend, loading = false }: Props): React.ReactElement {
  const opInfo = getOperationInfo(collection);
  const serverUrl = getServerUrl(collection);
  const [url, setUrl] = useState(`${serverUrl}${opInfo.path}`);
  const [method, setMethod] = useState(opInfo.method.toUpperCase());
  const [activeTab, setActiveTab] = useState<Tab>('params');
  const [params, setParams] = useState<KVPair[]>([{ key: '', value: '', enabled: true }]);
  const [headers, setHeaders] = useState<KVPair[]>([{ key: '', value: '', enabled: true }]);
  const [bodyType, setBodyType] = useState<BodyType>('none');
  const [bodyContent, setBodyContent] = useState('');

  useEffect(() => {
    const info = getOperationInfo(collection);
    const srv = getServerUrl(collection);
    setUrl(`${srv}${info.path}`);
    setMethod(info.method.toUpperCase());
  }, [opInfo.operationId]);

  const handleSend = () => {
    const hdrs: Record<string, string> = {};
    headers.filter((h) => h.enabled && h.key).forEach((h) => { hdrs[h.key] = h.value; });

    let fullUrl = url;
    const enabledParams = params.filter((p) => p.enabled && p.key);
    if (enabledParams.length > 0) {
      const qs = enabledParams.map((p) => `${encodeURIComponent(p.key)}=${encodeURIComponent(p.value)}`).join('&');
      fullUrl += (url.includes('?') ? '&' : '?') + qs;
    }

    if (bodyType === 'json' && bodyContent) {
      hdrs['Content-Type'] = 'application/json';
    }

    onSend(fullUrl, method, hdrs, bodyType !== 'none' ? bodyContent : undefined);
  };

  const updateKV = (
    list: KVPair[],
    setList: (v: KVPair[]) => void,
    idx: number,
    field: keyof KVPair,
    val: string | boolean,
  ) => {
    const next = [...list];
    next[idx][field] = val;
    // auto-add empty row at end
    if (idx === list.length - 1 && (field === 'key' || field === 'value') && val) {
      next.push({ key: '', value: '', enabled: true });
    }
    setList(next);
  };

  const tabs: Tab[] = ['params', 'headers', 'body'];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* URL bar */}
      <div style={{ display: 'flex', gap: 8, padding: '8px 12px', borderBottom: '1px solid #313244' }}>
        <select
          value={method}
          onChange={(e) => setMethod(e.target.value)}
          style={{
            background: '#313244',
            color: methodColor(method),
            border: '1px solid #45475a',
            borderRadius: 4,
            padding: '4px 8px',
            fontSize: 13,
            fontWeight: 'bold',
            cursor: 'pointer',
            minWidth: 90,
          }}
        >
          {HTTP_METHODS.map((m) => (
            <option key={m} value={m} style={{ color: methodColor(m) }}>{m}</option>
          ))}
        </select>
        <input
          type="text"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') handleSend(); }}
          placeholder="{{BASE_URL}}/path"
          style={{
            flex: 1,
            background: '#313244',
            color: '#cdd6f4',
            border: '1px solid #45475a',
            borderRadius: 4,
            padding: '4px 10px',
            fontSize: 13,
            fontFamily: 'monospace',
            outline: 'none',
          }}
        />
        <button
          onClick={handleSend}
          disabled={loading}
          style={{
            background: loading ? '#45475a' : '#89b4fa',
            color: '#1e1e2e',
            border: 'none',
            borderRadius: 4,
            padding: '4px 16px',
            fontSize: 13,
            fontWeight: 'bold',
            cursor: loading ? 'default' : 'pointer',
          }}
        >
          {loading ? 'Sending…' : 'Send'}
        </button>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', borderBottom: '1px solid #313244', paddingLeft: 12 }}>
        {tabs.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            style={{
              background: 'transparent',
              border: 'none',
              borderBottom: activeTab === tab ? '2px solid #89b4fa' : '2px solid transparent',
              color: activeTab === tab ? '#cdd6f4' : '#585b70',
              padding: '6px 12px',
              cursor: 'pointer',
              fontSize: 12,
              textTransform: 'capitalize',
            }}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div style={{ flex: 1, overflow: 'hidden' }}>
        {activeTab === 'params' && (
          <KVEditor pairs={params} onChange={setParams} placeholder={{ key: 'parameter', value: 'value' }} />
        )}
        {activeTab === 'headers' && (
          <KVEditor pairs={headers} onChange={setHeaders} placeholder={{ key: 'Header-Name', value: 'value' }} />
        )}
        {activeTab === 'body' && (
          <BodyEditor
            bodyType={bodyType}
            body={bodyContent}
            onBodyTypeChange={setBodyType}
            onBodyChange={setBodyContent}
          />
        )}
      </div>
    </div>
  );
}

function KVEditor({
  pairs,
  onChange,
  placeholder,
}: {
  pairs: KVPair[];
  onChange: (pairs: KVPair[]) => void;
  placeholder: { key: string; value: string };
}): React.ReactElement {
  const update = (idx: number, field: keyof KVPair, value: string | boolean) => {
    const next = [...pairs];
    next[idx][field] = value;
    if (idx === pairs.length - 1 && (field === 'key' || field === 'value') && value) {
      next.push({ key: '', value: '', enabled: true });
    }
    onChange(next);
  };

  return (
    <div style={{ overflowY: 'auto', height: '100%', padding: 8 }}>
      {pairs.map((pair, idx) => (
        <div key={idx} style={{ display: 'flex', gap: 4, marginBottom: 4, alignItems: 'center' }}>
          <input
            type="checkbox"
            checked={pair.enabled}
            onChange={(e) => update(idx, 'enabled', e.target.checked)}
            style={{ flexShrink: 0 }}
          />
          <input
            type="text"
            value={pair.key}
            onChange={(e) => update(idx, 'key', e.target.value)}
            placeholder={placeholder.key}
            style={kvInputStyle()}
          />
          <input
            type="text"
            value={pair.value}
            onChange={(e) => update(idx, 'value', e.target.value)}
            placeholder={placeholder.value}
            style={kvInputStyle()}
          />
        </div>
      ))}
    </div>
  );
}

function kvInputStyle(): React.CSSProperties {
  return {
    flex: 1,
    background: '#313244',
    color: '#cdd6f4',
    border: '1px solid #45475a',
    borderRadius: 3,
    padding: '3px 6px',
    fontSize: 12,
    fontFamily: 'monospace',
    outline: 'none',
  };
}

function methodColor(method: string): string {
  const colors: Record<string, string> = {
    GET: '#89b4fa', POST: '#a6e3a1', PUT: '#fab387', PATCH: '#f9e2af',
    DELETE: '#f38ba8', HEAD: '#cba6f7', OPTIONS: '#89dceb',
  };
  return colors[method] ?? '#a6adc8';
}
