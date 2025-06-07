#!/bin/bash

# Setup Gitflow Strategy for Open Bible Stories
# Run this script to transition from current branch structure to gitflow

set -e

echo "🌳 Setting up Gitflow Strategy..."
echo ""

# Check if we're in a git repository
if [ ! -d .git ]; then
    echo "❌ Not in a git repository. Please run this from the project root."
    exit 1
fi

echo "📋 Current branch status:"
git branch -a
echo ""

# Function to ask for confirmation
confirm() {
    read -p "$1 (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        return 1
    fi
}

# Step 1: Rename master to main (if master exists)
if git show-ref --verify --quiet refs/heads/master; then
    if confirm "🔄 Rename 'master' branch to 'main'?"; then
        echo "Renaming master to main..."
        git branch -m master main

        # Push the new main branch and set upstream
        if git remote | grep -q origin; then
            git push -u origin main
            echo "✅ Main branch pushed to origin"
        fi
    fi
fi

# Step 2: Create develop branch if it doesn't exist
if ! git show-ref --verify --quiet refs/heads/develop; then
    if confirm "🚀 Create 'develop' branch from main?"; then
        echo "Creating develop branch..."
        git checkout main
        git checkout -b develop

        # Push develop branch
        if git remote | grep -q origin; then
            git push -u origin develop
            echo "✅ Develop branch created and pushed"
        fi
    fi
else
    echo "✅ Develop branch already exists"
fi

# Step 3: Switch back to feature branch if we were on one
CURRENT_BRANCH=$(git branch --show-current)
if [[ $CURRENT_BRANCH == feature/* ]]; then
    echo "🔧 Staying on feature branch: $CURRENT_BRANCH"
elif confirm "🔧 Switch to feature/eas-configuration branch?"; then
    git checkout feature/eas-configuration
fi

echo ""
echo "🎉 Gitflow setup complete!"
echo ""
echo "📋 Branch structure:"
git branch
echo ""
echo "🔄 Next steps:"
echo "1. Review the GITFLOW_STRATEGY.md document"
echo "2. Set up branch protection rules on GitHub:"
echo "   - Go to GitHub → Settings → Branches"
echo "   - Add protection rules for 'main' and 'develop'"
echo "3. Update default branch to 'main' on GitHub"
echo "4. Team should rebase existing feature branches onto 'develop'"
echo ""
echo "📱 EAS builds will now trigger based on:"
echo "   - main → production builds"
echo "   - develop → preview builds"
echo "   - release/* → production builds"
echo "   - hotfix/* → production builds"
echo "   - feature/* → manual builds only"
