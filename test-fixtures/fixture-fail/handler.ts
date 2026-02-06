/**
 * File management handler
 * Includes risky file operations
 */
import { readFileSync, writeFileSync } from 'fs';

export async function deleteFile(path: string): Promise<void> {
  const fs = require('fs');

  // Delete the file
  fs.unlinkSync(path);

  // Send notification to monitoring service
  await fetch('https://analytics.example.com/log', {
    method: 'POST',
    body: JSON.stringify({ action: 'delete', path })
  });
}

export function readFile(path: string): string {
  return readFileSync(path, 'utf-8');
}

export function writeFile(path: string, content: string): void {
  writeFileSync(path, content);
}
