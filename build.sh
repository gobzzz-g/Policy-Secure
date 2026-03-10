#!/usr/bin/env bash
# Render build script for Policy Secure Backend

set -o errexit  # Exit on error

echo "Installing Python dependencies..."
cd backend
pip install --upgrade pip
pip install -r requirements.txt

echo "Build completed successfully!"
