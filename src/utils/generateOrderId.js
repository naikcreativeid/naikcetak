/**
 * Format: NCK-{KODEPRODUK}-{TIMESTAMP}
 * Contoh: NCK-PROM-1777369916139
 * NCK = NaikCetak
 */
export const generateOrderId = (kodeProduk = 'PRO') => {
  const timestamp = Date.now();
  return `NCK-${kodeProduk.toUpperCase()}-${timestamp}`;
};
