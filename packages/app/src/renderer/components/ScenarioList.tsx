import React from 'react';

interface ScenarioItem {
  path: string;
  name: string;
}

interface Props {
  scenarios: ScenarioItem[];
  onRun: (scenarioPath: string) => void;
  running?: string | null;
}

export function ScenarioList({ scenarios, onRun, running }: Props): React.ReactElement {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
      <div style={{ padding: '8px 12px', borderBottom: '1px solid #313244', fontWeight: 600, fontSize: 12, color: '#a6adc8' }}>
        SCENARIOS ({scenarios.length})
      </div>
      <div style={{ overflowY: 'auto', flex: 1 }}>
        {scenarios.length === 0 && (
          <div style={{ padding: 16, color: '#585b70', fontSize: 12, textAlign: 'center' }}>
            No scenarios found
          </div>
        )}
        {scenarios.map((s) => {
          const isRunning = running === s.path;
          return (
            <div
              key={s.path}
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '6px 12px', borderBottom: '1px solid #313244',
              }}
            >
              <span style={{ fontSize: 12, color: '#cdd6f4', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>
                {s.name}
              </span>
              <button
                onClick={() => onRun(s.path)}
                disabled={isRunning}
                style={{
                  background: isRunning ? '#45475a' : '#a6e3a1',
                  color: '#1e1e2e',
                  border: 'none',
                  borderRadius: 3,
                  padding: '2px 10px',
                  fontSize: 11,
                  fontWeight: 'bold',
                  cursor: isRunning ? 'default' : 'pointer',
                  flexShrink: 0,
                  marginLeft: 8,
                }}
              >
                {isRunning ? '⟳' : '▶ Run'}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
