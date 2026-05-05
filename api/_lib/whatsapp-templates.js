function formatRupiah(amount) {
  const n = Number(amount ?? 0);
  return 'Rp ' + new Intl.NumberFormat('id-ID').format(Math.round(n));
}

function planLabel(planId, billingCycle) {
  const plan = String(planId ?? 'pro').toLowerCase();
  const cycle = billingCycle === 'yearly' ? 'Tahunan' : 'Bulanan';
  if (plan === 'pro') return `NaikCetak Pro ${cycle}`;
  if (plan === 'business') return `NaikCetak Business ${cycle}`;
  return `NaikCetak ${plan.toUpperCase()} ${cycle}`;
}

function formatDateID(date) {
  if (!date) return '—';
  return new Date(date).toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

function safeName(name, fallback = 'kak') {
  const trimmed = (name ?? '').toString().trim();
  return trimmed || fallback;
}

export function tplUpgradeRequestReceived({ customerName, planId, billingCycle, amount, orderId, appUrl }) {
  const dashboard = appUrl || 'https://app.naikcetak.com';
  return (
    `Halo ${safeName(customerName)}! 🎉\n` +
    `Permintaan upgrade ke *${planLabel(planId, billingCycle)}* sudah kami terima.\n\n` +
    `🆔 Order ID: ${orderId || '—'}\n` +
    `💰 Nominal: ${formatRupiah(amount)}\n\n` +
    `Tim kami akan verifikasi pembayaran maksimal 1×24 jam setelah bukti transfer diterima.\n` +
    `Cek status: ${dashboard}/dashboard\n\n` +
    `— NaikCetak`
  );
}

export function tplUpgradeApproved({ customerName, planId, billingCycle, expiresAt, appUrl }) {
  const dashboard = appUrl || 'https://app.naikcetak.com';
  return (
    `Halo ${safeName(customerName)}! ✅\n` +
    `Akun NaikCetak Anda sudah diupgrade ke *${planLabel(planId, billingCycle)}*.\n\n` +
    `📅 Aktif hingga: ${formatDateID(expiresAt)}\n\n` +
    `Silakan login ulang dan refresh halaman untuk melihat fitur lengkap.\n` +
    `${dashboard}/dashboard\n\n` +
    `Terima kasih sudah mempercayai NaikCetak! 🙏`
  );
}

export function tplUpgradeRejected({ customerName, planId, billingCycle, reason, adminWhatsApp }) {
  const adminContact = adminWhatsApp ? `\n\nHubungi admin: wa.me/${adminWhatsApp}` : '';
  return (
    `Halo ${safeName(customerName)}, 🙏\n` +
    `Mohon maaf, permintaan upgrade *${planLabel(planId, billingCycle)}* belum bisa kami proses.\n\n` +
    `Alasan: ${reason || 'Bukti pembayaran perlu diperiksa ulang.'}\n\n` +
    `Silakan submit ulang permintaan upgrade dengan bukti transfer yang valid.${adminContact}\n\n` +
    `— NaikCetak`
  );
}

export function tplCheckoutReminder({ customerName, planId, billingCycle, amount, orderId, appUrl }) {
  const dashboard = appUrl || 'https://app.naikcetak.com';
  return (
    `Halo ${safeName(customerName)}, 👋\n` +
    `Pembayaran upgrade *${planLabel(planId, billingCycle)}* Anda belum kami terima.\n\n` +
    `🆔 Order ID: ${orderId || '—'}\n` +
    `💰 Nominal: ${formatRupiah(amount)}\n\n` +
    `Selesaikan pembayaran dan upload bukti transfer di:\n${dashboard}/dashboard\n\n` +
    `Butuh bantuan? Balas pesan ini.\n` +
    `— NaikCetak`
  );
}

export function tplAdminNotifNewUpgrade({ customerName, customerEmail, planId, billingCycle, amount, orderId, paymentMethod, appUrl }) {
  const dashboard = appUrl || 'https://app.naikcetak.com';
  return (
    `🚨 Upgrade Request Baru\n\n` +
    `👤 ${customerName || customerEmail}\n` +
    `📧 ${customerEmail}\n` +
    `📦 ${planLabel(planId, billingCycle)}\n` +
    `💰 ${formatRupiah(amount)}\n` +
    `💳 ${paymentMethod || '—'}\n` +
    `🆔 ${orderId || '—'}\n\n` +
    `Review: ${dashboard}/admin`
  );
}
