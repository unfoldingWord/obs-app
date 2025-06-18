# 🚀 Release Process Guide

## 📋 **Overview**

Our release process is designed to be **automated yet controlled**, ensuring quality releases while minimizing manual work.

## 🎯 **Release Strategy**

### **Release-Triggered Store Submission**
- ✅ **GitHub Release created** → Automatic build + store submission
- ✅ **Full version management** → Auto-update app.json and package.json
- ✅ **Build metadata** → Automatic release notes enhancement
- ✅ **Semantic versioning** → Support for v1.2.3 tag format

## 🔄 **Complete Release Workflow**

### **Step 1: Prepare Release Branch**
```bash
# 1. Create release branch from develop
git checkout develop
git pull origin develop
git checkout -b release/v1.2.0

# 2. Update CHANGELOG.md (manual)
# Add release notes, breaking changes, new features

# 3. Final testing
# Manual EAS build if needed:
# Actions → "EAS Build (Conservative)" → Run workflow

# 4. Create PR to main
git push origin release/v1.2.0
# Create PR: release/v1.2.0 → main
```

### **Step 2: Create GitHub Release**
```bash
# Option A: Via GitHub UI (Recommended)
1. Go to Releases → "Create a new release"
2. Tag: v1.2.0 (new tag)
3. Target: main (after merging release PR)
4. Title: "v1.2.0 - Feature Release"
5. Description: Copy from CHANGELOG.md
6. Click "Publish release"

# Option B: Via CLI
gh release create v1.2.0 \
  --title "v1.2.0 - Feature Release" \
  --notes-file CHANGELOG_EXCERPT.md \
  --target main
```

### **Step 3: Automatic Process (No Action Needed)**
Once you publish the release, the workflow automatically:

1. **✅ Extracts version** from tag (`v1.2.0` → `1.2.0`)
2. **✅ Updates app.json**:
   - `expo.version`: `"1.2.0"`
   - `expo.android.versionCode`: Auto-increment
   - `expo.ios.buildNumber`: Auto-increment
3. **✅ Updates package.json** version
4. **✅ Creates production builds** for iOS + Android
5. **✅ Submits to stores** (App Store + Google Play)
6. **✅ Updates release notes** with build information

## 📱 **Version Management**

