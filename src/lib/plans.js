// Plan configuration — single source of truth untuk semua limit & fitur

export const PLANS = {
  starter: {
    id: 'starter',
    name: 'Starter',
    tagline: 'Untuk coba-coba & UMKM kecil yang baru kenal software percetakan',
    color: '#6B7280',
    badge: 'Free',
    prices: { monthly: 0, yearly: 0, yearlyPerMonth: 0 },
    earlyBird: { monthly: 0, yearly: 0, active: false },
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
      exportPDF: false,
      groqAI: false,
      groqAIIncluded: false,
      whatsappIntegration: false,
      multiOutlet: false,
      customBranding: false,
      apiAccess: false,
      prioritySupport: false,
      onboardingCall: false,
    },
  },

  pro: {
    id: 'pro',
    name: 'Pro',
    tagline: 'Untuk percetakan aktif yang butuh semua fitur tanpa batas',
    color: '#2563EB',
    badge: 'Pro',
    prices: { monthly: 149000, yearly: 1188000, yearlyPerMonth: 99000 },
    earlyBird: {
      monthly: 99000,
      yearly: 790000,
      active: true, // ganti false setelah 20 user pertama
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
      exportPDF: true,
      groqAI: true,
      groqAIIncluded: false,
      whatsappIntegration: true,
      multiOutlet: false,
      customBranding: false,
      apiAccess: false,
      prioritySupport: false,
      onboardingCall: false,
    },
  },

  business: {
    id: 'business',
    name: 'Business',
    tagline: 'Untuk percetakan besar dengan tim dan banyak outlet / cabang',
    color: '#D97706',
    badge: 'Business',
    prices: { monthly: 349000, yearly: 2988000, yearlyPerMonth: 249000 },
    earlyBird: {
      monthly: 249000,
      yearly: 2388000,
      active: true, // ganti false setelah early bird berakhir
    },
    limits: {
      potongKertasPerMonth: null,
      hitungCetakanPerMonth: null,
      masterKertasItems: null,
      masterFinishingItems: null,
      masterMesinItems: null,
      teamMembers: null,
      historyDays: null,
      outlets: null,
    },
    features: {
      potongKertas: true,
      hitungCetakan: true,
      kalkulatorHPP: true,
      invoice: true,
      quotation: true,
      trackingOrder: true,
      exportPDF: true,
      groqAI: true,
      groqAIIncluded: true,
      whatsappIntegration: true,
      multiOutlet: true,
      customBranding: true,
      apiAccess: true,
      prioritySupport: true,
      onboardingCall: true,
    },
  },
};

// ── Helpers ───────────────────────────────────────────────────────────────────

export function canAccessFeature(planId, feature) {
  return PLANS[planId]?.features[feature] === true;
}

export function isWithinLimit(planId, limitKey, currentCount) {
  const limit = PLANS[planId]?.limits[limitKey];
  if (limit === null || limit === undefined) return true; // unlimited
  return currentCount < limit;
}

export function getEffectivePrice(planId, cycle) {
  const p = PLANS[planId];
  if (!p) return 0;
  if (p.earlyBird.active) {
    return cycle === 'monthly' ? p.earlyBird.monthly : p.earlyBird.yearly;
  }
  return cycle === 'monthly' ? p.prices.monthly : p.prices.yearly;
}

export function formatPriceLabel(planId, cycle) {
  const price = getEffectivePrice(planId, cycle);
  if (price === 0) return 'Gratis';
  return 'Rp\u00A0' + price.toLocaleString('id-ID');
}

// ── Kontak & info pembayaran — GANTI dengan data asli ────────────────────────
export const PAYMENT_INFO = {
  bank: 'BCA',
  accountNumber: '2740049987',    // GANTI
  accountName: 'Faizal Nur Apriyadi',    // GANTI
  whatsappAdmin: '082261039601', // GANTI
  emailAdmin: 'admin@naikcetak.com',
};

export const ADMIN_EMAILS = [
  'naikcetakexclusive@gmail.com',
  'naikphotoexclusive@gmail.com',
  'admin@naikcetak.com', // tambah email admin lain jika perlu
];
