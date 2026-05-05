const PAYMENT_METHODS = {
  bank_bca: {
    id: 'bank_bca',
    label: 'Transfer BCA',
    shortLabel: 'BCA',
    type: 'bank_transfer',
  },
  bank_mandiri: {
    id: 'bank_mandiri',
    label: 'Transfer Mandiri',
    shortLabel: 'Mandiri',
    type: 'bank_transfer',
  },
  qris: {
    id: 'qris',
    label: 'QRIS',
    shortLabel: 'QRIS',
    type: 'qris',
  },
};

const PAYMENT_STATUS_LABELS = {
  pending: 'Menunggu pembayaran',
  manual_review: 'Menunggu verifikasi admin',
  approved: 'Pembayaran terverifikasi',
  rejected: 'Pembayaran ditolak',
  cancelled: 'Permintaan dibatalkan',
};

const PAYMENT_STATUS_META = {
  pending: { label: 'Menunggu pembayaran', bg: 'bg-amber-100', text: 'text-amber-700', dot: 'bg-amber-400' },
  manual_review: { label: 'Menunggu verifikasi', bg: 'bg-blue-100', text: 'text-blue-700', dot: 'bg-blue-500' },
  approved: { label: 'Sudah aktif', bg: 'bg-emerald-100', text: 'text-emerald-700', dot: 'bg-emerald-500' },
  rejected: { label: 'Ditolak', bg: 'bg-red-100', text: 'text-red-700', dot: 'bg-red-500' },
  cancelled: { label: 'Dibatalkan', bg: 'bg-zinc-100', text: 'text-zinc-600', dot: 'bg-zinc-400' },
};

// Fallback hardcoded supaya rekening & logo tetap tampil di production walau
// VITE_BCA_NO_REK / VITE_MANDIRI_NO_REK belum di-set di Vercel env vars.
const PAYMENT_FALLBACK = {
  bca: {
    accountNumber: '2740238623',
    accountName: 'Dwi Retno Dinda Ramdhiani',
    logo: '/images/banks/bca.png',
  },
  mandiri: {
    accountNumber: '1610017114047',
    accountName: 'Dwi Retno Dinda Ramdhiani',
    logo: '/images/banks/mandiri.png',
  },
  adminWhatsApp: '6282261039601',
  qrisImage: '/images/qris/qris-naikcetak.png',
};

function pick(envValue, fallback) {
  const v = (envValue ?? '').toString().trim();
  return v || fallback;
}

export function getPaymentEnv() {
  return {
    bca: {
      accountNumber: pick(import.meta.env.VITE_BCA_NO_REK, PAYMENT_FALLBACK.bca.accountNumber),
      accountName: pick(import.meta.env.VITE_BCA_ATAS_NAMA, PAYMENT_FALLBACK.bca.accountName),
      logo: PAYMENT_FALLBACK.bca.logo,
    },
    mandiri: {
      accountNumber: pick(import.meta.env.VITE_MANDIRI_NO_REK, PAYMENT_FALLBACK.mandiri.accountNumber),
      accountName: pick(import.meta.env.VITE_MANDIRI_ATAS_NAMA, PAYMENT_FALLBACK.mandiri.accountName),
      logo: PAYMENT_FALLBACK.mandiri.logo,
    },
    adminWhatsApp: pick(import.meta.env.VITE_ADMIN_WA, PAYMENT_FALLBACK.adminWhatsApp),
    qrisImage: pick(import.meta.env.VITE_QRIS_IMAGE, PAYMENT_FALLBACK.qrisImage),
    appUrl: pick(import.meta.env.VITE_APP_URL, typeof window !== 'undefined' ? window.location.origin : ''),
  };
}

export function getPaymentMethodOptions() {
  const env = getPaymentEnv();

  return [
    {
      ...PAYMENT_METHODS.bank_bca,
      accountNumber: env.bca.accountNumber,
      accountName: env.bca.accountName,
      logo: env.bca.logo,
      instructions: 'Transfer sesuai nominal unik agar admin lebih mudah verifikasi otomatis.',
    },
    {
      ...PAYMENT_METHODS.bank_mandiri,
      accountNumber: env.mandiri.accountNumber,
      accountName: env.mandiri.accountName,
      logo: env.mandiri.logo,
      instructions: 'Gunakan rekening Mandiri jika lebih nyaman untuk transfer antarbank Anda.',
    },
    {
      ...PAYMENT_METHODS.qris,
      accountName: 'NaikCetak',
      qrisImage: env.qrisImage,
      instructions: 'Scan QRIS, masukkan nominal unik tepat sesuai instruksi, lalu simpan bukti bayar.',
    },
  ];
}

export function getPaymentMethodMeta(method) {
  return getPaymentMethodOptions().find((item) => item.id === method) ?? getPaymentMethodOptions()[0];
}

export function getPaymentStatusLabel(status) {
  return PAYMENT_STATUS_LABELS[status] ?? status ?? 'Menunggu pembayaran';
}

export function getPaymentStatusMeta(status) {
  return PAYMENT_STATUS_META[status] ?? PAYMENT_STATUS_META.pending;
}

export function getBaseAmount(planId, billingCycle, plans) {
  const plan = plans?.[planId];
  if (!plan) return 0;
  return billingCycle === 'yearly' ? plan.prices.yearly : plan.prices.monthly;
}

export function getUniqueCodeFromAmount(amount, planId, billingCycle, plans) {
  const baseAmount = getBaseAmount(planId, billingCycle, plans);
  const safeAmount = Number(amount) || 0;
  const code = safeAmount - baseAmount;
  return code > 0 ? code : 0;
}

export function formatUniqueCode(code) {
  return String(code || 0).padStart(3, '0');
}

export function formatPaymentMethodLabel(method) {
  const meta = getPaymentMethodMeta(method);
  return meta?.label ?? method ?? '-';
}

export function buildWhatsAppPaymentText({
  adminWhatsApp,
  customerName,
  planName,
  billingCycleLabel,
  amount,
  orderId,
  paymentMethod,
}) {
  const meta = getPaymentMethodMeta(paymentMethod);
  const lines = [
    `Halo admin NaikCetak, saya ${customerName}.`,
    `Saya sudah membuat permintaan upgrade ${planName} (${billingCycleLabel}).`,
    `Order ID: ${orderId}`,
    `Metode bayar: ${meta.shortLabel}`,
    `Nominal: Rp ${Number(amount || 0).toLocaleString('id-ID')}`,
    'Saya akan kirim bukti transfer setelah pembayaran selesai.',
  ];

  return `https://wa.me/${adminWhatsApp}?text=${encodeURIComponent(lines.join('\n'))}`;
}

export function getInstructionDeadline(createdAt, hours = 24) {
  const base = createdAt ? new Date(createdAt) : new Date();
  return new Date(base.getTime() + hours * 60 * 60 * 1000);
}

