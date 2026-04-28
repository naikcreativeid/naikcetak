import { PRODUCTS } from '../../config/paymentConfig';
import { formatRupiah } from '../../utils/formatRupiah';

const UpgradeIndexPage = ({ onSelectPackage }) => {
  const productList = [PRODUCTS.PRO_MONTHLY, PRODUCTS.PRO_YEARLY];

  return (
    <div className="min-h-screen bg-gray-50 py-10 px-4">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-10">
          <h1 className="text-3xl font-bold text-gray-900">Pilih Paket Upgrade</h1>
          <p className="text-sm text-gray-500 mt-2">
            Aktifkan NaikCetak Pro lewat checkout manual transfer bank atau QRIS.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {productList.map((produk) => (
            <div key={produk.id} className="bg-white rounded-2xl border border-gray-200 p-8 shadow-sm">
              {produk.badge && (
                <div className="inline-flex items-center rounded-full bg-amber-100 px-3 py-1 text-xs font-bold text-amber-700 mb-4">
                  {produk.badge}
                </div>
              )}
              <h2 className="text-2xl font-bold text-gray-900">{produk.nama}</h2>
              <p className="text-sm text-gray-500 mt-2">{produk.deskripsi}</p>
              <p className="text-3xl font-black text-blue-600 mt-6">{formatRupiah(produk.harga)}</p>
              <p className="text-sm text-gray-400 mt-1">per {produk.periode}</p>

              <button
                type="button"
                onClick={() => onSelectPackage?.(produk.id)}
                className="w-full mt-8 py-3 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700"
              >
                Pilih Paket Ini
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default UpgradeIndexPage;
