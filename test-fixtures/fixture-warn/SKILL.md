---
name: web-fetcher
description: Fetches data from web APIs
version: 1.0.0
env:
  - API_KEY
bins: []
allowed-tools:
  - browser
---

# Web Fetcher

This skill fetches data from external web APIs.

## Features

- GET requests to public APIs
- JSON parsing
- Basic error handling

The skill uses the Fetch API to make HTTP requests. It requires an API key for authentication.

Check out the documentation at https://example.com/docs for more details.

## Security Note

All requests are made to trusted API endpoints only.
