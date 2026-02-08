# AcidTest Test Corpus

## Purpose

This test corpus provides a systematic way to validate AcidTest's detection accuracy across different vulnerability patterns and legitimate code examples. It serves as:

1. **Benchmark Dataset**: Comprehensive examples of both vulnerable and safe code
2. **Regression Testing**: Ensures detection accuracy remains consistent across changes
3. **Documentation**: Real-world examples of what should and shouldn't be flagged
4. **Quality Assurance**: Validates that legitimate code patterns don't trigger false positives

## Directory Structure

```
test-corpus/
├── README.md                    # This file
├── vulnerable/                  # Code that SHOULD be flagged (FAIL/DANGER)
│   ├── python/                 # Vulnerable Python examples
│   │   ├── 001-exec-injection.py
│   │   ├── 002-subprocess-shell.py
│   │   ├── 003-eval-injection.py
│   │   ├── 004-pickle-deserialize.py
│   │   └── 005-env-exfiltration.py
│   └── typescript/             # Vulnerable TypeScript examples
│       ├── 001-exec-injection.ts
│       ├── 002-eval-injection.ts
│       ├── 003-env-exfiltration.ts
│       ├── 004-dynamic-require.ts
│       └── 005-function-constructor.ts
└── legitimate/                 # Code that should NOT be flagged (PASS/WARN acceptable)
    ├── python/                # Legitimate Python examples
    │   ├── 001-api-client.py
    │   └── 002-file-processor.py
    └── typescript/            # Legitimate TypeScript examples
        ├── 001-api-client.ts
        └── 002-data-processor.ts
```

## Expected Scan Results

### Vulnerable Examples (SHOULD be flagged)
- **Expected Results**: `FAIL` or `DANGER`
- **Purpose**: Verify that AcidTest correctly identifies security vulnerabilities
- **Current State**: TypeScript/JavaScript detection is comprehensive; Python detection is limited
- **Note**: Some Python vulnerable examples may return `PASS` or `WARN` due to current detection limitations. These are known gaps that can be addressed with additional Python-specific patterns.

### Legitimate Examples (should NOT be flagged as dangerous)
- **Expected Results**: `PASS` or `WARN` (both acceptable)
- **Purpose**: Verify that AcidTest doesn't create excessive false positives
- **Failure Condition**: If any legitimate example returns `FAIL` or `DANGER`, this indicates a false positive

## Known Detection Gaps & Limitations

The corpus validation reveals several detection gaps and technical limitations:

### 1. Python-specific Vulnerabilities
Currently limited Python AST analysis:
- `exec()` and `eval()` calls not detected
- `subprocess` with `shell=True` not flagged
- `pickle.loads()` deserialization not detected
- These gaps can be filled by adding Python-specific patterns

### 2. Validation Script Limitations
The validation script wraps individual code files in temporary SKILL.md structures for scanning. This approach has some technical challenges:
- File glob patterns may not reliably find wrapped code files
- Scanner primarily designed for complete skill directories
- Some vulnerable examples may not trigger detection due to wrapping artifacts

### 3. Context-dependent Patterns
Some vulnerabilities require code context:
- Dynamic require/import detection may vary
- Exfiltration patterns depend on domain analysis
- Minimal examples may lack context to trigger certain patterns

### Future Improvements
- Convert corpus to complete skill directories instead of individual files
- Add Python-specific detection patterns
- Enhance validation script to better simulate real skill structures
- Add more comprehensive examples for each vulnerability type

**The corpus is valuable precisely because it reveals these gaps and provides test cases for improvements.**

## How to Run Validation

### Quick Validation
```bash
npm run test:corpus
```

This will scan all corpus files and report:
- Which vulnerable examples were correctly detected
- Which legitimate examples passed without critical issues
- Any mismatches that need attention

**Note**: The validation script currently has technical limitations (see section below). It may report failures due to wrapping artifacts, not actual detection gaps. The corpus files themselves are valid examples and can be manually tested or used as references.

### Manual Testing
```bash
# Scan a specific file
npm run scan test-corpus/vulnerable/python/001-exec-injection.py

# Scan all vulnerable examples
npm run scan test-corpus/vulnerable/

# Scan all legitimate examples
npm run scan test-corpus/legitimate/
```

