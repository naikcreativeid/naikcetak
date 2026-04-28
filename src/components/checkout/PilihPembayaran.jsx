import { useMemo, useState } from 'react';
import { BANK_ACCOUNTS } from '../../config/paymentConfig';
import { formatRupiah } from '../../utils/formatRupiah';
import { validateVoucher } from '../../utils/voucherUtils';
import BankTransferCard from './BankTransferCard';

const PilihPembayaran = ({
  produk,
  hargaAsli,
  diskon,
  totalBayar,
  voucher,
  onVoucherChange,
  metodeBayar,
  onMetodeBayarChange,
  onKembali,
  onBayarSekarang,
}) => {
  const [inputVoucher, setInputVoucher] = useState(voucher?.voucher?.kode || '');
  const [voucherPesan, setVoucherPesan] = useState('');
  const [voucherValid, setVoucherValid] = useState(null);
  const [copiedBank, setCopiedBank] = useState('');

  const bankPreview = useMemo(() => BANK_ACCOUNTS.slice(0, 2), []);

  const handleApplyVoucher = () => {
    const result = validateVoucher(inputVoucher, produk.id);
    setVoucherValid(result.valid);
    setVoucherPesan(result.pesan);
    if (result.valid) onVoucherChange?.(result);
    else onVoucherChange?.(null);
  };

  const handleCopyBank = async (text, key) => {
    await navigator.clipboard.writeText(text);
    setCopiedBank(key);
    window.setTimeout(() => setCopiedBank(''), 1800);
  };

  return (
    <div>
      <h2 className="text-xl font-bold text-gray-900 mb-1">Pembayaran</h2>
      <p className="text-sm text-gray-500 mb-6">
        Selesaikan pembayaran untuk mengaktifkan fitur Pro.
      </p>

      <div className="border border-gray-200 rounded-xl p-4 mb-4">
        <div className="flex justify-between text-sm text-gray-600 mb-2">
          <span>{produk.nama}</span>
          <span>{formatRupiah(hargaAsli)}</span>
        </div>
        {diskon > 0 && (
          <div className="flex justify-between text-sm mb-2">
            <span className="text-gray-600">Diskon</span>
            <span className="text-red-500 font-medium">- {formatRupiah(diskon)}</span>
          </div>
        )}
        <div className="flex justify-between font-bold text-gray-900 pt-2 border-t border-gray-100">
          <span>Total</span>
          <span className="text-green-600">{formatRupiah(totalBayar)}</span>
        </div>
      </div>

      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-1">Kode Voucher (Opsional)</label>
        <div className="flex gap-2">
          <input
            type="text"
            value={inputVoucher}
            onChange={(event) => setInputVoucher(event.target.value.toUpperCase())}
            placeholder="Masukkan kode voucher"
            className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
          />
          <button
            type="button"
            onClick={handleApplyVoucher}
            className="px-4 py-2 bg-gray-900 text-white text-sm rounded-lg hover:bg-gray-700"
          >
            Apply
          </button>
        </div>
        {voucherPesan && (
          <p className={`text-xs mt-1 ${voucherValid ? 'text-green-600' : 'text-red-500'}`}>
            {voucherPesan}
          </p>
        )}
      </div>

      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">Metode Pembayaran</label>

        <button
          type="button"
          onClick={() => onMetodeBayarChange?.('bank-transfer')}
          className={`w-full flex items-center justify-between p-4 rounded-xl border mb-3 ${
            metodeBayar === 'bank-transfer'
              ? 'border-blue-500 bg-blue-50'
              : 'border-gray-200 hover:border-gray-300'
          }`}
        >
          <span className="text-sm font-medium text-gray-800">Bank Transfer (Manual)</span>
          <div className="flex gap-2 items-center">
            <img src="/images/banks/bca.png" alt="BCA" className="h-4 object-contain" />
            <img src="/images/banks/mandiri.png" alt="Mandiri" className="h-4 object-contain" />
          </div>
        </button>

        {metodeBayar === 'bank-transfer' && (
          <div className="grid grid-cols-1 gap-3 mb-3">
            {bankPreview.map((bank) => (
              <div key={bank.id}>
                <BankTransferCard
                  bank={bank}
                  selected
                  onSelect={() => {}}
                  onCopy={handleCopyBank}
                />
                {copiedBank === bank.id && (
                  <p className="text-xs text-green-600 mt-1">Nomor rekening {bank.bank} tersalin.</p>
                )}
              </div>
            ))}
          </div>
        )}

        <button
          type="button"
          onClick={() => onMetodeBayarChange?.('qris')}
          className={`w-full flex items-center justify-between p-4 rounded-xl border ${
            metodeBayar === 'qris'
              ? 'border-blue-500 bg-blue-50'
              : 'border-gray-200 hover:border-gray-300'
          }`}
        >
          <span className="text-sm font-medium text-gray-800">E-Wallet / QRIS</span>
          <div className="flex gap-2 items-center">
            <img src="/images/ewallet/gopay.png" alt="GoPay" className="h-4 object-contain" />
            <img src="/images/ewallet/dana.png" alt="DANA" className="h-4 object-contain" />
            <span className="text-xs text-gray-500">& lainnya</span>
          </div>
        </button>
      </div>

      <div className="flex gap-3">
        <button
          type="button"
          onClick={onKembali}
          className="flex-1 py-3 border border-gray-300 text-gray-700 rounded-xl text-sm font-medium hover:bg-gray-50"
        >
          Kembali
        </button>
        <button
          type="button"
          onClick={onBayarSekarang}
          className="flex-1 py-3 bg-green-600 text-white rounded-xl text-sm font-semibold hover:bg-green-700 flex items-center justify-center gap-2"
        >
          🔒 Bayar Sekarang
        </button>
      </div>
    </div>
  );
};

export default PilihPembayaran;
