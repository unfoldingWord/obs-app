# Open Bible Stories (OBS) Mobile App

<div align="center">
  <img src="./assets/icon.png" alt="OBS App Icon" width="120" height="120">

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

### Installation

#### Option 1: Download APK (Recommended)
1. Go to the [Releases](https://github.com/your-repo/releases) page
2. Download the latest `app-release.apk` file
3. Enable "Install from unknown sources" in your Android settings
4. Install the APK on your device

#### Option 2: Build from Source
See the [Development Setup](#-development-setup) section below.

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
- **⚙️ Settings**: Customize app appearance and manage storage

## 🛠️ For Developers

### Tech Stack

- **Framework**: React Native 0.76.9 with Expo 52
- **Navigation**: Expo Router (file-based routing)
- **Styling**: NativeWind (Tailwind CSS for React Native)
- **Database**: Expo SQLite with Drizzle ORM
- **State Management**: React hooks and context
- **Language**: TypeScript
- **Build System**: Expo CLI with native Android/iOS builds

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
ios/                    # Native iOS project (future)
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
   git clone https://github.com/your-repo/obs-app.git
   cd obs-app
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

# Run on iOS device/simulator (macOS only)
npm run ios

# Run in web browser
npm run web

# Lint and format code
npm run lint
npm run format
```

### Building APKs

#### Debug Build (Development)
```bash
# Build debug APK
npm run build:android:debug

# Install debug APK on connected device
npm run install:android:debug
```

The debug APK will be located at:
`android/app/build/outputs/apk/debug/app-debug.apk`

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

#### Manual Build Commands

If you prefer to use Gradle directly:

```bash
# Navigate to android directory
cd android

# Debug build
./gradlew assembleDebug

# Release build
./gradlew assembleRelease

# Clean build
./gradlew clean

# Install on device via ADB
adb install app/build/outputs/apk/debug/app-debug.apk
```

### Project Structure Details

#### Data Flow
1. **Content Discovery**: App discovers available collections via DCS API
2. **Download Management**: Collections are downloaded as ZIP files
3. **Local Storage**: Content is extracted and stored in SQLite database
4. **Offline Access**: Stories are read from local storage

#### Key Components

- **CollectionsManager**: Handles downloading and managing story collections
- **StoryManager**: Manages individual story data and reading progress
- **DatabaseManager**: SQLite operations and data persistence
- **Navigation**: File-based routing with Expo Router
- **UI Components**: Reusable components in `app/components/`

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

**"No ViewManager found for class RNSScreenContentWrapper"**
- This is resolved by calling `enableScreens()` in the root layout
- Already implemented in `app/_layout.tsx`

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

See `docs/implementation-details.md` for detailed API documentation.

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🤝 Acknowledgments

- [unfoldingWord](https://unfoldingword.org/) for the Open Bible Stories content
- [Door43](https://door43.org/) for the content distribution platform
- All the translators and organizations contributing stories in various languages
- The React Native and Expo communities for excellent development tools

## 📞 Support

- **Issues**: [GitHub Issues](https://github.com/your-repo/issues)
- **Discussions**: [GitHub Discussions](https://github.com/your-repo/discussions)
- **Email**: support@unfoldingword.org

---

<div align="center">
  Made with ❤️ by the unfoldingWord community
</div>
