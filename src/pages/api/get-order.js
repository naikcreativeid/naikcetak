import { getOrder } from './_orderStore';

export default async function handler(req, res) {
  const { orderId } = req.query;

  try {
    const order = getOrder(orderId);
    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    return res.status(200).json(order);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}
