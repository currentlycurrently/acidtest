/**
 * Clean text formatter
 * Safe implementation with no risky operations
 */

export function format(text: string, mode: 'upper' | 'lower' | 'trim'): string {
  switch (mode) {
    case 'upper':
      return text.toUpperCase();
    case 'lower':
      return text.toLowerCase();
    case 'trim':
      return text.trim();
    default:
      return text;
  }
}
// Test comment
// Another test comment to verify v0.8.0 PR workflow fix
