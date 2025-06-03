# Development Guide

## Prerequisites

- **Node.js** 18+ and npm
- **Android Studio** with Android SDK
- **Java Development Kit (JDK)** 17+
- **Git**

## Development Setup

### 1. Clone and Install

```bash
# Clone the repository
git clone https://github.com/unfoldingword/obs-app.git
cd obs-app

# Install dependencies
npm install
```

### 2. Set up Android Development Environment

1. **Install Android Studio**
2. **Set up Android SDK** (API level 34+)
3. **Create an Android Virtual Device (AVD)** or connect a physical device
4. **Ensure ANDROID_HOME is set** in your environment variables

### 3. Generate Native Projects (if needed)

```bash
npm run prebuild
```

## Development Commands

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

# Type checking
npx tsc --noEmit
```

## Building APKs Locally

### Cross-Platform Compatibility ✨
All build scripts work seamlessly across **Windows**, **macOS**, and **Linux**.

### Debug Build (Development)
```bash
# Build debug APK
npm run build:android:debug

# Install debug APK on connected device
npm run install:android:debug
```

### Release Build (Production)
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

## Code Style Guidelines

- Use TypeScript for all new code
- Follow the existing code style (ESLint + Prettier)
- Use meaningful component and variable names
- Add comments for complex logic
- Ensure responsive design works on various screen sizes

## Testing

```bash
# Run linting
npm run lint

# Format code
npm run format

# Type checking
npx tsc --noEmit
```

## Deep Link Testing

### Using ADB (Android)
```bash
# Test simplified deep links
adb shell am start -W -a android.intent.action.VIEW -d "obs-app://story/1/3" com.unfoldingword.obsapp

# Test full collection deep links
adb shell am start -W -a android.intent.action.VIEW -d "obs-app://story/en_obs/1/3" com.unfoldingword.obsapp
```

### Using Expo Go (Development)
```bash
# Use the development server URL
adb shell am start -W -a android.intent.action.VIEW -d "exp://192.168.x.x:8081/--/story/1/3" host.exp.exponent
```

## Contributing

1. **Fork the repository**
2. **Create a feature branch**: `git checkout -b feature/amazing-feature`
3. **Make your changes** and ensure tests pass
4. **Commit your changes**: `git commit -m 'Add amazing feature'`
5. **Push to the branch**: `git push origin feature/amazing-feature`
6. **Open a Pull Request**

### Pull Request Guidelines

- Ensure code follows project conventions
- Add tests for new functionality
- Update documentation as needed
- Include clear commit messages
- Keep changes focused and atomic

## Git Workflow

```bash
# Keep your fork updated
git remote add upstream https://github.com/unfoldingword/obs-app.git
git fetch upstream
git checkout main
git merge upstream/main

# Create feature branch
git checkout -b feature/my-new-feature

# Work on your changes...
git add .
git commit -m "Add: new feature description"

# Push and create PR
git push origin feature/my-new-feature
``` 