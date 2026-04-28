import { saveOrder } from './_orderStore';

async function sendEmailKonfirmasiOrder({
  to,
  nama,
  orderId,
  namaPaket,
  totalBayar,
  kodeUnik,
}) {
  try {
    if (typeof fetch !== 'function') return;
    await fetch('/api/send-email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        to,
        subject: `Konfirmasi Order ${orderId}`,
        template: 'order-confirmation',
        payload: {
          nama,
          orderId,
          namaPaket,
          totalBayar,
          kodeUnik,
        },
      }),
    });
  } catch (error) {
    console.warn('[create-order] send email skipped:', error);
  }
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const order = req.body;

  try {
    saveOrder(order);

    await sendEmailKonfirmasiOrder({
      to: order.pemesan.email,
      nama: order.pemesan.nama,
      orderId: order.orderId,
      namaPaket: order.produk.nama,
      totalBayar: order.totalBayar,
      kodeUnik: order.kodeUnik,
    });

    res.status(200).json({ success: true, orderId: order.orderId });
  } catch (error) {
    console.error('create-order error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
}
