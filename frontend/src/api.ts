const API = '/api';

function getToken(): string | null {
  return localStorage.getItem('token');
}

function headers(includeAuth = true): Record<string, string> {
  const h: Record<string, string> = { 'Content-Type': 'application/json' };
  if (includeAuth && getToken()) h['Authorization'] = `Bearer ${getToken()}`;
  return h;
}

async function handleRes(r: Response) {
  const data = await r.json().catch(() => ({}));
  if (!r.ok) {
    const err: any = { status: r.status, ...data };
    err.error = err.error || data.message || (r.status === 0 ? 'Cannot reach server. Is the backend running on port 5000?' : `Request failed (${r.status})`);
    throw err;
  }
  return data;
}

export const auth = {
  signup: (body: any) => fetch(`${API}/auth/signup`, { method: 'POST', headers: headers(false), body: JSON.stringify(body) }).then(handleRes),
  login: (body: any) => fetch(`${API}/auth/login`, { method: 'POST', headers: headers(false), body: JSON.stringify(body) }).then(handleRes),
  me: () => fetch(`${API}/auth/me`, { headers: headers() }).then(handleRes),
  googleUrl: () => `${API}/auth/google?frontend=${encodeURIComponent(window.location.origin)}`,
};

export const dashboard = {
  get: () => fetch(`${API}/dashboard/`, { headers: headers() }).then(handleRes),
};

export const medicines = {
  list: (q?: string) => fetch(`${API}/medicines/${q ? `?q=${encodeURIComponent(q)}` : ''}`, { headers: headers() }).then(handleRes),
  get: (id: string) => fetch(`${API}/medicines/${id}`, { headers: headers() }).then(handleRes),
  add: (body: any) => fetch(`${API}/medicines/`, { method: 'POST', headers: headers(), body: JSON.stringify(body) }).then(handleRes),
  update: (id: string, body: any) => fetch(`${API}/medicines/${id}`, { method: 'PUT', headers: headers(), body: JSON.stringify(body) }).then(handleRes),
  delete: (id: string) => fetch(`${API}/medicines/${id}`, { method: 'DELETE', headers: headers() }).then(handleRes),
  adjustQuantity: (id: string, delta: number) => fetch(`${API}/medicines/${id}/quantity`, { method: 'PATCH', headers: headers(), body: JSON.stringify({ delta }) }).then(handleRes),
  bulkUpload: (formData: FormData) => fetch(`${API}/medicines/bulk`, { method: 'POST', headers: { Authorization: `Bearer ${getToken()}` }, body: formData }).then(handleRes),
};

export const notifications = {
  list: () => fetch(`${API}/notifications/`, { headers: headers() }).then(handleRes),
  markRead: (id: string) => fetch(`${API}/notifications/${id}/read`, { method: 'PATCH', headers: headers() }).then(handleRes),
  replenish: (id: string) => fetch(`${API}/notifications/${id}/replenish`, { method: 'POST', headers: headers() }).then(handleRes),
};

export const cart = {
  list: () => fetch(`${API}/cart/`, { headers: headers() }).then(handleRes),
  add: (medicine_id: string, quantity = 1) => fetch(`${API}/cart/`, { method: 'POST', headers: headers(), body: JSON.stringify({ medicine_id, quantity }) }).then(handleRes),
  remove: (id: string) => fetch(`${API}/cart/${id}`, { method: 'DELETE', headers: headers() }).then(handleRes),
  update: (id: string, quantity: number) => fetch(`${API}/cart/${id}`, { method: 'PATCH', headers: headers(), body: JSON.stringify({ quantity }) }).then(handleRes),
};

export const invoices = {
  list: () => fetch(`${API}/invoices/`, { headers: headers() }).then(handleRes),
  get: (id: string) => fetch(`${API}/invoices/${id}`, { headers: headers() }).then(handleRes),
  checkout: (tax_rate = 0) => fetch(`${API}/invoices/checkout`, { method: 'POST', headers: headers(), body: JSON.stringify({ tax_rate }) }).then(handleRes),
  pay: (invoice_id: string) => fetch(`${API}/invoices/pay`, { method: 'POST', headers: headers(), body: JSON.stringify({ invoice_id }) }).then(handleRes),
};

export const seasonality = {
  top: () => fetch(`${API}/seasonality/top`, { headers: headers() }).then(handleRes),
  monthly: () => fetch(`${API}/seasonality/monthly`, { headers: headers() }).then(handleRes),
  seasonal: () => fetch(`${API}/seasonality/seasonal`, { headers: headers() }).then(handleRes),
};



export const profitLoss = {
  daily: (days = 30) => fetch(`${API}/profit-loss/daily?days=${days}`, { headers: headers() }).then(handleRes),
  summary: (days = 30) => fetch(`${API}/profit-loss/summary?days=${days}`, { headers: headers() }).then(handleRes),
};

export const medguide = {
  analyze: (formData: FormData) => fetch(`${API}/medguide/analyze`, { 
    method: 'POST', 
    headers: { Authorization: `Bearer ${getToken()}` }, 
    body: formData 
  }).then(handleRes),
};

