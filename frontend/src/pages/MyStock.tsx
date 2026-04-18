import { useEffect, useState } from 'react';
import { medicines, cart } from '@/api';
import toast from 'react-hot-toast';
import './MyStock.css';

export default function MyStock() {
  const [list, setList] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [cartItems, setCartItems] = useState<any[]>([]);
  const [cartVisible, setCartVisible] = useState(false);

  const load = () => {
    setLoading(true);
    medicines.list(search)
      .then((data) => setList(data))  // Show all stock: fresh, expiring, expired
      .catch((e) => setError(e.error || 'Failed to load'))
      .finally(() => setLoading(false));

  };

  useEffect(() => {
    load();
    loadCart();
  }, [search]);

  const updateLocalQty = (id: string, delta: number) => {
    setList((lst) => {
      const updated = lst.map((m) => m.id === id ? { ...m, quantity: m.quantity + delta } : m);
      return updated.filter((m) => m.quantity > 0);
    });
  };

  const adjustQty = (id: string, delta: number) => {
    updateLocalQty(id, delta);
    return medicines.adjustQuantity(id, delta)
      .then(() => {
        if (delta !== 0) toast.success(delta < 0 ? 'Quantity decreased' : 'Quantity increased');
      })
      .catch((e) => {
        const msg = e.error || 'Failed';
        setError(msg);
        toast.error(msg);
        load();
        throw e;
      });
  };

  const loadCart = () => {
    cart.list().then(setCartItems).catch(() => {});
  };

  const addToCart = async (medicine_id: string, quantity = 1) => {
    try {
      await cart.add(medicine_id, quantity);
      await adjustQty(medicine_id, -quantity);
      setError('');
      loadCart();
      window.dispatchEvent(new Event('cartChanged'));
      toast.success('Added to cart');
    } catch (e: any) {
      toast.error(e.error || 'Failed to add to cart');
    }
  };

  const highlight = (text: string, query: string) => {
    if (!query.trim()) return text;
    const re = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
    return text.replace(re, '<mark>$1</mark>');
  };

  return (
    <div className="my-stock-page">
      <header className="page-header">
        <h1>My Stock</h1>
        <input
          type="search"
          className="input search-input"
          placeholder="Search by name or usage…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </header>
      {error && <div className="page-error">{error}</div>}
      {loading ? (
        <div className="page-loading">Loading…</div>
      ) : (
        <div className="stock-table-wrap card">
          <table className="stock-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Expiry</th>
                <th>Quantity</th>
                <th>Status</th>
                <th>Cost/unit</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {list.length === 0 ? (
                <tr><td colSpan={6}>No medicines. Add some in Update Stock.</td></tr>
              ) : (
                list.map((m) => {
                  const today = new Date().toISOString().slice(0, 10);
                  let status = 'healthy';
                  if (m.expiry_date < today) status = 'expired';
                  else if (m.quantity <= 5) status = 'low';
                  const isExpired = m.expiry_date < today;
                  return (
                    <tr key={m.id} className={m.quantity <= 0 ? 'out-of-stock' : ''}>
                      <td><span dangerouslySetInnerHTML={{ __html: highlight(m.name, search) }} /></td>
                      <td>{m.expiry_date}</td>
                      <td>
                        <div className="qty-controls">
                          <button type="button" className="btn btn-icon btn-secondary btn-sm" onClick={() => adjustQty(m.id, -1)} disabled={m.quantity <= 0}>−</button>
                          <span className="qty-value">{m.quantity}</span>
                          <button type="button" className="btn btn-icon btn-secondary btn-sm" onClick={() => adjustQty(m.id, 1)}>+</button>
                        </div>
                      </td>
                      <td><span className={`badge badge-${status}`}>{status === 'healthy' ? 'Healthy' : status === 'low' ? 'Low stock' : 'Expired'}</span></td>
                      <td>₹{Number(m.cost_per_unit).toFixed(2)}</td>
                      <td>
                        <button type="button" className="btn btn-primary btn-sm" onClick={() => addToCart(m.id, 1)} disabled={m.quantity <= 0 || isExpired} title={isExpired ? 'Cannot buy expired medicines' : ''}>
                          Buy
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      )}
      <div className={`cart-panel ${cartVisible ? 'open' : 'closed'}`}>
        <button className="cart-toggle btn btn-secondary btn-sm" onClick={() => setCartVisible(!cartVisible)}>
          🛒 {cartItems.length}
        </button>
        {cartVisible && (
          <div className="cart-contents card">
            {cartItems.length === 0 ? (
              <p className="no-data">Cart is empty.</p>
            ) : (
              <ul className="cart-summary">
                {cartItems.map((i) => (
                  <li key={i.id}>{i.name} × {i.quantity}</li>
                ))}
              </ul>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
