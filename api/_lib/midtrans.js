// ============================================
// MIDTRANS DISABLED — 2026-04-28
// Alasan: Proses approval Midtrans belum selesai
// Akan diaktifkan kembali setelah akun disetujui
// ============================================

export function getMidtransSnap() {
  throw new Error('Midtrans integration is disabled.');
}

export function verifyMidtransSignature() {
  return false;
}

export function isSuccessfulTransaction(status, fraudStatus) {
  if (status === 'settlement') return true;
  if (status === 'capture') return (fraudStatus ?? 'accept') === 'accept';
  return false;
}

export function mapUpgradeRequestStatus(transactionStatus, fraudStatus) {
  if (isSuccessfulTransaction(transactionStatus, fraudStatus)) return 'approved';
  if (transactionStatus === 'pending') return 'pending';
  if (transactionStatus === 'deny') return 'rejected';
  if (['cancel', 'expire', 'failure'].includes(transactionStatus)) return 'cancelled';
  return 'pending';
}
