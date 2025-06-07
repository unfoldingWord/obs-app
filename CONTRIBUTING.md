# Contributing to Open Bible Stories

Welcome! We're excited that you want to contribute to the Open Bible Stories app. This guide will help you get started.

## 🌳 Development Workflow (Gitflow)

We use a gitflow strategy for organized development. Please follow these branch conventions:

### **Branch Types**

- **`main`** - Production-ready code (protected)
- **`develop`** - Integration branch for features
- **`feature/*`** - New features (`feature/user-authentication`)
- **`release/*`** - Release preparation (`release/v1.2.0`)
- **`hotfix/*`** - Emergency fixes (`hotfix/critical-bug`)

### **Getting Started**

1. **Fork & Clone**
   ```bash
   git clone https://github.com/unfoldingWord/obs-app.git
   cd obs-app
   npm install
   ```

2. **Create Feature Branch**
   ```bash
   git checkout develop
   git pull origin develop
   git checkout -b feature/your-feature-name
   ```

3. **Make Changes**
   - Write code following our style guide
   - Add tests for new functionality
   - Update documentation if needed

4. **Test Your Changes**
   ```bash
   npm test
   npm run lint
   expo start # Test the app
   ```

5. **Create Pull Request**
   - **From**: `feature/your-feature-name`
   - **To**: `develop`
   - Follow the PR template
   - Request reviews from team members

## 📱 Mobile Development Guidelines

### **Testing on Devices**
- **iOS**: Use iOS Simulator or physical device
- **Android**: Use Android Emulator or physical device
- **Preview Builds**: Use EAS preview builds for team testing

### **EAS Builds**
- **Feature branches**: Manual builds only
- **Develop branch**: Automatic preview builds
- **Main branch**: Automatic production builds

## 🎨 Code Style

### **General Guidelines**
- Use TypeScript for type safety
- Follow React Native best practices
- Use functional components with hooks
- Write self-documenting code with clear variable names

### **File Organization**
```
src/
├── components/     # Reusable UI components
├── screens/        # Screen components
├── navigation/     # Navigation configuration
├── services/       # API calls and business logic
├── utils/          # Helper functions
├── types/          # TypeScript type definitions
└── constants/      # App constants
```

### **Naming Conventions**
- **Components**: PascalCase (`StoryCard.tsx`)
- **Files**: camelCase (`storyService.ts`)
- **Variables**: camelCase (`storyData`)
- **Constants**: UPPER_SNAKE_CASE (`API_BASE_URL`)

## 🧪 Testing

### **Required Tests**
- Unit tests for utilities and services
- Component tests for UI components
- Integration tests for critical flows

### **Running Tests**
```bash
npm test                    # Run all tests
npm run test:watch         # Watch mode
npm run test:coverage      # Generate coverage report
```

## 📝 Commit Guidelines

We follow [Conventional Commits](https://www.conventionalcommits.org/):

```
type(scope): description

feat(auth): add user authentication
fix(stories): resolve loading issue
docs(readme): update installation guide
test(utils): add unit tests for helpers
```

### **Commit Types**
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting)
- `refactor`: Code refactoring
- `test`: Adding or updating tests
- `chore`: Maintenance tasks

## 🔍 Code Review Process

### **PR Requirements**
- ✅ All tests pass
- ✅ No linting errors
- ✅ EAS build succeeds (for develop/main)
- ✅ At least one approval
- ✅ All conversations resolved

### **Review Checklist**
- [ ] Code follows style guidelines
- [ ] Tests cover new functionality
- [ ] No breaking changes (or properly documented)
- [ ] Performance impact considered
- [ ] Security implications reviewed
- [ ] Documentation updated if needed

## 🚀 Release Process

### **Feature Release**
1. Create `release/v1.x.0` branch from `develop`
2. Update version numbers and changelog
3. Test thoroughly
4. Create PR to `main`
5. Tag and create GitHub release

### **Hotfix Release**
1. Create `hotfix/description` branch from `main`
2. Fix the issue
3. Update version (patch increment)
4. Create PR to `main` and `develop`

## 🛠️ Development Environment

### **Required Tools**
- Node.js 18+
- npm or yarn
- Expo CLI
- EAS CLI
- Android Studio (for Android development)
- Xcode (for iOS development, macOS only)

### **Environment Setup**
```bash
# Install global tools
npm install -g expo-cli eas-cli

# Install project dependencies
npm install

# Start development server
expo start
```

## 🐛 Bug Reports

Use our [issue template](.github/ISSUE_TEMPLATE/bug_report.md) and include:
- Device/OS information
- Steps to reproduce
- Expected vs actual behavior
- Screenshots/videos if applicable
- Relevant logs

## 💡 Feature Requests

Use our [feature request template](.github/ISSUE_TEMPLATE/feature_request.md) and include:
- Clear description of the feature
- Use case and benefits
- Mockups or examples if available
- Acceptance criteria

## 📞 Getting Help

- **Documentation**: Check the README and wiki
- **Issues**: Search existing issues first
- **Discussions**: Use GitHub Discussions for questions
- **Team Chat**: Internal team communication channels

## 🙏 Recognition

Contributors will be recognized in our releases and README. Thank you for helping make Open Bible Stories better!

---

## Quick Reference

```bash
# Start new feature
git checkout develop && git pull && git checkout -b feature/my-feature

# Run tests and linting
npm test && npm run lint

# Create production build locally
eas build --platform all --profile production

# Push and create PR
git push origin feature/my-feature
# Then create PR on GitHub: feature/my-feature → develop
```
