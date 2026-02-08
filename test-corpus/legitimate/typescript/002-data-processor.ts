// Legitimate data processor - should PASS
// Expected: PASS or WARN (acceptable)
// Description: Safe file processing with JSON

import fs from 'fs';

export function processData(filepath: string) {
  const content = fs.readFileSync(filepath, 'utf8');
  const data = JSON.parse(content);
  return data.map(item => item.value * 2);
}
