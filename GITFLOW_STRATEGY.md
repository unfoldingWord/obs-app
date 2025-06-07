# Gitflow Strategy for Open Bible Stories

## 🌳 Branch Structure

### **Main Branches**

#### 🏭 `main` (Production)
- **Purpose**: Production-ready code
- **Protection**: Protected, requires PR reviews
- **EAS Builds**: Triggers **production** builds automatically
- **Store Submission**: Auto-submit to stores (when enabled)
- **Merge from**: `release/*` branches only

#### 🚀 `develop` (Integration)
- **Purpose**: Integration branch for features
- **EAS Builds**: Triggers **preview** builds for testing
- **Merge from**: `feature/*` branches
- **Merge to**: `release/*` branches

### **Supporting Branches**

#### 🔧 `feature/*` (Feature Development)
- **Naming**: `feature/description-of-feature`
- **Examples**:
  - `feature/eas-configuration`
  - `feature/ble-collection-sharing`
  - `feature/user-authentication`
- **Branch from**: `develop`
- **Merge to**: `develop`
- **EAS Builds**: Manual builds only (via GitHub Actions)

#### 📦 `release/*` (Release Preparation)
- **Naming**: `release/v1.2.0`
- **Purpose**: Prepare releases, bug fixes, version bumps
- **Branch from**: `develop`
- **Merge to**: `main` AND `develop`
- **EAS Builds**: Triggers **production** builds for testing

#### 🚨 `hotfix/*` (Emergency Fixes)
- **Naming**: `hotfix/critical-bug-fix`
- **Branch from**: `main`
- **Merge to**: `main` AND `develop`
- **EAS Builds**: Triggers **production** builds immediately

## 🔄 Workflow Process

### **Feature Development**
```bash
# 1. Start new feature
git checkout develop
git pull origin develop
git checkout -b feature/new-feature

# 2. Develop feature
# ... make changes ...
git add .
git commit -m "feat: add new feature"

# 3. Create PR to develop
# - Open PR: feature/new-feature → develop
# - Request reviews
# - EAS builds preview version
# - Merge after approval
```

### **Release Process**
```bash
# 1. Create release branch
git checkout develop
git pull origin develop
git checkout -b release/v1.2.0

# 2. Prepare release
# - Update version numbers
# - Update changelog
# - Final bug fixes
git commit -m "chore: prepare release v1.2.0"

# 3. Merge to main
# - Create PR: release/v1.2.0 → main
# - EAS builds production version
# - Auto-submit to stores
# - Tag release

# 4. Merge back to develop
git checkout develop
git merge release/v1.2.0
```

### **Hotfix Process**
```bash
# 1. Create hotfix
git checkout main
git pull origin main
git checkout -b hotfix/critical-fix

# 2. Fix issue
git commit -m "fix: resolve critical issue"

# 3. Merge to main and develop
# - Fast release process
# - Emergency store submission
```

## 🤖 EAS Build Triggers

| Branch Pattern | Build Profile | Trigger | Purpose |
|----------------|---------------|---------|---------|
| `main` | `production` | Auto (push) | Store submission |
| `develop` | `preview` | Auto (push) | Testing builds |
| `release/*` | `production` | Auto (push) | Release testing |
| `hotfix/*` | `production` | Auto (push) | Emergency fixes |
| `feature/*` | `preview` | Manual only | Feature testing |
| PR to `main/develop` | `preview` | Auto (PR) | Review builds |

## 📋 Branch Protection Rules

### **Main Branch**
- ✅ Require pull request reviews (2 reviewers)
- ✅ Require status checks (EAS builds must pass)
- ✅ Require branches to be up to date
- ✅ Restrict pushes to admins only
- ✅ Require signed commits

### **Develop Branch**
- ✅ Require pull request reviews (1 reviewer)
- ✅ Require status checks (tests must pass)
- ✅ Allow admins to bypass

## 📱 Version Management

### **Semantic Versioning** (MAJOR.MINOR.PATCH)
- **MAJOR**: Breaking changes
- **MINOR**: New features (backward compatible)
- **PATCH**: Bug fixes

### **Mobile App Versioning**
- **Version**: 1.2.0 (user-facing)
- **Build Number**: Auto-increment (iOS/Android internal)

## 🎯 Migration Plan

### **Current State**
- `master` → rename to `main`
- Create `develop` branch from `main`
- Existing feature branches continue as-is

### **Migration Steps**
```bash
# 1. Rename master to main
git branch -m master main
git push -u origin main

# 2. Create develop branch
git checkout main
git checkout -b develop
git push -u origin develop

# 3. Update default branch on GitHub
# Go to GitHub → Settings → Branches → Change default to 'main'

# 4. Update existing feature branches
# Rebase feature branches onto develop when ready
```

## 🚀 Getting Started

1. **Complete current feature branch** (`feature/eas-configuration`)
2. **Set up main/develop structure**
3. **Update GitHub workflows** to match new branch strategy
4. **Configure branch protection rules**
5. **Train team on new workflow**

---

**Next Steps:**
1. Review and approve this gitflow strategy
2. Implement branch restructuring
3. Update EAS workflows to match
4. Set up branch protection rules
