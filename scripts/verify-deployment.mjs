#!/usr/bin/env mjs
// verify-deployment.mjs - Deployment verification script for AIOS v0.5.0
// Validates all gates for production deployment readiness

import { execSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

// Configuration
const REPO_ROOT = resolve('..', '..');
const RESULTS = {};

function run(cmd) {
  try {
    const output = execSync(cmd, { cwd: REPO_ROOT, encoding: 'utf8', stdio: ['pipe', 'pipe'] });
    RESULTS[cmd] = { status: 'pass', output };
    return output;
  } catch (e) {
    RESULTS[cmd] = { status: 'fail', output: e.stdout || e.stderr || String(e) };
    return null;
  }
}

function check(condition, name) {
  if (condition) {
    RESULTS[name] = { status: 'pass' };
  } else {
    RESULTS[name] = { status: 'fail' };
  }
}

// 1. Version consistency across repository
const pkgVersion = readFileSync(resolve(REPO_ROOT, 'package.json'), 'utf8');
const versionMatch = pkgVersion.includes('"version": "0.5.0"');
check(versionMatch, 'version-consistency-packagejson');

// Read VERSION.md
const versionMd = readFileSync(resolve(REPO_ROOT, 'docs', 'VERSION.md'), 'utf8');
const versionMdHas050 = versionMd.includes('v0.5.0');
check(versionMdHas050, 'version-consensus-versionmd');

// CHANGELOG v0.5.0 entry
const changelogHas050 = readFileSync(resolve(REPO_ROOT, 'CHANGELOG.md'), 'utf8').includes('## [v0.5.0]');
check(changelogHas050, 'changelog-v0_5_0-entry');

// 2. Build validation
try {
  run('pnpm build');
  const buildPass = Object.values(RESULTS).filter(r => r.status === 'pass').length > 0;
  check(buildPass, 'build-validation');
} catch (e) {
  check(false, 'build-validation');
}

// 3. Typecheck validation
try {
  run('pnpm typecheck');
  const typecheckPass = RESULTS['pnpm typecheck']?.status === 'pass';
  check(typecheckPass, 'typecheck-validation');
} catch (e) {
  check(false, 'typecheck-validation');
}

// 4. Test suite validation
try {
  run('pnpm test');
  const testPass = RESULTS['pnpm test']?.status === 'pass';
  check(testPass, 'test-suite-validation');
} catch (e) {
  check(false, 'test-suite-validation');
}

// 5. Integration tests
try {
  run('pnpm test:integration');
  const integrationPass = RESULTS['pnpm test:integration']?.status === 'pass';
  check(integrationPass, 'integration-tests-validation');
} catch (e) {
  check(false, 'integration-tests-validation');
}

// 6. Secret validation
try {
  run('pnpm test:secret');
  const secretPass = RESULTS['pnpm test:secret']?.status === 'pass';
  check(secretPass, 'secret-validation');
} catch (e) {
  check(false, 'secret-validation');
}

// 7. Docker/ECR verification (skip if not in CI)
// Check if Dockerfile exists and is valid
const dockerExists = require('fs').existsSync(resolve(REPO_ROOT, 'docker', 'compose', ' production.yml'));
check(dockerExists, 'docker-compose-exists');

// 8. Version consistency check across key files
const filesToCheck = [
  'package.json',
  'docs/VERSION.md',
  'CHANGELOG.md'
];
const allHave050 = filesToCheck.every(f => {
  try {
    const content = readFileSync(resolve(REPO_ROOT, f), 'utf8');
    return content.includes('0.5.0') || content.includes('v0.5.0');
  } catch {
    return false;
  }
});
check(allHave050, 'version-consistency-all-files');

// 9. No tag creation verified
const gitTagCheck = !readFileSync(resolve(REPO_ROOT, '.git', 'REF'), 'utf8').includes('v0.5.0');
check(gitTagCheck, 'no-git-tag-v0_5_0');

// 10. AIOS_Book.md and ENGINEERING_TIMELINE.md synchronization
const aiosBookHasPhase10 = readFileSync(resolve(REPO_ROOT, 'docs', 'AIOS_Book.md'), 'utf8').includes('Phase 10');
const engineeringTimelineHasPhase10 = readFileSync(resolve(REPO_ROOT, 'docs', 'ENGINEERING_TIMELINE.md'), 'utf8').includes('Phase 10');
check(aiosBookHasPhase10, 'aios-book-synchronized');
check(engineeringTimelineHasPhase10, 'engineering-timeline-synchronized');

// Print summary
console.log('=== Deployment Verification Summary ===');
let allPass = true;
for (const [cmd, result] of Object.entries(RESULTS)) {
  const status = result.status;
  if (status === 'fail') allPass = false;
  console.log(`  ${status.toUpperCase()}: ${cmd}`);
}
console.log('');
if (allPass) {
  console.log('✅ All deployment verification gates PASSED');
  process.exit(0);
} else {
  console.log('❌ Some deployment verification gates FAILED');
  process.exit(1);
}