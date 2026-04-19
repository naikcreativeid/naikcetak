import { createClient } from '@supabase/supabase-js';

const supabaseUrl  = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey  = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const isConfigured = Boolean(supabaseUrl && supabaseKey);

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

export async function logout() {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
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
