# EAS Credentials Management Guide

## 🔒 Security Best Practices

### ❌ **NEVER** put these in `eas.json`:
- Real Apple ID credentials
- Google Play service account key files
- API keys or tokens

### ✅ **DO** use these secure methods:

## 1. Environment Variables (Current Setup)
Your `eas.json` now uses environment variables:

```bash
# Set these before running EAS commands:
export APPLE_ID="your-apple-id@unfoldingword.org"
export ASC_APP_ID="your-app-store-connect-app-id"
export APPLE_TEAM_ID="your-apple-team-id"
export GOOGLE_PLAY_SERVICE_ACCOUNT_KEY_PATH="/path/to/service-account.json"
```

## 2. EAS Secrets (Recommended)
```bash
# Store secrets securely on EAS servers:
eas secret:create --scope project --name APPLE_ID--value "your-apple-id@unfoldingword.org"
eas secret:create --scope project --name ASC_APP_ID --value "your-app-id"
eas secret:create --scope project --name APPLE_TEAM_ID --value "your-team-id"
```

## 3. Interactive EAS CLI (Easiest)
- Simply run `eas build` without pre-configuring credentials
- EAS CLI will prompt you to sign in and handle credentials securely
- Credentials are stored encrypted on EAS servers

## 4. Manual Credential Management
For advanced users who want full control over credentials.

## Next Steps When Ready:
1. Get access to unfoldingword organization in EAS
2. Choose your preferred credential management method
3. Run your first production build!