### **Semantic Versioning**
We follow [semver](https://semver.org/) format:
```
v1.2.3
│ │ │
│ │ └── PATCH: Bug fixes
│ └──── MINOR: New features (backward compatible)
└────── MAJOR: Breaking changes
```

### **Automatic Version Updates**
The workflow automatically updates:

#### **app.json**
```json
{
  "expo": {
    "version": "1.2.0",          ← From GitHub tag
    "android": {
      "versionCode": 123         ← Auto-incremented
    },
    "ios": {
      "buildNumber": "124"       ← Auto-incremented
    }
  }
}
```

#### **package.json**
```json
{
  "version": "1.2.0"            ← From GitHub tag
}
```

## 🏪 **Store Submission Process**

### **Automatic Submission**
When you create a release, apps are automatically submitted to:

#### **Apple App Store**
- **Status**: Pending Review
- **Track**: Production
- **Review time**: 1-7 days typically
- **Monitor at**: [App Store Connect](https://appstoreconnect.apple.com)

#### **Google Play Store**
- **Status**: Pending Review
- **Track**: Internal (configurable)
- **Review time**: Few hours to 3 days
- **Monitor at**: [Google Play Console](https://play.google.com/console)

### **Required Secrets** (Account Manager Setup)
```bash
# Essential (for builds)
EXPO_TOKEN=xxx

# Store submission (optional - can submit manually)
APPLE_ID=developer@unfoldingword.org
ASC_APP_ID=1234567890
APPLE_TEAM_ID=ABCD123456
GOOGLE_PLAY_SERVICE_ACCOUNT_KEY_PATH=/path/to/key.json
```

## 📋 **Release Checklist**

### **Pre-Release (Development)**
- [ ] All features implemented and tested
- [ ] PR reviews completed
- [ ] No critical bugs remaining
- [ ] Documentation updated
- [ ] CHANGELOG.md prepared

### **Release Branch**
- [ ] `release/vX.Y.Z` branch created from develop
- [ ] Final testing completed
- [ ] CHANGELOG.md finalized
- [ ] PR to main created and approved

### **GitHub Release**
- [ ] Release created with proper semver tag
- [ ] Release notes added from CHANGELOG
- [ ] Target branch set to `main`
- [ ] Release published

### **Post-Release (Automatic)**
- [ ] ✅ EAS builds triggered
- [ ] ✅ Store submissions started
- [ ] ✅ Release notes updated with build info
- [ ] 📱 Monitor store review progress

### **Post-Release (Manual)**
- [ ] Merge release branch back to develop
- [ ] Monitor app store reviews
- [ ] Respond to any store feedback
- [ ] Announce release to team/users

## 🚨 **Hotfix Process**

For critical bugs that need immediate release:

```bash
# 1. Create hotfix branch from main
git checkout main
git pull origin main
git checkout -b hotfix/v1.2.1

# 2. Fix the critical issue
# Make minimal changes only

# 3. Test the fix
# Manual EAS build to test

# 4. Create PR to main
git push origin hotfix/v1.2.1
# Create PR: hotfix/v1.2.1 → main

# 5. After merge, create hotfix release
gh release create v1.2.1 \
  --title "v1.2.1 - Critical Hotfix" \
  --notes "Fixes critical issue: [description]" \
  --target main

# 6. Merge hotfix back to develop
git checkout develop
git merge hotfix/v1.2.1
git push origin develop
```

## 🔧 **Manual Release Testing**

### **Test Release Process Without Stores**
```bash
# Use manual workflow for testing
Actions → "EAS Build and Store Submission" → Run workflow
Inputs:
  submit_to_stores: false
  platform: android (faster for testing)
```

### **Build Only (No Submission)**
```bash
# Use conservative workflow for development builds
Actions → "EAS Build (Conservative)" → Run workflow
Inputs:
  platform: android
  profile: production
  branch: release/v1.2.0
```

## 📊 **Release Monitoring**

### **Track Release Progress**
1. **EAS Dashboard**: https://expo.dev/accounts/unfoldingword/projects/obs-app
2. **GitHub Actions**: Repository → Actions tab
3. **App Store Connect**: iOS review status
4. **Google Play Console**: Android review status

### **Release Notes Enhancement**
After the workflow completes, your GitHub release will automatically include:

```markdown
## 🚀 Build Information

**App Version:** 1.2.0
**Build Date:** 2024-01-15 14:30:45 UTC
**Platform:** all
**EAS Profile:** production

### 📱 Download Links
- **EAS Dashboard:** https://expo.dev/accounts/unfoldingword/projects/obs-app
- **App Store Connect:** https://appstoreconnect.apple.com (pending review)
- **Google Play Console:** https://play.google.com/console (pending review)

### 🔧 Technical Details
- **Commit:** abc123def456
- **Workflow:** EAS Build and Store Submission
- **Build ID:** Available in EAS dashboard after completion
```

## 🎯 **Best Practices**

### **Release Timing**
- **Major releases**: Coordinate with team, avoid Fridays
- **Minor releases**: Can be done anytime
- **Hotfixes**: As soon as critical fix is ready

### **Version Numbering**
```bash
# Good version progression
v1.0.0 → Initial release
v1.1.0 → New features added
v1.1.1 → Bug fixes
v1.2.0 → More new features
v2.0.0 → Breaking changes
```

### **Release Notes Quality**
- ✅ **User-focused**: What changed for users
- ✅ **Clear sections**: New Features, Improvements, Bug Fixes
- ✅ **Breaking changes**: Clearly highlighted
- ❌ **Technical details**: Keep minimal

## 🆘 **Troubleshooting**

### **Build Fails During Release**
1. Check EAS dashboard for build logs
2. Verify eas.json configuration
3. Check app.json version format
4. Ensure EXPO_TOKEN is valid

### **Store Submission Fails**
1. Check store credentials are set
2. Verify app signing certificates
3. Review store-specific requirements
4. Submit manually from EAS dashboard if needed

### **Version Conflicts**
1. Ensure tag format is `v1.2.3`
2. Check that version doesn't already exist
3. Verify semver progression

---

**🎉 Result**: Professional release process with automatic versioning, building, and store submission, triggered simply by creating a GitHub release!
