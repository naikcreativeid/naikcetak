import { formatRupiah } from '../utils/formatRupiah';

export async function sendEmailKonfirmasiOrder({
  to,
  nama,
  orderId,
  namaPaket,
  totalBayar,
  kodeUnik,
}) {
  const response = await fetch('/api/send-email', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      to,
      template: 'order-confirmation',
      payload: {
        nama,
        orderId,
        namaPaket,
        totalBayar: formatRupiah(totalBayar),
        totalBayarRaw: totalBayar,
        kodeUnik,
      },
    }),
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.error || 'Gagal mengirim email konfirmasi order.');
  }

  return data;
}

export async function sendEmailReminder({ to, nama }) {
  const response = await fetch('/api/send-email', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      to,
      template: 'starter-reminder',
      payload: { nama },
    }),
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.error || 'Gagal mengirim email reminder.');
  }

  return data;
}
