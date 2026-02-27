import React, { useState, useEffect } from 'react';
import type { EnvMap } from '@flint/core';

const SENSITIVE_RE = /secret|password|token|key|auth|bearer|credential/i;

interface Props {
  envMap: EnvMap;
}

export function EnvVarTable({ envMap }: Props): React.ReactElement {
  const [revealed, setRevealed] = useState<Set<string>>(new Set());

  const isSensitive = (key: string): boolean => SENSITIVE_RE.test(key);

  const toggleReveal = (key: string) => {
    setRevealed((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const entries = Object.entries(envMap);

  return (
    <div style={{ padding: 12, overflowY: 'auto', maxHeight: '100%' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
        <thead>
          <tr style={{ borderBottom: '1px solid #45475a' }}>
            <th style={{ textAlign: 'left', padding: '4px 8px', color: '#a6adc8', width: '40%' }}>Key</th>
            <th style={{ textAlign: 'left', padding: '4px 8px', color: '#a6adc8' }}>Value</th>
          </tr>
        </thead>
        <tbody>
          {entries.length === 0 && (
            <tr>
              <td colSpan={2} style={{ padding: '8px', color: '#585b70', textAlign: 'center' }}>
                No variables
              </td>
            </tr>
          )}
          {entries.map(([key, value]) => (
            <tr key={key} style={{ borderBottom: '1px solid #313244' }}>
              <td style={{ padding: '3px 8px', color: '#cba6f7', fontFamily: 'monospace' }}>{key}</td>
              <td style={{ padding: '3px 8px', fontFamily: 'monospace' }}>
                {isSensitive(key) && !revealed.has(key) ? (
                  <span style={{ color: '#585b70' }}>
                    {'•'.repeat(Math.min(value.length, 12))}{' '}
                    <button
                      onClick={() => toggleReveal(key)}
                      style={{
                        background: 'none',
                        border: '1px solid #45475a',
                        color: '#89b4fa',
                        cursor: 'pointer',
                        fontSize: 11,
                        padding: '1px 4px',
                        borderRadius: 3,
                      }}
                    >
                      reveal
                    </button>
                  </span>
                ) : (
                  <span style={{ color: '#a6e3a1' }}>
                    {value}
                    {isSensitive(key) && (
                      <button
                        onClick={() => toggleReveal(key)}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: '#585b70',
                          cursor: 'pointer',
                          fontSize: 11,
                          marginLeft: 6,
                        }}
                      >
                        hide
                      </button>
                    )}
                  </span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
