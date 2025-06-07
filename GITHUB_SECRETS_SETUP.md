# GitHub Secrets Setup for EAS Builds

**For unfoldingword Account Manager** 👤

This document explains what GitHub secrets need to be configured to enable automatic EAS builds.

## 🔑 Required GitHub Secrets

### 1. **EXPO_TOKEN** (Essential)
- **What**: Authentication token for EAS CLI
- **How to get**:
  1. Login to [expo.dev](https://expo.dev) with unfoldingword account
  2. Go to Account Settings → Access Tokens
  3. Create new token with name "GitHub Actions - Open Bible Stories"
  4. Copy the token value
- **Where to add**: GitHub repo Settings → Secrets and variables → Actions → New repository secret

### 2. **Store Submission Secrets** (Optional - for auto-submit)
Only needed if you want automatic store submission:

#### Apple App Store:
- `APPLE_ID`: Apple ID email (e.g., developer@unfoldingword.org)
- `ASC_APP_ID`: App Store Connect App ID (10-digit number)
- `APPLE_TEAM_ID`: Apple Developer Team ID

#### Google Play Store:
- `GOOGLE_PLAY_SERVICE_ACCOUNT_KEY_PATH`: Path to service account JSON file
- Or upload the JSON content as `GOOGLE_PLAY_SERVICE_ACCOUNT_KEY` secret

## 📋 Setup Steps

1. **Go to GitHub Repository**:
   ```
   https://github.com/unfoldingword/my-expo-app/settings/secrets/actions
   ```

2. **Add Required Secrets**:
   - Click "New repository secret"
   - Name: `EXPO_TOKEN`
   - Value: [paste the token from expo.dev]
   - Click "Add secret"

3. **Test the Setup**:
   - Go to Actions tab
   - Run "EAS Build Only" workflow manually
   - Should build successfully

## 🚀 How It Works

### Automatic Triggers:
- **Pull Requests** → Preview builds (APK/IPA for testing)
- **Main/Master branch** → Production builds (AAB/IPA for stores)
- **Develop branch** → Preview builds
- **Manual trigger** → Choose platform and profile

### Build Profiles:
- **Preview**: Internal distribution, APK for Android
- **Production**: Store-ready builds, AAB for Google Play

## 🛠️ Troubleshooting

If builds fail:
1. Check EXPO_TOKEN is valid and not expired
2. Verify unfoldingword account has access to this project
3. Check EAS project is properly initialized

## 📞 Contact
If you need help with setup, contact the developer team.

---
**Next Steps After Setup**:
1. Merge this branch to main
2. First automatic build will trigger
3. Monitor builds at [expo.dev/accounts/unfoldingword/projects](https://expo.dev/accounts/unfoldingword/projects)
