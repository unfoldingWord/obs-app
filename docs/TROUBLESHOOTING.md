# Troubleshooting Guide

## Common Development Issues

### Dependencies Not Found

#### Problem
```
ERROR: Cannot resolve module 'expo-linear-gradient'
ERROR: Cannot resolve module 'expo-file-system'
```

#### Solution
✅ **Fixed**: Both dependencies are now properly installed. If you still see this error:

```bash
# Clean and reinstall
rm -rf node_modules package-lock.json
npm install

# Clear Metro cache
npx expo start --clear
```

### Build Failures

#### Android Build Issues

**Problem**: Gradle build fails or times out

**Solutions**:
```bash
# Clean the build
npm run build:android:clean

# Ensure Android SDK is configured
echo $ANDROID_HOME  # Should show SDK path

# Check available build tools
ls $ANDROID_HOME/build-tools/

# Rebuild
npm run build:android:release
```

**Problem**: Java version conflicts

**Solutions**:
```bash
# Check Java version (should be 17+)
java -version

# Set JAVA_HOME if needed (example paths)
# Windows: set JAVA_HOME=C:\Program Files\Java\jdk-17
# macOS: export JAVA_HOME=/Library/Java/JavaVirtualMachines/jdk-17.jdk/Contents/Home
# Linux: export JAVA_HOME=/usr/lib/jvm/java-17-openjdk
```

#### Metro Bundler Issues

**Problem**: Metro bundler cache issues

**Solutions**:
```bash
# Clear Metro cache
npx expo start --clear

# Reset node modules
rm -rf node_modules && npm install

# Clear all caches
npx expo start --clear --reset-cache
```

**Problem**: JavaScript bundle fails to load

**Solutions**:
```bash
# Restart Metro with clean slate
npx expo start --clear --dev-client

# Check for syntax errors
npm run lint

# Verify TypeScript compilation
npx tsc --noEmit
```

### Device Connection Issues

#### Android Emulator Not Detected

**Problem**: `adb devices` shows no devices

**Solutions**:
```bash
# Check if adb is in PATH
which adb

# Start ADB server
adb start-server

# Restart ADB if needed
adb kill-server
adb start-server

# List connected devices
adb devices
```

**Problem**: Emulator won't start

**Solutions**:
1. **Open Android Studio** → AVD Manager
2. **Wipe Data** on your virtual device
3. **Cold Boot** the emulator
4. **Check system requirements** (enough RAM, virtualization enabled)

#### Physical Device Issues

**Problem**: Device not recognized

**Solutions**:
1. **Enable Developer Options**:
   - Settings → About Phone → Tap "Build number" 7 times
2. **Enable USB Debugging**:
   - Settings → Developer Options → USB Debugging
3. **Trust Computer**: Accept the dialog on your device
4. **Check USB Cable**: Use a data cable, not charge-only

### Deep Link Testing Issues

#### Deep Links Not Working in Expo Go

**Problem**: `obs-app://` URLs don't open in Expo Go

**Solution**: Use Expo development URLs instead:
```bash
# Instead of: obs-app://story/1/3
# Use: exp://192.168.x.x:8081/--/story/1/3

# Find your IP in Expo output
npm start
# Look for: "Metro waiting on exp://192.168.x.x:8081"
```

#### ADB Deep Link Commands Fail

**Problem**: ADB commands return "Activity not started"

**Solutions**:
```bash
# Ensure app is installed
adb shell pm list packages | grep unfoldingword

# Check if app is correct package name
adb shell am start -W -a android.intent.action.VIEW -d "obs-app://story/1/3" com.unfoldingword.obsapp

# Try with different intent flags
adb shell am start -W -a android.intent.action.VIEW -c android.intent.category.BROWSABLE -d "obs-app://story/1/3" com.unfoldingword.obsapp
```

## Runtime Issues

### App Crashes

#### Database Issues

**Problem**: App crashes on startup with SQLite errors

