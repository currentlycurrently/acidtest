/**
 * Main scanner orchestrator
 * Coordinates all four scanning layers
 */

import { readFileSync, existsSync, statSync } from "fs";
import { join, basename, extname, dirname } from "path";
import { glob } from "glob";
import matter from "gray-matter";
import type { Skill, CodeFile, ScanResult, Finding } from "./types.js";
import { scanPermissions } from "./layers/permissions.js";
import { scanInjection } from "./layers/injection.js";
import { scanCode } from "./layers/code.js";
import { scanCrossReference } from "./layers/crossref.js";
import {
  calculateScore,
  determineStatus,
  generateRecommendation,
} from "./scoring.js";
import { detectMCPManifest, parseMCPManifest } from "./loaders/mcp-loader.js";

const VERSION = "0.5.1";

/**
 * Main scan function
 * Scans a skill directory or SKILL.md file
 */
export async function scanSkill(skillPath: string): Promise<ScanResult> {
  // Load the skill
  const skill = await loadSkill(skillPath);

  // Run all four scanning layers
  const layer1 = await scanPermissions(skill);
  const layer2 = await scanInjection(skill);
  const layer3 = await scanCode(skill);

  // Combine findings from layers 1-3 for cross-reference
  const previousFindings = [
    ...layer1.findings,
    ...layer2.findings,
    ...layer3.findings,
  ];

  const layer4 = await scanCrossReference(skill, previousFindings);

  // Combine all findings
  const allFindings: Finding[] = [
    ...layer1.findings,
    ...layer2.findings,
    ...layer3.findings,
    ...layer4.findings,
  ];

  // Calculate score and status
  const score = calculateScore(allFindings);
  const status = determineStatus(score);
  const recommendation = generateRecommendation(status, allFindings);

  // Build result with normalized permissions
  const result: ScanResult = {
    schemaVersion: "1.0.0",
    tool: "acidtest",
    version: VERSION,
    skill: {
      name: skill.name,
      path: skill.path,
    },
    score,
    status,
    permissions: normalizePermissions(skill.metadata),
    findings: allFindings,
    recommendation,
  };

  return result;
}

/**
 * Load a skill from a directory or SKILL.md file
 * Also supports MCP server manifests (mcp.json, server.json, package.json)
 */
async function loadSkill(skillPath: string): Promise<Skill> {
  let skillDir: string;

  // Determine if path is a directory or file
  if (existsSync(skillPath) && statSync(skillPath).isDirectory()) {
    skillDir = skillPath;
  } else if (
    basename(skillPath) === "SKILL.md" ||
    basename(skillPath).endsWith(".json")
  ) {
    skillDir = dirname(skillPath);
  } else {
    throw new Error(
      "Path must be a skill/MCP directory or SKILL.md/manifest file",
    );
  }

  // Try to load as SKILL.md first (AgentSkills format)
  const skillMdPath = join(skillDir, "SKILL.md");
  if (existsSync(skillMdPath)) {
    return await loadAgentSkill(skillDir, skillMdPath);
  }

  // Try to detect MCP manifest
  const mcpManifestPath = detectMCPManifest(skillDir);
  if (mcpManifestPath) {
    return await loadMCPServer(skillDir, mcpManifestPath);
  }

  throw new Error(
    `No SKILL.md or MCP manifest found in directory: ${skillDir}`,
  );
}

/**
 * Load an AgentSkills format skill (SKILL.md)
 */
async function loadAgentSkill(
  skillDir: string,
  skillMdPath: string,
): Promise<Skill> {
  // Read and parse SKILL.md
  const skillContent = readFileSync(skillMdPath, "utf-8");
  const parsed = matter(skillContent);

  // Extract metadata and markdown
  const metadata = parsed.data;
  const markdownContent = parsed.content;

  // Determine skill name
  const skillName = metadata.name || basename(skillDir) || "unknown-skill";

  // Find all code files (.ts, .js, .mjs, .cjs)
  const codeFiles = await findCodeFiles(skillDir);

  return {
    name: skillName,
    path: skillDir,
    metadata,
    markdownContent,
    codeFiles,
  };
}

/**
 * Load an MCP server manifest
 */
async function loadMCPServer(
  skillDir: string,
  manifestPath: string,
): Promise<Skill> {
  const manifest = parseMCPManifest(manifestPath);

  // Use the manifest content as markdown for scanning
  const markdownContent = JSON.stringify(manifest.rawConfig, null, 2);

  // Determine server name
  const serverName =
    manifest.metadata.name || basename(skillDir) || "unknown-mcp-server";

  // Find all code files
  const codeFiles = await findCodeFiles(skillDir);

  return {
    name: serverName,
    path: skillDir,
    metadata: manifest.metadata,
    markdownContent,
    codeFiles,
  };
}

