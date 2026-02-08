/**
 * Tests for TypeScript and Python parsers
 */

import { describe, it, expect } from 'vitest';
import { TypeScriptParser } from './typescript-parser.js';
import { PythonParser } from './python-parser.js';

describe('TypeScript Parser', () => {
  it('should parse TypeScript file', () => {
    const parser = new TypeScriptParser();
    const code = `
      import { foo } from 'bar';

      function greet(name: string): string {
        return 'Hello ' + name;
      }
    `;

    expect(parser.canParse('test.ts')).toBe(true);
    const result = parser.parse('test.ts', code);

    expect(result.filePath).toBe('test.ts');
    expect(result.ast).toBeDefined();
    expect(result.functions.length).toBeGreaterThan(0);
  });

  it('should extract imports correctly from TypeScript', () => {
    const parser = new TypeScriptParser();
    const code = `
      import { foo, bar } from 'module-name';
      import defaultExport from 'another-module';
      const lib = require('some-lib');
    `;

    const result = parser.parse('test.ts', code);

    expect(result.imports.length).toBe(3);

    // Check named imports
    const namedImport = result.imports.find(imp => imp.module === 'module-name');
    expect(namedImport).toBeDefined();
    expect(namedImport?.names).toContain('foo');
    expect(namedImport?.names).toContain('bar');

    // Check default import
    const defaultImport = result.imports.find(imp => imp.module === 'another-module');
    expect(defaultImport).toBeDefined();
    expect(defaultImport?.names).toContain('defaultExport');

    // Check require
    const requireImport = result.imports.find(imp => imp.module === 'some-lib');
    expect(requireImport).toBeDefined();
  });
});

describe('Python Parser', () => {
  it('should parse Python file', () => {
    const parser = new PythonParser();
    const code = `
import os
import sys

def greet(name):
    return f"Hello {name}"
`;

    expect(parser.canParse('test.py')).toBe(true);
    const result = parser.parse('test.py', code);

    expect(result.filePath).toBe('test.py');
    expect(result.ast).toBeDefined();
  });

  it('should extract imports correctly from Python', () => {
    const parser = new PythonParser();
    const code = `
import os
import sys
from pathlib import Path
from typing import List, Dict
`;

    const result = parser.parse('test.py', code);

    expect(result.imports.length).toBeGreaterThan(0);

    // Check simple imports
    const osImport = result.imports.find(imp => imp.module === 'os');
    expect(osImport).toBeDefined();

    const sysImport = result.imports.find(imp => imp.module === 'sys');
    expect(sysImport).toBeDefined();

    // Check from imports
    const pathlibImport = result.imports.find(imp => imp.module === 'pathlib');
    expect(pathlibImport).toBeDefined();
  });

  it('should extract function definitions correctly from Python', () => {
    const parser = new PythonParser();
    const code = `
def greet(name):
    return f"Hello {name}"

def add(a, b):
    return a + b

def process_data(data, verbose=False):
    if verbose:
        print(data)
    return data
`;

    const result = parser.parse('test.py', code);

    expect(result.functions.length).toBe(3);

    // Check greet function
    const greet = result.functions.find(fn => fn.name === 'greet');
    expect(greet).toBeDefined();
    expect(greet?.params).toContain('name');

    // Check add function
    const add = result.functions.find(fn => fn.name === 'add');
    expect(add).toBeDefined();
    expect(add?.params).toContain('a');
    expect(add?.params).toContain('b');

    // Check process_data function
    const processData = result.functions.find(fn => fn.name === 'process_data');
    expect(processData).toBeDefined();
    expect(processData?.params).toContain('data');
  });
});
