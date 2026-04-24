import { createClient } from '@supabase/supabase-js';
import { getEnv, getRequiredEnv } from './config.js';

function createSupabaseClient(key) {
  const url = getRequiredEnv('SUPABASE_URL', ['VITE_SUPABASE_URL']);

  return createClient(url, key, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

export function getSupabaseAdmin() {
  return createSupabaseClient(getRequiredEnv('SUPABASE_SERVICE_ROLE_KEY'));
}

export function getSupabaseAdminIfAvailable() {
  const serviceRoleKey = getEnv('SUPABASE_SERVICE_ROLE_KEY');
  return serviceRoleKey ? createSupabaseClient(serviceRoleKey) : null;
}

export function getSupabaseUserClient(accessToken) {
  if (!accessToken) {
    throw new Error('Missing bearer token');
  }

  const url = getRequiredEnv('SUPABASE_URL', ['VITE_SUPABASE_URL']);
  const anonKey = getRequiredEnv('SUPABASE_ANON_KEY', ['VITE_SUPABASE_ANON_KEY']);

  return createClient(url, anonKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
    global: {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    },
  });
}

export async function authenticateRequestUser(req) {
  const header = req.headers.authorization ?? req.headers.Authorization;
  const token = header?.startsWith('Bearer ') ? header.slice(7).trim() : null;

  if (!token) {
    throw new Error('Missing bearer token');
  }

  const supabase = createSupabaseClient(getRequiredEnv('SUPABASE_ANON_KEY', ['VITE_SUPABASE_ANON_KEY']));
  const { data, error } = await supabase.auth.getUser(token);

  if (error || !data?.user) {
    throw new Error('Unauthorized');
  }

  return data.user;
}
