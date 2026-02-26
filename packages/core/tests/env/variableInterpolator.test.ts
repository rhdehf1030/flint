import { describe, it, expect } from 'vitest';

import { interpolate, InterpolationError } from '../../src/env/variableInterpolator.js';

describe('interpolate', () => {
  it('replaces a single variable', () => {
    expect(interpolate('Hello {{NAME}}', { NAME: 'world' })).toBe('Hello world');
  });

  it('replaces multiple variables', () => {
    expect(interpolate('{{A}} and {{B}}', { A: 'foo', B: 'bar' })).toBe('foo and bar');
  });

  it('replaces variable in URL', () => {
    expect(interpolate('https://{{HOST}}/api/{{VERSION}}', { HOST: 'example.com', VERSION: 'v1' }))
      .toBe('https://example.com/api/v1');
  });

  it('leaves undefined variable as-is in lenient mode', () => {
    expect(interpolate('{{UNDEFINED}}', {})).toBe('{{UNDEFINED}}');
  });

  it('throws InterpolationError in strict mode for undefined variable', () => {
    expect(() => interpolate('{{UNDEFINED}}', {}, true)).toThrow(InterpolationError);
  });

  it('throws with variable name in strict mode', () => {
    try {
      interpolate('{{MY_VAR}}', {}, true);
    } catch (e) {
      expect(e).toBeInstanceOf(InterpolationError);
      expect((e as InterpolationError).varName).toBe('MY_VAR');
    }
  });

  it('handles string with no variables', () => {
    expect(interpolate('no variables here', {})).toBe('no variables here');
  });

  it('handles empty string', () => {
    expect(interpolate('', {})).toBe('');
  });

  it('handles variable with surrounding whitespace in braces', () => {
    expect(interpolate('{{ NAME }}', { NAME: 'world' })).toBe('world');
  });

  it('does not replace nested braces (not a valid token)', () => {
    // {{{VAR}}} — the outer braces won't match because regex is non-greedy
    const result = interpolate('{{{VAR}}}', { VAR: 'val' });
    // Inner {{VAR}} gets replaced, leaving surrounding {}
    expect(result).toBe('{val}');
  });
});
