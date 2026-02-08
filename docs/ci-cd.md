# CI/CD Integration Guide

Integrate AcidTest into your continuous integration and deployment pipelines to automatically scan AI agent skills and MCP servers for security vulnerabilities.

## GitHub Actions

### Quick Start

Add this workflow to `.github/workflows/acidtest.yml`:

```yaml
name: Security Scan

on: [push, pull_request]

jobs:
  scan:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: npx acidtest@latest scan .
```

### Advanced: PR Comments

Automatically comment on pull requests with scan results:

```yaml
name: AcidTest Security Scan

on:
  pull_request:
    paths:
      - '**.ts'
      - '**.js'
      - 'SKILL.md'
      - 'mcp.json'

jobs:
  scan:
    runs-on: ubuntu-latest
    permissions:
      contents: read
      pull-requests: write  # Required for commenting

    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'

      - name: Run AcidTest
        id: scan
        run: |
          npx acidtest@latest scan . --json > results.json || true
          echo "results<<EOF" >> $GITHUB_OUTPUT
          cat results.json >> $GITHUB_OUTPUT
          echo "EOF" >> $GITHUB_OUTPUT

      - name: Comment on PR
        uses: actions/github-script@v7
        with:
          script: |
            const results = JSON.parse(`${{ steps.scan.outputs.results }}`);
            const score = results.score || 0;
            const status = results.status || 'ERROR';

            let comment = `## AcidTest Security Scan\n\n`;
            comment += `**Score:** ${score}/100\n`;
            comment += `**Status:** ${status}\n`;

            await github.rest.issues.createComment({
              issue_number: context.issue.number,
              owner: context.repo.owner,
              repo: context.repo.repo,
              body: comment
            });
```

See [`.github/workflows/acidtest-pr-comment.yml`](../.github/workflows/acidtest-pr-comment.yml) for a full example.

### Custom Thresholds

Fail builds based on severity:

```yaml
- name: Run AcidTest
  run: |
    npx acidtest@latest scan . --json > results.json

    STATUS=$(jq -r '.status' results.json)
    if [ "$STATUS" = "FAIL" ] || [ "$STATUS" = "DANGER" ]; then
      echo "Security scan failed"
      exit 1
    fi
```

### Scan Multiple Skills

```yaml
- name: Scan all skills
  run: npx acidtest@latest scan-all ./skills --json
```

## GitLab CI

Add to `.gitlab-ci.yml`:

```yaml
acidtest:
  image: node:20
  stage: test
  script:
    - npx acidtest@latest scan .
  rules:
    - if: '$CI_PIPELINE_SOURCE == "merge_request_event"'
    - if: '$CI_COMMIT_BRANCH == "main"'
```

### With Artifacts

```yaml
acidtest:
  image: node:20
  stage: test
  script:
    - npx acidtest@latest scan . --json > acidtest-results.json
  artifacts:
    reports:
      junit: acidtest-results.json
    paths:
      - acidtest-results.json
    expire_in: 1 week
```

### MR Comments

```yaml
acidtest:
  image: node:20
  stage: test
  script:
    - npx acidtest@latest scan . --json > results.json
    - |
      SCORE=$(jq -r '.score' results.json)
      STATUS=$(jq -r '.status' results.json)

      curl --request POST --header "PRIVATE-TOKEN: $CI_JOB_TOKEN" \
        --data "body=**AcidTest:** $SCORE/100 ($STATUS)" \
        "$CI_API_V4_URL/projects/$CI_PROJECT_ID/merge_requests/$CI_MERGE_REQUEST_IID/notes"
  only:
    - merge_requests
```

## CircleCI

Add to `.circleci/config.yml`:

```yaml
version: 2.1

jobs:
  acidtest:
    docker:
      - image: cimg/node:20.0
    steps:
      - checkout
      - run:
          name: Security Scan
          command: npx acidtest@latest scan .

workflows:
  main:
    jobs:
      - acidtest:
          filters:
            branches:
              only:
                - main
                - /feature.*/
```

### Store Artifacts

```yaml
- run:
    name: Security Scan
    command: npx acidtest@latest scan . --json | tee results.json
- store_artifacts:
    path: results.json
```

## Travis CI

Add to `.travis.yml`:

```yaml
language: node_js
node_js:
  - "20"

