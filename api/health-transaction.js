import { allowMethods, sendJson } from './_lib/http.js';
import { getEnv } from './_lib/config.js';

function getEnvPresence(name, fallbackNames = []) {
  const directValue = getEnv(name);
  if (directValue !== undefined) {
    return { name, present: true, source: name };
  }

  for (const fallbackName of fallbackNames) {
    const fallbackValue = getEnv(fallbackName);
    if (fallbackValue !== undefined) {
      return { name, present: true, source: fallbackName };
    }
  }

  return { name, present: false, source: null };
}

export default async function handler(req, res) {
  if (!allowMethods(req, res, ['GET'])) return;

  const envChecks = {
    VITE_SUPABASE_URL: getEnvPresence('VITE_SUPABASE_URL', ['SUPABASE_URL']),
    VITE_SUPABASE_ANON_KEY: getEnvPresence('VITE_SUPABASE_ANON_KEY', ['SUPABASE_ANON_KEY']),
    SUPABASE_SERVICE_ROLE_KEY: getEnvPresence('SUPABASE_SERVICE_ROLE_KEY'),
    VITE_BCA_NO_REK: getEnvPresence('VITE_BCA_NO_REK', ['NEXT_PUBLIC_BCA_NO_REK']),
    VITE_BCA_ATAS_NAMA: getEnvPresence('VITE_BCA_ATAS_NAMA', ['NEXT_PUBLIC_BCA_ATAS_NAMA']),
    VITE_MANDIRI_NO_REK: getEnvPresence('VITE_MANDIRI_NO_REK', ['NEXT_PUBLIC_MANDIRI_NO_REK']),
    VITE_MANDIRI_ATAS_NAMA: getEnvPresence('VITE_MANDIRI_ATAS_NAMA', ['NEXT_PUBLIC_MANDIRI_ATAS_NAMA']),
    VITE_ADMIN_WA: getEnvPresence('VITE_ADMIN_WA', ['NEXT_PUBLIC_ADMIN_WA']),
    VITE_QRIS_IMAGE: getEnvPresence('VITE_QRIS_IMAGE', ['NEXT_PUBLIC_QRIS_IMAGE']),
    SMTP_HOST: getEnvPresence('SMTP_HOST'),
    SMTP_PORT: getEnvPresence('SMTP_PORT'),
    SMTP_USER: getEnvPresence('SMTP_USER'),
    SMTP_PASS: getEnvPresence('SMTP_PASS'),
    EMAIL_FROM: getEnvPresence('EMAIL_FROM'),
  };

  const checkoutReady =
    envChecks.VITE_SUPABASE_URL.present &&
    envChecks.VITE_SUPABASE_ANON_KEY.present &&
    envChecks.VITE_BCA_NO_REK.present &&
    envChecks.VITE_ADMIN_WA.present;

  const emailReady =
    envChecks.SUPABASE_SERVICE_ROLE_KEY.present &&
    envChecks.SMTP_HOST.present &&
    envChecks.SMTP_PORT.present &&
    envChecks.SMTP_USER.present &&
    envChecks.SMTP_PASS.present &&
    envChecks.EMAIL_FROM.present;

  const missing = Object.values(envChecks)
    .filter((item) => !item.present)
    .map((item) => item.name);

  const warnings = [];
  if (!checkoutReady) {
    warnings.push('Checkout manual belum siap penuh karena masih ada env pembayaran yang belum terpasang.');
  }
  if (!emailReady) {
    warnings.push('Email follow-up otomatis belum siap; lengkapi SMTP Hostinger dan service role Supabase.');
  }

  sendJson(res, 200, {
    ok: checkoutReady && emailReady,
    checkedAt: new Date().toISOString(),
    capabilities: {
      manualCheckoutReady: checkoutReady,
      starterFollowUpEmailReady: emailReady,
    },
    env: envChecks,
    missing,
    warnings,
  });
}
