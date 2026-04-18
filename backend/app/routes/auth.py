from datetime import datetime
from flask import Blueprint, request, jsonify, redirect, current_app
from authlib.integrations.flask_client import OAuth
from app import db
from app.models import User
import hashlib

bp = Blueprint('auth', __name__)
oauth = OAuth()

def init_oauth(app):
    oauth.init_app(app)
    if app.config.get('GOOGLE_CLIENT_ID'):
        oauth.register(
            name='google',
            client_id=app.config['GOOGLE_CLIENT_ID'],
            client_secret=app.config['GOOGLE_CLIENT_SECRET'],
            server_metadata_url='https://accounts.google.com/.well-known/openid-configuration',
            client_kwargs={'scope': 'openid email profile'},
        )
    return oauth

@bp.route('/signup', methods=['POST'])
def signup():
    try:
        data = request.get_json() or {}
        email = (data.get('email') or '').strip().lower()
        password = data.get('password') or ''
        name = (data.get('name') or '').strip() or email.split('@')[0]
        if not email or not password:
            return jsonify({'error': 'Email and password required'}), 400
        if User.query.filter_by(email=email).first():
            return jsonify({'error': 'Email already registered'}), 400
        user = User(
            email=email,
            name=name,
            password_hash=hash_password(password),
            last_login=datetime.utcnow(),
        )
        db.session.add(user)
        db.session.commit()
        return jsonify({'user': user.to_dict(), 'token': str(user.id)}), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': 'Sign up failed: ' + str(e)}), 500

@bp.route('/login', methods=['POST'])
def login():
    data = request.get_json() or {}
    email = (data.get('email') or '').strip().lower()
    password = data.get('password') or ''
    if not email or not password:
        return jsonify({'error': 'Email and password required'}), 400
    user = User.query.filter_by(email=email).first()
    if not user or not user.password_hash or not verify_password(password, user.password_hash):
        return jsonify({'error': 'Invalid email or password'}), 401
    user.last_login = datetime.utcnow()
    db.session.commit()
    return jsonify({'user': user.to_dict(), 'token': str(user.id)})

@bp.route('/me')
def me():
    from app.auth_utils import get_current_user
    user = get_current_user()
    if not user:
        return jsonify({'error': 'Not authenticated'}), 401
    return jsonify(user.to_dict())

@bp.route('/google')
def google_login():
    oauth_client = init_oauth(current_app._get_current_object())
    if 'google' not in oauth_client._clients:
        return jsonify({'error': 'Google OAuth not configured. Set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET.'}), 503
    redirect_uri = current_app.config.get('OAUTH_REDIRECT_URI') or (request.url_root.rstrip('/') + '/api/auth/google/callback')
    return oauth_client.google.authorize_redirect(redirect_uri)

@bp.route('/google/callback')
def google_callback():
    oauth_client = init_oauth(current_app._get_current_object())
    if 'google' not in oauth_client._clients:
        return jsonify({'error': 'Google OAuth not configured'}), 503
    try:
        token = oauth_client.google.authorize_access_token()
    except Exception as e:
        return jsonify({'error': str(e)}), 400
    user_info = token.get('userinfo') or {}
    email = (user_info.get('email') or '').strip().lower()
    google_id = user_info.get('sub')
    name = user_info.get('name') or email.split('@')[0]
    avatar_url = user_info.get('picture')
    if not email:
        return jsonify({'error': 'Email not provided by Google'}), 400
    user = User.query.filter_by(google_id=google_id).first() or User.query.filter_by(email=email).first()
    if not user:
        user = User(email=email, name=name, google_id=google_id, avatar_url=avatar_url, last_login=datetime.utcnow())
        db.session.add(user)
    else:
        user.google_id = user.google_id or google_id
        user.name = user.name or name
        user.avatar_url = user.avatar_url or avatar_url
        user.last_login = datetime.utcnow()
    db.session.commit()
    frontend = request.args.get('frontend') or 'http://localhost:8080'
    return redirect(f"{frontend.rstrip('/')}/auth/callback?token={user.id}")

def hash_password(password):
    return hashlib.sha256((password + current_app.config['SECRET_KEY']).encode()).hexdigest()

def verify_password(password, password_hash):
    return hash_password(password) == password_hash
