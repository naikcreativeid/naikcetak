import { allowMethods, sendJson } from './_lib/http.js';
import { getEnv } from './_lib/config.js';
import { getSupabaseAdmin } from './_lib/supabase-admin.js';
import { sendEmailReminder } from './_lib/email.js';

function isAuthorized(secret) {
  const expected = getEnv('CRON_SECRET');
  return Boolean(expected) && secret === expected;
}

function getSevenDaysAgoIso() {
  return new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
}

export default async function handler(req, res) {
  if (!allowMethods(req, res, ['GET', 'POST'])) return;

  const secret = req.query.secret ?? req.body?.secret;
  if (!isAuthorized(secret)) {
    return sendJson(res, 401, { error: 'Unauthorized' });
  }

  try {
    const supabaseAdmin = getSupabaseAdmin();
    const sevenDaysAgo = getSevenDaysAgoIso();

    const { data: users, error } = await supabaseAdmin
      .from('user_profiles')
      .select('id, email, full_name, company_name, plan, plan_status, last_upgrade_followup_email_at, upgrade_followup_email_count')
      .eq('plan', 'starter')
      .eq('plan_status', 'active')
      .not('email', 'is', null)
      .or(`last_upgrade_followup_email_at.is.null,last_upgrade_followup_email_at.lt.${sevenDaysAgo}`)
      .limit(50);

    if (error) throw new Error(error.message);

    let sent = 0;
    for (const user of users ?? []) {
      await sendEmailReminder({
        to: user.email,
        nama: user.full_name || user.company_name || user.email,
      });

      await supabaseAdmin
        .from('user_profiles')
        .update({
          last_upgrade_followup_email_at: new Date().toISOString(),
          upgrade_followup_email_count: (user.upgrade_followup_email_count ?? 0) + 1,
          updated_at: new Date().toISOString(),
        })
        .eq('id', user.id);

      sent += 1;
      await new Promise((resolve) => setTimeout(resolve, 500));
    }

    return sendJson(res, 200, { success: true, sent });
  } catch (error) {
    console.error('[send-reminder]', error);
    return sendJson(res, 500, { error: error.message });
  }
}
