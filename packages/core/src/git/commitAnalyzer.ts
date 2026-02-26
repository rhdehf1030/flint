import { readdirSync, statSync } from 'node:fs';
import { join, basename, extname } from 'node:path';

function walkDir(dir: string): string[] {
  const results: string[] = [];
  try {
    const entries = readdirSync(dir);
    for (const entry of entries) {
      const fullPath = join(dir, entry);
      try {
        const stat = statSync(fullPath);
        if (stat.isDirectory()) {
          results.push(...walkDir(fullPath));
        } else if (stat.isFile() && extname(entry) === '.yaml') {
          results.push(fullPath);
        }
      } catch {
        // skip
      }
    }
  } catch {
    // directory doesn't exist
  }
  return results;
}

/**
 * Analyze a commit message and return scenario file paths that are relevant.
 * Matches scenario file names and operationIds mentioned in the commit message.
 */
export function analyzeCommit(commitMessage: string, scenariosDir: string): string[] {
  const scenarioFiles = walkDir(scenariosDir);
  const matched = new Set<string>();

  // Tokenize commit message: split by whitespace and common delimiters
  const tokens = commitMessage
    .toLowerCase()
    .split(/[\s,.:;()\[\]{}'"\/\\]+/)
    .filter((t) => t.length > 2);

  for (const filePath of scenarioFiles) {
    const fileName = basename(filePath, '.yaml').toLowerCase();

    // Direct filename match
    if (tokens.includes(fileName) || commitMessage.toLowerCase().includes(fileName)) {
      matched.add(filePath);
      continue;
    }

    // Check if any token appears in filename (partial match for operationId references)
    for (const token of tokens) {
      if (fileName.includes(token) || token.includes(fileName)) {
        matched.add(filePath);
        break;
      }
    }
  }

  return Array.from(matched);
}
