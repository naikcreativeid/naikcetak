import { allowMethods, sendJson } from './_lib/http.js';
import {
  authenticateRequestUser,
  getSupabaseAdmin,
} from './_lib/supabase-admin.js';
import { getManualPaymentConfig } from './_lib/manual-payment.js';
import { sendWhatsApp } from './_lib/fonnte.js';
import {
  tplUpgradeApproved,
  tplUpgradeRejected,
} from './_lib/whatsapp-templates.js';

const ADMIN_EMAILS = new Set([
  'naikcetakexclusive@gmail.com',
  'naikphotoexclusive@gmail.com',
  'admin@naikcetak.com',
]);

export default async function handler(req, res) {
  if (!allowMethods(req, res, ['POST'])) return;

  try {
    const adminUser = await authenticateRequestUser(req);
    if (!ADMIN_EMAILS.has(adminUser.email)) {
      return sendJson(res, 403, { error: 'Akses admin diperlukan.' });
    }

    const { requestId, decision, reason, expiresAt } = req.body ?? {};

    if (!requestId) {
      return sendJson(res, 400, { error: 'requestId wajib diisi.' });
    }
    if (decision !== 'approved' && decision !== 'rejected') {
      return sendJson(res, 400, { error: 'decision harus "approved" atau "rejected".' });
    }

    const supabaseAdmin = getSupabaseAdmin();
    const { data: request, error: fetchErr } = await supabaseAdmin
      .from('upgrade_requests')
      .select('id, user_id, user_email, user_name, requested_plan, billing_cycle')
      .eq('id', requestId)
      .maybeSingle();

    if (fetchErr) throw new Error(`Gagal load upgrade_request: ${fetchErr.message}`);
    if (!request) return sendJson(res, 404, { error: 'Upgrade request tidak ditemukan.' });

    const { data: profile } = await supabaseAdmin
      .from('user_profiles')
      .select('phone_number, full_name, plan_expires_at')
      .eq('id', request.user_id)
      .maybeSingle();

    const phone = profile?.phone_number ?? '';
    if (!phone) {
      return sendJson(res, 200, { sent: false, skipped: true, reason: 'no_phone_number' });
    }

    const customerName = request.user_name || profile?.full_name || request.user_email || '';
    const config = getManualPaymentConfig();
    const effectiveExpiresAt = expiresAt || profile?.plan_expires_at;

    const message = decision === 'approved'
      ? tplUpgradeApproved({
          customerName,
          planId: request.requested_plan,
          billingCycle: request.billing_cycle,
          expiresAt: effectiveExpiresAt,
          appUrl: config.appUrl,
        })
      : tplUpgradeRejected({
          customerName,
          planId: request.requested_plan,
          billingCycle: request.billing_cycle,
          reason,
          adminWhatsApp: config.adminWhatsApp,
        });

    const result = await sendWhatsApp({ target: phone, message });

    return sendJson(res, 200, {
      sent: result.sent === true,
      skipped: result.skipped === true,
      reason: result.reason ?? null,
    });
  } catch (error) {
    console.error('[notify-upgrade-decision]', error);
    const status = error.message === 'Unauthorized' || error.message === 'Missing bearer token' ? 401 : 500;
    return sendJson(res, status, { error: error.message || 'Failed to notify upgrade decision.' });
  }
}
