import { createClient } from '@supabase/supabase-js';

const supabaseUrl  = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey  = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const isConfigured = Boolean(supabaseUrl && supabaseKey);

if (import.meta.env.DEV) {
  console.log('[Supabase] URL:', supabaseUrl ? '✓ ' + supabaseUrl : '✗ MISSING');
  console.log('[Supabase] Key:', supabaseKey ? '✓ ' + supabaseKey.slice(0, 20) + '...' : '✗ MISSING');
}

if (!isConfigured) {
  console.error('[Supabase] ✗ VITE_SUPABASE_URL atau VITE_SUPABASE_ANON_KEY tidak ditemukan di .env');
}

export const supabase = isConfigured
  ? createClient(supabaseUrl, supabaseKey)
  : null;

// ── Auth ─────────────────────────────────────────────────────────────────────

export async function login(email, password) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
  return data;
}

export async function register(email, password) {
  const { data, error } = await supabase.auth.signUp({ email, password });
  if (error) throw error;
  return data;
}

const LANDING_URL = import.meta.env.VITE_LANDING_URL ?? 'https://naikcetak.com';

export async function logout() {
  try {
    await supabase.auth.signOut();
  } catch (err) {
    console.error('[Logout] signOut error:', err);
  }
  window.location.href = LANDING_URL;
}

export function watchAuth(callback) {
  if (!isConfigured) return () => {};
  const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
    callback(session?.user ?? null);
  });
  return () => subscription.unsubscribe();
}

export async function getCurrentUser() {
  if (!isConfigured) return null;
  const { data: { user } } = await supabase.auth.getUser();
  return user;
}

// ── Projects (Riwayat HPP) ───────────────────────────────────────────────────
// Buat tabel dulu via Supabase SQL Editor — lihat supabase-schema.sql

export async function saveProject(userId, data) {
  if (!isConfigured) throw new Error('Supabase belum dikonfigurasi');
  const { error } = await supabase.from('projects').insert({
    user_id:     userId,
    product_name:data.productName,
    target_qty:  data.targetQty,
    hpp:         data.hpp,
    selling_price:data.sellingPrice,
    total_cost:  data.totalCost,
    margin:      data.margin,
    payload:     data,          // simpan semua data sebagai JSON
  });
  if (error) throw error;
}

export async function getUserProjects(userId) {
  if (!isConfigured) return [];
  const { data, error } = await supabase
    .from('projects')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(50);
  if (error) throw error;
  return data ?? [];
}

export async function deleteProject(projectId) {
  if (!isConfigured) return;
  const { error } = await supabase.from('projects').delete().eq('id', projectId);
  if (error) throw error;
}

// ── Invoices ─────────────────────────────────────────────────────────────────

export async function saveInvoice(userId, data) {
  if (!isConfigured) throw new Error('Supabase belum dikonfigurasi');
  const { error } = await supabase.from('invoices').insert({
    user_id:        userId,
    invoice_number: data.invoiceNumber,
    status:         data.status,
    invoice_type:   data.invoiceType,
    template:       data.template,
    theme_color:    data.themeColor,
    date:           data.date,
    due_date:       data.dueDate,
    from_name:      data.fromName,
    from_info:      data.fromInfo,
    to_name:        data.toName,
    to_address:     data.toAddress,
    items:          data.items,
    tax:            data.tax,
    discount:       data.discount,
    notes:          data.notes,
    logo:           data.logo,
    subtotal:       data.subtotal,
    total:          data.total,
    amount_due:     data.amountDue,
  });
  if (error) throw error;
}

export async function getUserInvoices(userId) {
  if (!isConfigured) return [];
  const { data, error } = await supabase
    .from('invoices')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(100);
  if (error) throw error;
  return data ?? [];
}

export async function deleteInvoice(invoiceId) {
  if (!isConfigured) return;
  const { error } = await supabase.from('invoices').delete().eq('id', invoiceId);
  if (error) throw error;
}

