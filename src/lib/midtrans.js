// ============================================
// MIDTRANS DISABLED — 2026-04-28
// Alasan: Proses approval Midtrans belum selesai
// Akan diaktifkan kembali setelah akun disetujui
// ============================================

import { getPaymentStatusLabel } from './payments';

export function loadMidtransSnapScript() {
  return Promise.reject(new Error('Midtrans is disabled. Gunakan checkout manual.'));
}

export async function createMidtransTransaction() {
  throw new Error('Midtrans is disabled. Gunakan checkout manual.');
}

export function getMidtransStatusLabel(status) {
  return getPaymentStatusLabel(status);
}
