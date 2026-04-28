const globalStore = globalThis.__naikcetakOrdersStore ?? new Map();
globalThis.__naikcetakOrdersStore = globalStore;

export function saveOrder(order) {
  globalStore.set(order.orderId, order);
  return order;
}

export function getOrder(orderId) {
  return globalStore.get(orderId) ?? null;
}
