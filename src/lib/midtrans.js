const MIDTRANS_SCRIPT_ID = 'midtrans-snap-script';

function getClientKey() {
  return import.meta.env.VITE_MIDTRANS_CLIENT_KEY;
}

function getScriptUrl() {
  return import.meta.env.VITE_MIDTRANS_IS_PRODUCTION === 'true'
    ? 'https://app.midtrans.com/snap/snap.js'
    : 'https://app.sandbox.midtrans.com/snap/snap.js';
}

export function loadMidtransSnapScript() {
  if (typeof window === 'undefined') {
    return Promise.reject(new Error('Midtrans Snap hanya tersedia di browser'));
  }

  if (!getClientKey()) {
    return Promise.reject(new Error('VITE_MIDTRANS_CLIENT_KEY belum diatur'));
  }

  if (window.snap) {
    return Promise.resolve(window.snap);
  }

  const existing = document.getElementById(MIDTRANS_SCRIPT_ID);
  if (existing) {
    return new Promise((resolve, reject) => {
      existing.addEventListener('load', () => resolve(window.snap), { once: true });
      existing.addEventListener('error', () => reject(new Error('Gagal memuat Midtrans Snap')), { once: true });
    });
  }

  return new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.id = MIDTRANS_SCRIPT_ID;
    script.src = getScriptUrl();
    script.async = true;
    script.dataset.clientKey = getClientKey();
    script.onload = () => resolve(window.snap);
    script.onerror = () => reject(new Error('Gagal memuat Midtrans Snap'));
    document.body.appendChild(script);
  });
}

export async function createMidtransTransaction({ accessToken, planId, billingCycle, customerDetails, paymentNotes }) {
  const response = await fetch('/api/midtrans-token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify({
      planId,
      billingCycle,
      customer_details: customerDetails,
      paymentNotes,
    }),
  });

  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(payload.error || 'Gagal membuat transaksi Midtrans');
  }

  return payload;
}

export function getMidtransStatusLabel(status) {
  const labels = {
    pending: 'Menunggu pembayaran',
    settlement: 'Pembayaran berhasil',
    capture: 'Pembayaran berhasil',
    deny: 'Pembayaran ditolak',
    cancel: 'Pembayaran dibatalkan',
    expire: 'Pembayaran kedaluwarsa',
    failure: 'Pembayaran gagal',
    approved: 'Pembayaran berhasil',
    rejected: 'Pembayaran ditolak',
    cancelled: 'Pembayaran dibatalkan',
  };

  return labels[status] || status || 'Memproses pembayaran';
}
