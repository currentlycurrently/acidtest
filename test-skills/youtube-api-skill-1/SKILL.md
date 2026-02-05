---
name: youtube
description: |
  YouTube Data API integration with managed OAuth. Search videos, manage playlists, access channel data, and interact with comments. Use this skill when users want to interact with YouTube.
compatibility: Requires network access and valid Maton API key
metadata:
  author: maton
  version: "1.0"
---

# YouTube

Access the YouTube Data API v3 with managed OAuth authentication. Search videos, manage playlists, access channel information, and interact with comments and subscriptions.

## Quick Start

```bash
# Search for videos
curl -s -X GET 'https://gateway.maton.ai/youtube/youtube/v3/search?part=snippet&q=coding+tutorial&type=video&maxResults=10' \
  -H 'Authorization: Bearer YOUR_API_KEY'
```

## Base URL

```
https://gateway.maton.ai/youtube/{native-api-path}
```

Replace `{native-api-path}` with the actual YouTube Data API endpoint path. The gateway proxies requests to `www.googleapis.com` and automatically injects your OAuth token.

## Authentication

All requests require the Maton API key in the Authorization header:

```
Authorization: Bearer YOUR_API_KEY
```

**Environment Variable:** Set your API key as `MATON_API_KEY`:

```bash
export MATON_API_KEY="YOUR_API_KEY"
```

### Getting Your API Key

