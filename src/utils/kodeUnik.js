/**
 * Kode unik 3 digit: 100-999
 * Ditambahkan ke total pembayaran agar transfer bisa diidentifikasi.
 */
export const generateKodeUnik = () => {
  return Math.floor(Math.random() * 900) + 100;
};

export const hitungTotalDenganKodeUnik = (hargaAsli, kodeUnik) => {
  return Number(hargaAsli || 0) + Number(kodeUnik || 0);
};
