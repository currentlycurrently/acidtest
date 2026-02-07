/**
 * Tests for config loading
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdirSync, writeFileSync, rmSync } from 'fs';
import { join } from 'path';
import { loadConfig, mergeConfig, getDefaultConfig } from './config.js';
import type { Severity } from './types.js';

describe('Config Loading', () => {
  const testDir = join(process.cwd(), 'test-config-temp');

  beforeEach(() => {
    mkdirSync(testDir, { recursive: true });
  });

  afterEach(() => {
    rmSync(testDir, { recursive: true, force: true });
  });

  it('should return empty config when .acidtest.json does not exist', () => {
    const config = loadConfig(testDir);
    expect(config).toEqual({});
  });

  it('should load valid .acidtest.json config', () => {
    const configData = {
      ignore: {
        patterns: ['di-001', 'di-002'],
        categories: ['obfuscation']
      },
      thresholds: {
        minScore: 80,
        failOn: ['CRITICAL', 'HIGH'] as Severity[]
      }
    };

    writeFileSync(
      join(testDir, '.acidtest.json'),
      JSON.stringify(configData, null, 2)
    );

    const config = loadConfig(testDir);
    expect(config).toEqual(configData);
  });

  it('should return empty config on invalid JSON', () => {
    writeFileSync(
      join(testDir, '.acidtest.json'),
      'invalid json {'
    );

    const config = loadConfig(testDir);
    expect(config).toEqual({});
  });

  it('should merge user config with defaults', () => {
    const userConfig = {
      ignore: {
        patterns: ['di-001']
      },
      thresholds: {
        minScore: 90
      }
    };

    const merged = mergeConfig(userConfig);
    const defaults = getDefaultConfig();

    expect(merged.ignore?.patterns).toEqual(['di-001']);
    expect(merged.ignore?.categories).toEqual(defaults.ignore!.categories);
    expect(merged.thresholds?.minScore).toBe(90);
    expect(merged.thresholds?.failOn).toEqual(defaults.thresholds!.failOn);
    expect(merged.output?.format).toBe(defaults.output!.format);
  });

  it('should handle partial config', () => {
    const userConfig = {
      thresholds: {
        failOn: ['CRITICAL' as Severity]
      }
    };

    const merged = mergeConfig(userConfig);
    const defaults = getDefaultConfig();

    expect(merged.ignore?.patterns).toEqual(defaults.ignore!.patterns);
    expect(merged.thresholds?.failOn).toEqual(['CRITICAL']);
  });
});
