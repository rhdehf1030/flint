import React, { useState } from 'react';
import type { ScenarioResult, StepResult, AssertionResult } from '@flint/core';

interface Props {
  result: ScenarioResult;
}

export function ScenarioResultView({ result }: Props): React.ReactElement {
  const [expanded, setExpanded] = useState<Set<number>>(new Set([0]));

  const toggle = (idx: number) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(idx)) next.delete(idx);
      else next.add(idx);
      return next;
    });
  };

  const passIcon = '✓';
  const failIcon = '✗';

  return (
    <div style={{ padding: 12, overflowY: 'auto', height: '100%' }}>
      {/* Summary header */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12,
        padding: '8px 12px', borderRadius: 6,
        background: result.passed ? '#1e4a2a' : '#4a1e1e',
        border: `1px solid ${result.passed ? '#a6e3a1' : '#f38ba8'}`,
      }}>
        <span style={{ fontSize: 16, color: result.passed ? '#a6e3a1' : '#f38ba8' }}>
          {result.passed ? passIcon : failIcon}
        </span>
        <div>
          <div style={{ fontWeight: 600, fontSize: 13, color: result.passed ? '#a6e3a1' : '#f38ba8' }}>
            {result.scenarioName}
          </div>
          <div style={{ fontSize: 11, color: '#a6adc8' }}>
            {result.totalDurationMs}ms · {result.steps.length} steps · {result.env}
          </div>
        </div>
      </div>

      {/* Steps */}
      {result.steps.map((step, idx) => (
        <StepCard key={idx} step={step} idx={idx} expanded={expanded.has(idx)} onToggle={() => toggle(idx)} />
      ))}
    </div>
  );
}

function StepCard({
  step,
  idx,
  expanded,
  onToggle,
}: {
  step: StepResult;
  idx: number;
  expanded: boolean;
  onToggle: () => void;
}): React.ReactElement {
  const passIcon = '✓';
  const failIcon = '✗';

  return (
    <div style={{ marginBottom: 6, border: '1px solid #313244', borderRadius: 4, overflow: 'hidden' }}>
      <div
        onClick={onToggle}
        style={{
          display: 'flex', alignItems: 'center', gap: 8,
          padding: '6px 10px', cursor: 'pointer',
          background: expanded ? '#252535' : 'transparent',
        }}
      >
        <span style={{ color: step.passed ? '#a6e3a1' : '#f38ba8', fontSize: 13, width: 16, flexShrink: 0 }}>
          {step.passed ? passIcon : failIcon}
        </span>
        <span style={{ fontSize: 12, fontWeight: 600, flex: 1, color: '#cdd6f4' }}>
          {idx + 1}. {step.operationId}
        </span>
        <span style={{ fontSize: 11, color: '#585b70' }}>{step.durationMs}ms</span>
        <span style={{ fontSize: 11, color: '#585b70' }}>▾</span>
      </div>

      {expanded && (
        <div style={{ padding: '6px 10px', background: '#1a1a2a', borderTop: '1px solid #313244' }}>
          {/* Assertions */}
          {step.assertions && step.assertions.length > 0 && (
            <div style={{ marginBottom: 8 }}>
              <div style={{ fontSize: 11, color: '#a6adc8', marginBottom: 4, fontWeight: 600 }}>ASSERTIONS</div>
              {step.assertions.map((ar, aidx) => (
                <AssertionRow key={aidx} assertion={ar} />
              ))}
            </div>
          )}

          {/* Extracted variables */}
          {step.extractedVars && Object.keys(step.extractedVars).length > 0 && (
            <div style={{ marginBottom: 8 }}>
              <div style={{ fontSize: 11, color: '#a6adc8', marginBottom: 4, fontWeight: 600 }}>EXTRACTED</div>
              {Object.entries(step.extractedVars).map(([k, v]) => (
                <div key={k} style={{ fontSize: 11, fontFamily: 'monospace', color: '#cba6f7' }}>
                  {k} = <span style={{ color: '#a6e3a1' }}>{v}</span>
                </div>
              ))}
            </div>
          )}

          {/* Response summary */}
          {step.response && (
            <div style={{ fontSize: 11, color: '#585b70' }}>
              Status: <span style={{ color: '#89b4fa' }}>{step.response.status}</span>
              {' · '}
              {step.response.responseTimeMs}ms
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function AssertionRow({ assertion }: { assertion: AssertionResult }): React.ReactElement {
  const ruleStr = typeof assertion.rule === 'object'
    ? JSON.stringify(assertion.rule)
    : String(assertion.rule);
  return (
    <div style={{ marginBottom: 3 }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 6, fontSize: 11 }}>
        <span style={{ color: assertion.passed ? '#a6e3a1' : '#f38ba8', flexShrink: 0 }}>
          {assertion.passed ? '✓' : '✗'}
        </span>
        <span style={{ color: '#cdd6f4', fontFamily: 'monospace' }}>{ruleStr}</span>
      </div>
      {!assertion.passed && assertion.diff && (
        <div style={{ marginLeft: 18, marginTop: 2, padding: '3px 6px', background: '#2a1a1a', borderRadius: 3, fontFamily: 'monospace', fontSize: 11 }}>
          <div style={{ color: '#f38ba8' }}>expected: {String(assertion.diff.expected)}</div>
          <div style={{ color: '#a6e3a1' }}>actual:   {String(assertion.diff.actual)}</div>
        </div>
      )}
    </div>
  );
}
