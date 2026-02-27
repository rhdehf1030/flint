import React, { useState } from 'react';
import type { AuthProfile } from '@flint/core';

interface Props {
  profiles: AuthProfile[];
  onStartOAuth2?: (profile: AuthProfile) => void;
}

export function AuthManagerPanel({ profiles, onStartOAuth2 }: Props): React.ReactElement {
  const [selected, setSelected] = useState<AuthProfile | null>(null);

  return (
    <div style={{ display: 'flex', height: '100%', overflow: 'hidden' }}>
      {/* List */}
      <div style={{ width: 200, borderRight: '1px solid #313244', overflowY: 'auto', flexShrink: 0 }}>
        <div style={{ padding: '8px 12px', borderBottom: '1px solid #313244', fontSize: 12, fontWeight: 600, color: '#a6adc8' }}>
          AUTH PROFILES
        </div>
        {profiles.length === 0 && (
          <div style={{ padding: 12, fontSize: 12, color: '#585b70', textAlign: 'center' }}>
            No profiles found
          </div>
        )}
        {profiles.map((p) => (
          <div
            key={p.name}
            onClick={() => setSelected(p)}
            style={{
              padding: '6px 12px', cursor: 'pointer',
              background: selected?.name === p.name ? '#313244' : 'transparent',
              borderBottom: '1px solid #313244',
            }}
          >
            <div style={{ fontSize: 12, color: '#cdd6f4' }}>{p.name}</div>
            <div style={{ fontSize: 10, color: '#585b70', textTransform: 'uppercase' }}>{p.type}</div>
          </div>
        ))}
      </div>

      {/* Detail */}
      <div style={{ flex: 1, padding: 16, overflow: 'auto' }}>
        {selected ? (
          <div>
            <div style={{ fontSize: 14, fontWeight: 600, color: '#cdd6f4', marginBottom: 12 }}>{selected.name}</div>
            <div style={{ fontSize: 12, color: '#a6adc8', marginBottom: 8 }}>Type: {selected.type}</div>
            {selected.type === 'oauth2' && (
              <button
                onClick={() => onStartOAuth2?.(selected)}
                style={{
                  background: '#89b4fa', color: '#1e1e2e', border: 'none',
                  borderRadius: 4, padding: '6px 16px', fontSize: 12,
                  fontWeight: 'bold', cursor: 'pointer', marginBottom: 12,
                }}
              >
                Start OAuth2 Flow
              </button>
            )}
            {selected.type === 'jwt' && (
              <div style={{ fontSize: 12, color: '#f9e2af' }}>
                JWT token management
              </div>
            )}
          </div>
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#585b70', fontSize: 12 }}>
            Select a profile
          </div>
        )}
      </div>
    </div>
  );
}
