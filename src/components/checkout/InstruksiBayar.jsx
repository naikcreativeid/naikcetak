import { useMemo, useState } from 'react';
import { BANK_ACCOUNTS, QRIS_CONFIG } from '../../config/paymentConfig';
import { formatRupiah } from '../../utils/formatRupiah';
import KonfirmasiWA from './KonfirmasiWA';

const InstruksiBayar = ({ order, metodeBayar = 'bank-transfer' }) => {
  const [copied, setCopied] = useState({});
  const [buktiFile, setBuktiFile] = useState(null);

  const bankAccounts = useMemo(() => BANK_ACCOUNTS, []);

  if (!order) return null;

  const handleCopy = async (text, key) => {
    await navigator.clipboard.writeText(text);
    setCopied((prev) => ({ ...prev, [key]: true }));
    window.setTimeout(() => {
      setCopied((prev) => ({ ...prev, [key]: false }));
    }, 2000);
  };

  return (
    <div className="max-w-md mx-auto bg-white rounded-2xl border border-gray-200 p-8">
      <p className="text-center text-gray-600 text-sm mb-1">Terima kasih sudah melakukan order</p>
      <h1 className="text-center text-xl font-bold text-gray-900 mb-1">{order.produk?.nama}</h1>
      <p className="text-center text-sm text-gray-500 mb-6">
        {metodeBayar === 'qris'
          ? 'Scan QRIS di bawah dan transfer sejumlah'
          : 'Untuk menyelesaikan order, silakan transfer sejumlah'}
      </p>

      <div className="text-center mb-2">
        <div className="inline-block bg-green-600 text-white text-2xl font-bold px-8 py-3 rounded-xl mb-2">
          {formatRupiah(order.totalBayar)}
        </div>
        <p className="text-xs text-gray-400">
          Termasuk kode unik +{order.kodeUnik} untuk identifikasi pembayaran Anda
        </p>
      </div>

      <button
        type="button"
        onClick={() => handleCopy(String(order.totalBayar), 'jumlah')}
        className="w-full py-2 border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-50 mb-6 flex items-center justify-center gap-2"
      >
        📋 {copied.jumlah ? 'Tersalin!' : 'Salin Jumlah'}
      </button>

      {metodeBayar === 'bank-transfer' ? (
        <>
          <p className="text-sm text-gray-600 text-center mb-4">ke salah satu bank berikut ini:</p>
          {bankAccounts.map((bank) => (
            <div key={bank.id} className="border border-gray-200 rounded-xl p-4 mb-3">
              <img src={bank.logo} alt={bank.bank} className="h-6 mb-2 object-contain" />
              <p className="text-xs text-gray-500">
                No. Rek: <span className="text-gray-900 font-bold">{bank.noRek}</span>
              </p>
              <p className="text-xs text-gray-500 mb-3">
                Atas Nama: <span className="text-gray-900 font-semibold">{bank.atasNama}</span>
              </p>
              <button
                type="button"
                onClick={() => handleCopy(bank.noRek, bank.id)}
                className="w-full py-2 border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-50 flex items-center justify-center gap-2"
              >
                📋 {copied[bank.id] ? 'Tersalin!' : 'Salin No. Rek.'}
              </button>
            </div>
          ))}
        </>
      ) : (
        <>
          <p className="text-sm text-gray-600 text-center mb-3">
            dengan memindai kode QRIS di bawah ini:
          </p>
          <div className="flex justify-center mb-6">
            <div className="border border-gray-200 rounded-xl p-3">
              <img
                src={QRIS_CONFIG.imagePath}
                alt="QRIS NaikCetak"
                className="w-52 h-52 object-contain"
                onError={(event) => {
                  event.currentTarget.style.display = 'none';
                  if (event.currentTarget.nextElementSibling) {
                    event.currentTarget.nextElementSibling.style.display = 'flex';
                  }
                }}
              />
              <div
                style={{ display: 'none' }}
                className="w-52 h-52 bg-gray-100 rounded-lg flex-col items-center justify-center text-gray-400"
              >
                <p className="text-4xl mb-2">📷</p>
                <p className="text-xs text-center">
                  Upload gambar QRIS ke
                  <br />
                  /public/images/qris/qris-naikcetak.png
                </p>
              </div>
            </div>
          </div>
        </>
      )}

      <div className="mt-6 mb-4">
        <p className="text-sm font-medium text-gray-700 mb-2 text-center">Upload Bukti Transfer</p>
        <label className="block border-2 border-dashed border-gray-300 rounded-xl p-6 text-center cursor-pointer hover:border-blue-400 transition-colors">
          <input
            type="file"
            accept="image/jpeg,image/png"
            onChange={(event) => setBuktiFile(event.target.files?.[0] ?? null)}
            className="hidden"
          />
          {buktiFile ? (
            <p className="text-sm text-green-600 font-medium">Bukti berhasil dipilih ✓</p>
          ) : (
            <>
              <p className="text-2xl mb-1">📷</p>
              <p className="text-sm text-gray-500">Tap untuk upload bukti transfer</p>
              <p className="text-xs text-gray-400">JPG, PNG (maks. 5MB)</p>
            </>
          )}
        </label>
      </div>

      <p className="text-xs text-gray-500 text-center mb-3">Setelah membayar, konfirmasi pembayaran Anda:</p>
      <KonfirmasiWA
        order={order}
        metodeBayarLabel={metodeBayar === 'qris' ? 'QRIS' : 'Transfer Bank'}
      />

      <p className="text-xs text-gray-400 text-center mt-4">Order ID: {order.orderId}</p>
    </div>
  );
};

export default InstruksiBayar;
