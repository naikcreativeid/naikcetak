import { generateWAKonfirmasi } from '../../utils/whatsappTemplate';

const KonfirmasiWA = ({ order, metodeBayarLabel = 'Transfer Bank', className = '' }) => {
  if (!order) return null;

  const waUrl = generateWAKonfirmasi({
    orderId: order.orderId,
    namaPaket: order.produk?.nama,
    totalBayar: order.totalBayar,
    nama: order.pemesan?.nama,
    email: order.pemesan?.email,
    metodeBayar: metodeBayarLabel,
  });

  return (
    <a
      href={waUrl}
      target="_blank"
      rel="noopener noreferrer"
      className={`w-full py-3 bg-green-600 text-white rounded-xl text-sm font-semibold flex items-center justify-center gap-2 hover:bg-green-700 ${className}`}
    >
      💬 Konfirmasi via WhatsApp
    </a>
  );
};

export default KonfirmasiWA;
