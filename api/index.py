"""
Vercel serverless function entry point.
This file exposes the FastAPI app for Vercel deployment.
"""
import sys
import os
from pathlib import Path

# Set default environment variables if not set
os.environ.setdefault('DATABASE_URL', 'postgresql://postgres:password@localhost:5432/insurance_claims')
os.environ.setdefault('MONGODB_URL', 'mongodb://localhost:27017/')
os.environ.setdefault('SECRET_KEY', 'default-secret-key-change-in-production-min-32-characters-long')
os.environ.setdefault('GEMINI_API_KEY', 'your-gemini-api-key-here')
os.environ.setdefault('ENVIRONMENT', 'production')
os.environ.setdefault('DEBUG', 'False')
os.environ.setdefault('ALLOWED_ORIGINS', '*')

# Add the backend directory to the Python path
current_file = Path(__file__).resolve()
backend_path = current_file.parent.parent / 'backend'
sys.path.insert(0, str(backend_path))

try:
    from main import app
    
except Exception as e:
    # If import fails, create a basic FastAPI app that shows the error
    from fastapi import FastAPI
    from fastapi.responses import JSONResponse
    
    app = FastAPI()
    
    @app.get("/")
    async def root():
        return JSONResponse(
            status_code=500,
            content={
                "error": "Failed to initialize application",
                "message": str(e),
                "python_path": sys.path,
                "backend_path": str(backend_path),
                "cwd": os.getcwd(),
                "hint": "Please ensure all environment variables are set in Vercel dashboard"
            }
        )
    
    @app.get("/health")
    async def health():
        return {"status": "error", "message": str(e)}
