# Rollback Procedure - AIOS v0.5.0

## Overview

This document defines the rollback procedure for AIOS v0.5.0 in the event of a failed deployment or critical production issue. Rollback is triggered when validation gates fail or when a deployed version exhibits irreversible corruption.

## Prerequisites

- Access to the deployment environment (Kubernetes cluster or Docker host)
- Previous version Docker images available in ECR or fallback registry
- Vault data directory intact and accessible (T-Bit storage root)
- Read access to git history for the previous validated commit
- `pnpm` and `docker` CLI tools available

## Rollback Triggers

| Trigger | Description |
|---------|-------------|
| **Build failure** | `pnpm run build` fails for any workspace package |
| **Typecheck failure** | `pnpm run typecheck` reports errors |
| **Test suite failure** | `pnpm test` or `pnpm test:integration` reports failures |
| **Secret validation failure** | `pnpm test:secret` reports secret bootstrap errors |
| **Runtime anomaly** | API returns unexpected status codes or vault integration fails |
| **Manual approval** | Engineering leadership approves rollback for non-technical reasons |

## Rollback Steps

### Step 1: Identify the Previous Validated Commit

```bash
# Check git log for the last successful deployment
git log --oneline --all | head -20

# Or check the VERSION.md for the last accepted baseline
cat docs/VERSION.md
```

### Step 2: Stop Current Deployment

```bash
# Stop running containers/composites
docker compose -f docker-compose.prod.yml down

# Or for Kubernetes:
kubectl rollout pause deployment/aos-web
kubectl rollout pause deployment/aos-api
```

### Step 3: Pull Previous Version Images

```bash
# Pull the previous validated version
docker pull <ECR-repo>/aios-api:v0.3.0
docker pull <ECR-repo>/aios-web:v0.3.0
```

### Step 4: Restore Vault Configuration (if needed)

```bash
# Verify vault data integrity
ls -la /path/to/tbit/storage/root/

# Restore from backup if corruption suspected
cp -a /backup/vault/root /path/to/tbit/storage/root/
```

### Step 5: Deploy Previous Version

```bash
# Deploy using docker compose
docker compose -f docker-compose.prod.yml up -d

# Or for Kubernetes:
kubectl apply -f k8s/api-deployment.yaml
kubectl apply -f k8s/web-deployment.yaml

# Wait for rollout
kubectl rollout status deployment/aos-api
kubectl rollout status deployment/aos-web
```

### Step 6: Validate Rollback Success

```bash
# Run full validation suite
pnpm run build
pnpm run typecheck
pnpm run test
pnpm run test:integration
pnpm run test:secret

# Verify API health
curl -f https://api.aios.local/health || exit 1

# Verify vault integration
curl -f https://app.aios.local/vault/status || exit 1
```

## Post-Rollback Verification

- ✅ Full build passes (11/11 packages)
- ✅ Full typecheck passes (10/10 packages)
- ✅ Test suite passes (18/18 task groups)
- ✅ Integration tests pass (8/8)
- ✅ Secret bootstrap validated (10/10 PASS)
- ✅ API health checks return expected status codes
- ✅ CORS configuration honored
- ✅ Vault lifecycle events working (init/opened/closed)

## Rollback Failure Handling

If rollback fails or introduces new issues:

1. **Escalate to engineering leadership** - Document the failure mode
2. **Attempt secondary rollback** - Go to the commit before the failed one
3. **Activate disaster recovery mode** - Run with reduced functionality (vault disabled)
4. **Record the incident** - Update docs/OPERATIONS/ROLLBACK.md with root cause
5. **Schedule post-mortem** - Within 5 business days

## Emergency Rollback (No Downtime)

For critical production issues requiring immediate response:

```bash
# Quick revert to previous Docker images
docker stop aos-web aos-api
docker pull <ECR-repo>/aios-api:v0.3.0
docker pull <ECR-repo>/aios-web:v0.3.0
docker start aos-web aos-api

# Or Kubernetes:
kubectl set image deployment/aos-api aios-api=<ECR-repo>/aios-api:v0.3.0
kubectl set image deployment/aos-web aios-web=<ECR-repo>/aios-web:v0.3.0
```

## Rollback Decision Matrix

| Issue Severity | Rollback Required | Escalation Level |
|----------------|-------------------|------------------|
| Critical (data loss, security breach) | Yes - immediate | Engineering Lead + Security |
| High (feature broken, no workflow) | Yes - within 1 hour | Engineering Lead |
| Medium (degraded performance) | Consider | Tech Lead |
| Low (cosmetic, no user impact) | No | N/A |

## Documentation

- **Rollback Procedure:** docs/OPERATIONS/ROLLBACK.md (this document)
- **Release Record:** docs/RELEASES/RELEASE_v0.5.0.md
- **Phase 10 Acceptance:** docs/PHASE10_FINAL_ACCEPTANCE.md
- **Deployment Verification:** scripts/verify-deployment.mjs
- **Version Governance:** docs/VERSION.md
- **Changelog:** CHANGELOG.md

---

*Document controlled per ADR-009 (Documentation Synchronization Policy).*
*Last reviewed: 2026-08-20*