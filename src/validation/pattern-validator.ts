/**
 * JSON Schema-based validator for AcidTest pattern files
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createRequire } from 'module';
import type { PatternCategory } from '../types.js';
import type { ValidateFunction } from 'ajv';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const require = createRequire(import.meta.url);

// Load dependencies via require to avoid ESM issues
const Ajv = require('ajv');
const addFormats = require('ajv-formats');

// Load the JSON Schema
const schemaPath = path.join(__dirname, '../schemas/pattern.schema.json');
const schema = JSON.parse(fs.readFileSync(schemaPath, 'utf-8'));

// Initialize AJV with options
const ajv = new Ajv({
  allErrors: true,
  verbose: true,
  strict: true,
  allowUnionTypes: true,
});

// Add format validation
addFormats(ajv);

// Compile the schema
const validate: ValidateFunction = ajv.compile(schema);

/**
 * Validation result for a single pattern file
 */
export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
  file?: string;
  patternCount?: number;
}

/**
 * Detailed validation error
 */
export interface ValidationError {
  message: string;
  path?: string;
  keyword?: string;
  params?: Record<string, unknown>;
}

/**
 * Validate a single pattern file
 * @param filePath Path to the pattern JSON file
 * @returns ValidationResult with validation status and errors
 */
export function validatePattern(filePath: string): ValidationResult {
  try {
    // Read and parse the file
    const fileContent = fs.readFileSync(filePath, 'utf-8');
    let data: unknown;

    try {
      data = JSON.parse(fileContent);
    } catch (parseError) {
      return {
        valid: false,
        errors: [
          {
            message: `JSON Parse Error: ${parseError instanceof Error ? parseError.message : 'Invalid JSON'}`,
            path: filePath,
          },
        ],
        file: filePath,
      };
    }

    // Validate against schema
    const isValid = validate(data);

    if (!isValid && validate.errors) {
      const errors: ValidationError[] = validate.errors.map((error) => ({
        message: formatErrorMessage(error),
        path: error.instancePath || '/',
        keyword: error.keyword,
        params: error.params,
      }));

      return {
        valid: false,
        errors,
        file: filePath,
      };
    }

    // Additional validation: Check for duplicate pattern IDs
    const patternData = data as PatternCategory;
    const seenIds = new Set<string>();
    const duplicateErrors: ValidationError[] = [];

    patternData.patterns.forEach((pattern, index) => {
      if (seenIds.has(pattern.id)) {
        duplicateErrors.push({
          message: `Duplicate pattern ID "${pattern.id}" found at index ${index}`,
          path: `/patterns/${index}/id`,
        });
      }
      seenIds.add(pattern.id);

      // Validate regex patterns can compile
      if (pattern.match.type === 'regex') {
        try {
          new RegExp(pattern.match.value, pattern.match.flags || '');
        } catch (regexError) {
          duplicateErrors.push({
            message: `Invalid regex pattern at /patterns/${index}: ${regexError instanceof Error ? regexError.message : 'Invalid regex'}`,
            path: `/patterns/${index}/match/value`,
          });
        }
      }
    });

    if (duplicateErrors.length > 0) {
      return {
        valid: false,
        errors: duplicateErrors,
        file: filePath,
        patternCount: patternData.patterns.length,
      };
    }

    return {
      valid: true,
      errors: [],
      file: filePath,
      patternCount: patternData.patterns.length,
    };
  } catch (error) {
    return {
      valid: false,
      errors: [
        {
          message: `Unexpected error: ${error instanceof Error ? error.message : 'Unknown error'}`,
          path: filePath,
        },
      ],
      file: filePath,
    };
  }
}

/**
 * Validate all pattern files in a directory
 * @param patternsDir Directory containing pattern JSON files
 * @returns Array of ValidationResult for each file
 */
export function validateAllPatterns(patternsDir: string): ValidationResult[] {
  try {
    const files = fs.readdirSync(patternsDir).filter((f) => f.endsWith('.json'));
    return files.map((file) => validatePattern(path.join(patternsDir, file)));
  } catch (error) {
    return [
      {
        valid: false,
        errors: [
          {
            message: `Failed to read patterns directory: ${error instanceof Error ? error.message : 'Unknown error'}`,
            path: patternsDir,
          },
        ],
      },
    ];
  }
}

/**
 * Format AJV error into human-readable message
 */
function formatErrorMessage(error: {
  keyword: string;
  message?: string;
  instancePath: string;
  params?: Record<string, unknown>;
}): string {
  const path = error.instancePath || '/';

  switch (error.keyword) {
    case 'required':
      return `Missing required field: ${error.params?.missingProperty} at ${path}`;
    case 'enum':
      return `Invalid value at ${path}. Must be one of: ${JSON.stringify(error.params?.allowedValues)}`;
    case 'pattern':
      return `Value at ${path} does not match required pattern: ${error.params?.pattern}`;
    case 'minLength':
      return `Value at ${path} is too short (minimum length: ${error.params?.limit})`;
    case 'minItems':
      return `Array at ${path} has too few items (minimum: ${error.params?.limit})`;
    case 'type':
      return `Invalid type at ${path}. Expected: ${error.params?.type}`;
    case 'additionalProperties':
      return `Unexpected property "${error.params?.additionalProperty}" at ${path}`;
    default:
      return `${error.message || 'Validation error'} at ${path}`;
  }
}
