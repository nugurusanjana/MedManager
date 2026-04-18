from datetime import datetime, date, timedelta
from flask import Blueprint, request, jsonify
from sqlalchemy import func, and_
from app.auth_utils import login_required
from app.models import Invoice, Purchase, Medicine
from app import db

bp = Blueprint('profit_loss', __name__)

def get_date_n_days_ago(days: int) -> date:
    return date.today() - timedelta(days=days)

@bp.route('/summary', methods=['GET'])
@login_required
def summary(user):
    days = int(request.args.get('days', 30))
    cutoff = get_date_n_days_ago(days)
    
    total_revenue = db.session.query(func.sum(Invoice.total)).filter(
        and_(
            Invoice.user_id == user.id,
            Invoice.payment_status == 'completed',
            Invoice.created_at >= cutoff
        )
    ).scalar() or 0.0
    
    total_loss = db.session.query(func.sum(Medicine.cost_per_unit * Medicine.quantity)).filter(
        and_(
            Medicine.user_id == user.id,
            Medicine.expiry_date < date.today()
        )
    ).scalar() or 0.0
    
    expired_medicines = Medicine.query.filter(
        and_(
            Medicine.user_id == user.id,
            Medicine.expiry_date < date.today()
        )
    ).all()
    expired_count = len(expired_medicines)
    
    total_profit = total_revenue - total_loss
    
    return jsonify({
        'total_revenue': float(total_revenue),
        'total_loss': float(total_loss),
        'total_profit': float(total_profit),
        'expired_medicine_count': expired_count,
        'period_days': days
    })

@bp.route('/daily', methods=['GET'])
@login_required
def daily(user):
    days = int(request.args.get('days', 30))
    cutoff = get_date_n_days_ago(days)

    # Daily revenue
    revenue_data = db.session.query(
        func.date(Invoice.created_at).label('date'),
        func.sum(Invoice.total).label('revenue')
    ).filter(
        and_(
            Invoice.user_id == user.id,
            Invoice.payment_status == 'completed',
            Invoice.created_at >= cutoff
        )
    ).group_by(func.date(Invoice.created_at)).all()

    # Daily loss — group expired medicines by their expiry_date
    loss_data = db.session.query(
        Medicine.expiry_date.label('date'),
        func.sum(Medicine.cost_per_unit * Medicine.quantity).label('loss')
    ).filter(
        and_(
            Medicine.user_id == user.id,
            Medicine.expiry_date >= cutoff,
            Medicine.expiry_date < date.today()
        )
    ).group_by(Medicine.expiry_date).all()

    data = []
    for i in range(days):
        current_date = cutoff + timedelta(days=i)
        date_str = current_date.strftime('%Y-%m-%d')

        rev_row = next((r for r in revenue_data if str(r.date)[:10] == date_str), None)
        loss_row = next((l for l in loss_data if str(l.date)[:10] == date_str), None)

        revenue = float(rev_row.revenue) if rev_row else 0.0
        loss = float(loss_row.loss) if loss_row else 0.0
        profit = revenue - loss

        data.append({
            'date': date_str,
            'revenue': revenue,
            'loss': loss,
            'profit': profit
        })

    return jsonify(data)