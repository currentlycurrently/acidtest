/**
 * Configuration file loader
 * Loads and validates .acidtest.json config files
 */

import { readFileSync, existsSync } from 'fs';
import { join } from 'path';
import type { AcidTestConfig } from './types.js';

/**
 * Load AcidTest configuration from directory
 * Looks for .acidtest.json in the skill directory
 */
export function loadConfig(directory: string): AcidTestConfig {
  const configPath = join(directory, '.acidtest.json');

  if (!existsSync(configPath)) {
    return {}; // No config, use defaults
  }

  try {
    const content = readFileSync(configPath, 'utf-8');
    const config = JSON.parse(content) as AcidTestConfig;
    return config;
  } catch (error) {
    console.warn(`Warning: Invalid .acidtest.json: ${(error as Error).message}`);
    return {};
  }
}

/**
 * Get default configuration
 */
export function getDefaultConfig(): AcidTestConfig {
  return {
    ignore: {
      patterns: [],
      categories: [],
      files: []
    },
    thresholds: {
      minScore: 0,
      failOn: []
    },
    output: {
      format: 'detailed',
      showRemediation: false,
      colors: true
    }
  };
}

/**
 * Merge user config with defaults
 */
export function mergeConfig(userConfig: AcidTestConfig): AcidTestConfig {
  const defaults = getDefaultConfig();

  return {
    ignore: {
      patterns: userConfig.ignore?.patterns ?? defaults.ignore!.patterns,
      categories: userConfig.ignore?.categories ?? defaults.ignore!.categories,
      files: userConfig.ignore?.files ?? defaults.ignore!.files
    },
    thresholds: {
      minScore: userConfig.thresholds?.minScore ?? defaults.thresholds!.minScore,
      failOn: userConfig.thresholds?.failOn ?? defaults.thresholds!.failOn
    },
    output: {
      format: userConfig.output?.format ?? defaults.output!.format,
      showRemediation: userConfig.output?.showRemediation ?? defaults.output!.showRemediation,
      colors: userConfig.output?.colors ?? defaults.output!.colors
    }
  };
}
