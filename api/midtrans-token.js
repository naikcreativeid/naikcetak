import { allowMethods, sendJson } from './_lib/http.js';
import { authenticateRequestUser, getSupabaseAdmin } from './_lib/supabase-admin.js';
import { buildOrderId, getPlanAmount } from './_lib/config.js';
import { getMidtransSnap } from './_lib/midtrans.js';

function normalizeCustomerDetails(user, customerDetails = {}) {
  return {
    first_name:
      customerDetails.first_name ||
      user.user_metadata?.full_name ||
      user.email?.split('@')[0] ||
      'Pelanggan',
    last_name: customerDetails.last_name || '',
    email: customerDetails.email || user.email || '',
    phone: customerDetails.phone || user.phone || user.user_metadata?.phone_number || '',
  };
}

export default async function handler(req, res) {
  if (!allowMethods(req, res, ['POST'])) return;

  try {
    const user = await authenticateRequestUser(req);
    const {
      planId = 'pro',
      billingCycle = 'monthly',
      customer_details: customerDetailsInput,
      paymentNotes = '',
    } = req.body ?? {};

    const grossAmount = getPlanAmount(planId, billingCycle);
    const customerDetails = normalizeCustomerDetails(user, customerDetailsInput);
    const orderId = buildOrderId(user.id);
    const paymentMethod = 'midtrans_snap';
    const supabaseAdmin = getSupabaseAdmin();

    const { data: requestRow, error: insertError } = await supabaseAdmin
      .from('upgrade_requests')
      .insert({
        user_id: user.id,
        user_email: user.email,
        user_name: customerDetails.first_name,
        requested_plan: planId,
        billing_cycle: billingCycle,
        amount_to_pay: grossAmount,
        payment_method: paymentMethod,
        payment_notes: paymentNotes || 'Pembayaran otomatis via Midtrans Snap',
        status: 'pending',
        order_id: orderId,
        payment_gateway: 'midtrans',
        transaction_status: 'pending',
      })
      .select('*')
      .single();

    if (insertError) {
      throw new Error(`Failed to create upgrade request: ${insertError.message}`);
    }

    const snap = getMidtransSnap();
    const snapResponse = await snap.createTransaction({
      transaction_details: {
        order_id: orderId,
        gross_amount: grossAmount,
      },
      customer_details: customerDetails,
      item_details: [
        {
          id: `${planId}-${billingCycle}`,
          price: grossAmount,
          quantity: 1,
          name: `naikcetak Pro ${billingCycle === 'yearly' ? 'Tahunan' : 'Bulanan'}`,
        },
      ],
    });

    const { error: requestUpdateError } = await supabaseAdmin
      .from('upgrade_requests')
      .update({
        snap_token: snapResponse.token,
        midtrans_response: snapResponse,
      })
      .eq('id', requestRow.id);

    if (requestUpdateError) {
      throw new Error(`Failed to save snap token: ${requestUpdateError.message}`);
    }

    await supabaseAdmin
      .from('user_profiles')
      .update({
        plan_status: 'pending_payment',
        payment_amount: grossAmount,
        payment_method: paymentMethod,
        payment_notes: paymentNotes || 'Menunggu pembayaran via Midtrans Snap',
        upgrade_requested_at: new Date().toISOString(),
        upgrade_requested_plan: planId,
        updated_at: new Date().toISOString(),
      })
      .eq('id', user.id);

    sendJson(res, 200, {
      token: snapResponse.token,
      redirectUrl: snapResponse.redirect_url,
      orderId,
      requestId: requestRow.id,
      grossAmount,
    });
  } catch (error) {
    console.error('[midtrans-token]', error);
    sendJson(
      res,
      error.message === 'Unauthorized' || error.message === 'Missing bearer token' ? 401 : 500,
      { error: error.message || 'Failed to create Midtrans transaction' },
    );
  }
}
