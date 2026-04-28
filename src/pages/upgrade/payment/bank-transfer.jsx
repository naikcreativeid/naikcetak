import { useEffect, useState } from 'react';
import InstruksiBayar from '../../../components/checkout/InstruksiBayar';

const BankTransferPage = ({ orderId: initialOrderId = '', initialOrder = null }) => {
  const [order, setOrder] = useState(initialOrder);

  useEffect(() => {
    const orderId =
      initialOrderId ||
      new URLSearchParams(window.location.hash.split('?')[1] || '').get('orderId') ||
      new URLSearchParams(window.location.search).get('orderId');

    if (!orderId || initialOrder) return;

    const fetchOrder = async () => {
      const response = await fetch(`/api/get-order?orderId=${encodeURIComponent(orderId)}`);
      const data = await response.json();
      setOrder(data);
    };

    fetchOrder().catch((error) => {
      console.warn('[bank-transfer-page] get-order failed:', error);
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
      <InstruksiBayar order={order} metodeBayar="bank-transfer" />
    </div>
  );
};

export default BankTransferPage;
