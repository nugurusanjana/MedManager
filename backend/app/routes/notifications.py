from flask import Blueprint, request, jsonify
from app.models import Notification
from app.auth_utils import login_required

bp = Blueprint('notifications', __name__)

@bp.route('/', methods=['GET'])
@login_required
def list_notifications(user):
    notifications = Notification.query.filter_by(user_id=user.id).order_by(Notification.created_at.desc()).all()
    return jsonify([n.to_dict() for n in notifications])

@bp.route('/<int:nid>/read', methods=['PATCH'])
@login_required
def mark_read(user, nid):
    n = Notification.query.filter_by(id=nid, user_id=user.id).first()
    if not n:
        return jsonify({'error': 'Not found'}), 404
    n.read = True
    from app import db
    db.session.commit()
    return jsonify(n.to_dict())

@bp.route('/<int:nid>/replenish', methods=['POST'])
@login_required
def replenish(user, nid):
    """Mark notification as handled; frontend can redirect to Update Stock or open add form."""
    n = Notification.query.filter_by(id=nid, user_id=user.id).first()
    if not n:
        return jsonify({'error': 'Not found'}), 404
    n.read = True
    from app import db
    db.session.commit()
    return jsonify({'ok': True, 'medicine_id': n.medicine_id, 'message': 'Open Update Stock to add quantity or new batch.'})