**Solutions**:
```bash
# Clear app data (this will reset all user data)
adb shell pm clear com.unfoldingword.obsapp

# Or manually delete database
adb shell
cd /data/data/com.unfoldingword.obsapp/databases/
rm -f *.db
```

#### Memory Issues

**Problem**: App crashes with out-of-memory errors

**Solutions**:
1. **Close other apps** to free memory
2. **Restart device** to clear memory
3. **Check device storage** - ensure sufficient space
4. **Clear app cache** without losing data

### Performance Issues

#### Slow Collection Downloads

**Problem**: Downloads take too long or fail

**Solutions**:
1. **Check internet connection** stability
2. **Try smaller collections first** to test
3. **Download during off-peak hours**
4. **Clear app cache** if downloads seem stuck

#### Slow Story Loading

**Problem**: Stories take long to load or images don't appear

**Solutions**:
1. **Restart the app** to clear memory
2. **Check available storage** space
3. **Re-download problematic collections**
4. **Clear image cache** in app settings

### Content Issues

#### Collections Not Appearing

**Problem**: Expected collections don't show up in search

**Possible Causes**:
1. **Repository structure issues** - see [Collection Compatibility](COLLECTIONS.md)
2. **Network connectivity** problems
3. **API service unavailable** temporarily

**Solutions**:
1. **Check collection format** against requirements
2. **Try again later** if API issues
3. **Verify repository URL** and accessibility
4. **Contact repository maintainer** for structure issues

#### Missing Images

**Problem**: Story images don't load or show broken image icons

**Solutions**:
1. **Check internet connection** for initial load
2. **Re-download collection** to refresh content
3. **Verify image URLs** in the markdown content
4. **Check storage permissions** if images were previously cached

## Platform-Specific Issues

### Windows

#### Path Length Issues
```bash
# Enable long path support
git config --system core.longpaths true

# Or use shorter directory names
cd c:\dev\obs  # instead of c:\very\long\path\to\project
```

#### PowerShell Execution Policy
```powershell
# If npm scripts fail due to execution policy
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

### macOS

#### Xcode Issues
```bash
# Ensure Xcode command line tools are installed
xcode-select --install

# Accept Xcode license
sudo xcodebuild -license accept
```

#### M1 Mac Compatibility
```bash
# If you encounter architecture issues
arch -x86_64 npm install

# Or ensure you're using ARM-compatible Node.js
node -p "process.arch"  # Should show "arm64" on M1 Macs
```

### Linux

#### Missing Build Dependencies
```bash
# Ubuntu/Debian
sudo apt-get update
sudo apt-get install build-essential

# CentOS/RHEL
sudo yum groupinstall "Development Tools"

# Arch Linux
sudo pacman -S base-devel
```

## Getting Help

### Before Asking for Help

1. **Check this troubleshooting guide** first
2. **Search existing issues** on GitHub
3. **Try the basic solutions** (restart, clean cache, etc.)
4. **Gather error information** (logs, screenshots, device info)

### Creating Bug Reports

Include this information:
- **Device/Platform**: Android version, device model
- **App Version**: Check in app settings
- **Steps to Reproduce**: Exact steps that cause the issue
- **Expected vs. Actual**: What should happen vs. what actually happens
- **Logs/Screenshots**: Any error messages or visual issues
- **Environment**: Development vs. production build

### Support Channels

- **GitHub Issues**: [unfoldingword/obs-app/issues](https://github.com/unfoldingword/obs-app/issues)
- **GitHub Discussions**: [unfoldingword/obs-app/discussions](https://github.com/unfoldingword/obs-app/discussions)
- **Email**: support@unfoldingword.org

### Community Resources

- **React Native Docs**: [reactnative.dev](https://reactnative.dev/)
- **Expo Docs**: [docs.expo.dev](https://docs.expo.dev/)
- **Stack Overflow**: Tag your questions with `react-native`, `expo`, `open-bible-stories` 