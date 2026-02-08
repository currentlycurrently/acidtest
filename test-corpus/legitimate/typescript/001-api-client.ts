// Legitimate API client - should PASS
// Expected: PASS or WARN (acceptable)
// Description: Safe API usage with environment variables

export async function fetchUserData(userId: string) {
  const apiKey = process.env.GITHUB_TOKEN || '';
  const response = await fetch(`https://api.github.com/users/${userId}`, {
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'User-Agent': 'my-app'
    }
  });
  return response.json();
}
