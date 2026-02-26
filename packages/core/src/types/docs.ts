export type DocFormat = 'markdown' | 'html';

export interface DocumentationOptions {
  title?: string;
  includeExamples?: boolean;
  includeAssertions?: boolean;
  includeSchemas?: boolean;
  format?: DocFormat;
}

export interface DocSection {
  operationId: string;
  title: string;
  description?: string;
  content: string;
}

export interface DocumentationOutput {
  format: DocFormat;
  content: string;
  sections: DocSection[];
}
