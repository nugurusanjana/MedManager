from datetime import datetime
from flask import Blueprint, request, jsonify
from app import db
from app.models import Invoice, Purchase, CartItem, Medicine
from app.auth_utils import login_required

bp = Blueprint('invoices', __name__)

def next_invoice_number():
    last = Invoice.query.order_by(Invoice.id.desc()).first()
    n = (last.id if last else 0) + 1
    return f"INV-{datetime.utcnow().strftime('%Y%m%d')}-{n:04d}"

@bp.route('/checkout', methods=['POST'])
@login_required
def checkout(user):
    """Create invoice from cart, record purchases, clear cart. Optional tax_rate in body."""
    data = request.get_json() or {}
    tax_rate = float(data.get('tax_rate') or 0)
    items = CartItem.query.filter_by(user_id=user.id).all()
    if not items:
        return jsonify({'error': 'Cart is empty'}), 400
    subtotal = 0
    for item in items:
        if not item.medicine:
            continue
        subtotal += item.quantity * item.medicine.cost_per_unit
    tax_amount = round(subtotal * (tax_rate / 100), 2)
    total = round(subtotal + tax_amount, 2)
    inv = Invoice(
        user_id=user.id,
        invoice_number=next_invoice_number(),
        subtotal=subtotal,
        tax_rate=tax_rate,
        tax_amount=tax_amount,
        total=total,
        payment_status='pending',
    )
    db.session.add(inv)
    db.session.flush()
    for item in items:
        if not item.medicine:
            continue
        m = item.medicine
        unit_price = m.cost_per_unit
        qty = item.quantity
        tot = round(qty * unit_price, 2)
        db.session.add(Purchase(user_id=user.id, medicine_id=m.id, invoice_id=inv.id, quantity=qty, unit_price=unit_price, total=tot))
        m.quantity = max(0, m.quantity - qty)
        db.session.delete(item)
    db.session.commit()
    return jsonify(inv.to_dict()), 201

@bp.route('/pay', methods=['POST'])
@login_required
def dummy_pay(user):
    """Simulate payment: accept invoice_id, mark as completed."""
    data = request.get_json() or {}
    invoice_id = data.get('invoice_id')
    if not invoice_id:
        return jsonify({'error': 'invoice_id required'}), 400
    inv = Invoice.query.filter_by(id=invoice_id, user_id=user.id).first()
    if not inv:
        return jsonify({'error': 'Invoice not found'}), 404
    inv.payment_status = 'completed'
    db.session.commit()
    return jsonify({'ok': True, 'invoice': inv.to_dict(), 'message': 'Payment simulated successfully.'})

@bp.route('/')
@login_required
def list_invoices(user):
    invs = Invoice.query.filter_by(user_id=user.id).order_by(Invoice.created_at.desc()).all()
    return jsonify([i.to_dict() for i in invs])

@bp.route('/<int:iid>')
@login_required
def get_invoice(user, iid):
    inv = Invoice.query.filter_by(id=iid, user_id=user.id).first()
    if not inv:
        return jsonify({'error': 'Not found'}), 404
    purchases = Purchase.query.filter_by(invoice_id=inv.id).all()
    lines = [{'medicine_name': p.medicine.name if p.medicine else 'N/A', 'quantity': p.quantity, 'unit_price': p.unit_price, 'total': p.total} for p in purchases]
    out = inv.to_dict()
    out['lines'] = lines
    return jsonify(out)
