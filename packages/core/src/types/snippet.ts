export type SnippetTarget = 'curl' | 'fetch' | 'axios' | 'python-requests' | 'go-http' | 'httpie';

export interface CodeSnippet {
  target: SnippetTarget;
  language: string;
  code: string;
}
