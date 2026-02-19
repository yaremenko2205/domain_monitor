# Authentication Setup Guide

Domain Monitor uses [NextAuth.js v5](https://authjs.dev/) with two OAuth providers: **GitHub** and **Microsoft Entra ID** (Azure AD). Users sign in via one of these providers, and each user gets their own domain list, settings, and notification preferences.

---

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Generate AUTH_SECRET](#1-generate-auth_secret)
3. [GitHub OAuth Setup](#2-github-oauth-setup)
4. [Microsoft Entra ID Setup](#3-microsoft-entra-id-setup)
5. [Environment Variables Reference](#4-environment-variables-reference)
6. [Legacy Domain Migration](#5-legacy-domain-migration)
7. [Domain Sharing](#6-domain-sharing)
8. [Running the App](#7-running-the-app)
9. [Troubleshooting](#8-troubleshooting)

---

## Prerequisites

- Node.js 18+
- The app installed and dependencies resolved (`npm install`)
- A `.env.local` file in the project root (copy from `.env.example`)

```bash
cp .env.example .env.local
```

---

## 1. Generate AUTH_SECRET

NextAuth requires a secret for encrypting session tokens and cookies.

```bash
openssl rand -base64 32
```

Paste the output into `.env.local`:

```
AUTH_SECRET=your-generated-secret-here
AUTH_TRUST_HOST=true
```

> `AUTH_TRUST_HOST=true` is required when running behind a proxy or on localhost.

---

## 2. GitHub OAuth Setup

### Step 1: Create a GitHub OAuth App

1. Go to **GitHub** > **Settings** > **Developer settings** > **OAuth Apps**
   - Direct link: https://github.com/settings/developers
2. Click **New OAuth App**
3. Fill in the form:

| Field                      | Value                                          |
|----------------------------|------------------------------------------------|
| **Application name**       | `Domain Monitor` (or anything you like)        |
| **Homepage URL**           | `http://localhost:3000` (or your production URL)|
| **Authorization callback URL** | `http://localhost:3000/api/auth/callback/github` |

4. Click **Register application**

### Step 2: Get Client ID and Secret

1. After registration, you'll see your **Client ID** on the app page
2. Click **Generate a new client secret**
3. Copy both values into `.env.local`:

```
GITHUB_CLIENT_ID=Iv1.abc123def456
GITHUB_CLIENT_SECRET=your-secret-here
```

> **Important:** The client secret is shown only once. Save it immediately.

### Production Note

When deploying, update the **Homepage URL** and **Authorization callback URL** to your production domain:
```
https://yourdomain.com
https://yourdomain.com/api/auth/callback/github
```

---

## 3. Microsoft Entra ID Setup

### Step 1: Register an App in Azure Portal

1. Go to https://portal.azure.com
2. Navigate to **Microsoft Entra ID** (formerly Azure Active Directory)
3. Select **App registrations** in the sidebar
4. Click **New registration**
5. Fill in the form:

| Field                  | Value                                                   |
|------------------------|---------------------------------------------------------|
| **Name**               | `Domain Monitor`                                        |
| **Supported account types** | Choose based on your needs (see below)            |
| **Redirect URI**       | Platform: **Web**, URI: `http://localhost:3000/api/auth/callback/microsoft-entra-id` |

**Account types explained:**

| Option | Who can sign in |
|--------|----------------|
| Single tenant | Only users in your organization |
| Multitenant | Users in any Microsoft organization |
| Multitenant + personal | Any Microsoft account (org + personal Outlook/Hotmail) |

6. Click **Register**

### Step 2: Get the Application (client) ID

On the app's **Overview** page, copy:

- **Application (client) ID** — this is your `AZURE_AD_CLIENT_ID`
- **Directory (tenant) ID** — this is your `AZURE_AD_TENANT_ID`

### Step 3: Create a Client Secret

1. Go to **Certificates & secrets** in the sidebar
2. Under **Client secrets**, click **New client secret**
3. Add a description (e.g., `Domain Monitor secret`) and choose an expiry
4. Click **Add**
5. Copy the secret **Value** (not the Secret ID) — this is your `AZURE_AD_CLIENT_SECRET`

> **Important:** The secret value is shown only once. Copy it immediately.

### Step 4: Configure API Permissions (optional)

By default, the app requests `openid`, `profile`, and `email` scopes, which is sufficient for authentication. No additional API permissions are needed.

### Step 5: Update .env.local

```
AZURE_AD_CLIENT_ID=12345678-abcd-efgh-ijkl-123456789012
AZURE_AD_CLIENT_SECRET=your-secret-value-here
AZURE_AD_TENANT_ID=your-tenant-id-or-common
```

**Tenant ID options:**

| Value | Meaning |
|-------|---------|
| Your actual tenant ID (UUID) | Only your organization's users |
| `common` | Any Microsoft account (multitenant + personal) |
| `organizations` | Any organizational account (multitenant) |
| `consumers` | Personal Microsoft accounts only |

### Production Note

When deploying, add your production redirect URI in the Azure portal:
```
https://yourdomain.com/api/auth/callback/microsoft-entra-id
```

You can have both localhost and production URIs registered simultaneously.

---

## 4. Environment Variables Reference

| Variable | Required | Description |
|----------|----------|-------------|
| `AUTH_SECRET` | Yes | Random secret for session encryption. Generate with `openssl rand -base64 32` |
| `AUTH_TRUST_HOST` | Yes | Set to `true` for localhost and proxy setups |
| `GITHUB_CLIENT_ID` | For GitHub login | OAuth App client ID from GitHub |
| `GITHUB_CLIENT_SECRET` | For GitHub login | OAuth App client secret from GitHub |
| `AZURE_AD_CLIENT_ID` | For Microsoft login | Application (client) ID from Azure portal |
| `AZURE_AD_CLIENT_SECRET` | For Microsoft login | Client secret value from Azure portal |
| `AZURE_AD_TENANT_ID` | No | Tenant ID or `common` (default: `common`) |
| `LEGACY_ADMIN_EMAIL` | No | Email of the user who should inherit pre-existing domains |

> You can configure just one provider if you only need GitHub or Microsoft login. Leave the other provider's variables empty — the sign-in page will still show both buttons, but the unconfigured one will fail with an error. To hide a provider's button, you would need to edit `src/app/auth/signin/page.tsx`.

---

## 5. Legacy Domain Migration

If you had domains in the database before auth was added, they were created without a `userId` (or with `legacy-admin`). To claim them:

1. Set `LEGACY_ADMIN_EMAIL` in `.env.local` to your email address
2. Sign in with an OAuth provider that uses that same email
3. On first sign-in, the app automatically transfers all legacy domains and settings to your account
4. This transfer happens once — after that, the `LEGACY_ADMIN_EMAIL` variable has no further effect

---

## 6. Domain Sharing

Domain Monitor supports sharing domains between users with three permission levels:

| Permission | View | Edit notes / toggle | Delete / share with others |
|------------|------|---------------------|----------------------------|
| **Read**   | Yes  | No                  | No                         |
| **Edit**   | Yes  | Yes                 | No                         |
| **Full control** | Yes | Yes            | Yes                        |

### How to share a domain

1. On the dashboard, click the **share icon** (next to the check button) on any domain you own
2. Enter the email address of the person you want to share with
3. Select a permission level
4. Click **Share**

> The recipient must have signed in to Domain Monitor at least once (so their account exists in the database).

Shared domains appear in the recipient's dashboard with a **"Shared"** badge.

---

## 7. Running the App

After configuring the environment variables:

```bash
# Initialize / push the database schema
npx drizzle-kit push

# Development
npm run dev

# Production
npm run build
npm start
```

The app will be available at `http://localhost:3000`. Any unauthenticated request is redirected to the sign-in page at `/auth/signin`.

---

## 8. Troubleshooting

### "OAuthCallbackError" or redirect loop

- Verify your callback URLs match exactly:
  - GitHub: `http://localhost:3000/api/auth/callback/github`
  - Microsoft: `http://localhost:3000/api/auth/callback/microsoft-entra-id`
- Make sure `AUTH_SECRET` is set and `AUTH_TRUST_HOST=true`

### "SQLITE_BUSY" errors

- The app uses WAL mode and a 5-second busy timeout by default
- Avoid running multiple instances writing to the same database file

### Microsoft login shows "AADSTS50011: The redirect URI does not match"

- Double-check the redirect URI in Azure portal matches your running URL exactly
- Remember the path is `/api/auth/callback/microsoft-entra-id` (with hyphens)

### Provider button shows an error instead of redirecting

- The provider's client ID and secret are likely missing or incorrect
- Check the server console for detailed error messages

### Sessions expire unexpectedly

- Sessions are stored in the SQLite database and persist across server restarts
- If you delete `data/domains.db`, all sessions are lost and users must re-authenticate

### "User not found" when sharing a domain

- The person you're sharing with must have signed in at least once
- Their email in the system must match what you're entering (check for typos)
