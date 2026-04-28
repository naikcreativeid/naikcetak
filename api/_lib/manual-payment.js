import { getEnv, getPlanAmount } from './config.js';

const PAYMENT_METHODS = new Set(['bank_bca', 'bank_mandiri', 'qris']);

export function getManualPaymentConfig() {
  return {
    bca: {
      accountNumber: getEnv('VITE_BCA_NO_REK', ['NEXT_PUBLIC_BCA_NO_REK']) ?? '',
      accountName: getEnv('VITE_BCA_ATAS_NAMA', ['NEXT_PUBLIC_BCA_ATAS_NAMA']) ?? '',
    },
    mandiri: {
      accountNumber: getEnv('VITE_MANDIRI_NO_REK', ['NEXT_PUBLIC_MANDIRI_NO_REK']) ?? '',
      accountName: getEnv('VITE_MANDIRI_ATAS_NAMA', ['NEXT_PUBLIC_MANDIRI_ATAS_NAMA']) ?? '',
    },
    adminWhatsApp: getEnv('VITE_ADMIN_WA', ['NEXT_PUBLIC_ADMIN_WA']) ?? '6282261039601',
    qrisImage: getEnv('VITE_QRIS_IMAGE', ['NEXT_PUBLIC_QRIS_IMAGE']) ?? '/images/qris/qris-naikcetak.png',
    appUrl: getEnv('VITE_APP_URL', ['NEXT_PUBLIC_APP_URL']) ?? '',
  };
}

export function normalizeManualPaymentMethod(method) {
  return PAYMENT_METHODS.has(method) ? method : 'bank_bca';
}

export function generateUniqueCode() {
  return Math.floor(Math.random() * 900) + 100;
}

export function buildManualPaymentAmount(planId, billingCycle, uniqueCode) {
  return getPlanAmount(planId, billingCycle) + uniqueCode;
}

export function buildManualPaymentNotes({ paymentNotes, customerName, paymentMethod, uniqueCode }) {
  const safeNotes = (paymentNotes ?? '').trim();
  const extra = [
    `Manual payment via ${paymentMethod}`,
    `Kode unik ${String(uniqueCode).padStart(3, '0')}`,
    customerName ? `Atas nama ${customerName}` : null,
  ].filter(Boolean).join(' | ');

  return safeNotes ? `${safeNotes}\n${extra}` : extra;
}
