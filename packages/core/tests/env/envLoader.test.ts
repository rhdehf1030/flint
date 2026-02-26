import { describe, it, expect } from 'vitest';

import { parseEnvContent, loadEnvFile } from '../../src/env/envLoader.js';

describe('parseEnvContent', () => {
  it('parses basic KEY=VALUE pairs', () => {
    const result = parseEnvContent('FOO=bar\nBAZ=qux');
    expect(result).toEqual({ FOO: 'bar', BAZ: 'qux' });
  });

  it('skips comment lines', () => {
    const result = parseEnvContent('# this is a comment\nFOO=bar');
    expect(result).toEqual({ FOO: 'bar' });
  });

  it('skips empty lines', () => {
    const result = parseEnvContent('\nFOO=bar\n\nBAZ=qux\n');
    expect(result).toEqual({ FOO: 'bar', BAZ: 'qux' });
  });

  it('handles double-quoted values', () => {
    const result = parseEnvContent('FOO="hello world"');
    expect(result).toEqual({ FOO: 'hello world' });
  });

  it('handles single-quoted values', () => {
    const result = parseEnvContent("FOO='hello world'");
    expect(result).toEqual({ FOO: 'hello world' });
  });

  it('unescapes \\n in double-quoted values', () => {
    const result = parseEnvContent('FOO="line1\\nline2"');
    expect(result['FOO']).toBe('line1\nline2');
  });

  it('handles value with equals sign', () => {
    const result = parseEnvContent('FOO=a=b=c');
    expect(result).toEqual({ FOO: 'a=b=c' });
  });

  it('handles backslash line continuation', () => {
    const result = parseEnvContent('FOO=hello\\\n world');
    expect(result['FOO']).toBe('hello world');
  });

  it('handles inline comment style (value includes #)', () => {
    // We do NOT strip inline comments — value is taken literally after =
    const result = parseEnvContent('FOO=bar#notcomment');
    expect(result).toEqual({ FOO: 'bar#notcomment' });
  });

  it('handles nested braces edge case', () => {
    const result = parseEnvContent('FOO={{nested}}');
    expect(result).toEqual({ FOO: '{{nested}}' });
  });

  it('handles Windows CRLF line endings', () => {
    const result = parseEnvContent('FOO=bar\r\nBAZ=qux\r\n');
    expect(result).toEqual({ FOO: 'bar', BAZ: 'qux' });
  });
});

describe('loadEnvFile', () => {
  it('throws EnvParseError for non-existent file', () => {
    expect(() => loadEnvFile('/nonexistent/path/to/file.env')).toThrow('Failed to read env file');
  });
});
