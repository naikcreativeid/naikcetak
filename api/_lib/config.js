export const PLAN_PRICING = {
  pro: {
    monthly: 149000,
    yearly: 948000,
  },
};

export function getEnv(name, fallbackNames = []) {
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

export function isProductionMidtrans() {
  return getEnv('MIDTRANS_IS_PRODUCTION', ['VITE_MIDTRANS_IS_PRODUCTION']) === 'true';
}

export function getPlanAmount(planId, billingCycle) {
  const plan = PLAN_PRICING[planId];
  if (!plan) throw new Error(`Unsupported plan: ${planId}`);

  const amount = plan[billingCycle];
  if (!amount) throw new Error(`Unsupported billing cycle: ${billingCycle}`);

  return amount;
}

export function buildOrderId(userId) {
  const safeUser = (userId ?? '').replace(/-/g, '').slice(0, 8).toUpperCase() || 'USER';
  return `NC-${Date.now()}-${safeUser}`;
}
