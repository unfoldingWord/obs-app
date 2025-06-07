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
- **📝 Notes**: Add personal notes and reflections to stories
- **📖 Reading Modes**: Switch between horizontal or vertical reading layouts
- **🌙 Dark Mode**: Comfortable reading in any lighting condition
- **📊 Progress Tracking**: Keep track of your reading progress

## 📱 Installation

### 🤖 Android

#### Download APK (Recommended)
1. Go to the [Releases](https://github.com/unfoldingword/obs-app/releases) page
2. Download the latest `obs-app-release.apk` file
3. Enable "Install from unknown sources" in your Android settings
4. Install the APK on your device

#### GitHub Actions Build
1. Go to the [Actions](https://github.com/unfoldingword/obs-app/actions) tab
2. Download the latest build artifacts
3. Extract and install the APK

### 🍎 iOS
iOS version coming soon!

## 🚀 Quick Start

1. **Launch the app** and complete onboarding
2. **Select a language** from available options
3. **Download stories** for offline reading
4. **Start reading** any of the 50 stories
5. **Navigate** with swipe gestures or buttons

### App Structure
- **📖 Read Tab**: Browse and read downloaded stories
- **❤️ Favorites Tab**: Access saved favorite stories
- **🔍 Search Tab**: Find words and phrases within downloaded stories

## 🛠️ For Developers

### Quick Setup

```bash
# Clone the repository
git clone https://github.com/unfoldingword/obs-app.git
cd obs-app

# Install dependencies
npm install

# Start development server
npm start

# Run on Android/iOS
npm run android
npm run ios
```

### 🌳 Development Workflow (Gitflow)

We use a structured gitflow strategy for organized development:

**Branch Structure:**
- `main` - Production-ready code (protected)
- `develop` - Integration branch for features
- `feature/*` - New features (`feature/user-authentication`)
- `release/*` - Release preparation (`release/v1.2.0`)
- `hotfix/*` - Emergency fixes (`hotfix/critical-bug`)

**Getting Started:**
```bash
# Start new feature
git checkout develop
git pull origin develop
git checkout -b feature/your-feature-name

# Make changes, test, commit
# Then create PR: feature/your-feature → develop
```

📖 **Read our [Contributing Guide](CONTRIBUTING.md)** for detailed workflow instructions.

### Tech Stack
- **Framework**: React Native 0.76.9 with Expo 52
- **Navigation**: Expo Router (file-based routing)
- **Styling**: NativeWind (Tailwind CSS for React Native)
- **Database**: Expo SQLite with Drizzle ORM
- **Language**: TypeScript
- **Build System**: EAS Build (Expo Application Services)
- **CI/CD**: GitHub Actions with automated builds

### 🚀 Build & Deploy (EAS)

This project uses **EAS (Expo Application Services)** for professional-grade builds and deployments:

#### **Automatic Builds** 🤖 (Free Plan Optimized)
- **`main` branch** → Production builds (store-ready releases only)
- **All other builds** → Manual trigger only (conserves build minutes)

#### **Manual Builds** 🔧
```bash
# Install EAS CLI
npm install -g eas-cli

# Login with unfoldingword account
eas login

# Build for testing
eas build --platform all --profile preview

# Build for production
eas build --platform all --profile production
```

#### **Build Profiles**
- **`development`** - Development client with hot reload
- **`preview`** - Internal testing (APK for Android)
- **`production`** - Store-ready builds (AAB for Google Play)

### 📚 Documentation

- **[Contributing Guide](CONTRIBUTING.md)** - Development workflow and coding standards
- **[Gitflow Strategy](GITFLOW_STRATEGY.md)** - Branching strategy and release process
- **[EAS Build Strategy](EAS_BUILD_STRATEGY.md)** - Conservative build approach for free plans
- **[GitHub Setup Guide](GITHUB_SECRETS_SETUP.md)** - Repository configuration
- **[EAS Credentials Guide](eas-credentials-template.md)** - Secure credential management
- **[Development Guide](docs/DEVELOPMENT.md)** - Detailed setup and development workflow
- **[Architecture Guide](docs/ARCHITECTURE.md)** - Project structure and technical details
- **[Collection Compatibility](docs/COLLECTIONS.md)** - Supported content formats
- **[Troubleshooting](docs/TROUBLESHOOTING.md)** - Common issues and solutions

## 🌍 Perfect for Ministry

- **🌏 Missionaries**: Offline access in remote areas
- **⛪ Churches**: Share with congregation members
- **📚 Translation Teams**: Test new language versions
- **👨‍👩‍👧‍👦 Family Devotions**: Engaging stories for children
- **📖 Bible Study Groups**: Illustrated Bible stories

## 🤝 Contributing

We welcome contributions! Please follow our gitflow strategy:

### Quick Start Contributing
```bash
# 1. Fork and clone
git clone https://github.com/YOUR_USERNAME/obs-app.git
cd obs-app

# 2. Create feature branch from develop
git checkout develop
git pull origin develop
git checkout -b feature/amazing-feature

# 3. Make changes and test
npm test
npm run lint

# 4. Commit with conventional commits
git commit -m 'feat: add amazing feature'

# 5. Push and create PR
git push origin feature/amazing-feature
# Create PR: feature/amazing-feature → develop
```

### 📋 Before Contributing
- Read our **[Contributing Guide](CONTRIBUTING.md)**
- Check **[open issues](https://github.com/unfoldingword/obs-app/issues)**
- Follow our **[coding standards](CONTRIBUTING.md#code-style)**
- Test on multiple platforms (iOS/Android)

### 🔄 Development Process
1. **Issues** → Plan and discuss features/bugs
2. **Feature branches** → Develop in isolation
3. **Pull requests** → Code review and testing
4. **EAS builds** → Automated testing builds
5. **Merge to develop** → Integration testing
6. **Release branches** → Production preparation
7. **Merge to main** → Production deployment

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 📞 Support

- **Issues**: [GitHub Issues](https://github.com/unfoldingword/obs-app/issues)
- **Discussions**: [GitHub Discussions](https://github.com/unfoldingword/obs-app/discussions)
- **Email**: support@unfoldingword.org

### 🔧 Collection Issues

Missing or unsupported collections? [Create an issue](https://github.com/unfoldingword/obs-app/issues) with:
- Language name and code
- Expected collection details
- Repository URL (if known)

## 🤝 Acknowledgments

- **[unfoldingWord](https://unfoldingword.org/)** for the Open Bible Stories content and vision for global Bible translation
- **[Door43](https://door43.org/)** for the robust content distribution platform that makes worldwide access possible
- **All translators and organizations** contributing stories in diverse languages, bringing God's Word to every nation
- **[Open Components Ecosystem](https://opencomponents.io/)** for providing innovative, reusable components that accelerate development
- **React Native and Expo communities** for creating powerful, accessible mobile development tools
- **Global ministry partners** who test, distribute, and share these stories in remote and underserved areas worldwide

---

<div align="center">
  <strong>Ready to share God's Word worldwide! 📱📖✨</strong><br/>
  Made with ❤️ by the unfoldingWord community
</div>
