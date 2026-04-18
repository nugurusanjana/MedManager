import { useEffect, useState } from 'react';
import { medicines } from '@/api';
import toast from 'react-hot-toast';
import './UpdateStock.css';

export default function UpdateStock() {
  const today = new Date().toISOString().slice(0, 10);
  const [list, setList] = useState<any[]>([]);
  const [editing, setEditing] = useState<string | null>(null);
  const [form, setForm] = useState({ name: '', expiry_date: '', quantity: '' as any, usage: '', cost_per_unit: '' as any });
  const [formErrors, setFormErrors] = useState<any>({});
  const [bulkError, setBulkError] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = () => {
    medicines.list().then(setList).catch((e) => setError(e.error || 'Failed to load')).finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const openAdd = () => {
    setEditing(null);
    setForm({ name: '', expiry_date: new Date().toISOString().slice(0, 10), quantity: '', usage: '', cost_per_unit: '' });
  };

  const openEdit = (m: any) => {
    setEditing(m.id);
    setForm({
      name: m.name,
      expiry_date: m.expiry_date,
      quantity: m.quantity != null ? String(m.quantity) : '',
      usage: m.usage || '',
      cost_per_unit: m.cost_per_unit != null ? String(m.cost_per_unit) : '',
    });
  };

  const save = () => {
    const errs: any = {};
    if (!form.name.trim()) errs.name = 'Name is required';
    if (!form.expiry_date) errs.expiry_date = 'Expiry date is required';
    else if (form.expiry_date < today) errs.expiry_date = 'Cannot be in the past';
    if (form.quantity === '' || Number(form.quantity) < 0) errs.quantity = 'Quantity must be >=0';
    setFormErrors(errs);
    if (Object.keys(errs).length) return;

    setError('');
    const payload = {
      ...form,
      quantity: form.quantity === '' ? 0 : Number(form.quantity),
      cost_per_unit: form.cost_per_unit === '' ? 0 : Number(form.cost_per_unit),
    };
    const promise = editing ? medicines.update(editing, payload) : medicines.add(payload);
    promise
      .then(() => { setEditing(null); load(); openAdd(); toast.success('Saved successfully'); })
      .catch((e) => { const msg = e.error || 'Save failed'; setError(msg); toast.error(msg); });
  };

  const remove = (id: string) => {
    if (!confirm('Delete this medicine?')) return;
    medicines.delete(id)
      .then(() => { load(); toast.success('Deleted'); })
      .catch((e) => { const msg = e.error || 'Delete failed'; setError(msg); toast.error(msg); });
  };

  const handleBulk = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setBulkError('');
    const fd = new FormData();
    fd.append('file', file);
    medicines.bulkUpload(fd)
      .then((r) => { setBulkError(`Added ${r.created} items.`); toast.success(`Added ${r.created} items`); })
      .catch((err) => { setBulkError(err.error || 'Upload failed'); toast.error(err.error || 'Upload failed'); });
    e.target.value = '';
  };

  const handleQuantityChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value;
    if (value === '') { setForm((f) => ({ ...f, quantity: '' })); return; }
    if (/^0\d+$/.test(value)) value = value.replace(/^0+/, '');
    const regex = /^\d*$/;
    if (regex.test(value)) {
      const parsed = parseInt(value, 10);
      if (!isNaN(parsed) && parsed >= 0) setForm((f) => ({ ...f, quantity: parsed }));
      else if (value === '0') setForm((f) => ({ ...f, quantity: 0 }));
    }
  };

  const handleCostChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (value === '') { setForm((f) => ({ ...f, cost_per_unit: '' })); return; }
    const regex = /^\d*\.?\d*$/;
    if (regex.test(value)) {
      const parsed = parseFloat(value);
      if (!isNaN(parsed) && parsed >= 0) setForm((f) => ({ ...f, cost_per_unit: parsed }));
      else if (value === '0' || value === '0.') setForm((f) => ({ ...f, cost_per_unit: 0 }));
    }
  };

  return (
    <div className="update-stock-page">
      <header className="page-header">
        <h1>Update Stock</h1>
        <p className="text-muted">Add, edit, or delete medicines. Bulk upload via CSV/Excel.</p>
      </header>
      {error && <div className="page-error">{error}</div>}
      {bulkError && <div className={bulkError.startsWith('Added') ? 'bulk-success' : 'page-error'}>{bulkError}</div>}
      <div className="card form-card">
        <h2>{editing ? 'Edit medicine' : 'Add medicine'}</h2>
        <div className="form-grid">
          <label className="label">Name *</label>
          <input className="input" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} placeholder="Medicine name" />
          {formErrors.name && <div className="field-error">{formErrors.name}</div>}
          <label className="label">Expiry date *</label>
          <input type="date" className="input" value={form.expiry_date} onChange={(e) => setForm((f) => ({ ...f, expiry_date: e.target.value }))} min={today} />
          {formErrors.expiry_date && <div className="field-error">{formErrors.expiry_date}</div>}
          <label className="label">Quantity</label>
          {formErrors.quantity && <div className="field-error">{formErrors.quantity}</div>}
          <input type="number" min="0" step="1" className="input quantity-input" value={form.quantity}
            onChange={handleQuantityChange}
            onFocus={() => { if (form.quantity === '0' || form.quantity === 0) setForm((f) => ({ ...f, quantity: '' })); }}
            onBlur={() => { if (form.quantity === '') setForm((f) => ({ ...f, quantity: 0 })); }}
            onWheel={(e) => (e.target as HTMLElement).blur()}
            placeholder="Enter quantity" aria-label="Quantity" />
          <label className="label">Usage</label>
          <input className="input" value={form.usage} onChange={(e) => setForm((f) => ({ ...f, usage: e.target.value }))} placeholder="e.g. painkiller" />
          <label className="label">Cost per unit (₹)</label>
          <input type="number" min="0" step="0.01" className="input cost-input" value={form.cost_per_unit || ''}
            onChange={handleCostChange} placeholder="Enter cost per unit" aria-label="Cost per unit" />
        </div>
        <div className="form-actions">
          <button type="button" className="btn btn-primary" onClick={save}>Save</button>
          {editing && <button type="button" className="btn btn-secondary" onClick={openAdd}>Cancel</button>}
        </div>
      </div>
      <div className="bulk-row">
        <label className="btn btn-secondary">
          Upload CSV/Excel
          <input type="file" accept=".csv,.xlsx,.xls" hidden onChange={handleBulk} />
        </label>
      </div>
      <div className="card list-card">
        <h2>Current stock</h2>
        {loading ? (
          <div className="page-loading">Loading…</div>
        ) : (
          <ul className="medicine-list">
            {list.length === 0 ? (
              <li className="empty">No medicines yet.</li>
            ) : (
              list.map((m) => (
                <li key={m.id} className={editing === m.id ? 'editing' : ''}>
                  <span className="name">{m.name}</span>
                  <span className="meta">Exp: {m.expiry_date} · Qty: {m.quantity} · ₹{Number(m.cost_per_unit).toFixed(2)}</span>
                  <div className="actions">
                    <button type="button" className="btn btn-sm btn-secondary" onClick={() => openEdit(m)}>Edit</button>
                    <button type="button" className="btn btn-sm btn-danger" onClick={() => remove(m.id)}>Delete</button>
                  </div>
                </li>
              ))
            )}
          </ul>
        )}
      </div>
    </div>
  );
}
