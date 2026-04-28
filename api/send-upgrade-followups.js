import { allowMethods, sendJson } from './_lib/http.js';
import { getEnv } from './_lib/config.js';
import { getSupabaseAdmin, authenticateRequestUser } from './_lib/supabase-admin.js';
import { sendEmailReminder } from './_lib/email.js';
import { getManualPaymentConfig } from './_lib/manual-payment.js';

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
    return { mode: 'cron', email: 'cron@naikcetak.local', userId: null };
  }

  const user = await authenticateRequestUser(req);
  const targetUserId = req.query.targetUserId ?? req.body?.targetUserId ?? null;
  if (!ADMIN_EMAILS.has(user.email) && targetUserId !== user.id) {
    throw new Error('Unauthorized');
  }

  return {
    mode: ADMIN_EMAILS.has(user.email) ? 'admin' : 'self',
    email: user.email,
    userId: user.id,
    targetUserId,
  };
}

export default async function handler(req, res) {
  if (!allowMethods(req, res, ['GET', 'POST'])) return;

  try {
    const auth = await ensureAuthorized(req);

    const limit = Math.min(Number(req.query.limit ?? req.body?.limit ?? 25) || 25, 100);
    const dryRun = `${req.query.dryRun ?? req.body?.dryRun ?? 'false'}` === 'true';
    const appUrl = getManualPaymentConfig().appUrl || 'https://app.naikcetak.com';
    const supabaseAdmin = getSupabaseAdmin();

    let query = supabaseAdmin
      .from('user_profiles')
      .select('id, email, full_name, company_name, plan, plan_status, created_at, last_upgrade_followup_email_at, upgrade_followup_email_count')
      .eq('plan', 'starter')
      .not('email', 'is', null);

    if (auth.mode === 'self' && auth.userId) {
      query = query.eq('id', auth.userId);
    } else if (auth.targetUserId) {
      query = query.eq('id', auth.targetUserId);
    } else {
      query = query.is('last_upgrade_followup_email_at', null).order('created_at', { ascending: true }).limit(limit);
    }

    const { data: rows, error } = await query;

    if (error) throw new Error(error.message);

    const candidates = (rows ?? []).filter((row) => row.plan_status === 'active');

    if (dryRun) {
      return sendJson(res, 200, {
        ok: true,
        dryRun: true,
        candidateCount: candidates.length,
        candidates: candidates.map((row) => ({
          id: row.id,
          email: row.email,
          name: row.full_name || row.company_name || null,
          createdAt: row.created_at,
        })),
      });
    }

    const sent = [];
    for (const row of candidates) {
      await sendEmailReminder({
        to: row.email,
        nama: row.full_name || row.company_name || row.email,
        appUrl,
      });

      await supabaseAdmin
        .from('user_profiles')
        .update({
          last_upgrade_followup_email_at: new Date().toISOString(),
          upgrade_followup_email_count: (row.upgrade_followup_email_count ?? 0) + 1,
          updated_at: new Date().toISOString(),
        })
        .eq('id', row.id);

      sent.push({
        id: row.id,
        email: row.email,
      });
    }

    sendJson(res, 200, {
      ok: true,
      sentCount: sent.length,
      sent,
    });
  } catch (error) {
    console.error('[send-upgrade-followups]', error);
    sendJson(res, error.message === 'Unauthorized' ? 401 : 500, {
      error: error.message || 'Failed to send follow-up emails',
    });
  }
}
