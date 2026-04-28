// ============================================
// MIDTRANS DISABLED — 2026-04-28
// Alasan: Proses approval Midtrans belum selesai
// Akan diaktifkan kembali setelah akun disetujui
// ============================================

import { allowMethods, sendJson } from './_lib/http.js';

export default async function handler(req, res) {
  if (!allowMethods(req, res, ['POST'])) return;

  return sendJson(res, 410, {
    error: 'Midtrans checkout dinonaktifkan. Gunakan checkout manual via transfer bank atau QRIS.',
  });
}
