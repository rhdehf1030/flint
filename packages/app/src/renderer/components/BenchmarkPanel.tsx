import React, { useState } from 'react';
import type { BenchmarkResult } from '@flint/core';

interface Props {
  scenarios: { path: string; name: string }[];
  onRun: (scenarioPath: string, concurrent: number, duration: number, rampUp: number) => Promise<BenchmarkResult>;
}

export function BenchmarkPanel({ scenarios, onRun }: Props): React.ReactElement {
  const [scenarioPath, setScenarioPath] = useState('');
  const [concurrent, setConcurrent] = useState(5);
  const [duration, setDuration] = useState(30);
  const [rampUp, setRampUp] = useState(5);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<BenchmarkResult | null>(null);

  const run = async () => {
    if (!scenarioPath) return;
    setLoading(true);
    setResult(null);
    try {
      const r = await onRun(scenarioPath, concurrent, duration, rampUp);
      setResult(r);
    } finally {
      setLoading(false);
    }
  };

  const pStats = result?.latency;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', padding: 16 }}>
      {/* Config */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12, marginBottom: 16 }}>
        <div>
          <label style={{ fontSize: 11, color: '#a6adc8', display: 'block', marginBottom: 4 }}>Scenario</label>
          <select
            value={scenarioPath}
            onChange={(e) => setScenarioPath(e.target.value)}
            style={inputStyle()}
          >
            <option value="">-- select --</option>
            {scenarios.map((s) => (
              <option key={s.path} value={s.path}>{s.name}</option>
            ))}
          </select>
        </div>
        <div>
          <label style={{ fontSize: 11, color: '#a6adc8', display: 'block', marginBottom: 4 }}>Concurrent</label>
          <input
            type="number" min={1} max={100}
            value={concurrent}
            onChange={(e) => setConcurrent(parseInt(e.target.value) || 1)}
            style={inputStyle()}
          />
        </div>
        <div>
          <label style={{ fontSize: 11, color: '#a6adc8', display: 'block', marginBottom: 4 }}>Duration (s)</label>
          <input
            type="number" min={1} max={300}
            value={duration}
            onChange={(e) => setDuration(parseInt(e.target.value) || 10)}
            style={inputStyle()}
          />
        </div>
        <div>
          <label style={{ fontSize: 11, color: '#a6adc8', display: 'block', marginBottom: 4 }}>Ramp-up (s)</label>
          <input
            type="number" min={0} max={60}
            value={rampUp}
            onChange={(e) => setRampUp(parseInt(e.target.value) || 0)}
            style={inputStyle()}
          />
        </div>
      </div>

      <button
        onClick={run}
        disabled={loading || !scenarioPath}
        style={{
          background: loading || !scenarioPath ? '#45475a' : '#a6e3a1',
          color: '#1e1e2e', border: 'none', borderRadius: 4,
          padding: '8px 24px', fontSize: 13, fontWeight: 'bold',
          cursor: loading || !scenarioPath ? 'default' : 'pointer',
          alignSelf: 'flex-start', marginBottom: 16,
        }}
      >
        {loading ? '⟳ Running…' : '▶ Run Benchmark'}
      </button>

      {/* Results */}
      {result && (
        <div style={{ flex: 1, overflowY: 'auto' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, marginBottom: 16 }}>
            <StatCard label="Total Requests" value={String(result.totalRequests)} />
            <StatCard label="RPS" value={result.rps.toFixed(1)} />
            <StatCard label="Success Rate" value={`${(result.successRate * 100).toFixed(1)}%`} color={result.successRate > 0.95 ? '#a6e3a1' : '#f38ba8'} />
            <StatCard label="Error Rate" value={`${(result.errorRate * 100).toFixed(1)}%`} color={result.errorRate < 0.05 ? '#a6e3a1' : '#f38ba8'} />
            {pStats && (
              <>
                <StatCard label="p50" value={`${pStats.p50}ms`} />
                <StatCard label="p95" value={`${pStats.p95}ms`} />
                <StatCard label="p99" value={`${pStats.p99}ms`} />
                <StatCard label="Min" value={`${pStats.min}ms`} />
                {pStats.max > 1000
                  ? <StatCard label="Max" value={`${pStats.max}ms`} color="#f38ba8" />
                  : <StatCard label="Max" value={`${pStats.max}ms`} />
                }
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({ label, value, color }: { label: string; value: string; color?: string }): React.ReactElement {
  return (
    <div style={{
      background: '#313244', borderRadius: 6, padding: '8px 12px',
      border: '1px solid #45475a',
    }}>
      <div style={{ fontSize: 11, color: '#585b70', marginBottom: 2 }}>{label}</div>
      <div style={{ fontSize: 18, fontWeight: 'bold', color: color ?? '#cdd6f4' }}>{value}</div>
    </div>
  );
}

function inputStyle(): React.CSSProperties {
  return {
    width: '100%',
    background: '#313244',
    color: '#cdd6f4',
    border: '1px solid #45475a',
    borderRadius: 4,
    padding: '4px 8px',
    fontSize: 12,
    outline: 'none',
  };
}
