import { allowMethods, sendJson } from './_lib/http.js';
import { getSupabaseAdmin } from './_lib/supabase-admin.js';
import { isSuccessfulTransaction, mapUpgradeRequestStatus, verifyMidtransSignature } from './_lib/midtrans.js';

function parseTimestamp(value) {
  if (!value) return new Date().toISOString();
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? new Date().toISOString() : date.toISOString();
}

async function applyPaidUpgrade(supabaseAdmin, requestRow, userProfile, paymentPayload) {
  const { data: existingHistory } = await supabaseAdmin
    .from('subscription_history')
    .select('id')
    .eq('upgrade_request_id', requestRow.id)
    .limit(1)
    .maybeSingle();

  if (existingHistory?.id) return;

  const now = new Date();
  const currentExpiry = userProfile.plan_expires_at ? new Date(userProfile.plan_expires_at) : null;
  const isRenewal =
    userProfile.plan === requestRow.requested_plan &&
    userProfile.plan_status === 'active' &&
    currentExpiry &&
    currentExpiry > now;

  const effectiveStart = isRenewal ? currentExpiry : now;
  const nextExpiry = new Date(effectiveStart);
  if (requestRow.billing_cycle === 'yearly') nextExpiry.setFullYear(nextExpiry.getFullYear() + 1);
  else nextExpiry.setMonth(nextExpiry.getMonth() + 1);

  await supabaseAdmin
    .from('user_profiles')
    .update({
      plan: requestRow.requested_plan,
      plan_status: 'active',
      billing_cycle: requestRow.billing_cycle,
      plan_started_at: effectiveStart.toISOString(),
      plan_expires_at: nextExpiry.toISOString(),
      plan_activated_at: new Date().toISOString(),
      plan_activated_by: 'midtrans-webhook',
      payment_amount: requestRow.amount_to_pay,
      payment_method: `midtrans_${paymentPayload.payment_type ?? 'snap'}`,
      payment_notes: `Midtrans ${paymentPayload.transaction_status}`,
      grace_period_ends_at: null,
      downgraded_at: null,
      downgrade_reason: null,
      previous_plan: null,
      reminded_7days: false,
      reminded_3days: false,
      reminded_1day: false,
      reminded_expired: false,
      renewal_count: (userProfile.renewal_count ?? 0) + (isRenewal ? 1 : 0),
      updated_at: new Date().toISOString(),
    })
    .eq('id', requestRow.user_id);

  await supabaseAdmin.from('subscription_history').insert({
    user_id: requestRow.user_id,
    user_email: requestRow.user_email,
    action: isRenewal ? 'renewed' : 'activated',
    plan_from: userProfile.plan,
    plan_to: requestRow.requested_plan,
    billing_cycle: requestRow.billing_cycle,
    period_start: effectiveStart.toISOString(),
    period_end: nextExpiry.toISOString(),
    amount_paid: requestRow.amount_to_pay,
    payment_method: `midtrans_${paymentPayload.payment_type ?? 'snap'}`,
    upgrade_request_id: requestRow.id,
    triggered_by: 'system',
    triggered_by_email: 'midtrans-webhook',
    notes: `Pembayaran Midtrans ${paymentPayload.transaction_status}`,
  });
}

async function restorePendingProfile(supabaseAdmin, requestRow) {
  const { data: profile } = await supabaseAdmin
    .from('user_profiles')
    .select('plan_status, upgrade_requested_plan')
    .eq('id', requestRow.user_id)
    .maybeSingle();

  if (!profile) return;
  if (profile.plan_status !== 'pending_payment') return;
  if (profile.upgrade_requested_plan !== requestRow.requested_plan) return;

  await supabaseAdmin
    .from('user_profiles')
    .update({
      plan_status: 'active',
      updated_at: new Date().toISOString(),
    })
    .eq('id', requestRow.user_id);
}

export default async function handler(req, res) {
  if (!allowMethods(req, res, ['POST'])) return;

  try {
    const payload = req.body ?? {};

    if (!verifyMidtransSignature(payload)) {
      return sendJson(res, 401, { error: 'Invalid Midtrans signature' });
    }

    const supabaseAdmin = getSupabaseAdmin();
    const { data: requestRow, error: requestError } = await supabaseAdmin
      .from('upgrade_requests')
      .select('*')
      .eq('order_id', payload.order_id)
      .maybeSingle();

    if (requestError) throw new Error(requestError.message);
    if (!requestRow) return sendJson(res, 200, { received: true, ignored: true });

    const nextStatus = mapUpgradeRequestStatus(payload.transaction_status, payload.fraud_status);
    const isPaid = isSuccessfulTransaction(payload.transaction_status, payload.fraud_status);
    const alreadyPaid = isSuccessfulTransaction(requestRow.transaction_status, requestRow.fraud_status);

    const { error: updateError } = await supabaseAdmin
      .from('upgrade_requests')
      .update({
        status: nextStatus,
        transaction_status: payload.transaction_status,
        transaction_id: payload.transaction_id ?? requestRow.transaction_id,
        payment_type: payload.payment_type ?? requestRow.payment_type,
        fraud_status: payload.fraud_status ?? requestRow.fraud_status,
        currency: payload.currency ?? requestRow.currency ?? 'IDR',
        webhook_payload: payload,
        webhook_received_at: new Date().toISOString(),
        paid_at: isPaid ? parseTimestamp(payload.settlement_time ?? payload.transaction_time) : requestRow.paid_at,
      })
      .eq('id', requestRow.id);

    if (updateError) throw new Error(updateError.message);

    if (isPaid && !alreadyPaid) {
      const { data: userProfile, error: profileError } = await supabaseAdmin
        .from('user_profiles')
        .select('*')
        .eq('id', requestRow.user_id)
        .single();

      if (profileError) throw new Error(profileError.message);
      await applyPaidUpgrade(supabaseAdmin, requestRow, userProfile, payload);

      // Catat komisi referral. Idempotent — return reason 'no_referrer' / 'already_recorded'
      // tidak menggagalkan webhook supaya pembayaran user tidak terdampak.
      const { error: commissionError } = await supabaseAdmin.rpc('record_commission', {
        p_upgrade_request_id: requestRow.id,
      });
      if (commissionError) {
        console.warn('[midtrans-webhook] record_commission failed:', commissionError.message);
      }
    }

    if (!isPaid && ['cancelled', 'rejected'].includes(nextStatus)) {
      await restorePendingProfile(supabaseAdmin, requestRow);

      // Jika sebelumnya sudah paid (refund/chargeback late), clawback komisi.
      if (alreadyPaid) {
        const { error: clawbackError } = await supabaseAdmin.rpc('clawback_commission', {
          p_upgrade_request_id: requestRow.id,
          p_reason: `Midtrans status changed to ${payload.transaction_status}`,
        });
        if (clawbackError) {
          console.warn('[midtrans-webhook] clawback_commission failed:', clawbackError.message);
        }
      }
    }

    sendJson(res, 200, { received: true });
  } catch (error) {
    console.error('[midtrans-webhook]', error);
    sendJson(res, 500, { error: error.message || 'Webhook handling failed' });
  }
}
