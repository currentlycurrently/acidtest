# OpenClaw Command Center

🦞 **A Starcraft-inspired dashboard for AI agent orchestration**

> "Spawn more Overlords!"

Real-time monitoring and control for [OpenClaw](https://github.com/openclaw/openclaw) AI assistant deployments.

## Features

- **Session Monitoring** — Real-time view of active AI sessions
- **LLM Usage Tracking** — Token consumption, costs, model distribution
- **System Vitals** — CPU, memory, disk, network metrics
- **Gateway Status** — OpenClaw gateway health and configuration
- **Cron Jobs** — View and manage scheduled tasks
- **Linear Integration** — View issues from the dashboard
- **Topic Classification** — Automatic conversation tagging

## Quick Start

```bash
# Clone
git clone https://github.com/jontsai/openclaw-command-center
cd openclaw-command-center

# Run setup (installs deps, creates config)
./scripts/setup.sh

# Start dashboard
make start
```

Dashboard runs at http://localhost:3333

### Zero-Config Experience

The dashboard **auto-detects** your OpenClaw workspace by checking:

1. `$OPENCLAW_WORKSPACE` environment variable
2. `~/openclaw-workspace` or `~/.openclaw-workspace`
3. `~/molty`, `~/clawd`, `~/moltbot` (common names)

If you have an existing workspace with `memory/` or `state/` directories, it will be found automatically.

## Configuration

### Environment Variables

| Variable               | Description                | Default                 |
| ---------------------- | -------------------------- | ----------------------- |
| `PORT`                 | Server port                | `3333`                  |
| `OPENCLAW_WORKSPACE`   | Workspace root directory   | `~/.openclaw-workspace` |
| `OPENCLAW_MEMORY_DIR`  | Memory/logs directory      | `$WORKSPACE/memory`     |
| `OPENCLAW_STATE_DIR`   | State files directory      | `$WORKSPACE/state`      |
| `OPENCLAW_CEREBRO_DIR` | Cerebro topic directory    | `$WORKSPACE/cerebro`    |
| `OPENCLAW_JOBS_DIR`    | Jobs definitions directory | `$WORKSPACE/jobs`       |
| `OPENCLAW_SKILLS_DIR`  | Skills directory           | `$WORKSPACE/skills`     |

### Authentication

| Variable                  | Description                                                        |
| ------------------------- | ------------------------------------------------------------------ |
| `DASHBOARD_AUTH_MODE`     | Auth mode: `none`, `token`, `tailscale`, `cloudflare`, `allowlist` |
| `DASHBOARD_TOKEN`         | Bearer token (when mode=`token`)                                   |
| `DASHBOARD_ALLOWED_USERS` | Comma-separated allowed users                                      |
| `DASHBOARD_ALLOWED_IPS`   | Comma-separated allowed IPs (when mode=`allowlist`)                |

### Integration

| Variable         | Description                          |
| ---------------- | ------------------------------------ |
| `LINEAR_API_KEY` | Linear API key for issue integration |

## Using with Makefile

```bash
# Show available commands
make help

# Start dashboard in tmux
make start

# View status
make status

# Attach to tmux session
make attach

# Stop dashboard
make stop
```

### Private Commands

Create `Makefile.local` for custom commands (gitignored):

```makefile
lfg: ## Start and attach in one command
	@$(MAKE) start
	@$(MAKE) attach
```

## ClawHub

**Registry:** https://www.clawhub.ai/jontsai/command-center

```bash
clawhub install command-center
```

See [SKILL.md](SKILL.md) for ClawHub usage.

## Architecture

```
command-center/
├── lib/
│   ├── server.js           # Main HTTP server
│   ├── jobs.js             # Jobs API integration
│   ├── linear-sync.js      # Linear API integration
│   └── topic-classifier.js # Topic ML classifier
├── public/
│   ├── index.html          # Main dashboard UI
│   └── jobs.html           # Jobs management UI
├── scripts/
│   ├── start.sh            # Start server
│   ├── stop.sh             # Stop server
│   └── tmux-dashboard.sh   # tmux layout script
└── config/
    └── dashboard.example.json
```

## Development

```bash
# Watch mode
npm run dev

# Lint
npm run lint

# Format
npm run format
```

## License

MIT

## Contributing

Contributions welcome! Please read [CONTRIBUTING.md](CONTRIBUTING.md) first.
