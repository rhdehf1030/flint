import React, { useState } from 'react';

interface Props {
  content: string;
  format: 'markdown' | 'html';
  onExport: (format: 'markdown' | 'html') => void;
}

export function DocViewer({ content, format, onExport }: Props): React.ReactElement {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div style={{
        display: 'flex', alignItems: 'center', gap: 8,
        padding: '6px 12px', borderBottom: '1px solid #313244',
      }}>
        <span style={{ fontSize: 12, color: '#a6adc8', fontWeight: 600 }}>API DOCUMENTATION</span>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 6 }}>
          <button
            onClick={() => onExport('markdown')}
            style={exportBtnStyle(format === 'markdown')}
          >
            Markdown
          </button>
          <button
            onClick={() => onExport('html')}
            style={exportBtnStyle(format === 'html')}
          >
            HTML
          </button>
        </div>
      </div>

      <div style={{ flex: 1, overflow: 'auto', padding: 16 }}>
        {format === 'html' ? (
          <iframe
            srcDoc={content}
            style={{ width: '100%', height: '100%', border: 'none', background: '#fff' }}
            sandbox="allow-same-origin"
          />
        ) : (
          <pre style={{
            margin: 0, fontFamily: 'monospace', fontSize: 12,
            lineHeight: 1.7, color: '#cdd6f4', whiteSpace: 'pre-wrap',
          }}>
            {content || <span style={{ color: '#585b70' }}>No documentation generated yet</span>}
          </pre>
        )}
      </div>
    </div>
  );
}

function exportBtnStyle(active: boolean): React.CSSProperties {
  return {
    background: active ? '#313244' : 'transparent',
    border: '1px solid #45475a',
    color: active ? '#cdd6f4' : '#585b70',
    borderRadius: 3,
    padding: '2px 10px',
    fontSize: 11,
    cursor: 'pointer',
  };
}
