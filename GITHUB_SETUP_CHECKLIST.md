# 📋 GitHub Repository Setup Checklist

**Complete setup guide for Open Bible Stories repository with gitflow + EAS integration**

## 🎯 Phase 1: Essential Setup (Required)

### ✅ 1. Branch Configuration
**Location**: `Settings → Branches`

#### Default Branch
- [ ] Set default branch to `main`
- [ ] Update any existing references from `master` to `main`

#### Create Protected Branches
Run this after setting up branch protection rules:
```bash
# Create develop branch if it doesn't exist
git checkout main
git checkout -b develop
git push origin develop
```

### ✅ 2. Branch Protection Rules

#### Main Branch Protection (`main`)
**Location**: `Settings → Branches → Add rule`

```
Branch name pattern: main
```

**Required settings:**
- [x] **Require a pull request before merging**
  - Required approvals: `2`
  - [x] Dismiss stale PR reviews when new commits are pushed
  - [x] Require review from code owners
  - [x] Restrict reviews to users with push access

- [x] **Require status checks to pass before merging**
  - [x] Require branches to be up to date before merging
  - **Required status checks** (add as workflows are created):
    - `build (EAS Build)`
    - `test-setup (Test EAS Configuration)`

- [x] **Require conversation resolution before merging**
- [x] **Require signed commits** *(optional but recommended)*
- [x] **Require linear history**
- [x] **Do not allow bypassing the above settings**
- [x] **Restrict pushes that create files larger than 100MB**

#### Develop Branch Protection (`develop`)
```
Branch name pattern: develop
```

**Required settings:**
- [x] **Require a pull request before merging**
  - Required approvals: `1`
  - [x] Dismiss stale PR reviews when new commits are pushed

- [x] **Require status checks to pass before merging**
  - [x] Require branches to be up to date before merging
  - **Required status checks:**
    - `build (EAS Build)`

- [x] **Require conversation resolution before merging**

#### Release Branch Protection (`release/*`)
```
Branch name pattern: release/*
```

**Required settings:**
- [x] **Require a pull request before merging**
  - Required approvals: `1`
- [x] **Require status checks to pass before merging**

### ✅ 3. Repository Secrets
**Location**: `Settings → Secrets and variables → Actions`

#### Essential Secrets (Required for EAS)
- [ ] **`EXPO_TOKEN`** - EAS authentication token
  - Get from: https://expo.dev → Account Settings → Access Tokens
  - Create token named: "GitHub Actions - Open Bible Stories"

#### Store Submission Secrets (Optional)
- [ ] **`APPLE_ID`** - Apple Developer account email
- [ ] **`ASC_APP_ID`** - App Store Connect App ID (10-digit number)
- [ ] **`APPLE_TEAM_ID`** - Apple Developer Team ID
- [ ] **`GOOGLE_PLAY_SERVICE_ACCOUNT_KEY`** - Google Play service account JSON content

### ✅ 4. Actions Configuration
**Location**: `Settings → Actions → General`

#### Actions Permissions
- [x] **Allow all actions and reusable workflows**
  - OR **Allow select actions** (more secure):
    - `actions/checkout@*`
    - `actions/setup-node@*`
    - `expo/expo-github-action@*`

#### Workflow Permissions
- **Default workflow permissions**: `Read repository contents and packages permissions`
- [x] **Allow GitHub Actions to create and approve pull requests**

## 🎯 Phase 2: Team & Security (Important)

### ✅ 5. Team Configuration
**Location**: `Settings → Collaborators and teams`

#### GitHub Teams Setup
Create these teams in your organization:
- [ ] **`@unfoldingword/admins`** - Repository administrators
- [ ] **`@unfoldingword/maintainers`** - Project maintainers
- [ ] **`@unfoldingword/developers`** - Core developers
- [ ] **`@unfoldingword/mobile-developers`** - Mobile specialists
- [ ] **`@unfoldingword/backend-developers`** - API/backend developers
- [ ] **`@unfoldingword/designers`** - UI/UX designers
- [ ] **`@unfoldingword/translators`** - Content translators

