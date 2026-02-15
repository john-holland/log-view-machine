#!/bin/bash

# Generic Editor Playwright Test Runner
# This script sets up and runs the Playwright test suite

set -e

echo "🎯 Generic Editor Test Suite"
echo "=============================="

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 18+ first."
    exit 1
fi

# Check Node.js version
NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo "❌ Node.js 18+ is required. Current version: $(node -v)"
    exit 1
fi

echo "✅ Node.js version: $(node -v)"

# Check if npm is available
if ! command -v npm &> /dev/null; then
    echo "❌ npm is not installed. Please install npm first."
    exit 1
fi

echo "✅ npm version: $(npm -v)"

# Install dependencies if node_modules doesn't exist
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
else
    echo "✅ Dependencies already installed"
fi

# Check if Playwright is installed
if [ ! -d "node_modules/@playwright" ]; then
    echo "📦 Installing Playwright..."
    npm install @playwright/test
fi

# Install Playwright browsers if not already installed
if [ ! -d "node_modules/playwright" ]; then
    echo "🌐 Installing Playwright browsers..."
    npx playwright install
else
    echo "✅ Playwright browsers already installed"
fi

# Create test results directory
mkdir -p test-results/screenshots
mkdir -p test-results/videos

echo "📁 Test results directory created"

# Check if the editor is running
echo "🔍 Checking if editor is running on http://localhost:3000..."
if curl -s http://localhost:3000 > /dev/null; then
    echo "✅ Editor is running on http://localhost:3000"
else
    echo "⚠️  Editor is not running on http://localhost:3000"
    echo "   Starting dev server..."
    npm run dev &
    DEV_PID=$!
    
    # Wait for server to start
    echo "⏳ Waiting for server to start..."
    for i in {1..30}; do
        if curl -s http://localhost:3000 > /dev/null; then
            echo "✅ Server started successfully"
            break
        fi
        if [ $i -eq 30 ]; then
            echo "❌ Server failed to start within 30 seconds"
            kill $DEV_PID 2>/dev/null || true
            exit 1
        fi
        sleep 1
    done
fi

# Function to cleanup on exit
cleanup() {
    if [ ! -z "$DEV_PID" ]; then
        echo "🛑 Stopping dev server..."
        kill $DEV_PID 2>/dev/null || true
    fi
}

trap cleanup EXIT

# Parse command line arguments
TEST_MODE="run"
BROWSER=""
HEADED=""
DEBUG=""
UI=""

while [[ $# -gt 0 ]]; do
    case $1 in
        --headed)
            HEADED="--headed"
            shift
            ;;
        --debug)
            DEBUG="--debug"
            shift
            ;;
        --ui)
            UI="--ui"
            shift
            ;;
        --browser)
            BROWSER="--project=$2"
            shift 2
            ;;
        --help|-h)
            echo "Usage: $0 [OPTIONS]"
            echo ""
            echo "Options:"
            echo "  --headed          Run tests in headed mode (visible browser)"
            echo "  --debug           Run tests in debug mode"
            echo "  --ui              Run tests with Playwright UI"
            echo "  --browser NAME    Run tests for specific browser (chromium, firefox, webkit)"
            echo "  --help, -h        Show this help message"
            echo ""
            echo "Examples:"
            echo "  $0                    # Run all tests"
            echo "  $0 --headed           # Run tests with visible browser"
            echo "  $0 --debug            # Run tests in debug mode"
            echo "  $0 --ui               # Run tests with Playwright UI"
            echo "  $0 --browser chromium # Run tests only in Chromium"
            echo ""
            exit 0
            ;;
        *)
            echo "❌ Unknown option: $1"
            echo "Use --help for usage information"
            exit 1
            ;;
    esac
done

# Determine test command
if [ ! -z "$UI" ]; then
    TEST_CMD="npx playwright test --ui"
elif [ ! -z "$DEBUG" ]; then
    TEST_CMD="npx playwright test --debug"
elif [ ! -z "$HEADED" ]; then
    TEST_CMD="npx playwright test --headed"
else
    TEST_CMD="npx playwright test"
fi

# Add browser selection if specified
if [ ! -z "$BROWSER" ]; then
    TEST_CMD="$TEST_CMD $BROWSER"
fi

echo ""
echo "🚀 Running tests with command: $TEST_CMD"
echo "=============================="

# Run the tests
if eval $TEST_CMD; then
    echo ""
    echo "✅ All tests passed!"
    echo ""
    echo "📊 Test reports available at:"
    echo "   - HTML Report: playwright-report/index.html"
    echo "   - JSON Results: test-results/results.json"
    echo "   - JUnit XML: test-results/results.xml"
    echo ""
    echo "🎯 Test suite completed successfully!"
else
    echo ""
    echo "❌ Some tests failed!"
    echo ""
    echo "📊 Test reports available at:"
    echo "   - HTML Report: playwright-report/index.html"
    echo "   - JSON Results: test-results/results.json"
    echo "   - JUnit XML: test-results/results.xml"
    echo "   - Screenshots: test-results/screenshots/"
    echo "   - Videos: test-results/videos/"
    echo ""
    echo "🔍 Check the reports above for details on failures"
    exit 1
fi
