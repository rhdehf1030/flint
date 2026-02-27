import React, { useState } from 'react';

interface Props {
  onExecute: (endpoint: string, query: string, variables: string) => Promise<unknown>;
  loading?: boolean;
}

export function GraphQLEditor({ onExecute, loading = false }: Props): React.ReactElement {
  const [endpoint, setEndpoint] = useState('');
  const [query, setQuery] = useState('query {\n  \n}');
  const [variables, setVariables] = useState('{}');
  const [result, setResult] = useState('');
  const [activeTab, setActiveTab] = useState<'query' | 'variables'>('query');

  const execute = async () => {
    try {
      const res = await onExecute(endpoint, query, variables);
      setResult(JSON.stringify(res, null, 2));
    } catch (err) {
      setResult(String(err));
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Endpoint bar */}
      <div style={{ display: 'flex', gap: 8, padding: '8px 12px', borderBottom: '1px solid #313244' }}>
        <input
          type="text"
          value={endpoint}
          onChange={(e) => setEndpoint(e.target.value)}
          placeholder="https://api.example.com/graphql"
          style={{
            flex: 1, background: '#313244', color: '#cdd6f4',
            border: '1px solid #45475a', borderRadius: 4,
            padding: '4px 10px', fontSize: 13, fontFamily: 'monospace', outline: 'none',
          }}
        />
        <button
          onClick={execute}
          disabled={loading || !endpoint}
          style={{
            background: loading ? '#45475a' : '#89b4fa',
            color: '#1e1e2e', border: 'none', borderRadius: 4,
            padding: '4px 16px', fontSize: 13, fontWeight: 'bold',
            cursor: loading || !endpoint ? 'default' : 'pointer',
          }}
        >
          {loading ? '⟳' : '▶ Execute'}
        </button>
      </div>

      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        {/* Left: editor */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', borderRight: '1px solid #313244' }}>
          <div style={{ display: 'flex', borderBottom: '1px solid #313244' }}>
            {(['query', 'variables'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                style={{
                  background: 'transparent', border: 'none',
                  borderBottom: activeTab === tab ? '2px solid #89b4fa' : '2px solid transparent',
                  color: activeTab === tab ? '#cdd6f4' : '#585b70',
                  padding: '4px 12px', cursor: 'pointer', fontSize: 12, textTransform: 'capitalize',
                }}
              >
                {tab}
              </button>
            ))}
          </div>
          <textarea
            value={activeTab === 'query' ? query : variables}
            onChange={(e) =>
              activeTab === 'query' ? setQuery(e.target.value) : setVariables(e.target.value)
            }
            style={{
              flex: 1, background: '#1e1e2e', color: '#cdd6f4',
              border: 'none', outline: 'none', resize: 'none',
              fontFamily: 'monospace', fontSize: 12, padding: 10, lineHeight: 1.6,
            }}
          />
        </div>

        {/* Right: result */}
        <div style={{ flex: 1, overflow: 'hidden' }}>
          {result ? (
            <pre style={{
              height: '100%', overflowY: 'auto', margin: 0, padding: 10,
              fontFamily: 'monospace', fontSize: 12, lineHeight: 1.5,
              color: '#cdd6f4', whiteSpace: 'pre-wrap',
            }}>
              {result}
            </pre>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#585b70', fontSize: 12 }}>
              Execute a query to see results
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
