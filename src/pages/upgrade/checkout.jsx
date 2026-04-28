import { useEffect, useMemo, useState } from 'react';
import StepIndicator from '../../components/checkout/StepIndicator';
import DetailPemesan from '../../components/checkout/DetailPemesan';
import PilihPembayaran from '../../components/checkout/PilihPembayaran';
import OrderSummary from '../../components/checkout/OrderSummary';
import { PRODUCTS } from '../../config/paymentConfig';
import { generateOrderId } from '../../utils/generateOrderId';
import { generateKodeUnik, hitungTotalDenganKodeUnik } from '../../utils/kodeUnik';
import { hitungDiskon } from '../../utils/voucherUtils';

function getProductByRouteKey(paket) {
  const normalized = (paket || '').toUpperCase().replace(/-/g, '_');
  return PRODUCTS[normalized] || PRODUCTS.PRO_MONTHLY;
}

const CheckoutPage = ({ paket = 'pro-monthly', onNavigate }) => {
  const [step, setStep] = useState(1);
  const [produk, setProduk] = useState(null);
  const [formPemesan, setFormPemesan] = useState({
    nama: '',
    email: '',
    noWA: '',
    password: '',
    kodeReferral: '',
  });
  const [voucher, setVoucher] = useState(null);
  const [metodeBayar, setMetodeBayar] = useState('bank-transfer');
  const [orderData, setOrderData] = useState(null);

  useEffect(() => {
    setProduk(getProductByRouteKey(paket));
  }, [paket]);

  const diskon = useMemo(() => {
    if (!produk || !voucher?.voucher) return 0;
    return hitungDiskon(produk.harga, voucher.voucher);
  }, [produk, voucher]);

  const hargaSetelahDiskon = (produk?.harga || 0) - diskon;
  const kodeUnik = orderData?.kodeUnik || 0;
  const totalBayar = orderData
    ? hitungTotalDenganKodeUnik(hargaSetelahDiskon, kodeUnik)
    : hargaSetelahDiskon;

  if (!produk) {
    return <div className="min-h-screen bg-gray-50 flex items-center justify-center text-gray-500">Loading...</div>;
  }

  const handleLanjutBayar = async (dataPemesan) => {
    setFormPemesan(dataPemesan);

    const ku = generateKodeUnik();
    const orderId = generateOrderId(produk.kodeProduk);

    const order = {
      orderId,
      kodeUnik: ku,
      produk,
      hargaAsli: produk.harga,
      diskon,
      hargaSetelahDiskon,
      totalBayar: hitungTotalDenganKodeUnik(hargaSetelahDiskon, ku),
      pemesan: dataPemesan,
      voucher: voucher?.voucher?.kode || null,
      createdAt: new Date().toISOString(),
      status: 'pending',
      metodeBayar,
    };

    setOrderData(order);

    try {
      await fetch('/api/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(order),
      });
    } catch (error) {
      console.warn('[checkout] create-order skipped:', error);
    }

    setStep(2);
  };

  const handleBayarSekarang = () => {
    if (!orderData) return;

    if (onNavigate) {
      onNavigate(
        metodeBayar === 'bank-transfer'
          ? 'upgrade/payment/bank-transfer'
          : 'upgrade/payment/qris',
        { orderId: orderData.orderId, order: orderData },
      );
      return;
    }

    window.location.hash =
      metodeBayar === 'bank-transfer'
        ? `#/upgrade/payment/bank-transfer?orderId=${encodeURIComponent(orderData.orderId)}`
        : `#/upgrade/payment/qris?orderId=${encodeURIComponent(orderData.orderId)}`;
  };

  return (
    <div className="min-h-screen bg-gray-50 py-10 px-4">
      <div className="max-w-5xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <OrderSummary produk={produk} diskon={diskon} totalBayar={totalBayar} />

          <div className="bg-white rounded-2xl border border-gray-200 p-8">
            <StepIndicator currentStep={step} />

            {step === 1 && (
              <DetailPemesan onLanjut={handleLanjutBayar} initialData={formPemesan} />
            )}

            {step === 2 && (
              <PilihPembayaran
                produk={produk}
                hargaAsli={produk.harga}
                diskon={diskon}
                totalBayar={totalBayar}
                voucher={voucher}
                onVoucherChange={setVoucher}
                metodeBayar={metodeBayar}
                onMetodeBayarChange={setMetodeBayar}
                onKembali={() => setStep(1)}
                onBayarSekarang={handleBayarSekarang}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CheckoutPage;
