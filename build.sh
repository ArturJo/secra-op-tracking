#!/bin/bash
# Build script for SECRA OP Tracking
# Injects current git version into built files

set -e

# Get version: use first argument if provided, otherwise read from VERSION file
if [ -n "$1" ]; then
    VERSION="$1"
elif [ -f VERSION ]; then
    VERSION=$(cat VERSION | tr -d '[:space:]')
else
    echo "Error: No version argument given and no VERSION file found." >&2
    exit 1
fi
BUILD_DATE=$(date -u +"%Y-%m-%d %H:%M:%S UTC")

echo "Building SECRA OP Tracking v${VERSION}"

# Create dist directory
mkdir -p dist

# Process op-gtag.js
echo "Building op-gtag.js..."
sed "s/__VERSION__/${VERSION}/g; s/__BUILD_DATE__/${BUILD_DATE}/g" src/op-gtag.js > dist/op-gtag.js

# Process op-gtm.js
echo "Building op-gtm.js..."
sed "s/__VERSION__/${VERSION}/g; s/__BUILD_DATE__/${BUILD_DATE}/g" src/op-gtm.js > dist/op-gtm.js

echo "✓ Build complete: dist/op-gtag.js, dist/op-gtm.js (${VERSION})"
