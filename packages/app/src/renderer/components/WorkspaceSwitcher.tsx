import React, { useState } from 'react';

interface Props {
  workspaces: string[];
  active: string;
  onSwitch: (path: string) => void;
  onAdd: () => void;
  onRemove: (path: string) => void;
}

function shortName(path: string): string {
  return path.replace(/\\/g, '/').split('/').pop() ?? path;
}

export function WorkspaceSwitcher({ workspaces, active, onSwitch, onAdd, onRemove }: Props): React.ReactElement {
  const [open, setOpen] = useState(false);

  return (
    <div style={{ position: 'relative' }}>
      <div
        onClick={() => setOpen((v) => !v)}
        title={active}
        style={{
          padding: '6px 10px',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          userSelect: 'none',
        }}
      >
        <span style={{ fontSize: 12 }}>🗂</span>
        <span style={{ fontSize: 12, color: '#cdd6f4', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {active ? shortName(active) : 'No workspace'}
        </span>
        <span style={{ fontSize: 10, color: '#585b70' }}>{open ? '▲' : '▼'}</span>
      </div>

      {open && (
        <div style={{
          position: 'absolute',
          top: '100%',
          left: 0,
          right: 0,
          background: '#1e1e2e',
          border: '1px solid #45475a',
          borderRadius: 4,
          zIndex: 100,
          boxShadow: '0 4px 12px rgba(0,0,0,0.5)',
        }}>
          {workspaces.map((ws) => (
            <div
              key={ws}
              style={{
                display: 'flex',
                alignItems: 'center',
                padding: '5px 8px',
                gap: 6,
                background: ws === active ? '#313244' : 'transparent',
              }}
            >
              <span
                onClick={() => { onSwitch(ws); setOpen(false); }}
                title={ws}
                style={{
                  flex: 1,
                  fontSize: 12,
                  color: ws === active ? '#89b4fa' : '#cdd6f4',
                  cursor: 'pointer',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                {ws === active ? '✓ ' : ''}{shortName(ws)}
              </span>
              {ws !== active && (
                <span
                  onClick={() => onRemove(ws)}
                  title="Remove workspace"
                  style={{ fontSize: 10, color: '#585b70', cursor: 'pointer', padding: '0 2px' }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = '#f38ba8'; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = '#585b70'; }}
                >
                  ✕
                </span>
              )}
            </div>
          ))}
          <div
            onClick={() => { onAdd(); setOpen(false); }}
            style={{
              padding: '5px 8px',
              cursor: 'pointer',
              fontSize: 12,
              color: '#a6adc8',
              borderTop: '1px solid #313244',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
            }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = '#313244'; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
          >
            <span>＋</span> Add workspace
          </div>
        </div>
      )}
    </div>
  );
}