// ── Activity Log (Riwayat Produksi) ──────────────────────────────────────────
// Jalankan SQL ini sekali di Supabase SQL Editor:
//
// CREATE TABLE IF NOT EXISTS activity_log (
//   id          uuid DEFAULT gen_random_uuid() PRIMARY KEY,
//   user_id     uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
//   tipe        text NOT NULL,
//   judul       text,
//   ringkasan   jsonb DEFAULT '{}',
//   created_at  timestamptz DEFAULT now()
// );
// ALTER TABLE activity_log ENABLE ROW LEVEL SECURITY;
// CREATE POLICY "own_activity" ON activity_log
//   FOR ALL USING (auth.uid() = user_id);

export async function saveActivity(userId, { tipe, judul, ringkasan }) {
  if (!isConfigured || !userId) return null;
  const { data, error } = await supabase
    .from('activity_log')
    .insert({ user_id: userId, tipe, judul, ringkasan })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function getUserActivity(userId, limit = 20) {
  if (!isConfigured || !userId) return [];
  const { data, error } = await supabase
    .from('activity_log')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(limit);
  if (error) throw error;
  return data ?? [];
}

export async function deleteActivity(id) {
  if (!isConfigured) return;
  const { error } = await supabase.from('activity_log').delete().eq('id', id);
  if (error) throw error;
}

// ── User Profiles & Plan ──────────────────────────────────────────────────────

export async function getUserProfile(userId) {
  if (!isConfigured || !userId) return null;
  const { data, error } = await supabase
    .from('user_profiles')
    .select('*')
    .eq('id', userId)
    .single();
  if (error) {
    // Profile belum ada — buat otomatis
    if (error.code === 'PGRST116') {
      const { data: { user } } = await supabase.auth.getUser();
      const newProfile = {
        id: userId,
        email: user?.email ?? '',
        plan: 'starter',
        plan_status: 'active',
        usage_potong_kertas_count: 0,
        usage_hitung_cetakan_count: 0,
        usage_reset_at: new Date().toISOString(),
      };
      const { data: created } = await supabase.from('user_profiles').insert(newProfile).select().single();
      return created;
    }
    return null;
  }
  return data;
}

export async function updateUserProfile(userId, updates) {
  if (!isConfigured || !userId) return;
  const { error } = await supabase
    .from('user_profiles')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', userId);
  if (error) throw error;
}

// ── Usage Tracking ────────────────────────────────────────────────────────────

export async function trackUsage(userId, feature) {
  if (!isConfigured || !userId) return;
  await supabase.rpc('increment_usage', { p_user_id: userId, p_feature: feature });
  await supabase.from('usage_logs').insert({ user_id: userId, feature });
}

// ── Upgrade Requests ──────────────────────────────────────────────────────────

export async function submitUpgradeRequest(userId, { requestedPlan, billingCycle, paymentMethod, paymentNotes, amountToPay, userEmail, userName }) {
  if (!isConfigured) throw new Error('Supabase belum dikonfigurasi');
  const { data, error } = await supabase
    .from('upgrade_requests')
    .insert({
      user_id:        userId,
      user_email:     userEmail,
      user_name:      userName,
      requested_plan: requestedPlan,
      billing_cycle:  billingCycle,
      amount_to_pay:  amountToPay,
      payment_method: paymentMethod,
      payment_notes:  paymentNotes,
      status:         'pending',
    })
    .select()
    .single();
  if (error) throw error;

  // Update status user ke pending_payment
  await supabase.from('user_profiles').update({
    plan_status:           'pending_payment',
    upgrade_requested_at:  new Date().toISOString(),
    upgrade_requested_plan: requestedPlan,
    payment_method:        paymentMethod,
    payment_notes:         paymentNotes,
  }).eq('id', userId);

  return data;
}

export async function getUserUpgradeRequests(userId) {
  if (!isConfigured || !userId) return [];
  const { data, error } = await supabase
    .from('upgrade_requests')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(10);
  if (error) return [];
  return data ?? [];
}

export async function uploadPaymentProof(userId, requestId, file) {
  if (!isConfigured) throw new Error('Supabase belum dikonfigurasi');
  const ext = file.name.split('.').pop();
  const path = `${userId}/${requestId}-${Date.now()}.${ext}`;
  const { error: uploadError } = await supabase.storage
    .from('payment-proofs')
    .upload(path, file, { contentType: file.type });
  if (uploadError) throw uploadError;

  const { data: { publicUrl } } = supabase.storage.from('payment-proofs').getPublicUrl(path);

  await supabase.from('upgrade_requests').update({ payment_proof_url: publicUrl }).eq('id', requestId).eq('user_id', userId);
  await supabase.from('user_profiles').update({ payment_proof_url: publicUrl }).eq('id', userId);

  return publicUrl;
}

// ── Admin Functions ───────────────────────────────────────────────────────────

export async function adminGetUpgradeRequests(adminEmail) {
  if (!isConfigured) return [];
  const { data, error } = await supabase.rpc('admin_get_upgrade_requests', { p_admin_email: adminEmail });
  if (error) throw error;
  return data ?? [];
}

export async function adminApproveUpgrade(requestId, adminEmail) {
  if (!isConfigured) throw new Error('Supabase belum dikonfigurasi');
  const { data, error } = await supabase.rpc('admin_approve_upgrade', {
    p_request_id:  requestId,
    p_admin_email: adminEmail,
  });
  if (error) throw error;
  return data;
}

export async function adminRejectUpgrade(requestId, adminEmail, reason = '') {
  if (!isConfigured) throw new Error('Supabase belum dikonfigurasi');
  const { data, error } = await supabase.rpc('admin_reject_upgrade', {
    p_request_id:  requestId,
    p_admin_email: adminEmail,
    p_reason:      reason,
  });
  if (error) throw error;
  return data;
}

export async function adminGetAllUsers() {
  if (!isConfigured) return [];
  const { data, error } = await supabase.rpc('admin_get_all_users');
  if (error) throw error;
  return data ?? [];
}

export async function adminCreateUser(email, password, fullName) {
  if (!isConfigured) throw new Error('Supabase belum dikonfigurasi');

  // Sanitasi input — trim + lowercase agar tidak ada spasi tersembunyi
  const cleanEmail    = (email ?? '').toString().trim().toLowerCase();
  const cleanPassword = (password ?? '').toString().trim();
  const cleanName     = (fullName ?? '').toString().trim();

  if (!cleanEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
    throw new Error(`Format email tidak valid: "${cleanEmail}"`);
  }
  if (cleanPassword.length < 8) {
    throw new Error('Password minimal 8 karakter');
  }

  const { data, error } = await supabase.auth.signUp({
    email:    cleanEmail,
    password: cleanPassword,
    options:  { data: { full_name: cleanName } },
  });
  if (error) throw error;
  if (!data.user) throw new Error('Gagal membuat akun: user tidak terbentuk');

  // Konfirmasi email langsung via RPC agar user bisa login tanpa klik link email
  await supabase.rpc('admin_confirm_user_email', { p_email: cleanEmail });

  // Pastikan baris di user_profiles ada
  await supabase.from('user_profiles').upsert({
    id:        data.user.id,
    email:     cleanEmail,
    full_name: cleanName,
    plan:      'starter',
    plan_status: 'active',
    usage_potong_kertas_count:  0,
    usage_hitung_cetakan_count: 0,
    usage_reset_at: new Date().toISOString(),
  }, { onConflict: 'id' });

  return data.user;
}

export async function adminResetUserPassword(userId, newPassword) {
  if (!isConfigured) throw new Error('Supabase belum dikonfigurasi');
  const { error } = await supabase.rpc('admin_reset_user_password', {
    p_user_id:     userId,
    p_new_password: newPassword,
  });
  if (error) throw error;
}

export async function adminDirectUpgrade(userId, plan, months = 1) {
  if (!isConfigured) throw new Error('Supabase belum dikonfigurasi');
  // Coba admin_activate_plan dulu (lebih lengkap), fallback ke admin_direct_upgrade
  try {
    const { data, error } = await supabase.rpc('admin_activate_plan', {
      p_user_id:       userId,
      p_plan:          plan,
      p_billing_cycle: months === 12 ? 'yearly' : 'monthly',
      p_amount_paid:   0,
      p_notes:         `Upgrade langsung oleh admin (${months} bulan)`,
      p_is_renewal:    false,
    });
    if (error) throw error;
    return data;
  } catch {
    const { error } = await supabase.rpc('admin_direct_upgrade', {
      p_user_id: userId,
      p_plan:    plan,
      p_months:  months,
    });
    if (error) throw error;
  }
}

export async function getSubscriptionStats() {
  if (!isConfigured) return null;
  const { data, error } = await supabase.rpc('get_subscription_stats');
  if (error) return null;
  return data;
}

export async function adminGetReminderList() {
  if (!isConfigured) return [];
  const { data, error } = await supabase.rpc('admin_get_reminder_list');
  if (error) throw error;
  return data ?? [];
}

export async function adminMarkReminderSent(userId, reminderType) {
  if (!isConfigured) return;
  await supabase.rpc('admin_mark_reminder_sent', {
    p_user_id:       userId,
    p_reminder_type: reminderType,
  });
}

export async function adminActivatePlan(userId, plan, billingCycle, {
  amountPaid = 0, paymentMethod = null, isRenewal = false, notes = null,
  upgradeRequestId = null,
} = {}) {
  if (!isConfigured) throw new Error('Supabase belum dikonfigurasi');
  const { data, error } = await supabase.rpc('admin_activate_plan', {
    p_user_id:            userId,
    p_plan:               plan,
    p_billing_cycle:      billingCycle,
    p_amount_paid:        amountPaid,
    p_payment_method:     paymentMethod,
    p_is_renewal:         isRenewal,
    p_notes:              notes,
    p_upgrade_request_id: upgradeRequestId,
  });
  if (error) throw error;
  return data;
}

export async function adminGetUserHistory(userId) {
  if (!isConfigured) return [];
  const { data, error } = await supabase.rpc('admin_get_user_history', { p_user_id: userId });
  if (error) return [];
  return data ?? [];
}

export async function getUserSubscriptionHistory(userId) {
  if (!isConfigured || !userId) return [];
  const { data, error } = await supabase
    .from('subscription_history')
    .select('id, action, plan_from, plan_to, billing_cycle, period_start, period_end, amount_paid, created_at, notes')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(20);
  if (error) return [];
  return data ?? [];
}

export async function adminDowngradeUser(userId, notes = '') {
  if (!isConfigured) throw new Error('Supabase belum dikonfigurasi');
  const { error } = await supabase.rpc('admin_downgrade_user', {
    p_user_id: userId,
    p_notes:   notes,
  });
  if (error) throw error;
}

export async function adminDeleteUser(userId) {
  if (!isConfigured) throw new Error('Supabase belum dikonfigurasi');
  const { error } = await supabase.rpc('admin_delete_user', { p_user_id: userId });
  if (error) throw error;
}

// Forgot password tanpa email — user verifikasi email dulu, lalu langsung ganti password
export async function resetPasswordByEmail(email, newPassword) {
  if (!isConfigured) throw new Error('Supabase belum dikonfigurasi');
  const { data, error } = await supabase.rpc('reset_password_by_email', {
    p_email:        email,
    p_new_password: newPassword,
  });
  if (error) throw error;
  return data; // 'ok' | 'not_found'
}

// Public Storefront
const STORE_ASSET_BUCKET = 'store-assets';

export function sanitizeStoreSlug(value = '') {
  return value
    .toString()
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 60);
}

