import { formatRupiah } from '../../utils/formatRupiah';

const OrderSummary = ({ produk, diskon = 0, totalBayar = 0 }) => {
  if (!produk) return null;

  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-8 h-fit shadow-sm">
      <div className="inline-flex items-center rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700 mb-4">
        Ringkasan Order
      </div>
      <h2 className="text-2xl font-bold text-gray-900">{produk.nama}</h2>
      <p className="text-sm text-gray-500 mt-2 leading-relaxed">{produk.deskripsi}</p>

      {produk.badge && (
        <div className="mt-4 inline-flex items-center rounded-full bg-amber-100 px-3 py-1 text-xs font-bold text-amber-700">
          {produk.badge}
        </div>
      )}

      <div className="mt-8 rounded-2xl bg-gray-50 border border-gray-100 p-5 space-y-3">
        <div className="flex items-center justify-between text-sm text-gray-600">
          <span>Harga paket</span>
          <span className="font-medium text-gray-900">{formatRupiah(produk.harga)}</span>
        </div>
        {diskon > 0 && (
          <div className="flex items-center justify-between text-sm text-gray-600">
            <span>Diskon</span>
            <span className="font-medium text-red-500">- {formatRupiah(diskon)}</span>
          </div>
        )}
        <div className="border-t border-gray-200 pt-3 flex items-center justify-between">
          <span className="text-sm font-semibold text-gray-700">Total sementara</span>
          <span className="text-lg font-bold text-green-600">{formatRupiah(totalBayar)}</span>
        </div>
      </div>

      <div className="mt-6 space-y-3">
        <div className="flex items-start gap-3 text-sm text-gray-600">
          <span className="mt-0.5 text-green-500">✓</span>
          <span>Akses semua fitur Pro setelah pembayaran terverifikasi.</span>
        </div>
        <div className="flex items-start gap-3 text-sm text-gray-600">
          <span className="mt-0.5 text-green-500">✓</span>
          <span>Transfer manual dilengkapi kode unik 3 digit agar mudah dicek admin.</span>
        </div>
        <div className="flex items-start gap-3 text-sm text-gray-600">
          <span className="mt-0.5 text-green-500">✓</span>
          <span>Konfirmasi cepat via WhatsApp setelah upload bukti pembayaran.</span>
        </div>
      </div>
    </div>
  );
};

export default OrderSummary;
