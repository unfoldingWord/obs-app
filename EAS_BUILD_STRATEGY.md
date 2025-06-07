# EAS Build Strategy (Free Plan Optimized)

## 🎯 **Conservative Build Approach**

This project uses a **conservative EAS build strategy** optimized for free plan usage, minimizing unnecessary builds while maintaining full development capabilities.

## 🚀 **When Builds Trigger Automatically**

### **Production Builds (Automatic)**
- **Trigger**: Push to `main` branch
- **Profile**: `production`
- **Platforms**: `all` (iOS + Android)
- **Purpose**: Store-ready releases only
- **Output**: AAB (Google Play) + IPA (App Store)

```bash
# This triggers production build:
git push origin main
```

## 🔧 **Manual Build Control**

### **All Other Builds (Manual Only)**
- **Feature testing** → Manual trigger
- **PR validation** → Manual trigger
- **Release candidate testing** → Manual trigger
- **Hotfix builds** → Manual trigger

### **How to Trigger Manual Builds**

#### **Via GitHub Actions UI**
1. Go to **Actions** tab
2. Select **"EAS Build (Conservative - Free Plan)"**
3. Click **"Run workflow"**
4. Choose:
   - **Platform**: `android`, `ios`, or `all`
   - **Profile**: `development`, `preview`, or `production`
   - **Branch**: Leave empty for current, or specify branch name

#### **Common Manual Build Scenarios**

```bash
# Test feature branch
Platform: android
Profile: preview
Branch: feature/my-feature

# Release candidate testing
Platform: all
Profile: production
Branch: release/v1.2.0

# Quick development build
Platform: android
Profile: development
Branch: develop
```

## 📊 **Build Profiles Explained**

### **Development** (`development`)
- **Purpose**: Development client with hot reload
- **Distribution**: Internal only
- **Use case**: Local development testing
- **Cost**: ⚡ Fast, minimal build time

### **Preview** (`preview`)
- **Purpose**: Internal testing builds
- **Android**: APK (direct install)
- **iOS**: IPA (TestFlight/direct install)
- **Use case**: Team testing, stakeholder demos
- **Cost**: 💰 Moderate build time

### **Production** (`production`)
- **Purpose**: Store submission ready
- **Android**: AAB (Google Play Store)
- **iOS**: IPA (App Store)
- **Use case**: Store releases only
- **Cost**: 💰💰 Full build time + store optimization

## 🛡️ **Build Budget Management**

### **Free Plan Limits** (as of 2024)
- **Build minutes**: Limited per month
- **Concurrent builds**: 1
- **Priority**: Lower than paid plans

### **Optimization Strategies**

#### **1. Platform Selection**
```bash
# Use single platform for testing
Platform: android     # Faster, cheaper for testing
Platform: ios         # When iOS-specific testing needed
Platform: all         # Only for releases
```

#### **2. Profile Selection**
```bash
# Choose appropriate profile
development → Fastest builds
preview     → Good for testing
production  → Only for releases
```

#### **3. Smart Branch Strategy**
```bash
# Build only when necessary
feature/x   → Manual builds only
develop     → Manual builds only
main        → Automatic production builds (releases)
```

## 🔄 **Development Workflow**

### **Feature Development**
```bash
# 1. Develop locally
expo start

# 2. Test on device (when needed)
# Manual trigger: platform=android, profile=development

# 3. Create PR (no automatic build)
# Manual trigger if build testing needed

# 4. Merge to develop (no automatic build)
# Manual trigger for integration testing if needed
```

### **Release Process**
```bash
# 1. Create release branch
git checkout -b release/v1.2.0

# 2. Test release candidate (manual)
# Manual trigger: platform=all, profile=production

# 3. Merge to main (automatic production build)
git checkout main
git merge release/v1.2.0
git push origin main  # ← Triggers automatic production build
```

### **Hotfix Process**
```bash
# 1. Create hotfix branch
git checkout -b hotfix/critical-fix

# 2. Test fix (manual)
# Manual trigger: platform=android, profile=preview

# 3. Merge to main (automatic production build)
git checkout main
git merge hotfix/critical-fix
git push origin main  # ← Triggers automatic production build
```

## 💡 **Best Practices**

### **1. Test Locally First**
```bash
# Always test locally before building
expo start
# Use simulators/emulators for most testing
```

### **2. Use Preview Builds for Validation**
```bash
# Before production builds, validate with preview
Profile: preview  # Test functionality
Profile: production  # Only when ready for store
```

### **3. Batch Testing**
```bash
# Test multiple features together
# Instead of: 5 separate builds for 5 features
# Do: 1 build after merging multiple features
```

### **4. Strategic Platform Testing**
```bash
# Start with one platform
Platform: android  # Usually faster
# Add iOS when Android validates
Platform: all     # For final releases
```

## 📈 **Monitoring Usage**

### **Track Build Minutes**
- Monitor at: https://expo.dev/accounts/unfoldingword/settings/billing
- Check remaining quota before major builds
- Plan builds around monthly limits

### **Build History**
- Review at: https://expo.dev/accounts/unfoldingword/projects/obs-app
- Analyze which builds were necessary
- Optimize future build decisions

## 🚨 **Emergency Overrides**

### **When You Need More Builds**
If you hit plan limits:

1. **Upgrade temporarily** to paid plan
2. **Use local builds** with `expo build` (deprecated) or `eas build --local`
3. **Prioritize critical builds** only
4. **Coordinate with team** to reduce parallel development

### **Critical Release Process**
For urgent releases when quota is low:
```bash
# Skip preview builds, go straight to production
Manual trigger:
  Platform: all
  Profile: production
  Branch: hotfix/critical
```

## 📞 **Getting Help**

### **Build Failed?**
1. Check build logs at expo.dev
2. Verify eas.json configuration
3. Check EXPO_TOKEN is valid
4. Review this guide for proper usage

### **Need More Builds?**
1. Review your build history
2. Optimize your workflow
3. Consider upgrading EAS plan
4. Use local development more

---

**💰 Cost-Conscious Summary**: Only automatic builds on `main` (releases), everything else manual. Maximize local development, minimize cloud builds, optimize for your free plan quota.

**🎯 Goal**: Professional development workflow without exceeding free plan limits.
