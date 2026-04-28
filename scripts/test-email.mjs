import { sendEmailReminder } from '../api/_lib/email.js';

const to = process.argv[2] || 'test@gmail.com';
const nama = process.argv[3] || 'Test';

try {
  await sendEmailReminder({ to, nama });
  console.log(`Email reminder terkirim ke ${to}`);
} catch (error) {
  console.error('Gagal kirim email reminder:', error?.message || error);
  process.exitCode = 1;
}
