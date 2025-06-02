# Open Bible Stories - Android Distribution Workflow

This repository uses GitHub Actions to automatically build and distribute Android APK files for the **Open Bible Stories** app. The workflow provides seamless release management with APK files directly attached to GitHub releases.

## 🚀 How It Works

### Automatic Releases (Recommended)
Create releases with APKs automatically attached:

1. **Create and Push a Tag**:
   ```bash
   git tag v1.2.3
   git push origin v1.2.3
   ```

2. **Workflow Triggers Automatically**:
   - Builds APK using your existing `npm run build:android:release` script
   - Creates a GitHub release with the tag
   - **Automatically attaches the APK** to the release
   - Includes build info and release notes

3. **Download Ready**:
   - Go to [Releases page](https://github.com/abelpz/my-expo-app/releases)
   - Download `obs-app-v1.2.3.apk` directly from the release

### Manual Builds
For testing or custom builds:

1. **Go to Actions Tab** → **Build Android Release**
2. **Click "Run workflow"**
3. **Optional Settings**:
   - **Version Bump**: patch/minor/major (updates package.json)
   - **Create Release**: Check to create GitHub release after build
4. **Click "Run workflow"**

## 📱 Installation Guide

### For Users
1. **Download APK**: Go to [Releases](https://github.com/abelpz/my-expo-app/releases) and download the latest `obs-app-v*.*.*.apk`
2. **Enable Unknown Sources**: Android Settings → Security → Unknown Sources → Enable
3. **Install**: Tap the APK file and follow installation prompts
4. **Launch**: Find "Open Bible Stories" in your app drawer

### For Ministry Distribution
Perfect for sharing God's Word in areas with limited connectivity:

- **📧 Email**: Attach APK file to emails
- **💾 USB/SD**: Copy APK to storage devices
- **📱 Direct Transfer**: Send via Bluetooth, WiFi Direct, or file sharing apps
- **🌐 Website**: Host APK on your ministry website
- **☁️ Cloud**: Share via Google Drive, Dropbox, etc.

## 🔧 Workflow Features

### Build Capabilities
- ✅ Uses your existing `npm run build:android:release` script
- ✅ Automatic version management
- ✅ Proper Android signing and optimization
- ✅ SQLite database with Drizzle ORM support
- ✅ Expo Router navigation
- ✅ Dark mode support

### Artifacts Generated
Each build produces:
- **`obs-app-v*.*.*.apk`** - Ready-to-install Android app
- **`build-info.json`** - Build metadata and version info
- **`RELEASE-NOTES.md`** - User-friendly installation instructions

### Automatic Release Creation
When triggered by tags (v*.*.*), the workflow:
1. 🏗 Builds the APK
2. 📝 Generates release notes
3. 🚀 Creates GitHub release
4. 📎 **Attaches APK directly to the release**
5. 📊 Updates version in app.json if needed

## 📋 Workflow Triggers

| Trigger | When | Result |
|---------|------|--------|
| **Tag Push** | `git push origin v1.2.3` | ✅ Build APK + Create Release with APK attached |
| **Manual Run** | Actions tab → Run workflow | ✅ Build APK + Optional release creation |
| **Manual + Release** | Manual run with "Create Release" checked | ✅ Build APK + Create Release with APK attached |

## 🏷️ Version Management

### Recommended Tagging
```bash
# Patch release (1.0.1)
git tag v1.0.1
git push origin v1.0.1

# Minor release (1.1.0)
git tag v1.1.0
git push origin v1.1.0

# Major release (2.0.0)
git tag v2.0.0
git push origin v2.0.0
```

### Manual Version Bumping
When running manually, you can automatically bump the version:
- **patch**: 1.0.0 → 1.0.1
- **minor**: 1.0.0 → 1.1.0  
- **major**: 1.0.0 → 2.0.0

## 🌍 Perfect for Ministry

### Use Cases
- **🌏 Missionaries**: Offline Bible stories for remote areas
- **⛪ Churches**: Easy distribution to congregation
- **📚 Translation Teams**: Test new language versions
- **👨‍👩‍👧‍👦 Families**: Engaging Bible stories for children
- **📖 Study Groups**: Visual Bible story discussions

### Distribution Benefits
- **📶 Works Offline**: No internet required after installation
- **🔒 No App Store**: Direct installation bypass
- **💾 Small Size**: Optimized for low-bandwidth areas
- **🌍 Multi-language**: Ready for localization
- **📱 Universal**: Works on all Android devices

## 🔧 Technical Details

### Build Process
1. **Checkout** code from repository
2. **Install** Node.js dependencies with `npm ci`
3. **Setup** Java 17 and Android build tools
4. **Prebuild** with Expo for Android
5. **Build** release APK with your existing script
6. **Sign** and optimize APK for distribution
7. **Create** GitHub release with APK attached

### Requirements Met
- ✅ SQLite database with Drizzle ORM
- ✅ Expo Router for navigation
- ✅ React Native screens optimization
- ✅ Gesture handling support
- ✅ Status bar configuration
- ✅ Dark mode support

## 📞 Support

- **Issues**: [GitHub Issues](https://github.com/abelpz/my-expo-app/issues)
- **Documentation**: [Main README](../README.md)
- **Releases**: [Download APKs](https://github.com/abelpz/my-expo-app/releases)

---

**Built with ❤️ for global Bible translation and distribution**  
**unfoldingWord** - Providing unrestricted biblical content in every language 