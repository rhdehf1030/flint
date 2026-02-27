import React, { useState } from 'react';
import type { HttpResponse } from '@flint/core';

interface Props {
  response: HttpResponse;
}

type Tab = 'body' | 'headers';

export function ResponseViewer({ response }: Props): React.ReactElement {
  const [tab, setTab] = useState<Tab>('body');
  const [copied, setCopied] = useState(false);

  const statusColor = response.status >= 500
    ? '#f38ba8'
    : response.status >= 400
    ? '#fab387'
    : response.status >= 300
    ? '#f9e2af'
    : '#a6e3a1';

  const bodyStr = response.rawBody;
  const formattedBody = (() => {
    try {
      return JSON.stringify(JSON.parse(bodyStr), null, 2);
    } catch {
      return bodyStr;
    }
  })();

  const copy = async () => {
    await navigator.clipboard.writeText(formattedBody);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const headerEntries = Object.entries(response.headers);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Status bar */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 16,
        padding: '6px 12px', borderBottom: '1px solid #313244',
      }}>
        <span style={{ color: statusColor, fontWeight: 'bold', fontSize: 14 }}>
          {response.status}
        </span>
        <span style={{ color: '#585b70', fontSize: 12 }}>
          {response.responseTimeMs}ms
        </span>
        <span style={{ color: '#585b70', fontSize: 12 }}>
          {formatSize(bodyStr.length)}
        </span>
        <div style={{ display: 'flex', marginLeft: 'auto' }}>
          <TabBtn active={tab === 'body'} onClick={() => setTab('body')}>Body</TabBtn>
          <TabBtn active={tab === 'headers'} onClick={() => setTab('headers')}>
            Headers ({headerEntries.length})
          </TabBtn>
        </div>
      </div>

      {/* Content */}
      <div style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
        {tab === 'body' && (
          <>
            <button
              onClick={copy}
              style={{
                position: 'absolute', top: 8, right: 12, zIndex: 1,
                background: '#313244', border: '1px solid #45475a',
                color: copied ? '#a6e3a1' : '#89b4fa',
                borderRadius: 3, padding: '2px 8px', cursor: 'pointer', fontSize: 11,
              }}
            >
              {copied ? 'Copied!' : 'Copy'}
            </button>
            <pre style={{
              height: '100%', overflowY: 'auto', margin: 0,
              padding: 12, fontFamily: 'monospace', fontSize: 12,
              lineHeight: 1.5, color: '#cdd6f4', whiteSpace: 'pre-wrap', wordBreak: 'break-all',
            }}>
              {formattedBody || <span style={{ color: '#585b70' }}>Empty body</span>}
            </pre>
          </>
        )}
        {tab === 'headers' && (
          <div style={{ overflowY: 'auto', height: '100%', padding: 8 }}>
            {headerEntries.map(([key, value]) => (
              <div key={key} style={{ display: 'flex', gap: 8, padding: '3px 4px', fontFamily: 'monospace', fontSize: 12 }}>
                <span style={{ color: '#cba6f7', minWidth: 200 }}>{key}</span>
                <span style={{ color: '#a6e3a1', wordBreak: 'break-all' }}>{value}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function TabBtn({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}): React.ReactElement {
  return (
    <button
      onClick={onClick}
      style={{
        background: 'transparent',
        border: 'none',
        borderBottom: active ? '2px solid #89b4fa' : '2px solid transparent',
        color: active ? '#cdd6f4' : '#585b70',
        padding: '4px 10px',
        cursor: 'pointer',
        fontSize: 12,
      }}
    >
      {children}
    </button>
  );
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}
