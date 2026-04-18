import os
from dotenv import load_dotenv

load_dotenv()

class Config:
    SECRET_KEY = os.environ.get('SECRET_KEY') or 'dev-secret-change-in-production'
    _backend_dir = os.path.dirname(os.path.abspath(__file__))
    _db_path = os.path.join(_backend_dir, 'medicine_inventory.db')
    SQLALCHEMY_DATABASE_URI = os.environ.get('DATABASE_URI') or ('sqlite:///' + _db_path.replace('\\', '/'))
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    
    # Google OAuth (set in .env for production)
    GOOGLE_CLIENT_ID = os.environ.get('GOOGLE_CLIENT_ID', '')
    GOOGLE_CLIENT_SECRET = os.environ.get('GOOGLE_CLIENT_SECRET', '')
    OAUTH_REDIRECT_URI = os.environ.get('OAUTH_REDIRECT_URI', 'http://localhost:5000/api/auth/google/callback')
    GROQ_API_KEY = os.environ.get('GROQ_API_KEY', '')
