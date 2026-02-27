import React from 'react';
import type { CollectionRequest } from '@flint/core';
import { CollectionSearch } from './CollectionSearch.js';
import { getOperationInfo } from '../utils/collectionUtils.js';

interface Props {
  collections: CollectionRequest[];
  activeOperationId?: string | undefined;
  onSelect: (collection: CollectionRequest) => void;
}

const METHOD_COLORS: Record<string, string> = {
  GET: '#89b4fa',
  POST: '#a6e3a1',
  PUT: '#fab387',
  PATCH: '#f9e2af',
  DELETE: '#f38ba8',
  HEAD: '#cba6f7',
  OPTIONS: '#89dceb',
};

export function CollectionTree({ collections, activeOperationId, onSelect }: Props): React.ReactElement {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
      <div style={{ padding: '8px 12px', borderBottom: '1px solid #313244', fontWeight: 600, fontSize: 12, color: '#a6adc8' }}>
        COLLECTIONS ({collections.length})
      </div>
      <CollectionSearch collections={collections} onSelect={onSelect} />
      <div style={{ overflowY: 'auto', flex: 1 }}>
        {collections.length === 0 && (
          <div style={{ padding: 16, color: '#585b70', fontSize: 12, textAlign: 'center' }}>
            No collections found
          </div>
        )}
        {collections.map((c) => {
          const op = getOperationInfo(c);
          const isActive = op.operationId === activeOperationId;
          const method = op.method.toUpperCase();
          const color = METHOD_COLORS[method] ?? '#a6adc8';
          return (
            <div
              key={op.operationId}
              onClick={() => onSelect(c)}
              style={{
                padding: '6px 12px',
                cursor: 'pointer',
                background: isActive ? '#313244' : 'transparent',
                borderLeft: isActive ? '2px solid #89b4fa' : '2px solid transparent',
                display: 'flex',
                alignItems: 'center',
                gap: 8,
              }}
              onMouseEnter={(e) => {
                if (!isActive) (e.currentTarget as HTMLElement).style.background = '#1e1e2e80';
              }}
              onMouseLeave={(e) => {
                if (!isActive) (e.currentTarget as HTMLElement).style.background = 'transparent';
              }}
            >
              <span style={{ color, fontSize: 10, fontWeight: 'bold', width: 44, flexShrink: 0 }}>
                {method}
              </span>
              <div style={{ overflow: 'hidden' }}>
                <div style={{ fontSize: 12, color: '#cdd6f4', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {op.operationId}
                </div>
                <div style={{ fontSize: 10, color: '#585b70', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {op.path}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