export function generateStoreSlugCandidate(storeName = '') {
  const slug = sanitizeStoreSlug(storeName).slice(0, 50);
  return slug || 'toko-cetak';
}

export function getStoreUrl(slug, baseUrl = window.location.origin) {
  return `${baseUrl.replace(/\/$/, '')}/${sanitizeStoreSlug(slug)}`;
}

export async function generateUniqueStoreSlug(userId, rawValue) {
  if (!isConfigured) throw new Error('Supabase belum dikonfigurasi');

  const requested = generateStoreSlugCandidate(rawValue);
  let finalSlug = requested;
  let counter = 0;

  while (true) {
    const { data, error } = await supabase
      .from('user_profiles')
      .select('id')
      .eq('store_slug', finalSlug)
      .maybeSingle();

    if (error && error.code !== 'PGRST116') throw error;
    if (!data || data.id === userId) return finalSlug;

    counter += 1;
    finalSlug = `${requested.slice(0, Math.max(1, 57 - String(counter).length))}-${counter}`;
  }
}

async function getPublicStoreProfile(slug) {
  const cleanSlug = sanitizeStoreSlug(slug);
  if (!cleanSlug) return null;

  const fields = 'id, store_slug, store_name, store_tagline, store_city, store_whatsapp, store_logo_url, store_cover_url, store_description, store_instagram, store_is_active';

  let result = await supabase
    .from('public_store_profiles')
    .select(fields)
    .eq('store_slug', cleanSlug)
    .maybeSingle();

  if (result.error && result.error.code === 'PGRST205') {
    result = await supabase
      .from('user_profiles')
      .select(fields)
      .eq('store_slug', cleanSlug)
      .eq('store_is_active', true)
      .maybeSingle();
  }

  if (result.error && result.error.code !== 'PGRST116') throw result.error;
  return result.data ?? null;
}

