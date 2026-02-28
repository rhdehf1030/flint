import React, { useState } from 'react';
import type { Collection, CollectionRequest } from '@flint/core';
import { CollectionSearch } from './CollectionSearch.js';
import { getOperationInfo } from '../utils/collectionUtils.js';

interface Props {
  collections: Collection[];
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

const totalRequests = (collections: Collection[]) =>
  collections.reduce((acc, c) => acc + c.requests.length, 0);

export function CollectionTree({ collections, activeOperationId, onSelect }: Props): React.ReactElement {
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});

  const toggleCollapse = (name: string) =>
    setCollapsed((prev) => ({ ...prev, [name]: !prev[name] }));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
      <div style={{ padding: '8px 12px', borderBottom: '1px solid #313244', fontWeight: 600, fontSize: 12, color: '#a6adc8' }}>
        COLLECTIONS ({totalRequests(collections)})
      </div>
      <CollectionSearch collections={collections} onSelect={onSelect} />
      <div style={{ overflowY: 'auto', flex: 1 }}>
        {collections.length === 0 && (
          <div style={{ padding: 16, color: '#585b70', fontSize: 12, textAlign: 'center' }}>
            No collections found
          </div>
        )}
        {collections.map((col) => {
          const isCollapsed = collapsed[col.name] ?? false;
          return (
            <div key={col.name}>
              {/* Collection header (folder) */}
              <div
                onClick={() => toggleCollapse(col.name)}
                style={{
                  padding: '5px 12px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  background: '#1e1e2e',
                  borderBottom: '1px solid #313244',
                  userSelect: 'none',
                }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = '#26263a'; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = '#1e1e2e'; }}
              >
                <span style={{ color: '#585b70', fontSize: 10 }}>{isCollapsed ? '▶' : '▼'}</span>
                <span style={{ fontSize: 12 }}>📁</span>
                <span style={{ fontSize: 12, fontWeight: 600, color: '#cdd6f4', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {col.name}
                </span>
                <span style={{ fontSize: 10, color: '#585b70' }}>{col.requests.length}</span>
              </div>

              {/* Requests inside collection */}
              {!isCollapsed && col.requests.map((c) => {
                const op = getOperationInfo(c);
                const isActive = op.operationId === activeOperationId;
                const method = op.method.toUpperCase();
                const color = METHOD_COLORS[method] ?? '#a6adc8';
                return (
                  <div
                    key={op.operationId}
                    onClick={() => onSelect(c)}
                    style={{
                      padding: '5px 12px 5px 28px',
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
          );
        })}
      </div>
    </div>
  );
}