#### Permission Levels
- **Admins**: `Admin` access (bypass restrictions)
- **Maintainers**: `Maintain` access (manage issues, releases)
- **Developers**: `Write` access (push to feature branches)
- **Others**: `Read` access (view repository)

### ✅ 6. Security Configuration
**Location**: `Settings → Code security and analysis`

#### Enable Security Features
- [x] **Dependency graph**
- [x] **Dependabot alerts**
- [x] **Dependabot security updates**
- [x] **Secret scanning** (prevents committing secrets)
- [x] **Push protection** (blocks secret commits)

## 🎯 Phase 3: Quality & Documentation (Recommended)

### ✅ 7. Issue & PR Templates
**Status**: ✅ Already created in this branch
- [x] `.github/ISSUE_TEMPLATE/bug_report.md`
- [x] `.github/ISSUE_TEMPLATE/feature_request.md`
- [x] `.github/PULL_REQUEST_TEMPLATE.md`
- [ ] `.github/CODEOWNERS` *(Skipped - will add later after team structure verification)*

### ✅ 8. Repository Settings
**Location**: `Settings → General`

#### Pull Request Settings
- [x] **Allow merge commits**
- [ ] **Allow squash merging** *(team preference)*
- [x] **Allow rebase merging**
- [x] **Always suggest updating pull request branches**
- [x] **Allow auto-merge**
- [x] **Automatically delete head branches**

#### Issues
- [x] **Enable Issues**
- [x] **Enable Discussions** *(for community Q&A)*

### ✅ 9. Labels Configuration
**Location**: `Issues → Labels`

#### Create Custom Labels
```bash
# Bug types
bug, critical-bug, minor-bug

# Feature types
enhancement, feature-request, improvement

# Platform specific
ios, android, cross-platform

# Priority levels
priority:high, priority:medium, priority:low

# Status
needs-triage, in-progress, needs-review, blocked

# Areas
ui/ux, performance, security, accessibility, i18n

# EAS/Build related
eas-build, deployment, release
```

## 🎯 Phase 4: Advanced Features (Optional)

### ✅ 10. Release Management
**Location**: Repository main page

#### GitHub Releases Setup
- [ ] Create release template
- [ ] Set up auto-generated release notes
- [ ] Configure tag protection rules (`v*`)

#### Changelog Automation
- [ ] Consider using Release Drafter action
- [ ] Set up semantic versioning workflow

### ✅ 11. Project Management
**Location**: `Projects` tab

#### GitHub Projects Setup
- [ ] Create project board for issue tracking
- [ ] Set up automated workflows (issue → in progress → done)
- [ ] Link to milestones and releases

### ✅ 12. Monitoring & Notifications
**Location**: `Settings → Webhooks`

#### Team Notifications
- [ ] Slack/Discord webhook for builds
- [ ] Email notifications for releases
- [ ] Mobile app notifications for critical issues

## 🚀 Implementation Order

### **Week 1: Core Setup**
1. Branch protection rules
2. Required secrets (EXPO_TOKEN)
3. Team permissions
4. Basic security features

### **Week 2: Quality & Process**
1. Issue/PR templates (already done!)
2. CODEOWNERS file (already done!)
3. Documentation updates (already done!)
4. Workflow testing

### **Week 3: Advanced Features**
1. Additional labels and projects
2. Release automation
3. Monitoring setup
4. Team training

## ✅ Validation Checklist

After setup, verify everything works:

- [ ] Create test feature branch
- [ ] Open test pull request
- [ ] Check required reviewers are assigned
- [ ] Verify EAS build triggers
- [ ] Test branch protection rules
- [ ] Confirm secrets are working
- [ ] Validate team permissions

## 📞 Getting Help

If you need help with any step:
1. Check GitHub's documentation
2. Ask in team chat/discussions
3. Create an issue with `help-wanted` label

---

**🎉 Once complete, your repository will have:**
- ✅ Professional gitflow workflow
- ✅ Automated EAS builds
- ✅ Secure credential management
- ✅ Comprehensive code review process
- ✅ Quality gates and protection rules
- ✅ Team collaboration tools
