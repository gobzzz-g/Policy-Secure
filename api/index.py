"""
Vercel serverless function entry point.
This file exposes the FastAPI app for Vercel deployment.
"""
import sys
import os

# Set default environment variables if not set
os.environ.setdefault('DATABASE_URL', 'postgresql://postgres:password@localhost:5432/insurance_claims')
os.environ.setdefault('MONGODB_URL', 'mongodb://localhost:27017/')
os.environ.setdefault('SECRET_KEY', 'default-secret-key-change-in-production-min-32-characters-long')
os.environ.setdefault('GEMINI_API_KEY', 'your-gemini-api-key-here')
os.environ.setdefault('ENVIRONMENT', 'production')
os.environ.setdefault('DEBUG', 'False')
os.environ.setdefault('ALLOWED_ORIGINS', '*')

# Add the backend directory to the Python path
backend_path = os.path.join(os.path.dirname(__file__), '..', 'backend')
if backend_path not in sys.path:
    sys.path.insert(0, backend_path)

try:
    from main import app
    
    # Expose the app for Vercel
    # Vercel will call this as a serverless function
    handler = app
    
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
                "hint": "Please ensure all environment variables are set in Vercel dashboard"
            }
        )
    
    handler = app
