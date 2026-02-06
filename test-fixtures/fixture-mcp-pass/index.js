/**
 * Simple time formatting MCP server
 * No security concerns - only formats time/date
 */

function formatTime(format) {
  const now = new Date();

  switch (format) {
    case '12h':
      return now.toLocaleTimeString('en-US', { hour12: true });
    case '24h':
      return now.toLocaleTimeString('en-US', { hour12: false });
    case 'iso':
      return now.toISOString();
    default:
      return now.toString();
  }
}

function getDate() {
  return new Date().toLocaleDateString();
}

// Export functions
export { formatTime, getDate };
