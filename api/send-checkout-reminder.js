import { allowMethods, sendJson } from './_lib/http.js';
import { getEnv } from './_lib/config.js';
import { authenticateRequestUser, getSupabaseAdmin } from './_lib/supabase-admin.js';
import { getManualPaymentConfig } from './_lib/manual-payment.js';
import { sendWhatsApp } from './_lib/fonnte.js';
import { tplCheckoutReminder } from './_lib/whatsapp-templates.js';

const ADMIN_EMAILS = new Set([
  'naikcetakexclusive@gmail.com',
  'naikphotoexclusive@gmail.com',
  'admin@naikcetak.com',
]);

function isAuthorizedCron(req) {
  const cronSecret = getEnv('CRON_SECRET');
  if (!cronSecret) return false;
  const authHeader = req.headers.authorization ?? req.headers.Authorization ?? '';
  return authHeader === `Bearer ${cronSecret}`;
}

async function ensureAuthorized(req) {
  if (isAuthorizedCron(req)) {
    return { mode: 'cron', email: 'cron@naikcetak.local' };
  }
  const user = await authenticateRequestUser(req);
  if (!ADMIN_EMAILS.has(user.email)) {
    throw new Error('Unauthorized');
  }
  return { mode: 'admin', email: user.email };
}

export default async function handler(req, res) {
  if (!allowMethods(req, res, ['GET', 'POST'])) return;

  try {
    await ensureAuthorized(req);

    const limit = Math.min(Number(req.query.limit ?? req.body?.limit ?? 25) || 25, 100);
    const dryRun = `${req.query.dryRun ?? req.body?.dryRun ?? 'false'}` === 'true';
    const config = getManualPaymentConfig();
    const supabaseAdmin = getSupabaseAdmin();

    const { data: rows, error } = await supabaseAdmin.rpc('get_unpaid_checkout_reminders', {
      p_limit: limit,
    });
    if (error) throw new Error(`RPC gagal: ${error.message}`);

    const candidates = rows ?? [];

    if (dryRun) {
      return sendJson(res, 200, {
        ok: true,
        dryRun: true,
        candidateCount: candidates.length,
        candidates: candidates.map((row) => ({
          requestId: row.request_id,
          email: row.user_email,
          phone: row.phone_number,
          orderId: row.order_id,
          amount: row.amount_to_pay,
          submittedAt: row.submitted_at,
          reminderCount: row.reminder_count,
        })),
      });
    }

    const sent = [];
    const failed = [];
    for (const row of candidates) {
      const message = tplCheckoutReminder({
        customerName: row.user_name || row.user_email,
        planId: row.requested_plan,
        billingCycle: row.billing_cycle,
        amount: row.amount_to_pay,
        orderId: row.order_id,
        appUrl: config.appUrl,
      });

      const result = await sendWhatsApp({ target: row.phone_number, message });

      if (result.sent) {
        await supabaseAdmin.rpc('mark_unpaid_checkout_reminded', { p_request_id: row.request_id });
        sent.push({ requestId: row.request_id, email: row.user_email });
      } else {
        failed.push({
          requestId: row.request_id,
          email: row.user_email,
          reason: result.reason ?? result.error ?? 'unknown',
        });
      }
    }

    return sendJson(res, 200, {
      ok: true,
      sentCount: sent.length,
      failedCount: failed.length,
      sent,
      failed,
    });
  } catch (error) {
    console.error('[send-checkout-reminder]', error);
    const status = error.message === 'Unauthorized' || error.message === 'Missing bearer token' ? 401 : 500;
    return sendJson(res, status, { error: error.message || 'Failed to send checkout reminders' });
  }
}
