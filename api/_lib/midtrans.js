import crypto from 'node:crypto';
import midtransClient from 'midtrans-client';
import { getRequiredEnv, isProductionMidtrans } from './config.js';

let snapInstance;

export function getMidtransSnap() {
  if (!snapInstance) {
    snapInstance = new midtransClient.Snap({
      isProduction: isProductionMidtrans(),
      serverKey: getRequiredEnv('MIDTRANS_SERVER_KEY'),
      clientKey: getRequiredEnv('VITE_MIDTRANS_CLIENT_KEY'),
    });
  }

  return snapInstance;
}

export function verifyMidtransSignature(payload) {
  const serverKey = getRequiredEnv('MIDTRANS_SERVER_KEY');
  const signatureBase = `${payload.order_id ?? ''}${payload.status_code ?? ''}${payload.gross_amount ?? ''}${serverKey}`;
  const expected = crypto.createHash('sha512').update(signatureBase).digest('hex');
  return expected === payload.signature_key;
}

export function isSuccessfulTransaction(status, fraudStatus) {
  if (status === 'settlement') return true;
  if (status === 'capture') return (fraudStatus ?? 'accept') === 'accept';
  return false;
}

export function mapUpgradeRequestStatus(transactionStatus, fraudStatus) {
  if (isSuccessfulTransaction(transactionStatus, fraudStatus)) return 'approved';
  if (transactionStatus === 'pending') return 'pending';
  if (transactionStatus === 'deny') return 'rejected';
  if (['cancel', 'expire', 'failure'].includes(transactionStatus)) return 'cancelled';
  return 'pending';
}
