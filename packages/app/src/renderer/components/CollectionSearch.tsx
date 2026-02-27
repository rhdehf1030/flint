import React, { useState, useMemo } from 'react';
import type { CollectionRequest } from '@flint/core';
import { getOperationInfo } from '../utils/collectionUtils.js';

interface Props {
  collections: CollectionRequest[];
  onSelect: (collection: CollectionRequest) => void;
}

export function CollectionSearch({ collections, onSelect }: Props): React.ReactElement {
  const [query, setQuery] = useState('');

  const filtered = useMemo(() => {
    const q = query.toLowerCase();
    if (!q) return collections;
    return collections.filter((c) => {
      const op = getOperationInfo(c);
      return op.operationId.toLowerCase().includes(q) || (op.summary ?? '').toLowerCase().includes(q);
    });
  }, [collections, query]);

  return (
    <div style={{ padding: '8px 12px' }}>
      <input
        type="text"
        placeholder="Search operations..."
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        style={{
          width: '100%',
          background: '#313244',
          color: '#cdd6f4',
          border: '1px solid #45475a',
          borderRadius: 4,
          padding: '4px 8px',
          fontSize: 12,
          outline: 'none',
        }}
      />
      {query && (
        <div style={{ marginTop: 4, fontSize: 11, color: '#585b70' }}>
          {filtered.length} result{filtered.length !== 1 ? 's' : ''}
        </div>
      )}
      {query && (
        <div style={{ marginTop: 4, overflowY: 'auto', maxHeight: 200 }}>
          {filtered.map((c) => {
            const op = getOperationInfo(c);
            return (
              <div
                key={op.operationId}
                onClick={() => onSelect(c)}
                style={{
                  padding: '4px 6px',
                  cursor: 'pointer',
                  borderRadius: 3,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                }}
                onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.background = '#313244')}
                onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.background = 'transparent')}
              >
                <MethodBadge method={op.method} />
                <span style={{ color: '#cdd6f4', fontSize: 12 }}>{op.operationId}</span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function MethodBadge({ method }: { method: string }): React.ReactElement {
  const colors: Record<string, string> = {
    GET: '#89b4fa', POST: '#a6e3a1', PUT: '#fab387', PATCH: '#f9e2af',
    DELETE: '#f38ba8', HEAD: '#cba6f7', OPTIONS: '#89dceb',
  };
  const color = colors[method.toUpperCase()] ?? '#a6adc8';
  return (
    <span style={{ color, fontSize: 10, fontWeight: 'bold', width: 44, flexShrink: 0 }}>
      {method.toUpperCase()}
    </span>
  );
}
