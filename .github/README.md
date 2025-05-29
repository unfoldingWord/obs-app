# GitHub Actions Setup for Automated Releases

This repository includes GitHub Actions workflows that automatically build and release Android APK and iOS IPA files when a new release is created using **native build processes** (no EAS required).

## 🚀 Multiple Ways to Trigger Builds

### 1. Automatic Release Builds
When you create a GitHub release, builds are automatically triggered and artifacts are uploaded to the release.

### 2. Manual Testing Builds
You can manually trigger builds for testing without creating a release:

- Go to **Actions** tab in your repository
- Select **"Build and Release Apps"** workflow  
- Click **"Run workflow"**
- Choose options:
  - **Build type**: `test` (for testing) or `release` (for production)
  - **Upload to release**: Leave empty for testing, or enter a tag name to upload to existing release

### 3. Automatic Branch Builds
Builds are automatically triggered when you push to:
- `main` branch
- Any `release/*` branch (e.g., `release/v1.0.0`)

## 📦 Where to Find Your Built Apps

### For Release Builds:
- APK/IPA files are attached to the GitHub release

### For Testing Builds:
- Go to the **Actions** tab
- Click on the completed workflow run
- Scroll down to **"Artifacts"** section
- Download:
  - `android-apk` - Contains the APK file
  - `ios-ipa` - Contains the IPA file
- Artifacts are kept for 30 days

## Setup Instructions

### 1. No Expo Token Required! 🎉

Unlike EAS-based workflows, this setup uses native Android Gradle builds and Xcode builds, so you don't need any Expo authentication tokens.

### 2. iOS Code Signing Setup (iOS only)

For iOS builds, you'll need to configure code signing:

1. **Update Team ID:**
   - Edit `ios/exportOptions.plist`
   - Replace `YOUR_TEAM_ID` with your Apple Developer Team ID

2. **Add Certificates (if needed):**
   - For more complex signing requirements, you may need to add certificates as GitHub secrets
   - The current setup uses automatic signing

### 3. Creating a Release

When you're ready to release:

1. **Tag your release:**
   ```bash
   git tag v1.0.0
   git push origin v1.0.0
   ```

2. **Create GitHub Release:**
   - Go to your repository on GitHub
   - Click "Releases" → "Create a new release"
   - Choose your tag (v1.0.0)
   - Fill in release notes
   - Click "Publish release"

3. **Automatic Build Process:**
   - The GitHub Action will automatically trigger
   - Android: Uses Gradle to build APK natively
   - iOS: Uses Xcode to build IPA natively
   - The built files will be attached to the release

### 4. Build Process Details

- **Android:** 
  - Uses `expo prebuild` to generate native Android code
  - Builds APK using Gradle (`./gradlew assembleRelease`)
  - No EAS or authentication required

- **iOS:** 
  - Uses `expo prebuild` to generate native iOS code
  - Builds IPA using Xcode command line tools
  - Requires valid Apple Developer setup for code signing

### 5. Expected Artifacts

After a successful build, your release will include:
- `obs-app-v1.0.0.apk` - Android application
- `obs-app-v1.0.0.ipa` - iOS application

## Troubleshooting

### Common Issues

1. **Android Build Failures:**
   - Check that `android/gradlew` has proper permissions
   - Ensure Java 17 is being used (handled automatically)
   - Verify Android SDK components are available

2. **iOS Build Issues:**
   - Update your Team ID in `ios/exportOptions.plist`
   - Ensure your Apple Developer account has valid certificates
   - Check that the iOS project scheme name matches your app

3. **Prebuild Issues:**
   - Make sure `app.json` has correct configuration
   - Verify all required Expo plugins are properly configured

### Manual Testing

You can test the build process locally:

```bash
# Install dependencies
npm install

# Test Android build
npm run prebuild
npm run build:android:release

# Test iOS build (macOS only)
npm run prebuild
cd ios && pod install
xcodebuild -workspace *.xcworkspace -scheme obs-app -configuration Release
```

### Local Build Scripts

The following npm scripts are available for local development:

- `npm run build:android:release` - Build Android APK
- `npm run build:android:debug` - Build debug APK
- `npm run install:android:release` - Install release APK on device

## Workflow Details

The workflow consists of two parallel jobs:

1. **build-android**: 
   - Runs on Ubuntu
   - Sets up Java 17 and Android SDK
   - Uses Expo prebuild + Gradle

2. **build-ios**: 
   - Runs on macOS
   - Sets up Xcode and CocoaPods
   - Uses Expo prebuild + Xcode

### Advantages of Native Builds

✅ **No Authentication Required** - No Expo tokens needed  
✅ **Faster Builds** - No cloud build queue  
✅ **Full Control** - Direct access to native build tools  
✅ **Free** - No EAS build credits required  
✅ **Debugging** - Full build logs available in Actions 