## How to Add New Examples

### Adding a Vulnerable Example

1. **Choose the appropriate directory**:
   - `test-corpus/vulnerable/python/` for Python
   - `test-corpus/vulnerable/typescript/` for TypeScript

2. **Follow the naming convention**:
   - `NNN-descriptive-name.ext` (e.g., `006-sql-injection.py`)
   - Use sequential numbering

3. **Include required header comments**:
   ```python
   # Brief description of the vulnerability
   # Expected: DANGER or FAIL
   # Description: Detailed explanation of why this is dangerous
   ```

4. **Keep examples simple and focused**:
   - One vulnerability per file
   - Minimal code to demonstrate the issue
   - Clear and unambiguous vulnerability

5. **Test your example**:
   ```bash
   npm run scan test-corpus/vulnerable/python/NNN-your-example.py
   ```
   - Verify it returns `FAIL` or `DANGER`

### Adding a Legitimate Example

1. **Choose the appropriate directory**:
   - `test-corpus/legitimate/python/` for Python
   - `test-corpus/legitimate/typescript/` for TypeScript

2. **Follow the naming convention**:
   - `NNN-descriptive-name.ext` (e.g., `003-database-query.py`)
   - Use sequential numbering

3. **Include required header comments**:
   ```python
   # Brief description - should PASS
   # Expected: PASS or WARN (acceptable)
   # Description: Explanation of the safe pattern
   ```

4. **Keep examples realistic**:
   - Use patterns common in real applications
   - Demonstrate safe alternatives to vulnerable patterns
   - Show proper security practices

5. **Test your example**:
   ```bash
   npm run scan test-corpus/legitimate/python/NNN-your-example.py
   ```
   - Verify it returns `PASS` or `WARN` (not `FAIL` or `DANGER`)

### Template for New Vulnerable Example

```python
# [Brief description of vulnerability]
# Expected: DANGER or FAIL
# Description: [Detailed explanation]

# Your vulnerable code here
```

### Template for New Legitimate Example

```python
# [Brief description] - should PASS
# Expected: PASS or WARN (acceptable)
# Description: [Explanation of safe pattern]

# Your safe code here
```

## Validation Script Output

The validation script (`npm run test:corpus`) provides:

1. **Summary Statistics**:
   - Total files scanned
   - Vulnerable examples correctly detected
   - Legitimate examples that passed
   - Any mismatches found

2. **Detailed Results**:
   - Per-file scan results
   - Risk level assigned by AcidTest
   - Pass/Fail determination

3. **Mismatch Report**:
   - Vulnerable files that weren't flagged (FALSE NEGATIVES)
   - Legitimate files that were flagged as dangerous (FALSE POSITIVES)

## Maintaining the Corpus

### When to Add Examples

- **New vulnerability patterns discovered**: Add to `vulnerable/`
- **False positives reported**: Add to `legitimate/`
- **New language support**: Create new language directories
- **Edge cases identified**: Add examples covering edge cases

### Quality Guidelines

1. **Simplicity**: Each example should be minimal and focused
2. **Clarity**: Comments should clearly explain the security issue
3. **Realism**: Examples should reflect real-world AI agent code patterns
4. **Testability**: Each example should have clear pass/fail criteria

### Regression Testing

Before releasing new versions of AcidTest:
1. Run `npm run test:corpus` to validate all examples
2. Ensure no regressions (previously detected issues still detected)
3. Verify no new false positives (legitimate code still passes)
4. Update this README if new patterns are added

## Integration with Test Suite

The test corpus complements the existing test suite (`test-fixtures/`):
- **test-fixtures/**: Unit and integration tests for specific scanner features
- **test-corpus/**: End-to-end validation of detection accuracy

Both should pass:
```bash
npm test              # Run all unit/integration tests
npm run test:corpus   # Run corpus validation
```

## Contributing

When contributing new examples:
1. Follow the structure and naming conventions above
2. Include clear header comments
3. Test your examples before submitting
4. Update this README if adding new categories
5. Ensure all existing tests still pass

## Questions?

For questions about the test corpus:
- Review existing examples for patterns
- Check the main README for AcidTest documentation
- Open an issue for clarification on expected behavior
