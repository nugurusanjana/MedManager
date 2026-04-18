from flask import Blueprint, request, jsonify
from app import db
from app.models import CartItem, Medicine
from app.auth_utils import login_required

bp = Blueprint('cart', __name__)

@bp.route('/', methods=['GET'])
@login_required
def get_cart(user):
    items = CartItem.query.filter_by(user_id=user.id).all()
    return jsonify([i.to_dict() for i in items])

@bp.route('/', methods=['POST'])
@login_required
def add_to_cart(user):
    data = request.get_json() or {}
    medicine_id = data.get('medicine_id')
    quantity = int(data.get('quantity') or 1)
    if not medicine_id:
        return jsonify({'error': 'medicine_id required'}), 400
    m = Medicine.query.filter_by(id=medicine_id, user_id=user.id).first()
    if not m:
        return jsonify({'error': 'Medicine not found'}), 404
    existing = CartItem.query.filter_by(user_id=user.id, medicine_id=medicine_id).first()
    if existing:
        existing.quantity += quantity
    else:
        existing = CartItem(user_id=user.id, medicine_id=medicine_id, quantity=quantity)
        db.session.add(existing)
    db.session.commit()
    return jsonify(existing.to_dict()), 201

@bp.route('/<int:cid>', methods=['DELETE'])
@login_required
def remove_from_cart(user, cid):
    item = CartItem.query.filter_by(id=cid, user_id=user.id).first()
    if not item:
        return jsonify({'error': 'Not found'}), 404
    db.session.delete(item)
    db.session.commit()
    return jsonify({'ok': True}), 204

@bp.route('/<int:cid>', methods=['PATCH'])
@login_required
def update_cart_item(user, cid):
    item = CartItem.query.filter_by(id=cid, user_id=user.id).first()
    if not item:
        return jsonify({'error': 'Not found'}), 404
    data = request.get_json() or {}
    quantity = data.get('quantity')
    if quantity is not None:
        q = int(quantity)
        max_q = item.medicine.quantity if item.medicine.quantity else 999
        item.quantity = max(0, min(q, max_q))
    db.session.commit()
    return jsonify(item.to_dict())
