# GitHub Environments Configuration

This document describes how to configure GitHub Environments for the Kametrix CI/CD pipeline.

## Required Environments

You need to create two environments in your GitHub repository settings:

1. **staging** - For staging deployments
2. **production** - For production deployments (with protection rules)

### Creating Environments

1. Go to your repository on GitHub
2. Navigate to **Settings** → **Environments**
3. Click **New environment** for each environment

---

## Environment: staging

### Protection Rules
- No required reviewers (auto-deploy on push to `develop`)
- Optional: Add deployment branch rule to only allow `develop` branch

### Environment Secrets

| Secret Name | Description | Example |
|------------|-------------|---------|
| `STAGING_HOST` | Staging server hostname/IP | `staging.example.com` |
| `STAGING_USER` | SSH username | `deploy` |
| `STAGING_SSH_KEY` | Private SSH key for deployment | (private key content) |
| `STAGING_SSH_PORT` | SSH port (optional, default: 22) | `22` |

### Environment Variables

| Variable Name | Description | Example |
|--------------|-------------|---------|
| `STAGING_URL` | Public URL of staging | `https://staging.example.com` |
| `STAGING_APP_PATH` | Path to app on server | `/opt/kametrix` |

---

## Environment: production

### Protection Rules (REQUIRED)
- **Required reviewers**: Add at least 1-2 team members who must approve deployments
- **Wait timer**: Optional 5-15 minute delay for emergency stops
- **Deployment branches**: Restrict to `main` branch only

### Environment Secrets

| Secret Name | Description | Example |
|------------|-------------|---------|
| `PRODUCTION_HOST` | Production server hostname/IP | `app.example.com` |
| `PRODUCTION_USER` | SSH username | `deploy` |
| `PRODUCTION_SSH_KEY` | Private SSH key for deployment | (private key content) |
| `PRODUCTION_SSH_PORT` | SSH port (optional, default: 22) | `22` |

### Environment Variables

| Variable Name | Description | Example |
|--------------|-------------|---------|
| `PRODUCTION_URL` | Public URL of production | `https://app.example.com` |
| `PRODUCTION_APP_PATH` | Path to app on server | `/opt/kametrix` |

---

## Repository Secrets (Shared)

These secrets are available to all workflows:

| Secret Name | Description | Required |
|------------|-------------|----------|
| `GITHUB_TOKEN` | Automatically provided by GitHub | Auto |

---

## Setting Up SSH Keys

### Generate Deployment Keys

```bash
# Generate a new SSH key pair for deployments
ssh-keygen -t ed25519 -C "github-deploy@kametrix" -f deploy_key -N ""

# This creates:
# - deploy_key (private key - add to GitHub Secrets)
# - deploy_key.pub (public key - add to server)
```

### Add Public Key to Server

```bash
# On your deployment server
echo "PUBLIC_KEY_CONTENT" >> ~/.ssh/authorized_keys
chmod 600 ~/.ssh/authorized_keys
```

### Add Private Key to GitHub

1. Go to **Settings** → **Secrets and variables** → **Actions**
2. Click **New repository secret** or navigate to environment secrets
3. Name: `STAGING_SSH_KEY` or `PRODUCTION_SSH_KEY`
4. Value: Paste the entire private key including headers

---

## Server Requirements

Each deployment server needs:

### Docker & Docker Compose
```bash
# Install Docker
curl -fsSL https://get.docker.com | sh
sudo usermod -aG docker $USER

# Verify Docker Compose plugin
docker compose version
```

### Application Directory
```bash
# Create application directory
sudo mkdir -p /opt/kametrix
sudo chown $USER:$USER /opt/kametrix
cd /opt/kametrix

# Clone repository (first time only)
git clone https://github.com/your-org/kametrix.git .
```

### Environment File
```bash
# Copy and configure environment variables
cp .env.staging.example .env  # for staging
# OR
cp .env.production.example .env  # for production

# Edit with your values
nano .env
```

### GitHub Container Registry Authentication
```bash
# Login to GHCR (required for pulling images)
echo $GITHUB_TOKEN | docker login ghcr.io -u USERNAME --password-stdin
```

---

## Workflow Triggers

### CI Pipeline (`ci.yml`)
- **Automatic**: Push to `main`, `develop`, `feature/**`, `fix/**`
- **Automatic**: Pull requests to `main`, `develop`

### Staging Deployment (`deploy-staging.yml`)
- **Automatic**: Push to `develop` branch
- **Manual**: Workflow dispatch

### Production Deployment (`deploy-production.yml`)
- **Automatic**: Push to `main` branch (requires approval)
- **Manual**: Workflow dispatch with optional version tag

### Rollback (`rollback.yml`)
- **Manual only**: Workflow dispatch with environment selection

---

## Deployment Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                        CI Pipeline                               │
├─────────────────────────────────────────────────────────────────┤
│  Push to feature/* ──► Lint ──► Unit Tests ──► Build ──► Done   │
│                                                                  │
│  PR to develop ──► CI Suite ──► Ready for merge                 │
│                                                                  │
│  Merge to develop ──► CI ──► Build Image ──► Deploy Staging     │
│                               ▼                                  │
│                          Smoke Tests                             │
│                                                                  │
│  Merge to main ──► CI ──► Build Image ──► [APPROVAL] ──►        │
│                                                Production        │
│                                                    ▼             │
│                                              Verification        │
│                                                    ▼             │
│                                              Create Release      │
└─────────────────────────────────────────────────────────────────┘
```

---

## Troubleshooting

### SSH Connection Failed
```bash
# Test SSH connection
ssh -i deploy_key -p 22 user@host "echo 'Connection successful'"

# Check SSH agent
eval $(ssh-agent -s)
ssh-add deploy_key
```

### Docker Pull Failed
```bash
# Re-authenticate with GHCR
docker logout ghcr.io
echo $GITHUB_TOKEN | docker login ghcr.io -u USERNAME --password-stdin
```

### Health Check Failed
```bash
# Check application logs
docker compose -f docker-compose.prod.yml logs app

# Check container status
docker ps -a

# Manual health check
curl -v http://localhost:3000/api/health
```

### Rollback Issues
```bash
# List available images for rollback
docker images ghcr.io/your-org/kametrix

# Manual rollback
./deploy.sh rollback
```
