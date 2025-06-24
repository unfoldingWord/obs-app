# Contributing to Open Bible Stories

Welcome! We're excited that you want to contribute to the Open Bible Stories app. This guide will help you get started.

## 🌳 Development Workflow (Gitflow)

We use a gitflow strategy for organized development. Please follow these branch conventions:

### **Branch Types**

#### **🔒 Protected Branches (Team Leads & Maintainers)**
- **`main`**
  - **Purpose**: Production-ready code deployed to app stores
  - **Owner**: Project maintainers & release managers
  - **Protection**: Requires PR reviews, passing CI/CD, no direct pushes
  - **Deployment**: Triggers automatic production builds for store submission

- **`develop`**
  - **Purpose**: Integration branch for all feature development
  - **Owner**: Development team leads
  - **Protection**: Requires PR reviews, passing tests
  - **Deployment**: Triggers automatic preview builds for testing

#### **🚀 Development Branches (Contributors)**
- **`feature/<owner>/<description>`**
  - **Purpose**: New features and enhancements
  - **Owner**: Individual developers or feature teams
  - **Examples**:
    - `feature/john/user-authentication`
    - `feature/team-ui/story-navigation`
    - `feature/sarah/offline-sync`
  - **Lifecycle**: Branch from `develop` → PR back to `develop`
  - **Deployment**: Manual builds only (via workflow_dispatch)

- **`bugfix/<owner>/<description>`**
  - **Purpose**: Non-critical bug fixes that can wait for regular release
  - **Owner**: Individual developers
  - **Examples**:
    - `bugfix/alice/text-rendering-issue`
    - `bugfix/team-qa/collection-loading`
  - **Lifecycle**: Branch from `develop` → PR back to `develop`

- **`fix/<owner>/<description>`**
  - **Purpose**: Small fixes, minor improvements, and quick adjustments
  - **Owner**: Any contributor
  - **Examples**:
    - `fix/john/typo-in-button-text`
    - `fix/sarah/adjust-spacing-margins`
    - `fix/team/update-outdated-links`
  - **Lifecycle**: Branch from `develop` → PR back to `develop`
  - **Note**: For small, low-risk changes that don't require extensive testing

#### **🔧 Release Branches (Release Manager)**
- **`release/v<major>.<minor>.0`**
  - **Purpose**: Release preparation, version bumps, final testing
  - **Owner**: Release manager or project lead
  - **Examples**: `release/v1.2.0`, `release/v2.0.0`
  - **Lifecycle**: Branch from `develop` → PR to `main` + merge back to `develop`
  - **Activities**: Version updates, changelog, final QA testing

#### **🚨 Emergency Branches (On-Call Team)**
- **`hotfix/<severity>/<description>`**
  - **Purpose**: Critical fixes for production issues
  - **Owner**: On-call developers or senior team members
  - **Examples**:
    - `hotfix/critical/app-crash-ios`
    - `hotfix/urgent/authentication-failure`
  - **Lifecycle**: Branch from `main` → PR to `main` + `develop`
  - **Deployment**: Fast-track to production after minimal testing

#### **📚 Support Branches (Documentation Team)**
- **`docs/<owner>/<topic>`**
  - **Purpose**: Documentation updates, guides, and technical writing
  - **Owner**: Documentation team or contributors
  - **Examples**:
    - `docs/writer/api-documentation`
    - `docs/dev-team/architecture-guide`
  - **Lifecycle**: Branch from `develop` → PR back to `develop`

- **`config/<owner>/<change>`**
  - **Purpose**: Configuration changes, CI/CD updates, tooling
  - **Owner**: DevOps team or maintainers
  - **Examples**:
    - `config/devops/github-actions`
    - `config/john/eslint-rules`
  - **Lifecycle**: Branch from `develop` → PR back to `develop`

#### **🧪 Experimental Branches (Research Team)**
- **`experimental/<owner>/<concept>`**
  - **Purpose**: Proof of concepts, research, major architectural changes
  - **Owner**: Senior developers or research teams
  - **Examples**:
    - `experimental/team/react-native-upgrade`
    - `experimental/sarah/new-animation-engine`
  - **Lifecycle**: May be long-lived, eventual PR to `develop` or archived
  - **Note**: These branches may have relaxed CI requirements

#### **🔄 Integration Branches (Team Coordination)**
- **`integration/<team>/<feature-set>`**
  - **Purpose**: Coordinate multiple related features before merging to develop
  - **Owner**: Feature team leads
  - **Examples**:
    - `integration/ui-team/design-system-v2`
    - `integration/mobile/offline-capabilities`
  - **Lifecycle**: Branch from `develop` → merge multiple features → PR to `develop`

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
   git checkout -b feature/your-username/your-feature-name
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
   - **From**: `feature/your-username/your-feature-name`
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
git checkout develop && git pull && git checkout -b feature/username/my-feature

# Run tests and linting
npm test && npm run lint

# Create production build locally
eas build --platform all --profile production

# Push and create PR
git push origin feature/username/my-feature
# Then create PR on GitHub: feature/username/my-feature → develop
```
