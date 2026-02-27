import React, { useState } from 'react';
import type { HttpRequest } from '@flint/core';
import type { SnippetTarget } from '@flint/core';

interface Props {
  request: HttpRequest;
  onGenerate: (target: SnippetTarget) => Promise<string>;
}

const TARGETS: { value: SnippetTarget; label: string }[] = [
  { value: 'curl', label: 'cURL' },
  { value: 'fetch', label: 'Fetch (JS)' },
  { value: 'axios', label: 'Axios' },
  { value: 'python-requests', label: 'Python' },
  { value: 'go-http', label: 'Go' },
  { value: 'httpie', label: 'HTTPie' },
];

export function CodeSnippetPanel({ request, onGenerate }: Props): React.ReactElement {
  const [target, setTarget] = useState<SnippetTarget>('curl');
  const [snippet, setSnippet] = useState('');
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const generate = async () => {
    setLoading(true);
    try {
      const code = await onGenerate(target);
      setSnippet(code);
    } finally {
      setLoading(false);
    }
  };

  const copy = async () => {
    if (!snippet) return;
    await navigator.clipboard.writeText(snippet);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', padding: 12 }}>
      <div style={{ display: 'flex', gap: 8, marginBottom: 12, flexWrap: 'wrap' }}>
        <select
          value={target}
          onChange={(e) => setTarget(e.target.value as SnippetTarget)}
          style={{
            background: '#313244', color: '#cdd6f4',
            border: '1px solid #45475a', borderRadius: 4,
            padding: '4px 8px', fontSize: 12, cursor: 'pointer',
          }}
        >
          {TARGETS.map((t) => (
            <option key={t.value} value={t.value}>{t.label}</option>
          ))}
        </select>
        <button
          onClick={generate}
          disabled={loading}
          style={{
            background: '#89b4fa', color: '#1e1e2e', border: 'none',
            borderRadius: 4, padding: '4px 12px', fontSize: 12,
            fontWeight: 'bold', cursor: loading ? 'default' : 'pointer',
          }}
        >
          {loading ? 'Generating…' : 'Generate'}
        </button>
        {snippet && (
          <button
            onClick={copy}
            style={{
              background: 'transparent', border: '1px solid #45475a',
              color: copied ? '#a6e3a1' : '#89b4fa',
              borderRadius: 4, padding: '4px 12px', fontSize: 12, cursor: 'pointer',
            }}
          >
            {copied ? 'Copied!' : 'Copy'}
          </button>
        )}
      </div>

      {snippet ? (
        <pre style={{
          flex: 1, overflowY: 'auto', margin: 0, padding: 12,
          background: '#181825', borderRadius: 4,
          fontFamily: 'monospace', fontSize: 12, lineHeight: 1.6,
          color: '#cdd6f4', whiteSpace: 'pre-wrap', wordBreak: 'break-all',
        }}>
          {snippet}
        </pre>
      ) : (
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#585b70', fontSize: 12 }}>
          Select a target language and click Generate
        </div>
      )}
    </div>
  );
}
