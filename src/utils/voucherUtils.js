import { ACTIVE_VOUCHERS } from '../config/paymentConfig.js';

export const validateVoucher = (kode, productId) => {
  const normalizedCode = (kode || '').toUpperCase().trim();

  const voucher = ACTIVE_VOUCHERS.find(
    (item) =>
      item.kode.toUpperCase() === normalizedCode &&
      item.aktif &&
      item.berlakuUntuk.includes(productId),
  );

  if (!voucher) {
    return {
      valid: false,
      pesan: 'Kode voucher tidak valid atau sudah tidak aktif.',
    };
  }

  return {
    valid: true,
    voucher,
    pesan: `Voucher valid! Anda mendapat diskon ${
      voucher.tipe === 'persen'
        ? `${voucher.diskon}%`
        : `Rp ${voucher.diskon.toLocaleString('id-ID')}`
    }.`,
  };
};

export const hitungDiskon = (hargaAsli, voucher) => {
  if (!voucher) return 0;
  if (voucher.tipe === 'persen') return Math.floor((Number(hargaAsli || 0) * voucher.diskon) / 100);
  return voucher.diskon;
};
