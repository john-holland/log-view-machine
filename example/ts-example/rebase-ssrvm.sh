#!/bin/bash

# ServerSideRenderedViewMachine Rebase Script
# This script helps rebase your SSRVM work on top of origin/main

set -e  # Exit on any error

echo "🚀 Starting ServerSideRenderedViewMachine rebase process..."
echo "=================================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if we're in a git repository
if ! git rev-parse --git-dir > /dev/null 2>&1; then
    print_error "Not in a git repository. Please run this script from the project root."
    exit 1
fi

# Check current branch
CURRENT_BRANCH=$(git branch --show-current)
print_status "Current branch: $CURRENT_BRANCH"

# Step 1: Create backup branch
print_status "Step 1: Creating backup branch..."
BACKUP_BRANCH="backup-ssrvm-$(date +%Y%m%d-%H%M%S)"
git checkout -b "$BACKUP_BRANCH"
print_success "Created backup branch: $BACKUP_BRANCH"

# Step 2: Fetch latest from origin
print_status "Step 2: Fetching latest changes from origin..."
git fetch origin
print_success "Fetched latest changes"

# Step 3: Switch back to main and reset to origin/main
print_status "Step 3: Resetting main branch to origin/main..."
git checkout main
git reset --hard origin/main
print_success "Reset main to origin/main"

# Step 4: Copy SSRVM files from backup
print_status "Step 4: Copying ServerSideRenderedViewMachine files..."
SSRVM_FILES=(
    "src/core/ServerSideRenderedViewMachine.ts"
    "src/components/ServerSideRenderedPriceDisplay.tsx"
    "src/components/SimplePriceDisplay.tsx"
    "src/examples/ServerSideRenderedDemo.ts"
    "src/examples/ServerSideRenderedExample.ts"
    "src/examples/SimpleCartMachine.ts"
)

for file in "${SSRVM_FILES[@]}"; do
    if git show "$BACKUP_BRANCH:$file" > /dev/null 2>&1; then
        git show "$BACKUP_BRANCH:$file" > "$file"
        print_status "Copied $file"
    else
        print_warning "File $file not found in backup branch"
    fi
done

# Step 5: Stage and commit SSRVM work
print_status "Step 5: Committing ServerSideRenderedViewMachine work..."
git add "${SSRVM_FILES[@]}" 2>/dev/null || true

# Check if there are any staged changes
if git diff --cached --quiet; then
    print_warning "No changes to commit. SSRVM files may already be up to date."
else
    git commit -m "Add ServerSideRenderedViewMachine for price information display

- ServerSideRenderedViewMachine class for server-side rendering
- Price display components with configurable options
- Demo scripts showing SSRVM usage
- Simple cart machine for testing"
    print_success "Committed SSRVM work"
fi

# Step 6: Test the setup
print_status "Step 6: Testing the setup..."
if command -v npx >/dev/null 2>&1 && command -v ts-node >/dev/null 2>&1; then
    print_status "Running ServerSideRenderedDemo test..."
    if npx ts-node src/examples/ServerSideRenderedDemo.ts > /dev/null 2>&1; then
        print_success "Demo test passed!"
    else
        print_warning "Demo test failed. You may need to fix some import paths or dependencies."
    fi
else
    print_warning "ts-node not available. Skipping demo test."
fi

# Step 7: Clean up (optional)
print_status "Step 7: Cleanup options..."
echo -e "${YELLOW}Backup branch '$BACKUP_BRANCH' has been created with your original work.${NC}"
echo -e "${YELLOW}You can delete it later with: git branch -D $BACKUP_BRANCH${NC}"

# Step 8: Final status
print_status "Step 8: Final status..."
echo ""
print_success "Rebase completed successfully!"
echo ""
echo "Current status:"
git status --short
echo ""
echo "Recent commits:"
git log --oneline -3
echo ""
print_status "Your ServerSideRenderedViewMachine work is now on top of origin/main"
print_status "You can now push your changes or create a PR"

# Optional: Ask if user wants to push
read -p "Do you want to push these changes? (y/N): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    print_status "Pushing changes..."
    git push origin main
    print_success "Changes pushed to origin/main"
else
    print_status "Changes not pushed. You can push manually when ready."
fi

echo ""
print_success "🎉 Rebase process completed!" 