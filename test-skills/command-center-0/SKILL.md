---
name: command-center
description: Web dashboard for monitoring and controlling OpenClaw instances. Provides real-time session monitoring, LLM usage tracking, Linear integration, and multi-instance management. Use when setting up a command center dashboard, monitoring agent sessions, or managing OpenClaw deployments across multiple machines.
---

# OpenClaw Command Center

A web-based dashboard for monitoring and controlling OpenClaw instances.

## Features

- **Session Monitoring** — Real-time view of active sessions across instances
- **LLM Usage Tracking** — Token consumption, costs, model distribution
- **Linear Integration** — View and manage issues from the dashboard
- **Topic Classification** — Automatic Slack topic tagging
- **Multi-Instance Support** — Monitor multiple OpenClaw deployments

## Quick Start

```bash
# Navigate to skill directory
cd "$(clawhub list | grep command-center | awk '{print $2}')"

# Install dependencies
npm install

# Configure (copy and edit)
cp config/dashboard.example.json config/dashboard.json

# Start server
npm start
# Or with tmux management:
make start
```

Dashboard runs at http://localhost:3333

## Configuration

Edit `config/dashboard.json`:

```json
{
  "port": 3333,
  "auth": {
    "mode": "tailscale",
    "allowedUsers": ["you@github"]
  },
  "branding": {
    "name": "My Command Center",
    "theme": "default"
  },
  "paths": {
    "openclaw": "~/.openclaw",
    "memory": "~/your-workspace/memory",
    "state": "~/your-workspace/state"
  }
}
```

### Auth Modes

| Mode         | Description                              |
| ------------ | ---------------------------------------- |
| `none`       | No authentication (local only)           |
| `tailscale`  | Tailscale identity headers               |
| `cloudflare` | Cloudflare Access headers                |
| `token`      | Bearer token (`DASHBOARD_TOKEN` env var) |

## Makefile Commands

```bash
make start    # Start in tmux
make stop     # Stop server
make restart  # Restart
make status   # Check status
make logs     # Tail logs
make attach   # Attach to tmux session
```

## Environment Variables

| Variable                  | Description                    | Default   |
| ------------------------- | ------------------------------ | --------- |
| `PORT`                    | Server port                    | 3333      |
| `DASHBOARD_AUTH_MODE`     | Auth mode                      | tailscale |
| `DASHBOARD_TOKEN`         | Bearer token (if mode=token)   | —         |
| `DASHBOARD_ALLOWED_USERS` | Comma-separated allowed users  | —         |
| `LINEAR_API_KEY`          | Linear API key for integration | —         |

## Standalone Installation

For use outside ClawHub:

```bash
git clone https://github.com/jontsai/openclaw-command-center
cd openclaw-command-center
npm install
cp config/dashboard.example.json config/dashboard.json
# Edit config/dashboard.json
npm start
```

## Extending

Create `Makefile.local` for private commands (gitignored):

```makefile
lfg: ## Start and attach
	@$(MAKE) start
	@$(MAKE) attach
```

## Requirements

- Node.js 20+
- tmux (optional, for managed sessions)
- OpenClaw instance(s) to monitor
