# Open Bible Stories (OBS) Mobile App

<div align="center">
  <img src="./assets/splash-icon.png" alt="OBS App Icon" width="120" height="120">

  **A free and open-source Bible app for reading illustrated Bible stories**

  [![React Native](https://img.shields.io/badge/React%20Native-0.76.9-blue.svg)](https://reactnative.dev/)
  [![Expo](https://img.shields.io/badge/Expo-~52.0.46-black.svg)](https://expo.dev/)
  [![TypeScript](https://img.shields.io/badge/TypeScript-~5.3.3-blue.svg)](https://www.typescriptlang.org/)
  [![License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)
</div>

## 📖 About

Open Bible Stories is a free and open-source Bible app that allows you to read illustrated Bible stories in a variety of languages. It is a project of [unfoldingWord](https://unfoldingword.org/) in collaboration with organizations from around the world.

### ✨ Features

- **📚 50 Bible Stories**: Complete collection of illustrated Open Bible Stories
- **🌍 Multiple Languages**: Support for dozens of languages worldwide
- **🎨 Beautiful Illustrations**: High-quality artwork for each story frame
- **📱 Offline Reading**: Download stories for offline access
- **🔍 Search & Discovery**: Find stories and browse by language/owner
- **❤️ Favorites**: Save your favorite stories for quick access
- **🌙 Dark Mode**: Comfortable reading in any lighting condition
- **📊 Progress Tracking**: Keep track of your reading progress


## 📱 For Users

### 🤖 Android Installation

#### Option 1: Download from GitHub Releases (Recommended)
1. Go to the [Releases](https://github.com/abelpz/my-expo-app/releases) page
2. Download the latest `obs-app-release.apk` file
3. Enable "Install from unknown sources" in your Android settings
4. Install the APK on your device

#### Option 2: GitHub Actions Builds
1. Go to the [Actions](https://github.com/abelpz/my-expo-app/actions) tab
2. Click on a completed "Build Android Release" workflow
3. Download the build artifacts
4. Extract and install the APK

### Getting Started

1. **Launch the app** and complete the onboarding process
2. **Select a language** from the available options
3. **Download stories** for offline reading
4. **Start reading** by selecting any of the 50 stories
5. **Navigate** through story frames by swiping or using navigation buttons

### App Structure

- **📖 Read Tab**: Browse and read downloaded stories
- **❤️ Favorites Tab**: Access your saved favorite stories
- **🔍 Search Tab**: Discover new content and manage downloads

### Perfect For Ministry Use

- **🌏 Missionaries**: Offline access in remote areas
- **⛪ Churches**: Share with congregation members
- **📚 Translation Teams**: Test new language versions
- **👨‍👩‍👧‍👦 Family Devotions**: Engaging stories for children
- **📖 Bible Study Groups**: Illustrated Bible stories

### 📋 Collection Compatibility

The app supports **Open Bible Stories** collections with the following structure:

**✅ Supported Collections:**
- 🔵 Collections with proper `content/` directory structure
- 🔵 Markdown files numbered sequentially (01.md, 02.md, etc.)
- 🔵 Collections following Door43 OBS format standards

**🟡 Unsupported Collections:**
- 🟡 Collections missing the required `content/` directory
- 🟡 Collections with non-standard file structures
- 🟡 Legacy format collections that haven't been updated

**How to Identify:** Collections marked with 🔧 (construction) and ⏱️ (schedule) icons are not currently supported but may become available in future updates.

**Need Help?** If you encounter collections that should be supported but show as unavailable, or if you can't find expected collections for your language, please [contact the developers](https://github.com/unfoldingword/obs-app/issues) with:
- 📝 Language name and code
- 🔗 Collection repository URL (if known)
- 📖 Expected story titles or collection details

## 🛠️ For Developers

### Tech Stack

- **Framework**: React Native 0.76.9 with Expo 52
- **Navigation**: Expo Router (file-based routing)
- **Styling**: NativeWind (Tailwind CSS for React Native)
- **Database**: Expo SQLite with Drizzle ORM
- **State Management**: React hooks and context
- **Language**: TypeScript
- **Build System**: GitHub Actions with native Android builds

### Architecture

```
app/
├── (tabs)/                 # Tab-based navigation
│   ├── (read)/            # Reading interface
│   ├── favorites.tsx      # Favorites management
│   └── search.tsx         # Content discovery
├── components/            # Reusable UI components
├── _layout.tsx           # Root layout with navigation
├── languages.tsx         # Language selection
├── stories.tsx          # Story listing
├── about.tsx           # App information
└── settings.tsx        # App settings

src/                      # Business logic
├── managers/            # Data management classes
├── models/             # Data models and types
└── utils/              # Utility functions

android/                 # Native Android project
```

### Development Setup

#### Prerequisites

- **Node.js** 18+ and npm
- **Android Studio** with Android SDK
- **Java Development Kit (JDK)** 17+
- **Git**

#### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/abelpz/my-expo-app.git
   cd my-expo-app
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up Android development environment**
   - Install Android Studio
   - Set up Android SDK (API level 34+)
   - Create an Android Virtual Device (AVD) or connect a physical device

4. **Generate native projects** (if needed)
   ```bash
   npm run prebuild
   ```

#### Development Commands

```bash
# Start development server
npm start

# Run on Android device/emulator
npm run android

# Run in web browser (for testing)
npm run web

# Lint and format code
npm run lint
npm run format
```

### 🚀 Automated Builds with GitHub Actions

This project uses GitHub Actions for automated Android builds. See [`.github/README.md`](.github/README.md) for complete workflow documentation.

#### Quick Build Guide

**Manual Build:**
1. Go to **Actions** → **"Build Android Release"**
2. Click **"Run workflow"**
3. Download APK from artifacts

**Automatic Build:**
1. Create a new GitHub release
2. APK is automatically built and attached

#### Build Features
- ✅ **No complex setup** - Uses your existing build scripts
- ✅ **Manual or automatic** triggers
- ✅ **Professional APKs** ready for distribution
- ✅ **Ministry-focused** - Perfect for Open Bible Stories

### Building APKs Locally

#### Cross-Platform Compatibility ✨
All build scripts work seamlessly across **Windows**, **macOS**, and **Linux**.

#### Debug Build (Development)
```bash
# Build debug APK
npm run build:android:debug

# Install debug APK on connected device
npm run install:android:debug
```

#### Release Build (Production)
```bash
# Clean previous builds
npm run build:android:clean

# Build release APK
npm run build:android:release

# Install release APK on connected device
npm run install:android:release
```

The release APK will be located at:
`android/app/build/outputs/apk/release/app-release.apk`

### Project Structure Details

#### Data Flow
1. **Content Discovery**: App discovers available collections via DCS API
2. **Download Management**: Collections are downloaded as ZIP files
3. **Local Storage**: Content is extracted and stored in SQLite database
4. **Offline Access**: Stories are read from local storage

#### Collection Format Validation

The app automatically validates collection structures before allowing downloads:

**Required Structure:**
```
repository-root/
└── content/
    ├── 01.md    # Story 1
    ├── 02.md    # Story 2
    ├── ...
    └── 50.md    # Story 50
```

**Validation Process:**
- Collections are validated via `CollectionsManager.validateCollectionStructure()`
- The `getRemoteCollectionsByLanguage()` method returns validation status for each collection
- Invalid collections are marked with `isValid: false` and displayed with 🔧⏱️ icons

**Supported Content Format:**
```markdown
# Story Title

![Image Description](image-url) Text content for frame 1.

![Image Description](image-url) Text content for frame 2.
```

**Unsupported Scenarios:**
- Missing `content/` directory
- Non-sequential file numbering
- Non-markdown content files
- Empty or malformed markdown files

#### Key Components

- **CollectionsManager**: Handles downloading and managing story collections
- **StoryManager**: Manages individual story data and reading progress
- **DatabaseManager**: SQLite operations and data persistence
- **Navigation**: File-based routing with Expo Router
- **UI Components**: Reusable components with NativeWind styling

#### Database Schema
- **Collections**: Metadata about downloaded story collections
- **Stories**: Individual story data and content
- **Progress**: Reading progress and bookmarks
- **Favorites**: User's favorite stories

### Contributing

1. **Fork the repository**
2. **Create a feature branch**: `git checkout -b feature/amazing-feature`
3. **Make your changes** and ensure tests pass
4. **Commit your changes**: `git commit -m 'Add amazing feature'`
5. **Push to the branch**: `git push origin feature/amazing-feature`
6. **Open a Pull Request**

#### Code Style

- Use TypeScript for all new code
- Follow the existing code style (ESLint + Prettier)
- Use meaningful component and variable names
- Add comments for complex logic
- Ensure responsive design works on various screen sizes

#### Testing

```bash
# Run linting
npm run lint

# Format code
npm run format

# Type checking
npx tsc --noEmit
```

### Troubleshooting

#### Common Issues

**Dependencies not found (expo-linear-gradient, expo-file-system)**
- ✅ **Fixed**: Both dependencies are now properly installed

**Build failures**
- Clean the build: `npm run build:android:clean`
- Ensure Android SDK is properly configured
- Check that all dependencies are installed

**Metro bundler issues**
- Clear Metro cache: `npx expo start --clear`
- Reset node modules: `rm -rf node_modules && npm install`

**Android emulator not detected**
- Ensure Android Studio is installed and AVD is running
- Check that `adb` is in your PATH
- Verify USB debugging is enabled on physical devices

### API Documentation

The app integrates with the Door43 Content Service (DCS) API:

- **Base URL**: `https://git.door43.org/api/v1/`
- **Catalog Endpoints**: For discovering available content
- **Repository Endpoints**: For downloading content packages

## 🚀 Distribution Strategy

### For Ministry Organizations

1. **Build APK** using GitHub Actions (manual or release)
2. **Test** with your ministry team
3. **Distribute** APK file to partners
4. **Support** with included installation guides

### Perfect Distribution Scenarios

- **Church Ministry**: Share APK with congregation
- **Mission Fields**: Offline Bible stories for remote areas
- **Translation Partners**: Beta test new language versions
- **Bible Study Groups**: Engaging illustrated stories
- **Family Ministry**: Children's Bible story time

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🤝 Acknowledgments

- [unfoldingWord](https://unfoldingword.org/) for the Open Bible Stories content
- [Door43](https://door43.org/) for the content distribution platform
- All the translators and organizations contributing stories in various languages
- The React Native and Expo communities for excellent development tools

## 📞 Support

- **Issues**: [GitHub Issues](https://github.com/abelpz/my-expo-app/issues)
- **Discussions**: [GitHub Discussions](https://github.com/abelpz/my-expo-app/discussions)
- **Workflow Documentation**: [`.github/README.md`](.github/README.md)
- **Email**: support@unfoldingword.org

### 🔧 Collection Support Issues

**Missing or Unsupported Collections?**  
If you experience issues with collections not being available or showing as unsupported:

1. **📋 Create an Issue** on [GitHub Issues](https://github.com/abelpz/my-expo-app/issues)
2. **📝 Include Details**:
   - Language name and ISO code (e.g., "Spanish (es)")
   - Expected collection/repository name
   - URL of the collection repository (if known)
   - Screenshot of the issue (if applicable)

3. **⚡ Quick Response**: Our team will investigate and work to add support for valid OBS collections

**Why Some Collections Are Unsupported:**
- Repository structure doesn't match OBS standards
- Missing required `content/` directory with numbered markdown files
- Legacy formats that need updating by content creators

---

<div align="center">
  <strong>Ready to share God's Word worldwide! 📱📖✨</strong><br/>
  Made with ❤️ by the unfoldingWord community
</div>
