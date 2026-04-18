import os
import sys
import random
from datetime import datetime, date, timedelta
from flask import Flask
from app import db
from app.models import User, Medicine, CartItem, Invoice, Purchase
from app.routes.auth import hash_password

# Add backend to path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

def create_app():
    app = Flask(__name__, instance_relative_config=False)
    app.config.from_object('config.Config')
    db.init_app(app)
    
    # Register auth for hash_password access
    with app.app_context():
        from app.routes import auth
        auth.init_oauth(app)
    
    return app

def generate_historical_data(app, test_user, med_ids):
    """Generate 90 days historical sales/restocks"""
    with app.app_context():
        fresh_med_ids = [med_ids[name] for name in med_ids if 'Paracetamol' not in name and 'Aspirin' not in name and 'Metformin' not in name]
        
        # Boost initial stock for historical sales
        for mid in fresh_med_ids:
            m = Medicine.query.get(mid)
            if m:
                m.quantity += 10000  # plenty for sales
        
        db.session.commit()
        
        today = date.today()
        invoice_num = 3  # after TEST-002
        total_revenue = 0.0
        num_invoices = 0
        num_restocks = 0
        
        random.seed(42)  # reproducible
        
        for days_ago in range(1, 91):  # 90 days
            past_date = today - timedelta(days=days_ago)
            past_datetime = datetime.combine(past_date, datetime.min.time())
            
            # Random restock every ~5-10 days
            if days_ago % random.randint(4, 8) == 0:
                med_id = random.choice(fresh_med_ids)
                m = Medicine.query.get(med_id)
                if m:
                    delta = random.randint(80, 250)
                    m.quantity += delta
                    num_restocks += 1
            
            # Random 0-5 sales/day
            num_sales = random.randint(0, 5)
            if num_sales == 0:
                continue
            
            daily_subtotal = 0.0
            sale_meds = []
            
            for _ in range(num_sales):
                med_id = random.choice(fresh_med_ids)
                m = Medicine.query.get(med_id)
                if m and m.quantity > 0:
                    qty = random.randint(1, min(20, m.quantity // 2))
                    daily_subtotal += qty * m.cost_per_unit
                    m.quantity -= qty
                    sale_meds.append((med_id, qty, m.cost_per_unit))
            
            if daily_subtotal > 0:
                invoice_num += 1
                inv = Invoice(
                    user_id=test_user.id,
                    invoice_number=f'HIST-INV-{invoice_num:03d}',
                    subtotal=daily_subtotal,
                    tax_rate=0,
                    tax_amount=0,
                    total=daily_subtotal,
                    payment_status='completed',
                    created_at=past_datetime
                )
                db.session.add(inv)
                db.session.flush()
                
                # Add representative purchase (aggregate sales)
                if sale_meds:
                    last_med_id, last_qty, last_price = sale_meds[-1]
                    avg_price = daily_subtotal / sum(q for _,q,_ in sale_meds)
                    p = Purchase(
                        user_id=test_user.id,
                        medicine_id=last_med_id,
                        invoice_id=inv.id,
                        quantity=sum(q for _,q,_ in sale_meds),
                        unit_price=round(avg_price, 2),
                        total=daily_subtotal,
                        purchased_at=past_datetime
                    )
                    db.session.add(p)
                
                total_revenue += daily_subtotal
                num_invoices += 1
        
        db.session.commit()
        print(f"\nGenerated historical data:")
        print(f"- {num_invoices} invoices over 90 days")
        print(f"- Total added revenue: ₹{total_revenue:.2f} (avg daily ~₹{total_revenue/90:.2f})")
        print(f"- {num_restocks} restocks performed")
        print(f"- Final fresh stock levels reasonable (after net sales/restocks)")

def main():
    app = create_app()
    with app.app_context():
        print("Seeding test data...")
        
        # Optional: Clear test data
        test_user = User.query.filter_by(email='test@medmanager.com').first()
        if test_user:
            Medicine.query.filter_by(user_id=test_user.id).delete()
            CartItem.query.filter_by(user_id=test_user.id).delete()
            Purchase.query.filter_by(user_id=test_user.id).delete()
            Invoice.query.filter_by(user_id=test_user.id).delete()
            db.session.delete(test_user)
            db.session.commit()
            print("Cleared existing test user data.")
        
        # Create test user
        password = 'testpass'
        password_hash = hash_password(password)
        test_user = User(
            email='test@medmanager.com',
            name='Test User',
            password_hash=password_hash
        )
        db.session.add(test_user)
        db.session.commit()
        print(f"Created user ID: {test_user.id}, email: test@medmanager.com, pass: testpass")
        
        # Diverse stock categories
        expired_medicines = [
            {'name': 'Paracetamol 500mg', 'quantity': 4, 'cost_per_unit': 2.0, 'expiry_date': date(2024, 5, 15), 'usage': 'Painkiller'},
            {'name': 'Aspirin 100mg', 'quantity': 6, 'cost_per_unit': 1.5, 'expiry_date': date(2024, 11, 1), 'usage': 'Pain relief'},
            {'name': 'Metformin 500mg', 'quantity': 3, 'cost_per_unit': 0.8, 'expiry_date': date(2024, 12, 10), 'usage': 'Diabetes'},
        ]
        near_expiry_medicines = [
            {'name': 'Ibuprofen 400mg', 'quantity': 12, 'cost_per_unit': 3.0, 'expiry_date': date(2025, 1, 20), 'usage': 'Anti-inflammatory'},
            {'name': 'Amoxicillin 500mg', 'quantity': 8, 'cost_per_unit': 5.0, 'expiry_date': date(2025, 2, 15), 'usage': 'Antibiotic'},
            {'name': 'Vitamin C 1000mg', 'quantity': 10, 'cost_per_unit': 0.5, 'expiry_date': date(2025, 2, 28), 'usage': 'Supplement'},
            {'name': 'Crocin 500mg', 'quantity': 5, 'cost_per_unit': 1.2, 'expiry_date': date(2025, 3, 10), 'usage': 'Fever reducer'},
        ]
        fresh_low_medicines = [
            {'name': 'Augmentin 625mg', 'quantity': 18, 'cost_per_unit': 8.5, 'expiry_date': date(2025, 8, 30), 'usage': 'Antibiotic combo'},
            {'name': 'Cefixime 200mg', 'quantity': 7, 'cost_per_unit': 6.0, 'expiry_date': date(2025, 10, 15), 'usage': 'Antibiotic'},
            {'name': 'Omeprazole 20mg', 'quantity': 22, 'cost_per_unit': 1.8, 'expiry_date': date(2025, 11, 20), 'usage': 'Acid reflux'},
            {'name': 'Atorvastatin 20mg', 'quantity': 9, 'cost_per_unit': 4.2, 'expiry_date': date(2026, 1, 5), 'usage': 'Cholesterol'},
            {'name': 'Lisinopril 10mg', 'quantity': 15, 'cost_per_unit': 2.5, 'expiry_date': date(2026, 2, 28), 'usage': 'Blood pressure'},
        ]
        
        all_meds_data = expired_medicines + near_expiry_medicines + fresh_low_medicines
        med_ids = {}
        for data in all_meds_data:
            med = Medicine(
                user_id=test_user.id,
                name=data['name'],
                quantity=data['quantity'],
                cost_per_unit=data['cost_per_unit'],
                expiry_date=data['expiry_date'],
                usage=data['usage']
            )
            db.session.add(med)
        db.session.commit()
        
        # Get med ids
        for med in Medicine.query.filter_by(user_id=test_user.id).all():
            med_ids[med.name] = med.id
            print(f"Added medicine: {med.name} (ID:{med.id}, qty:{med.quantity}, cost/unit:₹{med.cost_per_unit}, expiry:{med.expiry_date}, status:{'Expired' if med.expiry_date < date.today() else 'Near' if med.expiry_date < date(2025, 4, 1) else 'Fresh'})")
        
        # Initial recent sales (today) (same as original)
        cart_items = []
        for name, qty in [('Ibuprofen 400mg', 10), ('Vitamin C 1000mg', 20)]:
            med = Medicine.query.filter_by(id=med_ids[name], user_id=test_user.id).first()
            item = CartItem(user_id=test_user.id, medicine_id=med.id, quantity=qty)
            db.session.add(item)
            cart_items.append(item)
        db.session.commit()
        
        # Checkout sale 1
        subtotal1 = sum(item.quantity * item.medicine.cost_per_unit for item in cart_items)
        inv1 = Invoice(
            user_id=test_user.id,
            invoice_number='INV-TEST-001',
            subtotal=subtotal1,
            tax_rate=0,
            tax_amount=0,
            total=subtotal1,
            payment_status='completed'
        )
        db.session.add(inv1)
        db.session.flush()
        for item in cart_items:
            med = item.medicine
            purchase = Purchase(
                user_id=test_user.id,
                medicine_id=med.id,
                invoice_id=inv1.id,
                quantity=item.quantity,
                unit_price=med.cost_per_unit,
                total=item.quantity * med.cost_per_unit
            )
            db.session.add(purchase)
            med.quantity -= item.quantity
        for item in cart_items:
            db.session.delete(item)
        db.session.commit()
        print(f"Recent invoice INV-TEST-001: ₹{subtotal1:.2f}")
        
        # Sale 2: Amoxicillin 5
        med = Medicine.query.filter_by(id=med_ids['Amoxicillin 500mg'], user_id=test_user.id).first()
        subtotal2 = 5 * med.cost_per_unit
        inv2 = Invoice(
            user_id=test_user.id,
            invoice_number='INV-TEST-002',
            subtotal=subtotal2,
            total=subtotal2,
            payment_status='completed'
        )
        db.session.add(inv2)
        db.session.flush()
        purchase2 = Purchase(
            user_id=test_user.id,
            medicine_id=med.id,
            invoice_id=inv2.id,
            quantity=5,
            unit_price=med.cost_per_unit,
            total=subtotal2
        )
        db.session.add(purchase2)
        med.quantity -= 5
        db.session.commit()
        print(f"Recent invoice INV-TEST-002: ₹{subtotal2:.2f}")
        
        # Generate historical
        generate_historical_data(app, test_user, med_ids)
        
        # Final verify
        from app.routes.profit_loss import get_date_n_days_ago
        for days in [30, 90]:
            cutoff = get_date_n_days_ago(days)
            total_revenue = db.session.query(db.func.sum(Invoice.total)).filter(
                db.and_(
                    Invoice.user_id == test_user.id,
                    Invoice.payment_status == 'completed',
                    Invoice.created_at >= cutoff
                )
            ).scalar() or 0
            total_loss = db.session.query(db.func.sum(Medicine.cost_per_unit * Medicine.quantity)).filter(
                db.and_(
                    Medicine.user_id == test_user.id,
                    Medicine.expiry_date < date.today()
                )
            ).scalar() or 0
            print(f"P&L last {days} days: Revenue ₹{total_revenue:.2f}, Loss ₹{total_loss:.2f}, Profit ₹{total_revenue - total_loss:.2f}")
        
        print("\nSeed complete! Diverse stock + 90-day multi-day purchase history for seasonality graphs.")
        print("1. python backend/run.py")
        print("2. Login: test@medmanager.com / testpass")
        print("3. Check Seasonality page (now shows structured multi-day trends!)")
        print("4. MyStock: Diverse statuses (expired, near, low fresh)")

if __name__ == '__main__':
    main()

