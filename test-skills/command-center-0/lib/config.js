/**
 * Configuration loader with sensible defaults
 *
 * Priority order:
 * 1. Environment variables (highest)
 * 2. config/dashboard.json file
 * 3. Auto-detected paths
 * 4. Sensible defaults (lowest)
 */

const fs = require("fs");
const path = require("path");
const os = require("os");

const HOME = os.homedir();

/**
 * Auto-detect OpenClaw workspace by checking common locations
 */
function detectWorkspace() {
  const candidates = [
    // Environment variable (already handled, but check anyway)
    process.env.OPENCLAW_WORKSPACE,
    // OpenClaw's default workspace location
    process.env.OPENCLAW_HOME,
    // Common custom workspace names
    path.join(HOME, "openclaw-workspace"),
    path.join(HOME, ".openclaw-workspace"),
    // Check if gateway config points to a workspace
    getWorkspaceFromGatewayConfig(),
    // Legacy/custom names
    path.join(HOME, "molty"),
    path.join(HOME, "clawd"),
    path.join(HOME, "moltbot"),
    // Fallback: create in standard location
    path.join(HOME, ".openclaw-workspace"),
  ].filter(Boolean);

  for (const candidate of candidates) {
    if (candidate && fs.existsSync(candidate)) {
      // Verify it looks like a workspace (has memory/ or state/ dir)
      const hasMemory = fs.existsSync(path.join(candidate, "memory"));
      const hasState = fs.existsSync(path.join(candidate, "state"));
      const hasConfig = fs.existsSync(path.join(candidate, ".openclaw"));

      if (hasMemory || hasState || hasConfig) {
        return candidate;
      }
    }
  }

  // Return default (will be created on first use)
  return path.join(HOME, ".openclaw-workspace");
}

/**
 * Try to get workspace from OpenClaw gateway config
 */
function getWorkspaceFromGatewayConfig() {
  const configPaths = [
    path.join(HOME, ".openclaw", "config.yaml"),
    path.join(HOME, ".openclaw", "config.json"),
    path.join(HOME, ".config", "openclaw", "config.yaml"),
  ];

  for (const configPath of configPaths) {
    try {
      if (fs.existsSync(configPath)) {
        const content = fs.readFileSync(configPath, "utf8");
        // Simple extraction - look for workspace or workdir
        const match =
          content.match(/workspace[:\s]+["']?([^"'\n]+)/i) ||
          content.match(/workdir[:\s]+["']?([^"'\n]+)/i);
        if (match && match[1]) {
          const workspace = match[1].trim().replace(/^~/, HOME);
          if (fs.existsSync(workspace)) {
            return workspace;
          }
        }
      }
    } catch (e) {
      // Ignore errors, continue searching
    }
  }
  return null;
}

/**
 * Load config file if it exists
 */
function loadConfigFile() {
  const configPaths = [
    path.join(__dirname, "..", "config", "dashboard.json"),
    path.join(__dirname, "..", "config", "dashboard.local.json"),
  ];

  for (const configPath of configPaths) {
    try {
      if (fs.existsSync(configPath)) {
        const content = fs.readFileSync(configPath, "utf8");
        return JSON.parse(content);
      }
    } catch (e) {
      console.warn(`[Config] Failed to load ${configPath}:`, e.message);
    }
  }
  return {};
}

/**
 * Expand ~ and environment variables in paths
 */
function expandPath(p) {
  if (!p) return p;
  return p
    .replace(/^~/, HOME)
    .replace(/\$HOME/g, HOME)
    .replace(/\$\{HOME\}/g, HOME);
}

/**
 * Build final configuration
 */
function loadConfig() {
  const fileConfig = loadConfigFile();
  const workspace =
    process.env.OPENCLAW_WORKSPACE || expandPath(fileConfig.paths?.workspace) || detectWorkspace();

  const config = {
    // Server settings
    server: {
      port: parseInt(process.env.PORT || fileConfig.server?.port || "3333", 10),
      host: process.env.HOST || fileConfig.server?.host || "localhost",
    },

    // Paths - all relative to workspace unless absolute
    paths: {
      workspace: workspace,
      memory:
        expandPath(process.env.OPENCLAW_MEMORY_DIR || fileConfig.paths?.memory) ||
        path.join(workspace, "memory"),
      state:
        expandPath(process.env.OPENCLAW_STATE_DIR || fileConfig.paths?.state) ||
        path.join(workspace, "state"),
      cerebro:
        expandPath(process.env.OPENCLAW_CEREBRO_DIR || fileConfig.paths?.cerebro) ||
        path.join(workspace, "cerebro"),
      skills:
        expandPath(process.env.OPENCLAW_SKILLS_DIR || fileConfig.paths?.skills) ||
        path.join(workspace, "skills"),
      jobs:
        expandPath(process.env.OPENCLAW_JOBS_DIR || fileConfig.paths?.jobs) ||
        path.join(workspace, "jobs"),
      logs:
        expandPath(process.env.OPENCLAW_LOGS_DIR || fileConfig.paths?.logs) ||
        path.join(HOME, ".openclaw-command-center", "logs"),
    },

    // Auth settings
    auth: {
      mode: process.env.DASHBOARD_AUTH_MODE || fileConfig.auth?.mode || "none",
      token: process.env.DASHBOARD_TOKEN || fileConfig.auth?.token,
      allowedUsers: (
        process.env.DASHBOARD_ALLOWED_USERS ||
        fileConfig.auth?.allowedUsers?.join(",") ||
        ""
      )
        .split(",")
        .map((s) => s.trim().toLowerCase())
        .filter(Boolean),
      allowedIPs: (
        process.env.DASHBOARD_ALLOWED_IPS ||
        fileConfig.auth?.allowedIPs?.join(",") ||
        "127.0.0.1,::1"
      )
        .split(",")
        .map((s) => s.trim()),
      publicPaths: fileConfig.auth?.publicPaths || ["/api/health", "/api/whoami", "/favicon.ico"],
    },

    // Branding
    branding: {
      name: fileConfig.branding?.name || "OpenClaw Command Center",
      theme: fileConfig.branding?.theme || "default",
    },

    // Integrations
    integrations: {
      linear: {
        enabled: !!(process.env.LINEAR_API_KEY || fileConfig.integrations?.linear?.apiKey),
        apiKey: process.env.LINEAR_API_KEY || fileConfig.integrations?.linear?.apiKey,
        teamId: process.env.LINEAR_TEAM_ID || fileConfig.integrations?.linear?.teamId,
      },
    },
  };

  return config;
}

// Export singleton config
const CONFIG = loadConfig();

// Log detected configuration on startup
console.log("[Config] Workspace:", CONFIG.paths.workspace);
console.log("[Config] Auth mode:", CONFIG.auth.mode);

module.exports = { CONFIG, loadConfig, detectWorkspace, expandPath };
