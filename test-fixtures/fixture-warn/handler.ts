/**
 * Web data fetcher
 * Makes HTTP requests using fetch API
 */

export async function fetchData(url: string): Promise<any> {
  const apiKey = process.env.API_KEY;

  const response = await fetch(url, {
    headers: {
      'Authorization': `Bearer ${apiKey}`
    }
  });

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  return response.json();
}