1. Sign in or create an account at [maton.ai](https://maton.ai)
2. Go to [maton.ai/settings](https://maton.ai/settings)
3. Copy your API key

## Connection Management

Manage your Google OAuth connections at `https://ctrl.maton.ai`.

### List Connections

```bash
curl -s -X GET 'https://ctrl.maton.ai/connections?app=youtube&status=ACTIVE' \
  -H 'Authorization: Bearer YOUR_API_KEY'
```

### Create Connection

```bash
curl -s -X POST 'https://ctrl.maton.ai/connections' \
  -H 'Content-Type: application/json' \
  -H 'Authorization: Bearer YOUR_API_KEY' \
  -d '{"app": "youtube"}'
```

### Get Connection

```bash
curl -s -X GET 'https://ctrl.maton.ai/connections/{connection_id}' \
  -H 'Authorization: Bearer YOUR_API_KEY'
```

**Response:**
```json
{
  "connection": {
    "connection_id": "21fd90f9-5935-43cd-b6c8-bde9d915ca80",
    "status": "ACTIVE",
    "creation_time": "2025-12-08T07:20:53.488460Z",
    "last_updated_time": "2026-01-31T20:03:32.593153Z",
    "url": "https://connect.maton.ai/?session_token=...",
    "app": "youtube",
    "metadata": {}
  }
}
```

Open the returned `url` in a browser to complete OAuth authorization.

### Delete Connection

```bash
curl -s -X DELETE 'https://ctrl.maton.ai/connections/{connection_id}' \
  -H 'Authorization: Bearer YOUR_API_KEY'
```

### Specifying Connection

If you have multiple YouTube connections, specify which one to use with the `Maton-Connection` header:

```bash
curl -s -X GET 'https://gateway.maton.ai/youtube/youtube/v3/channels?part=snippet&mine=true' \
  -H 'Authorization: Bearer YOUR_API_KEY' \
  -H 'Maton-Connection: 21fd90f9-5935-43cd-b6c8-bde9d915ca80'
```

If omitted, the gateway uses the default (oldest) active connection.

## API Reference

### Search

#### Search Videos, Channels, or Playlists

```bash
GET /youtube/youtube/v3/search
```

Query parameters:
- `part` - Required: `snippet`
- `q` - Search query
- `type` - Filter by type: `video`, `channel`, `playlist`
- `maxResults` - Results per page (1-50, default 5)
- `order` - Sort order: `date`, `rating`, `relevance`, `title`, `viewCount`
- `publishedAfter` - Filter by publish date (RFC 3339)
- `publishedBefore` - Filter by publish date (RFC 3339)
- `channelId` - Filter by channel
- `videoDuration` - `short` (<4min), `medium` (4-20min), `long` (>20min)
- `pageToken` - Pagination token

**Example:**

```bash
curl -s -X GET 'https://gateway.maton.ai/youtube/youtube/v3/search?part=snippet&q=machine+learning&type=video&maxResults=10&order=viewCount' \
  -H 'Authorization: Bearer YOUR_API_KEY'
```

**Response:**
```json
{
  "kind": "youtube#searchListResponse",
  "nextPageToken": "CAUQAA",
  "pageInfo": {
    "totalResults": 1000000,
    "resultsPerPage": 10
  },
  "items": [
    {
      "kind": "youtube#searchResult",
      "id": {
        "kind": "youtube#video",
        "videoId": "abc123xyz"
      },
      "snippet": {
        "publishedAt": "2024-01-15T10:00:00Z",
        "channelId": "UCxyz123",
        "title": "Machine Learning Tutorial",
        "description": "Learn ML basics...",
        "thumbnails": {
          "default": {"url": "https://i.ytimg.com/vi/abc123xyz/default.jpg"}
        },
        "channelTitle": "Tech Channel"
      }
    }
  ]
}
```

### Videos

#### Get Video Details

```bash
GET /youtube/youtube/v3/videos?part=snippet,statistics,contentDetails&id={videoId}
```

Parts available:
- `snippet` - Title, description, thumbnails, channel info
- `statistics` - View count, likes, comments
- `contentDetails` - Duration, dimension, definition
- `status` - Upload status, privacy status
- `player` - Embedded player HTML

**Example:**

```bash
curl -s -X GET 'https://gateway.maton.ai/youtube/youtube/v3/videos?part=snippet,statistics&id=dQw4w9WgXcQ' \
  -H 'Authorization: Bearer YOUR_API_KEY'
```

#### Get My Videos (Uploaded)

```bash
GET /youtube/youtube/v3/search?part=snippet&forMine=true&type=video&maxResults=25
```

#### Rate Video (Like/Dislike)

```bash
POST /youtube/youtube/v3/videos/rate?id={videoId}&rating=like
```

Rating values: `like`, `dislike`, `none`

#### Get Trending Videos

```bash
GET /youtube/youtube/v3/videos?part=snippet,statistics&chart=mostPopular&regionCode=US&maxResults=10
```

#### Get Video Categories

```bash
GET /youtube/youtube/v3/videoCategories?part=snippet&regionCode=US
```

### Channels

#### Get Channel Details

```bash
GET /youtube/youtube/v3/channels?part=snippet,statistics,contentDetails&id={channelId}
```

#### Get My Channel

```bash
GET /youtube/youtube/v3/channels?part=snippet,statistics,contentDetails&mine=true
```

**Response:**
```json
{
  "items": [
    {
      "id": "UCxyz123",
      "snippet": {
        "title": "My Channel",
        "description": "Channel description",
        "customUrl": "@mychannel",
        "publishedAt": "2020-01-01T00:00:00Z",
        "thumbnails": {...}
      },
      "statistics": {
        "viewCount": "1000000",
        "subscriberCount": "50000",
        "videoCount": "100"
      },
      "contentDetails": {
        "relatedPlaylists": {
          "uploads": "UUxyz123"
        }
      }
    }
  ]
}
```

#### Get Channel by Username

```bash
GET /youtube/youtube/v3/channels?part=snippet,statistics&forUsername={username}
```

### Playlists

#### List My Playlists

```bash
GET /youtube/youtube/v3/playlists?part=snippet,contentDetails&mine=true&maxResults=25
```

#### Get Playlist

```bash
GET /youtube/youtube/v3/playlists?part=snippet,contentDetails&id={playlistId}
```

#### Create Playlist

```bash
POST /youtube/youtube/v3/playlists?part=snippet,status
Content-Type: application/json

{
  "snippet": {
    "title": "My New Playlist",
    "description": "A collection of videos",
    "defaultLanguage": "en"
  },
  "status": {
    "privacyStatus": "private"
  }
}
```

Privacy values: `public`, `private`, `unlisted`

#### Update Playlist

```bash
PUT /youtube/youtube/v3/playlists?part=snippet,status
Content-Type: application/json

{
  "id": "PLxyz123",
  "snippet": {
    "title": "Updated Playlist Title",
    "description": "Updated description"
  },
  "status": {
    "privacyStatus": "public"
  }
}
```

#### Delete Playlist

```bash
DELETE /youtube/youtube/v3/playlists?id={playlistId}
```

### Playlist Items

#### List Playlist Items

```bash
GET /youtube/youtube/v3/playlistItems?part=snippet,contentDetails&playlistId={playlistId}&maxResults=50
```

#### Add Video to Playlist

```bash
POST /youtube/youtube/v3/playlistItems?part=snippet
Content-Type: application/json

{
  "snippet": {
    "playlistId": "PLxyz123",
    "resourceId": {
      "kind": "youtube#video",
      "videoId": "abc123xyz"
    },
    "position": 0
  }
}
```

#### Remove from Playlist

```bash
DELETE /youtube/youtube/v3/playlistItems?id={playlistItemId}
```

### Subscriptions

#### List My Subscriptions

```bash
GET /youtube/youtube/v3/subscriptions?part=snippet&mine=true&maxResults=50
```

#### Check Subscription to Channel

```bash
GET /youtube/youtube/v3/subscriptions?part=snippet&mine=true&forChannelId={channelId}
```

#### Subscribe to Channel

```bash
POST /youtube/youtube/v3/subscriptions?part=snippet
Content-Type: application/json

{
  "snippet": {
    "resourceId": {
      "kind": "youtube#channel",
      "channelId": "UCxyz123"
    }
  }
}
```

#### Unsubscribe

```bash
DELETE /youtube/youtube/v3/subscriptions?id={subscriptionId}
```

### Comments

#### List Video Comments

```bash
GET /youtube/youtube/v3/commentThreads?part=snippet,replies&videoId={videoId}&maxResults=100
```

#### Add Comment to Video

```bash
POST /youtube/youtube/v3/commentThreads?part=snippet
Content-Type: application/json

{
  "snippet": {
    "videoId": "abc123xyz",
    "topLevelComment": {
      "snippet": {
        "textOriginal": "Great video!"
      }
    }
  }
}
```

#### Reply to Comment

```bash
POST /youtube/youtube/v3/comments?part=snippet
Content-Type: application/json

{
  "snippet": {
    "parentId": "comment123",
    "textOriginal": "Thanks for your comment!"
  }
}
```

#### Delete Comment

```bash
DELETE /youtube/youtube/v3/comments?id={commentId}
```

## Code Examples

### JavaScript

```javascript
const headers = {
  'Authorization': `Bearer ${process.env.MATON_API_KEY}`
};

// Search videos
const results = await fetch(
  'https://gateway.maton.ai/youtube/youtube/v3/search?part=snippet&q=tutorial&type=video&maxResults=10',
  { headers }
).then(r => r.json());

// Get video details
const video = await fetch(
  'https://gateway.maton.ai/youtube/youtube/v3/videos?part=snippet,statistics&id=dQw4w9WgXcQ',
  { headers }
).then(r => r.json());

// Create playlist
await fetch(
  'https://gateway.maton.ai/youtube/youtube/v3/playlists?part=snippet,status',
  {
    method: 'POST',
    headers: { ...headers, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      snippet: { title: 'My Playlist', description: 'Videos I like' },
      status: { privacyStatus: 'private' }
    })
  }
);
```

### Python

```python
import os
import requests

headers = {'Authorization': f'Bearer {os.environ["MATON_API_KEY"]}'}

# Search videos
results = requests.get(
    'https://gateway.maton.ai/youtube/youtube/v3/search',
    headers=headers,
    params={'part': 'snippet', 'q': 'tutorial', 'type': 'video', 'maxResults': 10}
).json()

# Get video details
video = requests.get(
    'https://gateway.maton.ai/youtube/youtube/v3/videos',
    headers=headers,
    params={'part': 'snippet,statistics', 'id': 'dQw4w9WgXcQ'}
).json()

# Create playlist
response = requests.post(
    'https://gateway.maton.ai/youtube/youtube/v3/playlists?part=snippet,status',
    headers=headers,
    json={
        'snippet': {'title': 'My Playlist', 'description': 'Videos I like'},
        'status': {'privacyStatus': 'private'}
    }
)
```

## Notes

- Video IDs are 11 characters (e.g., `dQw4w9WgXcQ`)
- Channel IDs start with `UC` (e.g., `UCxyz123`)
- Playlist IDs start with `PL` (user) or `UU` (uploads)
- Use `pageToken` for pagination through large result sets
- The `part` parameter is required and determines what data is returned
- Quota costs vary by endpoint - search is expensive (100 units), reads are cheap (1 unit)
- Some write operations require channel verification

## Error Handling

| Status | Meaning |
|--------|---------|
| 400 | Missing YouTube connection or invalid request |
| 401 | Invalid or missing Maton API key |
| 403 | Forbidden - quota exceeded or insufficient permissions |
| 404 | Video, channel, or playlist not found |
| 429 | Rate limited (10 req/sec per account) |
| 4xx/5xx | Passthrough error from YouTube API |

## Resources

- [YouTube Data API Overview](https://developers.google.com/youtube/v3)
- [Search](https://developers.google.com/youtube/v3/docs/search/list)
- [Videos](https://developers.google.com/youtube/v3/docs/videos)
- [Channels](https://developers.google.com/youtube/v3/docs/channels)
- [Playlists](https://developers.google.com/youtube/v3/docs/playlists)
- [PlaylistItems](https://developers.google.com/youtube/v3/docs/playlistItems)
- [Subscriptions](https://developers.google.com/youtube/v3/docs/subscriptions)
- [Comments](https://developers.google.com/youtube/v3/docs/comments)
- [Quota Calculator](https://developers.google.com/youtube/v3/determine_quota_cost)
