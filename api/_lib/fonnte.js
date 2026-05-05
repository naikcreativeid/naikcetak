import { getEnv } from './config.js';

const FONNTE_ENDPOINT = 'https://api.fonnte.com/send';

export function normalizeWhatsAppNumber(input) {
  if (!input) return '';
  const digits = String(input).replace(/\D/g, '');
  if (!digits) return '';
  if (digits.startsWith('62')) return digits;
  if (digits.startsWith('0')) return `62${digits.slice(1)}`;
  if (digits.startsWith('8')) return `62${digits}`;
  return digits;
}

export function isValidWhatsAppNumber(input) {
  const normalized = normalizeWhatsAppNumber(input);
  return normalized.length >= 10 && normalized.length <= 15 && normalized.startsWith('62');
}

async function postFonnte(token, target, message) {
  const body = new URLSearchParams({
    target,
    message,
    countryCode: '62',
  });

  const response = await fetch(FONNTE_ENDPOINT, {
    method: 'POST',
    headers: {
      Authorization: token,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: body.toString(),
  });

  const text = await response.text();
  let payload;
  try {
    payload = JSON.parse(text);
  } catch {
    payload = { raw: text };
  }

  return { ok: response.ok && payload?.status !== false, status: response.status, payload };
}

export async function sendWhatsApp({ target, message }) {
  const token = getEnv('FONNTE_TOKEN');
  if (!token) {
    console.warn('[fonnte] FONNTE_TOKEN tidak tersedia, skip kirim WA.');
    return { sent: false, skipped: true, reason: 'missing_token' };
  }

  const normalizedTarget = normalizeWhatsAppNumber(target);
  if (!isValidWhatsAppNumber(normalizedTarget)) {
    console.warn('[fonnte] Nomor WA tidak valid, skip:', target);
    return { sent: false, skipped: true, reason: 'invalid_number', target };
  }

  if (!message || !message.trim()) {
    return { sent: false, skipped: true, reason: 'empty_message' };
  }

  try {
    let result = await postFonnte(token, normalizedTarget, message);
    if (!result.ok) {
      console.warn('[fonnte] kirim gagal, retry sekali:', result.status, result.payload);
      result = await postFonnte(token, normalizedTarget, message);
    }

    if (!result.ok) {
      console.error('[fonnte] kirim gagal final:', result.status, result.payload);
      return { sent: false, skipped: false, status: result.status, response: result.payload };
    }

    console.log('[fonnte] terkirim ke', normalizedTarget);
    return { sent: true, status: result.status, response: result.payload };
  } catch (error) {
    console.error('[fonnte] exception:', error);
    return { sent: false, skipped: false, error: error.message };
  }
}

export async function sendWhatsAppMany(messages) {
  const tasks = messages.map((m) => sendWhatsApp(m));
  return Promise.allSettled(tasks);
}
