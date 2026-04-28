import { ADMIN_WA } from '../config/paymentConfig.js';
import { formatRupiah } from './formatRupiah.js';

/**
 * Generate URL WhatsApp konfirmasi pembayaran NaikCetak.
 */
export const generateWAKonfirmasi = ({
  orderId,
  namaPaket,
  totalBayar,
  nama,
  email,
  metodeBayar,
}) => {
  const pesan =
    `Halo Admin NaikCetak 👋\n` +
    `Saya sudah melakukan pembayaran via *${metodeBayar}*.\n\n` +
    `📋 *Detail Order:*\n` +
    `• Order ID: *${orderId}*\n` +
    `• Paket: *${namaPaket}*\n` +
    `• Jumlah: *${formatRupiah(totalBayar)}*\n` +
    `• Nama: *${nama}*\n` +
    `• Email: *${email}*\n\n` +
    `Mohon diproses ya, terima kasih! 🙏`;

  return `https://wa.me/${ADMIN_WA}?text=${encodeURIComponent(pesan)}`;
};
