#!/usr/bin/env bash
# Render build script for Policy Secure Backend

set -o errexit  # Exit on error

echo "Current directory: $(pwd)"
echo "Listing files:"
ls -la

echo "Installing Python dependencies from backend/requirements.txt..."
pip install --upgrade pip
pip install -r backend/requirements.txt

echo "Build completed successfully!"
