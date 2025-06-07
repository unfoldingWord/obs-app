# 🔐 GitHub Secrets Setup Guide

## 📋 **Overview**

This guide covers GitHub repository secrets needed for your EAS workflows and explains the **better alternatives** for store credentials.

## 🚨 **Critical Requirements**

### **1. EXPO_TOKEN (Essential - Required for ALL builds)**

**Status**: ⚠️ **MISSING - Must be added by unfoldingword account manager**

```bash
# What it is:
Personal access token from your Expo account

# Where to get it:
1. Go to https://expo.dev/accounts/unfoldingword/settings/access-tokens
2. Click "Create Token"
3. Name: "GitHub Actions CI/CD"
4. Copy the token (save it securely!)

# How to add to GitHub:
Repository Settings → Secrets and variables → Actions → New repository secret
Name: EXPO_TOKEN
Value: [paste your token]
```

**⚠️ Important**: This token must be from the **unfoldingword** organization account, not a personal account.

## 🎯 **Store Credentials: Better Options Available!**

### **🚫 OLD WAY: GitHub Secrets (Not Recommended)**
```bash
# ❌ Your old setup required these GitHub secrets:
# APPLE_ID, ASC_APP_ID, APPLE_TEAM_ID, GOOGLE_PLAY_SERVICE_ACCOUNT_KEY_PATH
```

### **✅ NEW WAY: EAS Secrets (RECOMMENDED)**

**Benefits**:
- 🔒 **More secure**: Stored directly on EAS servers
- 🚀 **Easier setup**: No GitHub secrets needed
- 🔧 **Better management**: Use EAS CLI to manage credentials
- 🌐 **Cross-project**: Can be shared across projects

### **Option 1: EAS Secrets (Best for Production)**

```bash
# Set up store credentials directly on EAS:
eas secret:create --scope project --name APPLE_ID --value "developer@unfoldingword.org"
eas secret:create --scope project --name ASC_APP_ID --value "1234567890"
eas secret:create --scope project --name APPLE_TEAM_ID --value "ABCD123456"

# For Google Play - upload the JSON file:
eas secret:create --scope project --name GOOGLE_SERVICES_JSON --type file --value ./google-services.json
```

### **Option 2: Interactive Setup (Easiest)**

```bash
# Even simpler - EAS will prompt for credentials when needed:
eas submit --platform ios
# EAS CLI will ask for Apple ID, App Store Connect App ID, etc.
# Credentials are stored securely for future use
```

## 🔧 **Updated Setup Process**

### **Required GitHub Secrets (Minimal)**

| Secret Name | Required | Purpose | Who Sets Up |
|-------------|----------|---------|-------------|
| `EXPO_TOKEN` | ⚠️ **YES** | EAS builds & operations | unfoldingword manager |

### **Store Credentials (Use EAS Secrets Instead)**

| Platform | Setup Method | Command |
|----------|--------------|---------|
| **iOS** | EAS Secrets | `eas secret:create --scope project --name APPLE_ID --value "developer@unfoldingword.org"` |
| **Android** | EAS Secrets | `eas secret:create --scope project --name GOOGLE_SERVICES_JSON --type file --value ./google-services.json` |
| **Both** | Interactive | `eas submit` (will prompt for credentials) |

## 🎯 **Migration Guide**

### **From GitHub Secrets to EAS Secrets**

If you previously set up GitHub secrets, here's how to migrate:

#### **Step 1: Remove GitHub Secrets (Optional)**
```bash
# These GitHub secrets are no longer needed:
# - APPLE_ID
# - ASC_APP_ID
# - APPLE_TEAM_ID
# - GOOGLE_PLAY_SERVICE_ACCOUNT_KEY_PATH

# You can delete them from: Repository → Settings → Secrets and variables → Actions
```

#### **Step 2: Set Up EAS Secrets**
```bash
# For iOS (after getting Apple Developer account):
eas secret:create --scope project --name APPLE_ID --value "developer@unfoldingword.org"
eas secret:create --scope project --name ASC_APP_ID --value "1234567890"
eas secret:create --scope project --name APPLE_TEAM_ID --value "ABCD123456"

# For Android (after setting up Google Play):
eas secret:create --scope project --name GOOGLE_SERVICES_JSON --type file --value ./path/to/google-services.json
```

#### **Step 3: Test Store Submission**
```bash
# Test that credentials work:
eas submit --platform ios --latest
eas submit --platform android --latest
```

## 🏗️ **App Store Setup Requirements**

### **Apple App Store Setup**
1. **Apple Developer Program** ($99/year)
2. **Create app in App Store Connect**
3. **Use EAS secrets** or interactive setup

### **Google Play Store Setup**
1. **Google Play Console** ($25 one-time)
2. **Create app in Play Console**
3. **Set up service account** for API access
4. **Use EAS secrets** or interactive setup

## ⚡ **Quick Setup Checklist**

### **Phase 1: Get Building (This Week)**
- [ ] **EXPO_TOKEN**: Must be added by unfoldingword account manager
- [ ] Test first build after EXPO_TOKEN is added

### **Phase 2: Store Publishing (When Ready)**
- [ ] Set up Apple Developer Program (for iOS)
- [ ] Set up Google Play Console (for Android)
- [ ] Use **EAS secrets** for credentials (recommended)
- [ ] OR use **interactive setup** for simplicity

### **No Longer Needed**
- [ ] ~~GitHub secrets for store credentials~~ ✅ **Not needed!**
- [ ] ~~Manual credential management~~ ✅ **EAS handles this!**

## 💡 **Why EAS Secrets Are Better**

### **Security Benefits**
- 🔒 **Encrypted storage** on EAS servers
- 🛡️ **No exposure** in GitHub repository
- 🔐 **Granular access** control
- 📊 **Audit logging** of credential usage

### **Operational Benefits**
- 🚀 **Easier CI/CD** - no GitHub secret management
- 🔄 **Credential rotation** without updating workflows
- 📱 **Cross-platform** credential sharing
- 🎯 **Project-specific** or account-wide options

## 📞 **Who to Contact**

### **For EXPO_TOKEN Setup**
- **Contact**: unfoldingword organization account manager
- **Needed**: Admin access to unfoldingword Expo organization
- **Action**: Create access token and add to GitHub secrets

### **For Store Credentials**
- **Apple**: Team member with Apple Developer access
- **Google**: Team member with Google Play Console access
- **Setup**: Use `eas secret:create` commands above

---

**🎉 Result**: Simplified setup with better security! Only EXPO_TOKEN needed in GitHub, everything else handled by EAS directly.
