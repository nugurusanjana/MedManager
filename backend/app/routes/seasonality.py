from collections import defaultdict
from datetime import datetime
from flask import Blueprint, jsonify
from app.models import Purchase
from app.auth_utils import login_required

bp = Blueprint('seasonality', __name__)

@bp.route('/top')
@login_required
def top_purchases(user):
    """Frequently bought medicines (by total quantity or count)."""
    purchases = Purchase.query.filter_by(user_id=user.id).all()
    by_medicine = defaultdict(lambda: {'name': None, 'quantity': 0, 'count': 0})
    for p in purchases:
        if p.medicine:
            by_medicine[p.medicine_id]['name'] = p.medicine.name
            by_medicine[p.medicine_id]['quantity'] += p.quantity
            by_medicine[p.medicine_id]['count'] += 1
    top = sorted(by_medicine.values(), key=lambda x: -x['quantity'])[:15]
    return jsonify(top)

@bp.route('/monthly')
@login_required
def monthly_trends(user):
    """Purchases per month for the last 12 months."""
    purchases = Purchase.query.filter_by(user_id=user.id).all()
    by_month = defaultdict(lambda: {'total_amount': 0, 'count': 0})
    for p in purchases:
        if p.purchased_at:
            key = p.purchased_at.strftime('%Y-%m')
            by_month[key]['total_amount'] += p.total or 0
            by_month[key]['count'] += 1
    months = sorted(by_month.keys(), reverse=True)[:12]
    result = [{'month': m, **by_month[m]} for m in months]
    return jsonify(result)

@bp.route('/seasonal')
@login_required
def seasonal(user):
    """Seasonal view: group by season (Q1–Q4) for current year and last year."""
    purchases = Purchase.query.filter_by(user_id=user.id).all()
    by_season = defaultdict(lambda: {'total_amount': 0, 'count': 0})
    for p in purchases:
        if p.purchased_at:
            y = p.purchased_at.year
            m = p.purchased_at.month
            q = (m - 1) // 3 + 1
            key = f"{y}-Q{q}"
            by_season[key]['total_amount'] += p.total or 0
            by_season[key]['count'] += 1
    result = [{'period': k, **v} for k, v in sorted(by_season.items(), reverse=True)[:8]]
    return jsonify(result)
