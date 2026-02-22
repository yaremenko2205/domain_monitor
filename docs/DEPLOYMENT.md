# Deployment Guide

This guide covers deploying Domain Monitor using Docker Compose (quick start) or Kubernetes (production).

## Table of Contents

- [Prerequisites](#prerequisites)
- [Quick Start with Docker Compose](#quick-start-with-docker-compose)
- [Kubernetes Deployment](#kubernetes-deployment)
- [Environment Variable Reference](#environment-variable-reference)
- [Database Persistence and Backup](#database-persistence-and-backup)
- [Updating and Upgrading](#updating-and-upgrading)
- [Azure AD Configuration for Production](#azure-ad-configuration-for-production)
- [Troubleshooting](#troubleshooting)

---

## Prerequisites

### Docker Compose

- Docker Engine 20.10+ and Docker Compose v2
- A Microsoft Entra ID (Azure AD) app registration (see [AUTH_SETUP.md](./AUTH_SETUP.md))

### Kubernetes

- A Kubernetes cluster (1.25+)
- `kubectl` configured for your cluster
- [nginx-ingress controller](https://kubernetes.github.io/ingress-nginx/) installed
- [cert-manager](https://cert-manager.io/) installed with a `ClusterIssuer` named `letsencrypt-prod`
- A Microsoft Entra ID app registration (see [AUTH_SETUP.md](./AUTH_SETUP.md))

---

## Quick Start with Docker Compose

1. **Clone the repository and create your environment file:**

   ```bash
   cp .env.example .env.local
   ```

2. **Fill in the required values in `.env.local`:**

   ```bash
   # Generate a secret key
   openssl rand -base64 32
   ```

   Set `AUTH_SECRET` to the generated value, then fill in your Azure AD credentials (`AZURE_AD_CLIENT_ID`, `AZURE_AD_CLIENT_SECRET`, `AZURE_AD_TENANT_ID`).

3. **Set your domain** (optional, defaults to `localhost`):

   ```bash
   # Add to .env.local
   DOMAIN=domains.example.com
   ```

   When set to a real domain, Caddy will automatically provision a TLS certificate via Let's Encrypt.

4. **Start the services:**

   ```bash
   docker compose up -d
   ```

5. **Verify the deployment:**

   ```bash
   docker compose ps
   docker compose logs app
   ```

   The app will be available at `https://your-domain` (or `http://localhost` if no domain is set).

### Docker Compose Volumes

| Volume | Purpose |
|--------|---------|
| `domain-data` | SQLite database (all application data) |
| `caddy-data` | Let's Encrypt TLS certificates |
| `caddy-config` | Caddy server configuration state |

The database auto-initializes on first run. No manual setup is needed.

---

## Kubernetes Deployment

### Step 1: Create the namespace

```bash
kubectl apply -f k8s/namespace.yaml
```

### Step 2: Configure secrets

Edit `k8s/secret.yaml` and replace all `REPLACE_ME` values:

```bash
# Generate AUTH_SECRET
openssl rand -base64 32
```

Fill in your Azure AD credentials and a strong `CRON_SECRET`, then apply:

```bash
kubectl apply -f k8s/secret.yaml
```

### Step 3: Configure the ConfigMap

Edit `k8s/configmap.yaml` and set `NEXT_PUBLIC_BASE_URL` to your actual domain:

```yaml
NEXT_PUBLIC_BASE_URL: "https://domains.example.com"
```

```bash
kubectl apply -f k8s/configmap.yaml
```

### Step 4: Create the persistent volume

```bash
kubectl apply -f k8s/pvc.yaml
```

> If your cluster requires a specific StorageClass, uncomment and set `storageClassName` in `k8s/pvc.yaml`.

### Step 5: Deploy the application

```bash
kubectl apply -f k8s/deployment.yaml
```

### Step 6: Create the service

```bash
kubectl apply -f k8s/service.yaml
```

### Step 7: Configure the ingress

Edit `k8s/ingress.yaml` and replace `domains.example.com` with your actual domain (in both `tls.hosts` and `rules.host`), then apply:

```bash
kubectl apply -f k8s/ingress.yaml
```

### Step 8: Verify the deployment

```bash
# Check pod status
kubectl -n domain-monitor get pods

# Watch logs
kubectl -n domain-monitor logs -f deployment/domain-monitor

# Check ingress and TLS certificate
kubectl -n domain-monitor get ingress
kubectl -n domain-monitor get certificate
```

Wait for the pod to reach `Running` status and for cert-manager to provision the TLS certificate. The app will be available at `https://your-domain`.

### Quick Apply (all at once)

After editing secrets, configmap, and ingress, you can apply everything at once:

```bash
kubectl apply -f k8s/
```

---

## Environment Variable Reference

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `AUTH_SECRET` | Yes | — | Session encryption key. Generate with `openssl rand -base64 32` |
| `AUTH_TRUST_HOST` | Yes | — | Must be `true` when running behind a proxy or ingress |
| `AZURE_AD_CLIENT_ID` | Yes | — | Microsoft Entra ID application (client) ID |
| `AZURE_AD_CLIENT_SECRET` | Yes | — | Microsoft Entra ID client secret value |
| `AZURE_AD_TENANT_ID` | No | `common` | Tenant ID, or `common` / `organizations` / `consumers` |
| `CRON_SECRET` | Recommended | — | Protects the `/api/cron` endpoint from unauthorized access |
| `NEXT_PUBLIC_BASE_URL` | Yes | `http://localhost:3000` | Public URL; used by the scheduler for internal API calls |
| `CHECK_SCHEDULE` | No | `0 8 * * *` | Cron expression for automated domain checks (UTC) |
| `NODE_ENV` | No | `production` | Set to `production` for deployments |
| `LEGACY_ADMIN_EMAIL` | No | — | Email address to claim pre-existing domains on first login |
| `DOMAIN` | No | `localhost` | Docker Compose only: domain for Caddy reverse proxy |

### Settings Configured via UI

These settings are stored in the database and managed through the Settings page (admin only):

- SMTP configuration (host, port, user, password, from address)
- Email notification recipients
- Telegram bot token and chat ID
- Notification thresholds (days before expiry)
- Check schedule override

---

## Database Persistence and Backup

Domain Monitor uses SQLite with WAL (Write-Ahead Logging) mode. All data is stored in the `/app/data` directory:

| File | Purpose |
|------|---------|
| `domains.db` | Main database file |
| `domains.db-wal` | Write-ahead log (active transactions) |
| `domains.db-shm` | Shared memory (WAL index) |

### Backup

SQLite with WAL mode supports hot backups (copying while the app is running).

**Docker Compose:**

```bash
docker compose cp app:/app/data/domains.db ./backup-$(date +%Y%m%d).db
```

**Kubernetes:**

```bash
POD=$(kubectl -n domain-monitor get pod -l app.kubernetes.io/name=domain-monitor -o jsonpath='{.items[0].metadata.name}')
kubectl -n domain-monitor cp "$POD:/app/data/domains.db" "./backup-$(date +%Y%m%d).db"
```

### Restore

1. Stop the application
2. Replace `/app/data/domains.db` with the backup file
3. Remove any stale `.db-wal` and `.db-shm` files
4. Start the application

---

## Updating and Upgrading

### Docker Compose

```bash
# Pull the latest image and recreate containers
docker compose pull
docker compose up -d
```

### Kubernetes

**If using the `latest` tag:**

```bash
kubectl -n domain-monitor rollout restart deployment/domain-monitor
```

**If using specific version tags:**

```bash
kubectl -n domain-monitor set image deployment/domain-monitor \
  domain-monitor=ghcr.io/yaremenko2205/domain-monitor:1.2.0
```

> Note: The deployment uses `strategy: Recreate`, so there will be brief downtime during updates. This is required because SQLite does not support concurrent access from multiple processes.

---

## Azure AD Configuration for Production

When deploying to a public domain, add the production redirect URI to your Azure AD app registration:

```
https://your-domain.com/api/auth/callback/microsoft-entra-id
```

You can keep the `http://localhost:3000` redirect URI alongside the production URI for local development.

For full Azure AD setup instructions, see [AUTH_SETUP.md](./AUTH_SETUP.md).

---

## Troubleshooting

### Pod stuck in CrashLoopBackOff

Check logs for the error:

```bash
kubectl -n domain-monitor logs deployment/domain-monitor
```

Common causes:
- Missing or invalid `AUTH_SECRET` — generate a new one with `openssl rand -base64 32`
- Missing Azure AD credentials — verify all `AZURE_AD_*` values are set
- Invalid `NEXT_PUBLIC_BASE_URL` — must be a valid URL

### SQLITE_BUSY errors

Ensure:
- `replicas: 1` in the Deployment (SQLite only supports a single writer)
- `strategy: Recreate` is set (prevents two pods running simultaneously during updates)

### TLS certificate not provisioning

```bash
# Check certificate status
kubectl -n domain-monitor get certificate
kubectl -n domain-monitor describe certificate domain-monitor-tls

# Check cert-manager logs
kubectl -n cert-manager logs deployment/cert-manager
```

Ensure your DNS record points to the ingress controller's external IP.

### OAuth callback errors

Verify:
1. `NEXT_PUBLIC_BASE_URL` in the ConfigMap matches your actual domain
2. The redirect URI in Azure AD matches exactly: `https://your-domain.com/api/auth/callback/microsoft-entra-id`
3. `AUTH_TRUST_HOST` is set to `true`

### Pod cannot write to /app/data

Ensure the Deployment has the correct `securityContext`:

```yaml
securityContext:
  runAsUser: 1001
  runAsGroup: 1001
  fsGroup: 1001
```

The `fsGroup` setting ensures the PVC mount is writable by the container user.

### Scheduler not running

Check pod logs for `[Scheduler]` messages:

```bash
kubectl -n domain-monitor logs deployment/domain-monitor | grep Scheduler
```

The scheduler starts automatically inside the Next.js process. Verify `CHECK_SCHEDULE` is a valid cron expression in the ConfigMap.

### Image pull errors

If the container image is private on ghcr.io, create an image pull secret:

```bash
kubectl -n domain-monitor create secret docker-registry ghcr-pull \
  --docker-server=ghcr.io \
  --docker-username=YOUR_GITHUB_USERNAME \
  --docker-password=YOUR_GITHUB_PAT

# Then add to the Deployment spec:
# imagePullSecrets:
#   - name: ghcr-pull
```

Alternatively, make the package public in your GitHub account under **Settings > Packages**.
