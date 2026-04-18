from datetime import datetime, timedelta
from app import db

class User(db.Model):
    __tablename__ = 'users'
    id = db.Column(db.Integer, primary_key=True)
    email = db.Column(db.String(120), unique=True, nullable=False)
    name = db.Column(db.String(100))
    password_hash = db.Column(db.String(256))
    google_id = db.Column(db.String(100), unique=True)
    avatar_url = db.Column(db.String(500))
    last_login = db.Column(db.DateTime, default=datetime.utcnow)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    medicines = db.relationship('Medicine', backref='owner', lazy=True, cascade='all, delete-orphan')
    cart_items = db.relationship('CartItem', backref='user', lazy=True, cascade='all, delete-orphan')
    purchases = db.relationship('Purchase', backref='user', lazy=True)
    invoices = db.relationship('Invoice', backref='user', lazy=True)
    notifications = db.relationship('Notification', backref='user', lazy=True, cascade='all, delete-orphan')

    def to_dict(self):
        return {
            'id': self.id,
            'email': self.email,
            'name': self.name or self.email.split('@')[0],
            'avatar_url': self.avatar_url,
            'last_login': self.last_login.isoformat() if self.last_login else None,
        }


class Medicine(db.Model):
    __tablename__ = 'medicines'
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    name = db.Column(db.String(200), nullable=False)
    expiry_date = db.Column(db.Date, nullable=False)
    quantity = db.Column(db.Integer, default=0)
    usage = db.Column(db.String(200))  # e.g. painkiller, antibiotic
    cost_per_unit = db.Column(db.Float, default=0.0)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    def is_expiring_soon(self, days=6):
        return self.expiry_date <= (datetime.utcnow().date() + timedelta(days=days))

    def is_low_stock(self, threshold=5):
        return self.quantity <= threshold

    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'expiry_date': self.expiry_date.isoformat(),
            'quantity': self.quantity,
            'usage': self.usage or '',
            'cost_per_unit': self.cost_per_unit,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None,
        }


class Notification(db.Model):
    __tablename__ = 'notifications'
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    medicine_id = db.Column(db.Integer, db.ForeignKey('medicines.id'), nullable=False)
    type = db.Column(db.String(50))  # 'expiry' or 'low_stock'
    message = db.Column(db.String(500))
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    read = db.Column(db.Boolean, default=False)

    medicine = db.relationship('Medicine', backref='notifications')

    def to_dict(self):
        return {
            'id': self.id,
            'medicine_id': self.medicine_id,
            'medicine_name': self.medicine.name if self.medicine else None,
            'type': self.type,
            'message': self.message,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'read': self.read,
        }


class CartItem(db.Model):
    __tablename__ = 'cart_items'
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    medicine_id = db.Column(db.Integer, db.ForeignKey('medicines.id'), nullable=False)
    quantity = db.Column(db.Integer, default=1)

    medicine = db.relationship('Medicine', backref='cart_entries')

    def to_dict(self):
        m = self.medicine
        return {
            'id': self.id,
            'medicine_id': m.id,
            'name': m.name,
            'quantity': self.quantity,
            'unit_price': m.cost_per_unit,
            'total': round(self.quantity * m.cost_per_unit, 2),
        }


class Purchase(db.Model):
    __tablename__ = 'purchases'
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    medicine_id = db.Column(db.Integer, db.ForeignKey('medicines.id'), nullable=False)
    invoice_id = db.Column(db.Integer, db.ForeignKey('invoices.id'))
    quantity = db.Column(db.Integer)
    unit_price = db.Column(db.Float)
    total = db.Column(db.Float)
    purchased_at = db.Column(db.DateTime, default=datetime.utcnow)

    medicine = db.relationship('Medicine', backref='purchases')
    invoice = db.relationship('Invoice', backref='purchases')

    def to_dict(self):
        return {
            'id': self.id,
            'medicine_name': self.medicine.name if self.medicine else None,
            'quantity': self.quantity,
            'unit_price': self.unit_price,
            'total': self.total,
            'purchased_at': self.purchased_at.isoformat() if self.purchased_at else None,
        }


class Invoice(db.Model):
    __tablename__ = 'invoices'
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    invoice_number = db.Column(db.String(50), unique=True)
    subtotal = db.Column(db.Float)
    tax_rate = db.Column(db.Float, default=0)
    tax_amount = db.Column(db.Float, default=0)
    total = db.Column(db.Float)
    payment_status = db.Column(db.String(20), default='pending')  # pending, completed, failed
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            'id': self.id,
            'invoice_number': self.invoice_number,
            'subtotal': self.subtotal,
            'tax_rate': self.tax_rate,
            'tax_amount': self.tax_amount,
            'total': self.total,
            'payment_status': self.payment_status,
            'created_at': self.created_at.isoformat() if self.created_at else None,
        }
