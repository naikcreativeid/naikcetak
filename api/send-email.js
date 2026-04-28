import { allowMethods, sendJson } from './_lib/http.js';
import { sendEmailKonfirmasiOrder, sendEmailReminder } from './_lib/email.js';

export default async function handler(req, res) {
  if (!allowMethods(req, res, ['POST'])) return;

  try {
    const { to, template, payload } = req.body ?? {};

    if (!to) {
      return sendJson(res, 400, { error: 'Recipient email is required.' });
    }

    if (template === 'order-confirmation') {
      await sendEmailKonfirmasiOrder({
        to,
        nama: payload?.nama,
        orderId: payload?.orderId,
        namaPaket: payload?.namaPaket,
        totalBayar: payload?.totalBayarRaw ?? payload?.totalBayar,
        kodeUnik: payload?.kodeUnik,
      });
    } else if (template === 'starter-reminder') {
      await sendEmailReminder({
        to,
        nama: payload?.nama,
      });
    } else {
      return sendJson(res, 400, { error: 'Template email tidak dikenali.' });
    }

    return sendJson(res, 200, { success: true });
  } catch (error) {
    console.error('[send-email]', error);
    return sendJson(res, 500, { error: error.message || 'Failed to send email.' });
  }
}
