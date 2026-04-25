import { supabase } from './supabase';

const REFERRAL_KEY = 'naikcetak_ref_code';
const CODE_PATTERN = /^NC[A-Z0-9]{6}$/;

export function captureReferralFromUrl() {
  if (typeof window === 'undefined') return null;
  try {
    const params = new URLSearchParams(window.location.search);
    const raw = params.get('ref');
    if (!raw) return null;

    const code = raw.toUpperCase().trim();
    if (!CODE_PATTERN.test(code)) return null;

    localStorage.setItem(REFERRAL_KEY, code);
    return code;
  } catch {
    return null;
  }
}

export function getStoredReferralCode() {
  if (typeof window === 'undefined') return null;
  try {
    return localStorage.getItem(REFERRAL_KEY);
  } catch {
    return null;
  }
}

export function clearStoredReferralCode() {
  if (typeof window === 'undefined') return;
  try {
    localStorage.removeItem(REFERRAL_KEY);
  } catch {
    /* ignore */
  }
}

// Reasons returned by record_referral RPC where retry won't help
const TERMINAL_REASONS = [
  'invalid_code',
  'self_referral',
  'duplicate_email',
  'duplicate_phone',
  'already_referred',
];

export async function applyStoredReferral() {
  if (!supabase) return null;
  const code = getStoredReferralCode();
  if (!code) return null;

  try {
    const { data, error } = await supabase.rpc('record_referral', { p_code: code });
    if (error) {
      console.warn('[referral] record_referral error:', error.message);
      return null;
    }

    if (data?.success || TERMINAL_REASONS.includes(data?.reason)) {
      clearStoredReferralCode();
    }
    return data;
  } catch (err) {
    console.warn('[referral] exception:', err);
    return null;
  }
}
