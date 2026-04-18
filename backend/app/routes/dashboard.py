from datetime import datetime
from flask import Blueprint, jsonify
from app.models import Medicine
from app.auth_utils import login_required

bp = Blueprint('dashboard', __name__)

@bp.route('/')
@login_required
def index(user):
    medicines = Medicine.query.filter_by(user_id=user.id).all()
    total_medicines = len(medicines)
    today = datetime.utcnow().date()
    expired_count = sum(1 for m in medicines if m.expiry_date < today)
    low_stock_count = sum(1 for m in medicines if m.quantity <= 5)
    return jsonify({
        'user': user.to_dict(),
        'stock_summary': {
            'total_medicines': total_medicines,
            'expired_count': expired_count,
            'low_stock_count': low_stock_count,
        },
        'login_time': user.last_login.isoformat() if user.last_login else None,
    })
