import { allowMethods, sendJson } from './_lib/http.js';
import { getEnv } from './_lib/config.js';

function readBooleanEnv(name, fallbackNames = []) {
  const value = getEnv(name, fallbackNames);
  if (value === undefined) return null;
  return value === 'true';
}

function getEnvPresence(name, fallbackNames = []) {
  const directValue = getEnv(name);
  if (directValue !== undefined) {
    return {
      name,
      present: true,
      source: name,
    };
  }

  for (const fallbackName of fallbackNames) {
    const fallbackValue = getEnv(fallbackName);
    if (fallbackValue !== undefined) {
      return {
        name,
        present: true,
        source: fallbackName,
      };
    }
  }

  return {
    name,
    present: false,
    source: null,
  };
}

export default async function handler(req, res) {
  if (!allowMethods(req, res, ['GET'])) return;

  const envChecks = {
    VITE_SUPABASE_URL: getEnvPresence('VITE_SUPABASE_URL', ['SUPABASE_URL']),
    VITE_SUPABASE_ANON_KEY: getEnvPresence('VITE_SUPABASE_ANON_KEY', ['SUPABASE_ANON_KEY']),
    VITE_MIDTRANS_CLIENT_KEY: getEnvPresence('VITE_MIDTRANS_CLIENT_KEY'),
    MIDTRANS_SERVER_KEY: getEnvPresence('MIDTRANS_SERVER_KEY'),
    SUPABASE_SERVICE_ROLE_KEY: getEnvPresence('SUPABASE_SERVICE_ROLE_KEY'),
    VITE_MIDTRANS_IS_PRODUCTION: getEnvPresence('VITE_MIDTRANS_IS_PRODUCTION', ['MIDTRANS_IS_PRODUCTION']),
    MIDTRANS_IS_PRODUCTION: getEnvPresence('MIDTRANS_IS_PRODUCTION', ['VITE_MIDTRANS_IS_PRODUCTION']),
  };

  const checkoutReady =
    envChecks.VITE_SUPABASE_URL.present &&
    envChecks.VITE_SUPABASE_ANON_KEY.present &&
    envChecks.VITE_MIDTRANS_CLIENT_KEY.present &&
    envChecks.MIDTRANS_SERVER_KEY.present;

  const webhookReady =
    envChecks.MIDTRANS_SERVER_KEY.present &&
    envChecks.SUPABASE_SERVICE_ROLE_KEY.present;

  const clientProductionMode = readBooleanEnv('VITE_MIDTRANS_IS_PRODUCTION');
  const serverProductionMode = readBooleanEnv('MIDTRANS_IS_PRODUCTION', ['VITE_MIDTRANS_IS_PRODUCTION']);
  const midtransModeAligned =
    clientProductionMode !== null &&
    serverProductionMode !== null &&
    clientProductionMode === serverProductionMode;

  const missing = Object.values(envChecks)
    .filter((item) => !item.present)
    .map((item) => item.name);

  const warnings = [];
  if (!checkoutReady) {
    warnings.push('Checkout Midtrans belum siap penuh karena masih ada env penting yang belum terpasang.');
  }
  if (!webhookReady) {
    warnings.push('Webhook Midtrans belum siap penuh; pembayaran bisa terjadi tetapi aktivasi paket otomatis berisiko gagal.');
  }
  if (!midtransModeAligned) {
    warnings.push('Mode Midtrans client/server tidak sinkron. Samakan VITE_MIDTRANS_IS_PRODUCTION dan MIDTRANS_IS_PRODUCTION.');
  }

  sendJson(res, 200, {
    ok: checkoutReady && webhookReady && midtransModeAligned,
    checkedAt: new Date().toISOString(),
    environment: {
      nodeEnv: process.env.NODE_ENV ?? null,
      clientMidtransProduction: clientProductionMode,
      serverMidtransProduction: serverProductionMode,
      midtransModeAligned,
    },
    capabilities: {
      checkoutReady,
      webhookReady,
      automaticPlanActivationReady: webhookReady,
    },
    env: envChecks,
    missing,
    warnings,
  });
}
