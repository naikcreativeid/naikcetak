// Auth error mapper — maps Supabase error codes/messages to user-friendly Indonesian text

export const AUTH_CODE = {
  EMAIL_EXISTS:    '__EMAIL_EXISTS__',
  NOT_FOUND:       '__NOT_FOUND__',
  NEEDS_CONFIRM:   '__NEEDS_CONFIRM__',
};

export function handleAuthError(err) {
  if (!err) return 'Terjadi kesalahan. Coba lagi.';

  const msg  = (err.message ?? '').toLowerCase();
  const code = err.code ?? err.status ?? '';

  console.error('[Auth Error]', { code, message: err.message });

  if (msg.includes('fetch') || msg.includes('network') || msg.includes('failed to fetch') || msg.includes('load failed'))
    return 'Tidak dapat terhubung ke server. Periksa koneksi internet.';
  if (msg.includes('invalid login credentials') || msg.includes('invalid credentials') || code === 'invalid_credentials')
    return 'Email atau password tidak sesuai.';
  if (msg.includes('email not confirmed') || code === 'email_not_confirmed')
    return AUTH_CODE.NEEDS_CONFIRM;
  if (msg.includes('user not found') || msg.includes('no user found') || code === 'user_not_found')
    return AUTH_CODE.NOT_FOUND;
  if (msg.includes('already registered') || msg.includes('user already registered') || code === 'user_already_exists')
    return AUTH_CODE.EMAIL_EXISTS;
  if (msg.includes('password') && (msg.includes('weak') || msg.includes('short') || msg.includes('at least') || msg.includes('characters')))
    return 'Password terlalu lemah. Gunakan minimal 8 karakter.';
  if (msg.includes('rate limit') || msg.includes('too many') || code === 'over_request_rate_limit' || code === 429)
    return 'Terlalu banyak percobaan. Tunggu beberapa menit lalu coba lagi.';
  if (msg.includes('invalid email') || msg.includes('unable to validate email'))
    return 'Format email tidak valid.';
  if (msg.includes('invalid api key') || msg.includes('unauthorized') || code === 401)
    return 'Konfigurasi server bermasalah. Hubungi admin.';
  if (import.meta.env.DEV)
    return `[DEV] ${err.message} (code: ${code})`;
  return 'Terjadi kesalahan. Silakan coba lagi.';
}
