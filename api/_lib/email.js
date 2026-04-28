import nodemailer from 'nodemailer';
import { getEnv, getRequiredEnv } from './config.js';

let transporter;

const rupiahFormatter = new Intl.NumberFormat('id-ID', {
  style: 'currency',
  currency: 'IDR',
  minimumFractionDigits: 0,
});

function readSecureFlag() {
  const value = getEnv('SMTP_SECURE');
  if (value === undefined) return true;
  return value === 'true';
}

function formatRupiah(amount) {
  return rupiahFormatter.format(Number(amount || 0));
}

function getBankAccounts() {
  return [
    {
      bank: 'BCA',
      noRek: getEnv('VITE_BCA_NO_REK', ['NEXT_PUBLIC_BCA_NO_REK']) ?? '2740238623',
      atasNama: getEnv('VITE_BCA_ATAS_NAMA', ['NEXT_PUBLIC_BCA_ATAS_NAMA']) ?? 'Dwi Retno Dinda Ramdhiani',
    },
    {
      bank: 'Mandiri',
      noRek: getEnv('VITE_MANDIRI_NO_REK', ['NEXT_PUBLIC_MANDIRI_NO_REK']) ?? '1610017114047',
      atasNama: getEnv('VITE_MANDIRI_ATAS_NAMA', ['NEXT_PUBLIC_MANDIRI_ATAS_NAMA']) ?? 'Dwi Retno Dinda Ramdhiani',
    },
  ];
}

function getAdminWhatsApp() {
  return getEnv('VITE_ADMIN_WA', ['NEXT_PUBLIC_ADMIN_WA']) ?? '6282261039601';
}

function getAppUrl(appUrlOverride) {
  return appUrlOverride || getEnv('VITE_APP_URL', ['NEXT_PUBLIC_APP_URL']) || 'https://app.naikcetak.com';
}

export function getEmailTransporter() {
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: getRequiredEnv('SMTP_HOST'),
      port: Number(getEnv('SMTP_PORT') ?? 465),
      secure: readSecureFlag(),
      auth: {
        user: getRequiredEnv('SMTP_USER'),
        pass: getRequiredEnv('SMTP_PASS'),
      },
    });
  }

  return transporter;
}

export function getEmailSender() {
  const fromName = getEnv('EMAIL_FROM_NAME') ?? 'NaikCetak';
  const fromEmail = getRequiredEnv('EMAIL_FROM');
  return `"${fromName}" <${fromEmail}>`;
}

export async function sendEmail({ to, subject, html, text }) {
  const mailer = getEmailTransporter();
  return mailer.sendMail({
    from: getEmailSender(),
    to,
    subject,
    html,
    text,
  });
}

