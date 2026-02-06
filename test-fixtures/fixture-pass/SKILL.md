---
name: clean-formatter
description: Formats text strings with basic transformations
version: 1.0.0
env: []
bins: []
allowed-tools: []
---

# Clean Formatter

This skill provides basic text formatting utilities for the agent.

## Usage

The agent can use this skill to:
- Convert text to uppercase or lowercase
- Trim whitespace from strings
- Replace simple patterns in text

## Implementation

The handler uses only basic string methods. No external APIs or file system access.

## Example

```
Input: "  hello world  "
Output: "HELLO WORLD"
```

This is a minimal, safe skill with no risky operations.
