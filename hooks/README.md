# AcidTest Git Hooks

Pre-commit hooks to automatically scan your skills/MCP servers for security issues before committing.

## Pre-Commit Hook

Runs AcidTest before each commit to catch security issues early.

### Installation

**Option 1: Copy directly**
```bash
cp hooks/pre-commit .git/hooks/pre-commit
chmod +x .git/hooks/pre-commit
```

**Option 2: Download from GitHub**
```bash
curl -o .git/hooks/pre-commit https://raw.githubusercontent.com/currentlycurrently/acidtest/main/hooks/pre-commit
chmod +x .git/hooks/pre-commit
```

**Option 3: Symlink (for development)**
```bash
ln -s ../../hooks/pre-commit .git/hooks/pre-commit
```

### Behavior

The pre-commit hook will:
- ✅ Run AcidTest scan on your code
- ✅ Display score and status
- ✅ Show CRITICAL and HIGH severity findings
- ❌ **Block commits** on DANGER status
- ⚠️  **Warn** on FAIL status (doesn't block by default)
- ✅ **Pass** on WARN and PASS status

### Configuration

To make the hook **block on FAIL status**, edit `.git/hooks/pre-commit` and uncomment this line:

```bash
# exit 1  # <- Remove the # to block on FAIL
```

### Bypassing the Hook

If you need to bypass the pre-commit check (not recommended):

```bash
git commit --no-verify
```

### Uninstalling

```bash
rm .git/hooks/pre-commit
```

## Example Output

### Clean commit (PASS)
```
🛡️  Running AcidTest security scan...

Score:  100/100
Status: PASS

✅ Security scan passed
```

### Blocked commit (DANGER)
```
🛡️  Running AcidTest security scan...

Score:  0/100
Status: DANGER

Findings:
  [CRITICAL] eval() usage detected: Found 2 eval() call(s)
  [CRITICAL] instruction-override: Attempts to override agent instructions

❌ Commit blocked: DANGER status detected
   Fix critical security issues before committing

   To bypass this check (NOT recommended):
   git commit --no-verify
```

## Troubleshooting

**Hook doesn't run:**
- Ensure it's executable: `chmod +x .git/hooks/pre-commit`
- Verify it's in the right location: `.git/hooks/pre-commit`

**"acidtest not found" error:**
- The hook will automatically use `npx` if acidtest isn't globally installed
- Or install globally: `npm install -g acidtest`

**"jq: command not found" error:**
- Install jq:
  - macOS: `brew install jq`
  - Ubuntu: `sudo apt install jq`
  - Or the hook will skip JSON parsing (still runs scan)
