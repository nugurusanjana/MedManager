from flask import Flask
from flask_sqlalchemy import SQLAlchemy
from flask_cors import CORS
from config import Config

db = SQLAlchemy()

def create_app(config_class=Config):
    app = Flask(__name__)
    app.config.from_object(config_class)
    CORS(app, supports_credentials=True, origins=['http://localhost:5173', 'http://127.0.0.1:5173'])
    db.init_app(app)

    from app.routes import auth, med_guide, medicines, notifications, cart, invoices, dashboard, seasonality, profit_loss
    app.register_blueprint(auth.bp, url_prefix='/api/auth')
    app.register_blueprint(med_guide.bp, url_prefix='/api/medguide')
    app.register_blueprint(medicines.bp, url_prefix='/api/medicines')
    app.register_blueprint(notifications.bp, url_prefix='/api/notifications')
    app.register_blueprint(cart.bp, url_prefix='/api/cart')
    app.register_blueprint(invoices.bp, url_prefix='/api/invoices')
    app.register_blueprint(dashboard.bp, url_prefix='/api/dashboard')
    app.register_blueprint(seasonality.bp, url_prefix='/api/seasonality')
    app.register_blueprint(profit_loss.bp, url_prefix='/api/profit-loss')
    auth.init_oauth(app)

    with app.app_context():
        db.create_all()

    return app