script:
  - npx acidtest@latest scan .
```

### With Conditional Failure

```yaml
script:
  - npx acidtest@latest scan . --json > results.json
  - |
    STATUS=$(jq -r '.status' results.json)
    if [ "$STATUS" = "DANGER" ]; then
      echo "Critical security issues found"
      exit 1
    fi
```

## Jenkins

Create a `Jenkinsfile`:

```groovy
pipeline {
    agent {
        docker {
            image 'node:20'
        }
    }

    stages {
        stage('Security Scan') {
            steps {
                sh 'npx acidtest@latest scan .'
            }
        }
    }
}
```

### With JSON Output

```groovy
stage('Security Scan') {
    steps {
        sh 'npx acidtest@latest scan . --json > results.json'
        archiveArtifacts artifacts: 'results.json'

        script {
            def results = readJSON file: 'results.json'
            if (results.status == 'FAIL' || results.status == 'DANGER') {
                error('Security scan failed')
            }
        }
    }
}
```

## Pre-Commit Hook

Run AcidTest before every commit:

```bash
# Download and install hook
curl -o .git/hooks/pre-commit https://raw.githubusercontent.com/currentlycurrently/acidtest/main/hooks/pre-commit
chmod +x .git/hooks/pre-commit
```

Or create `.git/hooks/pre-commit`:

```bash
#!/bin/sh

echo "Running AcidTest security scan..."
npx acidtest@latest scan . --json > /tmp/acidtest-results.json

STATUS=$(jq -r '.status' /tmp/acidtest-results.json)

if [ "$STATUS" = "FAIL" ] || [ "$STATUS" = "DANGER" ]; then
    echo "❌ Security scan failed"
    echo "Run 'npx acidtest scan . --fix' for remediation"
    exit 1
fi

echo "✅ Security scan passed"
exit 0
```

## Configuration File

Create `.acidtest.json` in your repository root:

```json
{
  "ignore": {
    "patterns": ["ob-001"],
    "categories": ["obfuscation"],
    "files": ["vendor/**", "*.min.js"]
  },
  "thresholds": {
    "minScore": 80,
    "failOn": ["CRITICAL", "HIGH"]
  },
  "output": {
    "format": "detailed",
    "showRemediation": true
  }
}
```

## Best Practices

### 1. Scan on Every PR

Always run AcidTest on pull requests before merging:

```yaml
on:
  pull_request:
    branches: [main]
```

### 2. Block Dangerous Changes

Fail builds for DANGER and FAIL status:

```bash
if [ "$STATUS" = "FAIL" ] || [ "$STATUS" = "DANGER" ]; then
  exit 1
fi
```

### 3. Cache Results

For faster builds, cache scan results:

```yaml
# GitHub Actions
- uses: actions/cache@v3
  with:
    path: ~/.npm
    key: ${{ runner.os }}-node-${{ hashFiles('**/package-lock.json') }}
```

### 4. Run on Schedule

Scan periodically for new vulnerabilities:

```yaml
on:
  schedule:
    - cron: '0 0 * * 0'  # Weekly on Sunday
```

### 5. Store Artifacts

Save scan results for audit trails:

```yaml
- uses: actions/upload-artifact@v3
  with:
    name: acidtest-results
    path: results.json
```

## Troubleshooting

### "Command not found: acidtest"

Use `npx` to run without installing:
```bash
npx acidtest@latest scan .
```

### "Node version too old"

AcidTest requires Node.js 20+:
```yaml
- uses: actions/setup-node@v4
  with:
    node-version: '20'
```

### "Permission denied" (hooks)

Make hook executable:
```bash
chmod +x .git/hooks/pre-commit
```

### "Scan times out"

Increase timeout for large repositories:
```yaml
- run: npx acidtest@latest scan .
  timeout-minutes: 10
```

## Examples

See working examples in:
- [`.github/workflows/`](../.github/workflows/) - GitHub Actions
- [`template-repo/`](../template-repo/) - Complete starter template
- [`test-fixtures/`](../test-fixtures/) - Test cases

## Support

- [GitHub Issues](https://github.com/currentlycurrently/acidtest/issues)
- [Documentation](../README.md)
- [Methodology](../METHODOLOGY.md)

---

**Last Updated:** 2026-02-08