/**
 * Normalize permissions to always have consistent structure
 */
function normalizePermissions(metadata: any): {
  bins: string[];
  env: string[];
  tools: string[];
} {
  // Handle bins
  let bins: string[] = [];
  if (metadata.bins) {
    bins = Array.isArray(metadata.bins) ? metadata.bins : [metadata.bins];
  }

  // Handle env
  let env: string[] = [];
  if (metadata.env) {
    env = Array.isArray(metadata.env) ? metadata.env : [metadata.env];
  }

  // Handle allowed-tools
  let tools: string[] = [];
  if (metadata["allowed-tools"]) {
    tools = Array.isArray(metadata["allowed-tools"])
      ? metadata["allowed-tools"]
      : [metadata["allowed-tools"]];
  }

  return { bins, env, tools };
}

/**
 * Find all code files in skill directory
 */
async function findCodeFiles(skillDir: string): Promise<CodeFile[]> {
  const codeFiles: CodeFile[] = [];

  // Search for .ts, .js, .mjs, .cjs files
  const patterns = [
    join(skillDir, "**/*.ts"),
    join(skillDir, "**/*.js"),
    join(skillDir, "**/*.mjs"),
    join(skillDir, "**/*.cjs"),
  ];

  for (const pattern of patterns) {
    try {
      const files = await glob(pattern, {
        ignore: [
          "**/node_modules/**",
          "**/dist/**",
          "**/build/**",
          "**/__tests__/**",
          "**/tests/**",
          "**/test/**",
          "**/*.test.{js,ts,mjs,cjs}",
          "**/*.spec.{js,ts,mjs,cjs}",
          "**/fixtures/**",
          "**/examples/**",
          "**/.git/**",
          "**/.cache/**",
          "**/.next/**",
          "**/.nuxt/**",
          "**/.vite*/**",
          "**/coverage/**",
          "**/*.min.js",
          "**/*.min.mjs",
          "**/vendor/**",
        ],
      });

      for (const filePath of files) {
        try {
          const content = readFileSync(filePath, "utf-8");
          const ext = extname(filePath).slice(1); // Remove leading dot

          // Determine extension type
          let extension: "ts" | "js" | "mjs" | "cjs";
          if (ext === "ts") extension = "ts";
          else if (ext === "mjs") extension = "mjs";
          else if (ext === "cjs") extension = "cjs";
          else extension = "js";

          codeFiles.push({
            path: filePath,
            content,
            extension,
          });
        } catch (error) {
          // Skip files that can't be read
          console.warn(`Warning: Could not read file: ${filePath}`);
        }
      }
    } catch (error) {
      // Skip pattern if glob fails
    }
  }

  return codeFiles;
}

/**
 * Scan multiple skills/MCP servers in a directory
 */
export async function scanAllSkills(directory: string): Promise<ScanResult[]> {
  const results: ScanResult[] = [];
  const scanned = new Set<string>(); // Track scanned directories to avoid duplicates

  // Find all SKILL.md files
  const skillPattern = join(directory, "**/SKILL.md");
  const skillFiles = await glob(skillPattern, {
    ignore: ["**/node_modules/**"],
  });

  for (const skillFile of skillFiles) {
    const skillDir = dirname(skillFile);
    if (scanned.has(skillDir)) continue;
    scanned.add(skillDir);

    try {
      const result = await scanSkill(skillFile);
      results.push(result);
    } catch (error) {
      console.warn(
        `Warning: Could not scan skill at ${skillFile}:`,
        (error as Error).message,
      );
    }
  }

  // Find all MCP manifest files
  const mcpPatterns = [
    join(directory, "**/mcp.json"),
    join(directory, "**/server.json"),
  ];

  for (const pattern of mcpPatterns) {
    const manifestFiles = await glob(pattern, {
      ignore: ["**/node_modules/**"],
    });

    for (const manifestFile of manifestFiles) {
      const manifestDir = dirname(manifestFile);
      if (scanned.has(manifestDir)) continue;
      scanned.add(manifestDir);

      try {
        const result = await scanSkill(manifestFile);
        results.push(result);
      } catch (error) {
        console.warn(
          `Warning: Could not scan MCP server at ${manifestFile}:`,
          (error as Error).message,
        );
      }
    }
  }

  return results;
}
