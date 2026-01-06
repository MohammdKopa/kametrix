# Kametrix CI/CD Pipeline Documentation

This document provides a comprehensive guide to the automated deployment pipeline for Kametrix.

## Table of Contents

1. [Overview](#overview)
2. [Pipeline Architecture](#pipeline-architecture)
3. [Continuous Integration](#continuous-integration)
4. [Deployment Workflows](#deployment-workflows)
5. [Environment Management](#environment-management)
6. [Secrets Handling](#secrets-handling)
7. [Rollback Procedures](#rollback-procedures)
8. [Best Practices](#best-practices)

---

## Overview

The Kametrix CI/CD pipeline provides:

- **Automated Testing**: Unit tests, E2E tests, linting, and type checking
- **Continuous Integration**: Automatic validation on every push and PR
- **Staging Deployments**: Automatic deployment to staging on `develop` branch
- **Production Deployments**: Controlled deployment to production with approval gates
- **Rollback Capabilities**: Quick rollback to previous versions
- **Security Scanning**: Vulnerability detection and dependency audits

### Key Features

| Feature | Description |
|---------|-------------|
| Multi-environment | Separate staging and production pipelines |
| Approval Gates | Manual approval required for production |
| Auto-rollback | Automatic rollback on failed health checks |
| Container Registry | Images stored in GitHub Container Registry |
| Release Management | Automatic GitHub releases on production deploy |
| Notifications | Issue creation on deployment failures |

---

## Pipeline Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│                          GitHub Repository                               │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│   feature/* branch                                                       │
│        │                                                                 │
│        ▼                                                                 │
│   ┌─────────┐                                                           │
│   │   CI    │ ──► Lint, Type Check, Unit Tests, Build Verification      │
│   └────┬────┘                                                           │
│        │                                                                 │
│        ▼ (PR merged)                                                    │
│   develop branch                                                         │
│        │                                                                 │
│        ▼                                                                 │
│   ┌─────────────┐    ┌──────────────┐    ┌─────────────┐               │
│   │ CI Pipeline │───►│ Build Image  │───►│   Deploy    │               │
│   │   (Full)    │    │   (Staging)  │    │  (Staging)  │               │
│   └─────────────┘    └──────────────┘    └──────┬──────┘               │
│                                                  │                       │
│                                                  ▼                       │
│                                          ┌─────────────┐                │
│                                          │ Smoke Tests │                │
│                                          └─────────────┘                │
│                                                                          │
│   main branch (PR merged from develop)                                  │
│        │                                                                 │
│        ▼                                                                 │
│   ┌─────────────┐    ┌──────────────┐    ┌─────────────┐               │
│   │ CI Pipeline │───►│ Build Image  │───►│  [APPROVAL] │               │
│   │   (Full)    │    │ (Production) │    │   REQUIRED  │               │
│   └─────────────┘    └──────────────┘    └──────┬──────┘               │
│                                                  │                       │
│                                                  ▼                       │
│                                          ┌─────────────┐                │
│                                          │   Deploy    │                │
│                                          │ (Production)│                │
│                                          └──────┬──────┘                │
│                                                  │                       │
│                                                  ▼                       │
│                                    ┌─────────────────────┐              │
│                                    │ Verify + Release    │              │
│                                    └─────────────────────┘              │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## Continuous Integration

### CI Workflow (`.github/workflows/ci.yml`)

The CI pipeline runs on every push and pull request.

#### Jobs

| Job | Description | Dependencies |
|-----|-------------|--------------|
| `lint` | ESLint + TypeScript type checking | None |
| `unit-tests` | Vitest unit test suite | `lint` |
| `e2e-tests` | Playwright E2E tests | `lint` |
| `build` | Next.js build verification | `lint` |
| `docker-build` | Docker image build test | `lint` |
| `security` | npm audit + Trivy scan | `lint` |

#### Triggers

```yaml
on:
  push:
    branches: [main, develop, feature/**, fix/**]
  pull_request:
    branches: [main, develop]
```

#### Running CI Locally

```bash
# Run linting
npm run lint

# Run type checking
npx tsc --noEmit

# Run unit tests
npm run test

# Run E2E tests
npx playwright test
```

---

## Deployment Workflows

### Staging Deployment

**Workflow**: `.github/workflows/deploy-staging.yml`

**Triggers**:
- Automatic: Push to `develop` branch
- Manual: Workflow dispatch

**Process**:
1. Run full CI suite
2. Build Docker image with `staging-` prefix
3. Push to GitHub Container Registry
4. Deploy to staging server via SSH
5. Run database migrations
6. Execute smoke tests
7. Report status

**Manual Trigger**:
```bash
gh workflow run deploy-staging.yml
```

### Production Deployment

**Workflow**: `.github/workflows/deploy-production.yml`

**Triggers**:
- Automatic: Push to `main` branch (requires approval)
- Manual: Workflow dispatch with optional version tag

**Process**:
1. Pre-flight checks (version determination)
2. Run full CI suite
3. Build production Docker image
4. **Wait for manual approval** (required)
5. Create database backup
6. Deploy to production server
7. Run migrations
8. Health check with auto-rollback on failure
9. Post-deployment verification
10. Create GitHub release

**Manual Trigger with Version**:
```bash
gh workflow run deploy-production.yml -f version_tag=v1.2.3
```

---

## Environment Management

### Environment Configuration

Each environment has its own configuration:

| Environment | Docker Compose | Environment File |
|-------------|----------------|------------------|
| Development | `docker-compose.yml` | `.env` |
| Staging | `docker-compose.staging.yml` | `.env.staging.example` |
| Production | `docker-compose.prod.yml` | `.env.production.example` |

### GitHub Environments

Configure in **Settings → Environments**:

#### Staging Environment
- No approval required
- Auto-deploy on `develop` branch
- Separate API keys (test mode)

#### Production Environment
- **Required reviewers** (1-2 team members)
- Optional wait timer
- Branch restriction to `main` only

See [`.github/ENVIRONMENTS.md`](.github/ENVIRONMENTS.md) for detailed setup instructions.

---

## Secrets Handling

### Secret Categories

#### Repository Secrets (Shared)
- GitHub automatically provides `GITHUB_TOKEN`

#### Environment Secrets (Per Environment)

| Secret | Staging | Production |
|--------|---------|------------|
| `*_HOST` | Staging server IP | Production server IP |
| `*_USER` | SSH username | SSH username |
| `*_SSH_KEY` | Deployment key | Deployment key |
| `*_SSH_PORT` | SSH port | SSH port |

### Application Secrets (On Server)

Application secrets are stored in `.env` files on each server:

```bash
# Database
POSTGRES_PASSWORD=...

# API Keys
VAPI_API_KEY=...
GOOGLE_CLIENT_SECRET=...
STRIPE_SECRET_KEY=...
STRIPE_WEBHOOK_SECRET=...

# Encryption
GOOGLE_ENCRYPTION_KEY=...
```

### Best Practices

1. **Never commit secrets** to the repository
2. **Use test/sandbox keys** for staging
3. **Rotate keys** periodically
4. **Limit access** to production secrets
5. **Audit secret access** regularly

---

## Rollback Procedures

### Automatic Rollback

The deployment workflows automatically rollback if:
- Health check fails after deployment
- Migration fails during deployment

### Manual Rollback

**Workflow**: `.github/workflows/rollback.yml`

**Trigger**: Manual workflow dispatch only

#### Via GitHub UI

1. Go to **Actions** → **Rollback Deployment**
2. Click **Run workflow**
3. Select environment (staging/production)
4. Optionally specify target version
5. Enter rollback reason
6. Click **Run workflow**

#### Via GitHub CLI

```bash
# Rollback staging to last working version
gh workflow run rollback.yml \
  -f environment=staging \
  -f reason="Bug in latest deployment"

# Rollback production to specific version
gh workflow run rollback.yml \
  -f environment=production \
  -f target=v1.2.2 \
  -f reason="Critical bug found"
```

### Manual Server Rollback

If GitHub Actions is unavailable:

```bash
# SSH to server
ssh deploy@production-server

# Navigate to app directory
cd /opt/kametrix

# Use deployment script
./deploy.sh rollback

# Or manually
docker tag kametrix-app:rollback kametrix-app:latest
docker compose -f docker-compose.prod.yml up -d app
```

---

## Best Practices

### Branch Strategy

```
main (production)
  │
  └── develop (staging)
        │
        ├── feature/new-feature
        ├── feature/another-feature
        └── fix/bug-fix
```

### Commit Messages

Follow conventional commits:
```
feat: add new authentication method
fix: resolve login timeout issue
docs: update deployment documentation
chore: upgrade dependencies
```

### Pre-Deployment Checklist

- [ ] All CI checks passing
- [ ] Code reviewed and approved
- [ ] Tested on staging environment
- [ ] Database migrations tested
- [ ] Rollback plan documented
- [ ] Team notified of deployment

### Monitoring After Deployment

1. Check health endpoint: `GET /api/health`
2. Monitor application logs
3. Verify key functionality
4. Check error rates
5. Monitor performance metrics

---

## Quick Reference

### Common Commands

```bash
# Trigger staging deployment
gh workflow run deploy-staging.yml

# Trigger production deployment
gh workflow run deploy-production.yml

# Trigger rollback
gh workflow run rollback.yml -f environment=production -f reason="Issue found"

# View workflow runs
gh run list --workflow=ci.yml

# View deployment status
gh run view <run-id>
```

### Useful Links

- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [Docker Compose Reference](https://docs.docker.com/compose/)
- [Prisma Migrations](https://www.prisma.io/docs/concepts/components/prisma-migrate)

---

## Support

For issues with the CI/CD pipeline:

1. Check workflow logs in GitHub Actions
2. Review server logs: `./deploy.sh logs`
3. Check container status: `./deploy.sh status`
4. Create an issue with the `deployment` label
