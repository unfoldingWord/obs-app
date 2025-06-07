# 🔧 Admin Setup Guide for Open Bible Stories Mobile App

## 👤 **Who This Is For**

- **Expo Account Admin** for unfoldingword organization
- **GitHub Repository Admin** for obs-app repository
- **Role**: Set up everything needed for automated builds and store submissions

## 🎯 **What Our Workflows Do**

- ✅ **Automatic builds** when you create GitHub releases
- ✅ **Automatic store submission** to Apple App Store and Google Play Store
- ✅ **Version management** - automatically updates app versions
- ✅ **Release notes** - automatically enhances GitHub releases with build info

---

## 🚨 **PHASE 1: ESSENTIAL SETUP (Required for Builds)**

### **Step 1: Create EXPO_TOKEN**

**⚠️ CRITICAL: This is required for ANY builds to work**

#### **1.1 Create Access Token on Expo**

1. Go to **<https://expo.dev/accounts/unfoldingword/settings/access-tokens>**
2. Click **"Create Token"**
3. **Name**: `GitHub Actions - OBS App`
4. **Permissions**: Leave default (full access)
5. Click **"Create"**
6. **⚠️ COPY THE TOKEN** - you won't see it again!

#### **1.2 Add Token to GitHub Repository**

1. Go to **<https://github.com/unfoldingword/obs-app>**
2. Click **Settings** tab
3. Go to **Secrets and variables** → **Actions**
4. Click **"New repository secret"**
5. **Name**: `EXPO_TOKEN`
6. **Value**: [paste the token from step 1.1]
7. Click **"Add secret"**

#### **1.3 GitHub Token (Automatic - No Setup Needed)**

**ℹ️ GOOD NEWS**: `GITHUB_TOKEN` is automatically provided by GitHub Actions - you don't need to set this up!

- **What it does**: Allows workflows to update release notes and interact with repository
- **Setup required**: ✅ **NONE** - GitHub provides this automatically
- **Used for**: Enhancing release notes with build information

### **Step 2: Test Build**

After adding EXPO_TOKEN:

1. Go to **Actions** tab in GitHub
2. Select **"EAS Build (Conservative - Free Plan)"**
3. Click **"Run workflow"**
4. Choose:
   - **Platform**: `android` (faster for testing)
   - **Profile**: `preview`
   - **Branch**: leave empty
5. Click **"Run workflow"**

**✅ Success**: Build completes successfully
**❌ Problem**: Check that EXPO_TOKEN was added correctly

---

## 🧪 **DRY RUN TESTING (Test Store Submission Without Publishing)**

**⚠️ IMPORTANT**: You can test store submission setup WITHOUT actually publishing to the stores!

### **Option 1: Internal Testing Tracks (RECOMMENDED)**

Our `eas.json` is already configured for safe testing:

#### **Android Internal Testing** (Already Configured)

- **Track**: `internal` (configured in eas.json)
- **What it does**: Submits to Google Play's internal testing track
- **Result**: NOT published publicly - only for internal testers
- **Safety**: ✅ Safe - won't appear in Play Store

#### **iOS TestFlight** (Safe Testing)

- **What it does**: Submits to TestFlight for internal testing
- **Result**: NOT published publicly - only for internal testers
- **Safety**: ✅ Safe - won't appear in App Store

### **Option 2: Test Workflow with Build-Only**

Test the complete workflow without store submission:

#### **2.1 Manual Test (No Store Submission)**

1. Go to **Actions** → **"EAS Build and Store Submission"**
2. Click **"Run workflow"**
3. Choose:
   - **submit_to_stores**: `false` ← Important!
   - **platform**: `android`
4. **Result**: Builds successfully but skips store submission

#### **2.2 Full Workflow Test**

```bash
# Test locally with EAS CLI (if you have credentials set up):
eas submit --platform android --latest --non-interactive
# This will do a real submission to internal track (safe)
```

### **Option 3: Test Store Credentials Setup**

Before doing any submission, test that your credentials work:

#### **3.1 Test EAS Login**

```bash
# Install EAS CLI locally
npm install -g eas-cli

# Login as unfoldingword organization
eas login

# Check project is linked
eas project:info
```

#### **3.2 Test Store Credential Access**

```bash
# Test iOS credentials (will prompt if not set up)
eas submit --platform ios --help

# Test Android credentials (will prompt if not set up)
eas submit --platform android --help
```