export async function getPublicStoreBySlug(slug) {
  if (!isConfigured) return null;

  const store = await getPublicStoreProfile(slug);
  if (!store) return null;

  let productsResult = await supabase
    .from('public_store_products')
    .select('id, name, category, description, min_price, max_price, min_order, unit, lead_time_days, sort_order')
    .eq('store_slug', store.store_slug)
    .order('sort_order', { ascending: true });

  if (productsResult.error && productsResult.error.code === 'PGRST205') {
    productsResult = await supabase
      .from('store_products')
      .select('id, name, category, description, min_price, max_price, min_order, unit, lead_time_days, sort_order')
      .eq('user_id', store.id)
      .eq('is_available', true)
      .order('sort_order', { ascending: true });
  }

  if (productsResult.error) throw productsResult.error;

  return {
    store,
    products: productsResult.data ?? [],
  };
}

export async function submitPublicStoreOrder(slug, payload) {
  if (!isConfigured) throw new Error('Supabase belum dikonfigurasi');

  const store = await getPublicStoreProfile(slug);
  if (!store?.store_is_active) throw new Error('Toko tidak ditemukan atau sedang nonaktif');

  const quantity = Number(payload.quantity);
  if (!payload.clientName?.trim() || !payload.clientPhone?.trim() || !payload.productName?.trim() || !quantity) {
    throw new Error('Field wajib belum diisi lengkap');
  }

  const { data, error } = await supabase
    .from('store_orders')
    .insert({
      store_user_id: store.id,
      store_slug: store.store_slug,
      client_name: payload.clientName.trim(),
      client_phone: payload.clientPhone.trim(),
      client_email: payload.clientEmail?.trim() || null,
      product_name: payload.productName.trim(),
      quantity,
      unit: payload.unit?.trim() || 'pcs',
      size: payload.size?.trim() || null,
      finishing: payload.finishing?.trim() || null,
      notes: payload.notes?.trim() || null,
      status: 'pending',
    })
    .select('id')
    .single();

  if (error) throw error;
  return data;
}

