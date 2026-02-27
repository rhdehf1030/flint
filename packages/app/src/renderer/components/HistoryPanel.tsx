import React, { useState } from 'react';
import type { HistoryEntry } from '@flint/core';

interface Props {
  entries: HistoryEntry[];
}

export function HistoryPanel({ entries }: Props): React.ReactElement {
  const [selectedIdx, setSelectedIdx] = useState<number | null>(null);

  if (entries.length === 0) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#585b70', fontSize: 12 }}>
        No history yet
      </div>
    );
  }

  const selected = selectedIdx !== null ? entries[selectedIdx] : null;

  return (
    <div style={{ display: 'flex', height: '100%', overflow: 'hidden' }}>
      {/* List */}
      <div style={{ width: 220, borderRight: '1px solid #313244', overflowY: 'auto', flexShrink: 0 }}>
        {entries.map((entry, idx) => {
          const isSelected = selectedIdx === idx;
          const statusColor = entry.response.status >= 400 ? '#f38ba8' : '#a6e3a1';
          return (
            <div
              key={idx}
              onClick={() => setSelectedIdx(idx)}
              style={{
                padding: '6px 10px', cursor: 'pointer',
                background: isSelected ? '#313244' : 'transparent',
                borderBottom: '1px solid #313244',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ color: statusColor, fontSize: 12, fontWeight: 'bold' }}>{entry.response.status}</span>
                <span style={{ fontSize: 11, color: '#585b70' }}>{entry.response.responseTimeMs}ms</span>
              </div>
              <div style={{ fontSize: 10, color: '#585b70', marginTop: 2 }}>
                {new Date(entry.timestamp).toLocaleString()}
              </div>
            </div>
          );
        })}
      </div>

      {/* Detail */}
      <div style={{ flex: 1, overflow: 'hidden', padding: 12 }}>
        {selected ? (
          <>
            <div style={{ fontSize: 12, color: '#a6adc8', marginBottom: 8, fontWeight: 600 }}>
              {new Date(selected.timestamp).toLocaleString()} · {selected.response.status} · {selected.response.responseTimeMs}ms
            </div>
            <pre style={{
              overflowY: 'auto', maxHeight: 'calc(100% - 40px)', margin: 0,
              padding: 10, background: '#181825', borderRadius: 4,
              fontFamily: 'monospace', fontSize: 11, lineHeight: 1.5,
              color: '#cdd6f4', whiteSpace: 'pre-wrap',
            }}>
              {(() => {
                try { return JSON.stringify(JSON.parse(selected.response.rawBody), null, 2); }
                catch { return selected.response.rawBody; }
              })()}
            </pre>
          </>
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#585b70', fontSize: 12 }}>
            Select an entry to view details
          </div>
        )}
      </div>
    </div>
  );
}
