import { useEffect, useRef, useState } from 'react';
import QRCode from 'qrcode';
import { cart, invoices } from '@/api';
import './Cart.css';

const UPI_ID = import.meta.env.VITE_UPI_ID;
const PAYEE_NAME = import.meta.env.VITE_PAYEE_NAME;

function UPIQRCode({ amount, note }: { amount: number; note: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!amount || !canvasRef.current) return;
    const params = new URLSearchParams({
      pa: UPI_ID,
      pn: PAYEE_NAME,
      am: parseFloat(String(amount)).toFixed(2),
      cu: 'INR',
      ...(note ? { tn: note } : {}),
    });
    QRCode.toCanvas(canvasRef.current, `upi://pay?${params.toString()}`, { width: 200, margin: 2 });
  }, [amount, note]);

  return (
    <div className="flex flex-col items-center mt-5 pt-5 border-t border-gray-200 gap-1.5">
      <p className="text-sm text-gray-500 mb-0">Scan to pay via UPI</p>
      <canvas ref={canvasRef} className="rounded-lg pointer-events-none" />
      <p className="text-xs text-gray-400 mb-0">{UPI_ID}</p>
    </div>
  );
}

export default function Cart() {
  const [items, setItems] = useState<any[]>([]);
  const [taxRate, setTaxRate] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [checkoutDone, setCheckoutDone] = useState<any>(null);
  const [paySuccess, setPaySuccess] = useState<boolean | null>(null);

  const load = () => {
    cart.list().then(setItems).catch((e) => setError(e.error || 'Failed to load')).finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const subtotal = items.reduce((s, i) => s + (i.total || 0), 0);
  const taxAmount = (subtotal * taxRate) / 100;
  const total = subtotal + taxAmount;

  const updateQty = (id: string, quantity: number) => {
    if (quantity < 1) return;
    cart.update(id, quantity).then(() => load()).catch((e) => setError(e.error || 'Failed'));
  };

  const remove = (id: string) => {
    cart.remove(id).then(() => { load(); window.dispatchEvent(new Event('cartChanged')); }).catch((e) => setError(e.error || 'Failed'));
  };

  const doCheckout = () => {
    setError('');
    invoices.checkout(taxRate).then((inv) => {
      setCheckoutDone(inv);
      setItems([]);
      window.dispatchEvent(new Event('cartChanged'));
    }).catch((e) => setError(e.error || 'Checkout failed'));
  };

  const doPay = () => {
    if (!checkoutDone?.id) return;
    invoices.pay(checkoutDone.id).then(() => {
      setPaySuccess(true);
      window.dispatchEvent(new Event('cartChanged'));
    }).catch((e) => setError(e.error || 'Payment failed'));
  };

  if (loading) return <div className="page-loading">Loading cart…</div>;

  return (
    <div className="cart-page">
      <header className="page-header">
        <h1>Cart</h1>
        <p className="text-muted">Review and checkout. Optional tax % applied at checkout.</p>
      </header>
      {error && <div className="page-error">{error}</div>}
      {paySuccess && <div className="success-msg">Payment simulated successfully.</div>}
      {!checkoutDone ? (
        <>
          <div className="card cart-list">
            {items.length === 0 ? (
              <p className="no-data">Cart is empty. Add items from My Stock.</p>
            ) : (
              <table className="cart-table">
                <thead>
                  <tr><th>Name</th><th>Qty</th><th>Unit price</th><th>Total</th><th></th></tr>
                </thead>
                <tbody>
                  {items.map((i) => (
                    <tr key={i.id}>
                      <td>{i.name}</td>
                      <td>
                        <div className="qty-controls">
                          <button type="button" className="btn btn-icon btn-secondary btn-sm" onClick={() => updateQty(i.id, i.quantity - 1)}>−</button>
                          <span>{i.quantity}</span>
                          <button type="button" className="btn btn-icon btn-secondary btn-sm" onClick={() => updateQty(i.id, i.quantity + 1)}>+</button>
                        </div>
                      </td>
                      <td>₹{Number(i.unit_price).toFixed(2)}</td>
                      <td>₹{Number(i.total).toFixed(2)}</td>
                      <td><button type="button" className="btn btn-sm btn-danger" onClick={() => remove(i.id)}>Remove</button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
          {items.length > 0 && (
            <div className="card checkout-card">
              <label className="label">Tax % (optional)</label>
              <input type="number" min="0" max="100" step="0.5" className="input w-30"
                value={taxRate || ''} onChange={(e) => setTaxRate(parseFloat(e.target.value) || 0)} />
              <div className="totals">
                <p>Subtotal: ₹{subtotal.toFixed(2)}</p>
                <p>Tax: ₹{taxAmount.toFixed(2)}</p>
                <p><strong>Total: ₹{total.toFixed(2)}</strong></p>
              </div>
              <button type="button" className="btn btn-primary" onClick={doCheckout}>Checkout & generate invoice</button>
            </div>
          )}
        </>
      ) : (
        <div className="card invoice-card">
          <h2>Invoice {checkoutDone.invoice_number}</h2>
          <p>Subtotal: ₹{Number(checkoutDone.subtotal).toFixed(2)}</p>
          <p>Tax: ₹{Number(checkoutDone.tax_amount).toFixed(2)}</p>
          <p><strong>Total: ₹{Number(checkoutDone.total).toFixed(2)}</strong></p>
          <p className="payment-status">Status: {checkoutDone.payment_status}</p>
          <UPIQRCode amount={checkoutDone.total} note={`Invoice ${checkoutDone.invoice_number}`} />
          <div className="mt-4 flex gap-2 justify-center">
            <button type="button" className="btn btn-primary" onClick={doPay}>Simulate payment</button>
            <button type="button" className="btn btn-secondary" onClick={() => setCheckoutDone(null)}>Back to cart</button>
          </div>
        </div>
      )}
    </div>
  );
}
