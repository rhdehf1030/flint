import React from 'react';
import { useAppStore } from '../store/appStore.js';

export function EnvironmentSelector(): React.ReactElement {
  const { activeEnv, envList, setActiveEnv } = useAppStore();

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '4px 12px' }}>
      <span style={{ color: '#a6adc8', fontSize: 12 }}>ENV:</span>
      <select
        value={activeEnv}
        onChange={(e) => setActiveEnv(e.target.value)}
        style={{
          background: '#313244',
          color: '#cdd6f4',
          border: '1px solid #45475a',
          borderRadius: 4,
          padding: '2px 6px',
          fontSize: 12,
          cursor: 'pointer',
        }}
      >
        {envList.map((env) => (
          <option key={env} value={env}>
            {env}
          </option>
        ))}
      </select>
    </div>
  );
}
