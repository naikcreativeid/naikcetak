// Plan configuration — single source of truth untuk semua limit & fitur

export const PLANS = {
  starter: {
    id: 'starter',
    name: 'Starter',
    tagline: 'Untuk coba-coba & UMKM kecil yang baru kenal software percetakan',
    color: '#6B7280',
    badge: 'Free',
    prices: { monthly: 0, yearly: 0, yearlyPerMonth: 0 },
    limits: {
      potongKertasPerMonth: 10,
      hitungCetakanPerMonth: 5,
      masterKertasItems: 5,
      masterFinishingItems: 0,
      masterMesinItems: 0,
      teamMembers: 1,
      historyDays: 7,
      outlets: 1,
    },
    features: {
      potongKertas: true,
      hitungCetakan: true,
      kalkulatorHPP: false,
      invoice: false,
      quotation: false,
      trackingOrder: false,
      publicStore: false,
      exportPDF: false,
      groqAI: false,
      groqAIIncluded: false,
      whatsappIntegration: false,
      multiOutlet: false,
      customBranding: false,
      apiAccess: false,
      prioritySupport: false,
      onboardingCall: false,
      earlyAccess: false,
    },
  },

  pro: {
    id: 'pro',
    name: 'Pro',
    tagline: 'Untuk percetakan aktif yang butuh semua fitur tanpa batas',
    color: '#2563EB',
    badge: 'Pro',
    prices: {
      monthly: 149000,
      yearly: 948000,
      yearlyPerMonth: 79000,
      savingsPercent: 47,
    },
    limits: {
      potongKertasPerMonth: null,
      hitungCetakanPerMonth: null,
      masterKertasItems: null,
      masterFinishingItems: null,
      masterMesinItems: null,
      teamMembers: 3,
      historyDays: 365,
      outlets: 1,
    },
    features: {
      potongKertas: true,
      hitungCetakan: true,
      kalkulatorHPP: true,
      invoice: true,
      quotation: true,
      trackingOrder: true,
      publicStore: true,
      exportPDF: true,
      groqAI: true,
      groqAIIncluded: false,
      whatsappIntegration: true,
      multiOutlet: false,
      customBranding: false,
      apiAccess: false,
      prioritySupport: false,
      onboardingCall: false,
      earlyAccess: true,
    },
  },
};

// ── Helpers ───────────────────────────────────────────────────────────────────

export function canAccessFeature(planId, feature) {
  return PLANS[planId]?.features[feature] === true;
}

export function isWithinLimit(planId, limitKey, currentCount) {
  const limit = PLANS[planId]?.limits[limitKey];
  if (limit === null || limit === undefined) return true;
  return currentCount < limit;
}

export function getEffectivePrice(planId, cycle) {
  const p = PLANS[planId];
  if (!p) return 0;
  return cycle === 'monthly' ? p.prices.monthly : p.prices.yearly;
}

export function getDisplayPrice(planId, cycle) {
  const p = PLANS[planId];
  if (!p) return 0;
  return cycle === 'yearly' ? p.prices.yearlyPerMonth : p.prices.monthly;
}

export function getActualPayment(planId, cycle) {
  return getEffectivePrice(planId, cycle);
}

export function hasEarlyAccess(planId, cycle) {
  return cycle === 'yearly' && PLANS[planId]?.features?.earlyAccess === true;
}

export function formatPriceLabel(planId, cycle) {
  const price = getEffectivePrice(planId, cycle);
  if (price === 0) return 'Gratis';
  return 'Rp\u00A0' + price.toLocaleString('id-ID');
}

// ── Kontak & info pembayaran ──────────────────────────────────────────────────
export const PAYMENT_INFO = {
  bank: 'BCA',
  accountNumber: '2740049987',
  accountName: 'Faizal Nur Apriyadi',
  whatsappAdmin: '6282261039601',
  emailAdmin: 'admin@naikcetak.com',
};

export const ADMIN_EMAILS = [
  'naikcetakexclusive@gmail.com',
  'naikphotoexclusive@gmail.com',
  'admin@naikcetak.com',
];
