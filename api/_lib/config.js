import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const PLAN_PRICING = {
  pro: {
    monthly: 149000,
    yearly: 948000,
  },
};

let envLoaded = false;

function ensureLocalEnvLoaded() {
  if (envLoaded) return;
  envLoaded = true;

  try {
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = path.dirname(__filename);
    const projectRoot = path.resolve(__dirname, '..', '..');
    const envPath = path.join(projectRoot, '.env');

    if (!fs.existsSync(envPath)) return;

    const raw = fs.readFileSync(envPath, 'utf8');
    for (const line of raw.split(/\r?\n/)) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;

      const separatorIndex = trimmed.indexOf('=');
      if (separatorIndex <= 0) continue;

      const key = trimmed.slice(0, separatorIndex).trim();
      const value = trimmed.slice(separatorIndex + 1).trim();

      if (process.env[key] === undefined) {
        process.env[key] = value;
      }
    }
  } catch {
    // Best-effort local env loading for CLI tests.
  }
}

export function getEnv(name, fallbackNames = []) {
  ensureLocalEnvLoaded();
  const names = [name, ...fallbackNames];

  for (const key of names) {
    const value = process.env[key];
    if (value !== undefined && value !== '') return value;
  }

  return undefined;
}

export function getRequiredEnv(name, fallbackNames = []) {
  const value = getEnv(name, fallbackNames);
  if (!value) {
    throw new Error(`Missing environment variable: ${name}`);
  }
  return value;
}

export function getPlanAmount(planId, billingCycle) {
  const plan = PLAN_PRICING[planId];
  if (!plan) throw new Error(`Unsupported plan: ${planId}`);

  const amount = plan[billingCycle];
  if (!amount) throw new Error(`Unsupported billing cycle: ${billingCycle}`);

  return amount;
}

export function buildOrderId(productCode = 'PRO') {
  return `NCK-${String(productCode).toUpperCase()}-${Date.now()}`;
}
