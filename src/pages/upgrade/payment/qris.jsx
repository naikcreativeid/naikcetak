import { useEffect, useState } from 'react';
import InstruksiBayar from '../../../components/checkout/InstruksiBayar';

const QRISPage = ({ orderId: initialOrderId = '', initialOrder = null }) => {
  const [order, setOrder] = useState(initialOrder);

  useEffect(() => {
    const orderId =
      initialOrderId ||
      new URLSearchParams(window.location.hash.split('?')[1] || '').get('orderId') ||
      new URLSearchParams(window.location.search).get('orderId');

    if (!orderId || initialOrder) return;

    fetch(`/api/get-order?orderId=${encodeURIComponent(orderId)}`)
      .then((response) => response.json())
      .then(setOrder)
      .catch((error) => {
        console.warn('[qris-page] get-order failed:', error);
      });
  }, [initialOrderId, initialOrder]);

  if (!order) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-500">Memuat data order...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-10 px-4">
      <InstruksiBayar order={order} metodeBayar="qris" />
    </div>
  );
};

export default QRISPage;
