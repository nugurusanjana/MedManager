import os
from functools import wraps
from flask import request, jsonify
from app import db
from app.models import User

def get_current_user():
    """Get user from session or Authorization header (Bearer token = user_id for simplicity)."""
    auth = request.headers.get('Authorization')
    if auth and auth.startswith('Bearer '):
        try:
            uid = int(auth.split()[1])
            return User.query.get(uid)
        except (ValueError, IndexError):
            pass
    return None

def login_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        user = get_current_user()
        if user is None:
            return jsonify({'error': 'Authentication required'}), 401
        return f(user, *args, **kwargs)
    return decorated