### **Testing Strategy: Progressive Safety**

#### **Phase 1: Build Testing** ✅ **SAFE**

- Test GitHub Actions workflows
- Test EAS builds complete successfully
- **NO store interaction**

#### **Phase 2: Internal Track Testing** ✅ **SAFE**

- Submit to Google Play internal track
- Submit to iOS TestFlight
- **NOT visible to public**

#### **Phase 3: Production Publishing** ⚠️ **LIVE**

- Submit to Google Play production
- Submit to iOS App Store
- **Visible to public after review**

---

## 🏪 **PHASE 2: STORE SUBMISSION SETUP (Optional - For Full Automation)**

*Note: You can skip this phase and still get working builds. Add store submission later when ready.*

### **Step 3: Set Up App Store Accounts**

#### **3.1 Apple App Store (iOS) - $99/year**

1. **Enroll in Apple Developer Program**
   - Go to **<https://developer.apple.com/programs/>**
   - Choose **Organization** account (not individual)
   - Complete enrollment ($99/year)

2. **Create App in App Store Connect**
   - Go to **<https://appstoreconnect.apple.com>**
   - Click **"My Apps"** → **"+"** → **"New App"**
   - Fill in:
     - **Platform**: iOS
     - **Name**: `Open Bible Stories`
     - **Primary Language**: English
     - **Bundle ID**: `com.unfoldingword.obsapp` (matches app.json)
     - **SKU**: `com.unfoldingword.obsapp`
   - Click **"Create"**

3. **Gather Required Information**
   - **Apple ID**: Your Apple Developer account email
   - **ASC App ID**: From App Store Connect URL (10-digit number)
   - **Apple Team ID**: From developer.apple.com → Account → Membership

#### **3.2 Google Play Store (Android) - $25 one-time**

1. **Create Google Play Console Account**
   - Go to **<https://play.google.com/console>**
   - Pay $25 one-time registration fee
   - Complete account verification

2. **Create App in Play Console**
   - Click **"Create app"**
   - Fill in:
     - **App name**: `Open Bible Stories`
     - **Default language**: English
     - **App or game**: App
     - **Free or paid**: Free
   - Click **"Create app"**

3. **Set Up API Access**
   - Go to **Setup** → **API access**
   - **Create service account** (follow Google Cloud Console flow)
   - **Download JSON key file**
   - **Grant permissions**: "Release apps to production"

### **Step 4: Set Up EAS Environment Variables**

#### **4.1 Access EAS Environment Variables**

1. Go to **<https://expo.dev/accounts/unfoldingword/projects/obs-app/environment-variables>**
2. Sign in with unfoldingword account

#### **4.2 Create iOS Credentials (if you set up Apple Developer)**

Click **"Create Variable"** for each:

**Variable 1:**

- **Name**: `APPLE_ID`
- **Value**: `your-apple-developer-email@unfoldingword.org`
- **Environment**: `production`
- **Visibility**: `Sensitive`

**Variable 2:**

- **Name**: `ASC_APP_ID`
- **Value**: `1234567890` (your 10-digit App Store Connect App ID)
- **Environment**: `production`
- **Visibility**: `Sensitive`

**Variable 3:**

- **Name**: `APPLE_TEAM_ID`
- **Value**: `ABCD123456` (your Apple Team ID)
- **Environment**: `production`
- **Visibility**: `Sensitive`

#### **4.3 Create Android Credentials (if you set up Google Play)**

Click **"Create Variable"**:

- **Name**: `GOOGLE_SERVICES_JSON`
- **Type**: `File` ← Important!
- **Upload**: The JSON file from Google Cloud Console
- **Environment**: `production`
- **Visibility**: `Secret`

### **Step 5: Test Store Submission (SAFE - Internal Tracks)**

**⚠️ SAFE TESTING**: This submits to internal tracks only - NOT public stores

1. Go to **Actions** tab in GitHub
2. Select **"EAS Build and Store Submission"**
3. Click **"Run workflow"**
4. Choose:
   - **submit_to_stores**: `true`
   - **platform**: `android` (test one platform first)
5. Click **"Run workflow"**

**✅ Success**: Build completes and submits to **internal track** (safe)
**❌ Problem**: Check EAS environment variables are set correctly

**📱 Result**:

- **Android**: Submitted to Google Play **internal track** (not public)
- **iOS**: Submitted to **TestFlight** (not public)