export async function getStoreDashboardData(userId) {
  if (!isConfigured || !userId) return { profile: null, products: [], orders: [] };

  const [profileRes, productsRes, ordersRes] = await Promise.all([
    supabase
      .from('user_profiles')
      .select('id, store_slug, store_name, store_tagline, store_city, store_whatsapp, store_logo_url, store_cover_url, store_is_active, store_instagram, store_description')
      .eq('id', userId)
      .maybeSingle(),
    supabase
      .from('store_products')
      .select('*')
      .eq('user_id', userId)
      .order('sort_order', { ascending: true }),
    supabase
      .from('store_orders')
      .select('*')
      .eq('store_user_id', userId)
      .order('created_at', { ascending: false }),
  ]);

  if (profileRes.error && profileRes.error.code !== 'PGRST116') throw profileRes.error;
  if (productsRes.error) throw productsRes.error;
  if (ordersRes.error) throw ordersRes.error;

  return {
    profile: profileRes.data ?? null,
    products: productsRes.data ?? [],
    orders: ordersRes.data ?? [],
  };
}

export async function saveStoreProfile(userId, updates, { preserveExistingSlug = true } = {}) {
  if (!isConfigured || !userId) throw new Error('Supabase belum dikonfigurasi');

  const currentProfile = await getUserProfile(userId);
  const nextName = updates.store_name ?? currentProfile?.store_name ?? '';
  const wantsSlug = typeof updates.store_slug === 'string';

  let nextSlug = currentProfile?.store_slug ?? null;
  if (wantsSlug) {
    nextSlug = await generateUniqueStoreSlug(userId, updates.store_slug);
  } else if (!preserveExistingSlug || !nextSlug) {
    nextSlug = await generateUniqueStoreSlug(userId, nextName || 'toko-cetak');
  }

  const { data, error } = await supabase
    .from('user_profiles')
    .update({
      ...updates,
      store_slug: nextSlug,
      updated_at: new Date().toISOString(),
    })
    .eq('id', userId)
    .select('id, store_slug, store_name, store_tagline, store_city, store_whatsapp, store_logo_url, store_cover_url, store_is_active, store_instagram, store_description')
    .single();

  if (error) throw error;
  return data;
}

