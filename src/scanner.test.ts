/**
 * Tests for main scanner
 */

import { describe, it, expect } from "vitest";
import { scanSkill } from "./scanner.js";
import { join } from "path";
import { fileURLToPath } from "url";
import { dirname } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const fixturesDir = join(__dirname, "..", "test-fixtures");

describe("scanSkill", () => {
  it("should scan PASS fixture and return PASS status", async () => {
    const result = await scanSkill(join(fixturesDir, "fixture-pass"));

    expect(result.status).toBe("PASS");
    expect(result.score).toBeGreaterThanOrEqual(80);
    expect(result.schemaVersion).toBe("1.0.0");
    expect(result.tool).toBe("acidtest");
  });

  it("should scan WARN fixture and return WARN status", async () => {
    const result = await scanSkill(join(fixturesDir, "fixture-warn"));

    expect(result.status).toBe("WARN");
    expect(result.score).toBeGreaterThanOrEqual(50);
    expect(result.score).toBeLessThan(80);
  });

  it("should scan FAIL fixture and return FAIL status", async () => {
    const result = await scanSkill(join(fixturesDir, "fixture-fail"));

    expect(result.status).toBe("FAIL");
    expect(result.score).toBeGreaterThanOrEqual(20);
    expect(result.score).toBeLessThan(50);
  });

  it("should scan DANGER fixture and return DANGER status", async () => {
    const result = await scanSkill(join(fixturesDir, "fixture-danger"));

    expect(result.status).toBe("DANGER");
    expect(result.score).toBeLessThan(20);
  });

  it("should include skill metadata in result", async () => {
    const result = await scanSkill(join(fixturesDir, "fixture-pass"));

    expect(result.skill).toBeDefined();
    expect(result.skill.name).toBeDefined();
    expect(result.skill.path).toBeDefined();
  });

  it("should include findings array", async () => {
    const result = await scanSkill(join(fixturesDir, "fixture-danger"));

    expect(Array.isArray(result.findings)).toBe(true);
    expect(result.findings.length).toBeGreaterThan(0);
  });

  it("should include recommendation", async () => {
    const result = await scanSkill(join(fixturesDir, "fixture-pass"));

    expect(result.recommendation).toBeDefined();
    expect(typeof result.recommendation).toBe("string");
  });

  it("should normalize permissions", async () => {
    const result = await scanSkill(join(fixturesDir, "fixture-pass"));

    expect(result.permissions).toBeDefined();
    expect(Array.isArray(result.permissions.bins)).toBe(true);
    expect(Array.isArray(result.permissions.env)).toBe(true);
    expect(Array.isArray(result.permissions.tools)).toBe(true);
  });

  it("should throw error for non-existent directory", async () => {
    await expect(
      scanSkill(join(fixturesDir, "non-existent"))
    ).rejects.toThrow();
  });

  it("should scan MCP server manifest", async () => {
    const result = await scanSkill(join(fixturesDir, "fixture-mcp-pass"));

    expect(result.status).toBe("PASS");
    expect(result.skill.name).toBeDefined();
  });

  it("should scan entropy fixture and filter legitimate high-entropy strings", async () => {
    const result = await scanSkill(join(fixturesDir, "fixture-entropy"));

    // Should not flag JWTs, UUIDs, hashes as obfuscation
    const obfuscationFindings = result.findings.filter((f) =>
      f.category.includes("obfuscation")
    );

    // The fixture has legitimate JWT/UUID/hash - should not be flagged
    // But it also has a suspicious base64 string - should be flagged
    expect(obfuscationFindings.length).toBeGreaterThan(0);
  });
});