---

## 📋 **SETUP CHECKLIST**

### **✅ Phase 1: Essential (Required)**

- [ ] **EXPO_TOKEN** created on Expo website
- [ ] **EXPO_TOKEN** added to GitHub repository secrets
- [ ] ✅ **GITHUB_TOKEN** (automatic - no setup needed)
- [ ] **Test build** completed successfully

### **✅ Dry Run Testing (Recommended)**

- [ ] **Build-only test** completed (submit_to_stores: false)
- [ ] **EAS CLI** login tested
- [ ] **Project info** verified

### **✅ Phase 2: Store Submission (Optional)**

- [ ] **Apple Developer Program** enrollment ($99/year)
- [ ] **Apple App Store** app created
- [ ] **Google Play Console** account created ($25 one-time)
- [ ] **Google Play** app created
- [ ] **EAS environment variables** created for iOS credentials
- [ ] **EAS environment variables** created for Android credentials
- [ ] **Internal track submission** tested successfully

### **✅ Production Ready (When Ready to Go Live)**

- [ ] **Internal testing** completed and validated
- [ ] **Team approval** for public release
- [ ] **Store review guidelines** understood
- [ ] **Production submission** process tested

---

## 🆘 **TROUBLESHOOTING**

### **Build Fails with "Authentication Error"**

**Problem**: EXPO_TOKEN is missing or invalid
**Solution**:

1. Check EXPO_TOKEN exists in GitHub secrets
2. Verify token was created from unfoldingword account (not personal)
3. Try creating a new token

### **Store Submission Fails**

**Problem**: Missing or incorrect EAS environment variables
**Solution**:

1. Check all required variables exist in EAS dashboard
2. Verify Apple App Store Connect app is created
3. Verify Google Play Console app is created
4. Try manual submission first: `eas submit --platform ios`

### **"Can't Test Without Publishing" Worry**

**Solution**: ✅ **You CAN test safely!**

1. Use **build-only** mode first (submit_to_stores: false)
2. Use **internal tracks** for safe submission testing
3. Internal tracks are NOT visible to public users

### **Can't Access Expo/GitHub**

**Problem**: Permissions or account access
**Solution**:

1. Ensure you're admin of unfoldingword Expo organization
2. Ensure you're admin of unfoldingword/obs-app GitHub repository
3. Contact unfoldingword organization owner if needed

---

## 📚 **HELPFUL LINKS**

### **Essential Links**

- **Expo Account**: <https://expo.dev/accounts/unfoldingword>
- **GitHub Repository**: <https://github.com/unfoldingword/obs-app>
- **EAS Environment Variables**: <https://expo.dev/accounts/unfoldingword/projects/obs-app/environment-variables>

### **Documentation**

- **EAS Environment Variables Guide**: <https://docs.expo.dev/eas/environment-variables/>
- **iOS Store Setup**: <https://docs.expo.dev/submit/ios/>
- **Android Store Setup**: <https://docs.expo.dev/submit/android/>

### **Store Dashboards**

- **App Store Connect**: <https://appstoreconnect.apple.com>
- **Google Play Console**: <https://play.google.com/console>
- **EAS Dashboard**: <https://expo.dev/accounts/unfoldingword/projects/obs-app>

---

## 🎉 **RESULT**

Once setup is complete:

### **✅ What Works Automatically**

1. **Create GitHub Release** → Automatic build + store submission
2. **Version management** → App versions auto-updated from release tags
3. **Build tracking** → Release notes enhanced with build information
4. **Store monitoring** → Links provided to track submission status

### **✅ What You Can Do**

- **Manual builds** via GitHub Actions
- **Release management** via GitHub Releases
- **Build monitoring** via EAS Dashboard
- **Store management** via App Store Connect / Google Play Console

### **✅ Safe Testing Options**

- **Build-only testing** → No store interaction
- **Internal track testing** → Safe submission testing (not public)
- **Progressive validation** → Test each step before going live

### **🎯 Next Steps**

1. **Complete Phase 1** (EXPO_TOKEN) to enable builds
2. **Test builds first** with build-only mode
3. **Add Phase 2** (store credentials) for submission testing
4. **Test with internal tracks** (safe, not public)
5. **Go live** when confident everything works

---

**🚀 You're all set for professional mobile app deployment with safe testing options!**