export async function uploadStoreAsset(userId, file, kind = 'logo') {
  if (!isConfigured || !userId) throw new Error('Supabase belum dikonfigurasi');
  if (!file) throw new Error('File belum dipilih');

  const ext = (file.name.split('.').pop() || 'jpg').toLowerCase();
  const path = `${userId}/${kind}-${Date.now()}.${ext}`;
  const { error } = await supabase.storage
    .from(STORE_ASSET_BUCKET)
    .upload(path, file, { upsert: true, contentType: file.type });

  if (error) throw error;

  const { data } = supabase.storage.from(STORE_ASSET_BUCKET).getPublicUrl(path);
  return data.publicUrl;
}

export async function createStoreProduct(userId, payload) {
  if (!isConfigured || !userId) throw new Error('Supabase belum dikonfigurasi');

  const { data, error } = await supabase
    .from('store_products')
    .insert({
      user_id: userId,
      name: payload.name?.trim(),
      category: payload.category?.trim() || null,
      description: payload.description?.trim() || null,
      min_price: payload.min_price ? Number(payload.min_price) : null,
      max_price: payload.max_price ? Number(payload.max_price) : null,
      min_order: payload.min_order ? Number(payload.min_order) : 1,
      unit: payload.unit?.trim() || 'pcs',
      lead_time_days: payload.lead_time_days ? Number(payload.lead_time_days) : 3,
      is_available: payload.is_available ?? true,
      sort_order: Number(payload.sort_order ?? 0),
    })
    .select('*')
    .single();

  if (error) throw error;
  return data;
}

export async function updateStoreProduct(userId, productId, payload) {
  if (!isConfigured || !userId) throw new Error('Supabase belum dikonfigurasi');

  const { data, error } = await supabase
    .from('store_products')
    .update({
      name: payload.name?.trim(),
      category: payload.category?.trim() || null,
      description: payload.description?.trim() || null,
      min_price: payload.min_price ? Number(payload.min_price) : null,
      max_price: payload.max_price ? Number(payload.max_price) : null,
      min_order: payload.min_order ? Number(payload.min_order) : 1,
      unit: payload.unit?.trim() || 'pcs',
      lead_time_days: payload.lead_time_days ? Number(payload.lead_time_days) : 3,
      is_available: payload.is_available ?? true,
      sort_order: Number(payload.sort_order ?? 0),
    })
    .eq('id', productId)
    .eq('user_id', userId)
    .select('*')
    .single();

  if (error) throw error;
  return data;
}

export async function deleteStoreProduct(userId, productId) {
  if (!isConfigured || !userId) throw new Error('Supabase belum dikonfigurasi');
  const { error } = await supabase
    .from('store_products')
    .delete()
    .eq('id', productId)
    .eq('user_id', userId);
  if (error) throw error;
}

export async function reorderStoreProducts(userId, productIds) {
  if (!isConfigured || !userId) throw new Error('Supabase belum dikonfigurasi');
  await Promise.all(productIds.map((id, index) => (
    supabase
      .from('store_products')
      .update({ sort_order: index })
      .eq('id', id)
      .eq('user_id', userId)
  )));
}