export async function sendEmailKonfirmasiOrder({
  to,
  nama,
  orderId,
  namaPaket,
  totalBayar,
  kodeUnik,
}) {
  const bankList = getBankAccounts()
    .map((bank) => `<b>${bank.bank}</b>: ${bank.noRek} a.n. ${bank.atasNama}`)
    .join('<br/>');

  return sendEmail({
    to,
    subject: `[NaikCetak] Konfirmasi Order ${orderId} - ${namaPaket}`,
    text: [
      `Halo, ${nama}!`,
      '',
      `Terima kasih sudah memesan ${namaPaket}.`,
      'Silakan selesaikan pembayaran agar akun Pro Anda segera aktif.',
      '',
      `Order ID: ${orderId}`,
      `Total transfer: ${formatRupiah(totalBayar)}`,
      `Kode unik: +${kodeUnik}`,
      '',
      'Transfer ke salah satu rekening berikut:',
      ...getBankAccounts().map((bank) => `- ${bank.bank}: ${bank.noRek} a.n. ${bank.atasNama}`),
      '',
      `Konfirmasi WhatsApp admin: https://wa.me/${getAdminWhatsApp()}`,
    ].join('\n'),
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 560px; margin: 0 auto; color: #111;">
        <div style="background: #2563EB; padding: 24px; border-radius: 12px 12px 0 0; text-align: center;">
          <h1 style="color: white; margin: 0; font-size: 22px;">NaikCetak</h1>
          <p style="color: rgba(255,255,255,0.85); margin: 6px 0 0; font-size: 14px;">
            Software Manajemen Percetakan Indonesia
          </p>
        </div>

        <div style="background: white; border: 1px solid #E2E8F0; border-top: none; border-radius: 0 0 12px 12px; padding: 32px;">
          <h2 style="margin: 0 0 8px; font-size: 18px; color: #111;">Halo, ${nama}! 👋</h2>
          <p style="color: #555; font-size: 14px; margin-bottom: 24px;">
            Terima kasih sudah memesan <b>${namaPaket}</b>.
            Silakan selesaikan pembayaran agar akun Pro Anda segera aktif.
          </p>

          <div style="background: #F0FDF4; border: 1px solid #BBF7D0; border-radius: 10px; padding: 20px; text-align: center; margin-bottom: 24px;">
            <p style="margin: 0 0 4px; font-size: 13px; color: #555;">Total yang harus ditransfer</p>
            <p style="margin: 0; font-size: 28px; font-weight: 800; color: #16A34A;">
              ${formatRupiah(totalBayar)}
            </p>
            <p style="margin: 6px 0 0; font-size: 12px; color: #888;">
              (Sudah termasuk kode unik +${kodeUnik} untuk identifikasi transfer Anda)
            </p>
          </div>

          <table style="width: 100%; border-collapse: collapse; font-size: 13px; margin-bottom: 24px;">
            <tr>
              <td style="padding: 8px 0; color: #888; border-bottom: 1px solid #F1F5F9;">Order ID</td>
              <td style="padding: 8px 0; text-align: right; font-weight: 600; border-bottom: 1px solid #F1F5F9;">${orderId}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #888; border-bottom: 1px solid #F1F5F9;">Paket</td>
              <td style="padding: 8px 0; text-align: right; font-weight: 600; border-bottom: 1px solid #F1F5F9;">${namaPaket}</td>
            </tr>
          </table>

          <div style="background: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 8px; padding: 16px; margin-bottom: 24px;">
            <p style="margin: 0 0 10px; font-size: 13px; font-weight: 600; color: #111;">
              Transfer ke salah satu rekening:
            </p>
            <p style="margin: 0; font-size: 13px; color: #333; line-height: 2;">
              ${bankList}
            </p>
          </div>

          <p style="font-size: 13px; color: #555; margin-bottom: 12px;">
            Setelah transfer, konfirmasi ke WhatsApp Admin NaikCetak:
          </p>
          <a href="https://wa.me/${getAdminWhatsApp()}"
            style="display: block; background: #16A34A; color: white; text-align: center; padding: 14px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 14px;">
            💬 Konfirmasi via WhatsApp
          </a>

          <p style="font-size: 12px; color: #AAA; text-align: center; margin-top: 24px;">
            Email ini dikirim otomatis oleh NaikCetak · naikcetak.com<br/>
            Jangan balas email ini.
          </p>
        </div>
      </div>
    `,
  });
}

export function buildStarterFollowUpEmail({ name, appUrl, to = '' }) {
  const safeName = name || 'Kak';
  const safeAppUrl = getAppUrl(appUrl);

  return {
    subject: `${safeName}, fitur Pro NaikCetak menunggu kamu 👋`,
    text: [
      `Halo, ${safeName}!`,
      '',
      'Kamu sudah daftar di NaikCetak - terima kasih!',
      'Tapi kami lihat kamu belum mengaktifkan fitur Pro.',
      '',
      'Yang kamu lewatkan sebagai pengguna Starter:',
      '- Laporan Keuangan',
      '- AI Brief Analyzer',
      '- Toko Digital',
      '- WhatsApp Integration',
      '- Export PDF',
      '',
      'Hanya Rp 149.000 / bulan',
      'Atau Rp 599.000 / tahun (hemat 67%)',
      '',
      `Upgrade sekarang: ${safeAppUrl}/upgrade`,
    ].join('\n'),
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 560px; margin: 0 auto; color: #111;">
        <div style="background: #2563EB; padding: 24px; border-radius: 12px 12px 0 0; text-align: center;">
          <h1 style="color: white; margin: 0; font-size: 22px;">NaikCetak</h1>
        </div>

        <div style="background: white; border: 1px solid #E2E8F0; border-top: none; border-radius: 0 0 12px 12px; padding: 32px;">
          <h2 style="margin: 0 0 8px;">Halo, ${safeName}! 👋</h2>
          <p style="color: #555; font-size: 14px; line-height: 1.7; margin-bottom: 20px;">
            Kamu sudah daftar di NaikCetak - terima kasih! 🎉<br/>
            Tapi kami lihat kamu belum mengaktifkan fitur <b>Pro</b>.
          </p>

          <p style="font-size: 14px; color: #111; font-weight: 600; margin-bottom: 12px;">
            Yang kamu lewatkan sebagai pengguna Starter:
          </p>

          <ul style="font-size: 13px; color: #555; line-height: 2; padding-left: 20px; margin-bottom: 24px;">
            <li>📊 <b>Laporan Keuangan</b> - omzet, HPP, laba kotor otomatis</li>
            <li>🤖 <b>AI Brief Analyzer</b> - analisa brief klien + quotation otomatis</li>
            <li>🏪 <b>Toko Digital</b> - halaman order publik untuk terima pesanan</li>
            <li>💬 <b>WhatsApp Integration</b> - kirim dokumen langsung ke klien</li>
            <li>📄 <b>Export PDF</b> - semua dokumen bisa diunduh</li>
          </ul>

          <div style="background: #EFF6FF; border: 1px solid #BFDBFE; border-radius: 8px; padding: 16px; text-align: center; margin-bottom: 24px;">
            <p style="margin: 0 0 4px; font-size: 13px; color: #2563EB; font-weight: 600;">
              Hanya Rp 149.000 / bulan
            </p>
            <p style="margin: 0; font-size: 12px; color: #64748B;">
              Atau Rp 599.000 / tahun (hemat 67%)
            </p>
          </div>

          <a href="${safeAppUrl}/upgrade"
            style="display: block; background: #2563EB; color: white; text-align: center; padding: 14px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 14px; margin-bottom: 16px;">
            Upgrade ke Pro Sekarang →
          </a>

          <p style="font-size: 12px; color: #AAA; text-align: center; margin-top: 20px;">
            Tidak mau menerima email ini?
            <a href="${safeAppUrl}/unsubscribe?email=${encodeURIComponent(to)}" style="color: #AAA;">Berhenti berlangganan</a><br/>
            NaikCetak · naikcetak.com
          </p>
        </div>
      </div>
    `,
  };
}

export async function sendEmailReminder({ to, nama, appUrl }) {
  const payload = buildStarterFollowUpEmail({ name: nama, appUrl, to });
  return sendEmail({
    to,
    subject: payload.subject,
    html: payload.html,
    text: payload.text,
  });
}
