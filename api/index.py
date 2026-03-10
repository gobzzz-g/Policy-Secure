"""
Vercel serverless function entry point.
This file exposes the FastAPI app for Vercel deployment.
"""
import sys
import os

# Add the backend directory to the Python path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'backend'))

from main import app

# Vercel expects the app to be named 'app'
# This is the entry point for Vercel serverless functions