export async function updateStoreOrder(userId, orderId, updates) {
  if (!isConfigured || !userId) throw new Error('Supabase belum dikonfigurasi');

  const { data, error } = await supabase
    .from('store_orders')
    .update({
      status: updates.status,
      admin_notes: updates.admin_notes?.trim() || null,
      estimated_price: updates.estimated_price ? Number(updates.estimated_price) : null,
      quoted_at: updates.status === 'accepted' ? new Date().toISOString() : null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', orderId)
    .eq('store_user_id', userId)
    .select('*')
    .single();

  if (error) throw error;
  return data;
}

// ── Client Tracker ────────────────────────────────────────────────────────────

function generateTrackingToken() {
  const array = new Uint8Array(18);
  crypto.getRandomValues(array);
  return btoa(String.fromCharCode(...array))
    .replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
}

export function getClientTrackingUrl(token) {
  if (!token) return '';
  return `${window.location.origin}${window.location.pathname}#/track/${token}`;
}

export async function createClientOrder(userId, data, userEmailArg = '') {
  if (!isConfigured) throw new Error('Supabase belum dikonfigurasi');
  const { userEmail, ...orderData } = data ?? {};
  const auditEmail = userEmailArg || userEmail || '';
  const { count } = await supabase
    .from('client_orders')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId);
  const year        = new Date().getFullYear();
  const orderNumber = `ORD-${year}-${String((count ?? 0) + 1).padStart(3, '0')}`;
  const token       = generateTrackingToken();
  const trackingUrl = getClientTrackingUrl(token);

  const { data: order, error } = await supabase
    .from('client_orders')
    .insert({ user_id: userId, order_number: orderNumber, tracking_token: token, tracking_url: trackingUrl, ...orderData })
    .select()
    .single();
  if (error) throw error;

  // Initial update log
  await supabase.from('order_updates').insert({
    order_id: order.id, status_from: null, status_to: 'order_masuk',
    note: 'Order baru dibuat.', updated_by: auditEmail,
  });
  return order;
}

export async function getUserClientOrders(userId) {
  if (!isConfigured) return [];
  const { data, error } = await supabase
    .from('client_orders')
    .select('*, order_updates(id, status_to, note, photo_url, created_at)')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function updateClientOrder(orderId, updates) {
  if (!isConfigured) throw new Error('Supabase belum dikonfigurasi');
  const { userEmail, ...orderUpdates } = updates ?? {};
  const { data, error } = await supabase
    .from('client_orders')
    .update(orderUpdates)
    .eq('id', orderId)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function deleteClientOrder(orderId) {
  if (!isConfigured) return;
  const { error } = await supabase.from('client_orders').delete().eq('id', orderId);
  if (error) throw error;
}

export async function addOrderStatusUpdate(orderId, { statusFrom, statusTo, note, photoUrl, updatedBy }) {
  if (!isConfigured) throw new Error('Supabase belum dikonfigurasi');
  const { error: orderError } = await supabase
    .from('client_orders')
    .update({ current_status: statusTo })
    .eq('id', orderId);
  if (orderError) throw orderError;

  const { error } = await supabase.from('order_updates').insert({
    order_id: orderId, status_from: statusFrom, status_to: statusTo,
    note: note || null, photo_url: photoUrl || null, updated_by: updatedBy ?? '',
  });
  if (error) throw error;
}

export async function getOrderByToken(token) {
  if (!isConfigured) return null;
  const cleanToken = token?.trim();
  if (!cleanToken) return null;
  const { data, error } = await supabase.rpc('get_order_by_token', { p_token: cleanToken });
  if (error) return null;
  return data;
}

export async function uploadOrderPhoto(userId, file) {
  if (!isConfigured) throw new Error('Supabase belum dikonfigurasi');
  const ext  = file.name.split('.').pop();
  const path = `${userId}/${Date.now()}.${ext}`;
  const { error } = await supabase.storage.from('order-photos').upload(path, file, { upsert: true });
  if (error) throw error;
  const { data } = supabase.storage.from('order-photos').getPublicUrl(path);
  return data.publicUrl;
}

export async function toggleOrderTracking(orderId, active) {
  if (!isConfigured) return;
  const { error } = await supabase
    .from('client_orders')
    .update({ is_tracking_active: active })
    .eq('id', orderId);
  if (error) throw error;
}
