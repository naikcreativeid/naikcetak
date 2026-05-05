import { allowMethods, sendJson } from './_lib/http.js';
import {
  authenticateRequestUser,
  getSupabaseAdminIfAvailable,
  getSupabaseUserClient,
} from './_lib/supabase-admin.js';
import { buildOrderId, getPlanAmount } from './_lib/config.js';
import {
  buildManualPaymentAmount,
  buildManualPaymentNotes,
  generateUniqueCode,
  getManualPaymentConfig,
  normalizeManualPaymentMethod,
} from './_lib/manual-payment.js';
import { sendWhatsAppMany } from './_lib/fonnte.js';
import {
  tplUpgradeRequestReceived,
  tplAdminNotifNewUpgrade,
} from './_lib/whatsapp-templates.js';

function normalizeCustomerName(user, customerName) {
  return (
    customerName?.trim() ||
    user.user_metadata?.full_name ||
    user.email?.split('@')[0] ||
    'Pelanggan'
  );
}

export default async function handler(req, res) {
  if (!allowMethods(req, res, ['POST'])) return;

  try {
    const header = req.headers.authorization ?? req.headers.Authorization;
    const accessToken = header?.startsWith('Bearer ') ? header.slice(7).trim() : null;
    const user = await authenticateRequestUser(req);
    const {
      planId = 'pro',
      billingCycle = 'monthly',
      paymentMethod: paymentMethodInput = 'bank_bca',
      customerName: customerNameInput = '',
      paymentNotes = '',
    } = req.body ?? {};

    const paymentMethod = normalizeManualPaymentMethod(paymentMethodInput);
    const customerName = normalizeCustomerName(user, customerNameInput);
    const baseAmount = getPlanAmount(planId, billingCycle);
    const uniqueCode = generateUniqueCode();
    const amountToPay = buildManualPaymentAmount(planId, billingCycle, uniqueCode);
    const productCode = billingCycle === 'yearly' ? 'PROY' : 'PROM';
    const orderId = buildOrderId(productCode);
    const supabaseUser = getSupabaseUserClient(accessToken);
    const manualConfig = getManualPaymentConfig();

    const { data: requestRow, error: insertError } = await supabaseUser
      .from('upgrade_requests')
      .insert({
        user_id: user.id,
        user_email: user.email,
        user_name: customerName,
        requested_plan: planId,
        billing_cycle: billingCycle,
        amount_to_pay: amountToPay,
        payment_method: paymentMethod,
        payment_notes: buildManualPaymentNotes({ paymentNotes, customerName, paymentMethod, uniqueCode }),
        status: 'pending',
        order_id: orderId,
        payment_gateway: 'manual',
        transaction_status: 'pending',
      })
      .select('*')
      .single();

    if (insertError) {
      throw new Error(`Failed to create manual upgrade request: ${insertError.message}`);
    }

    const supabaseAdmin = getSupabaseAdminIfAvailable();
    if (supabaseAdmin) {
      const { error: profileUpdateError } = await supabaseAdmin
        .from('user_profiles')
        .update({
          plan_status: 'pending_payment',
          payment_amount: amountToPay,
          payment_method: paymentMethod,
          payment_notes: buildManualPaymentNotes({ paymentNotes, customerName, paymentMethod, uniqueCode }),
          upgrade_requested_at: new Date().toISOString(),
          upgrade_requested_plan: planId,
          updated_at: new Date().toISOString(),
        })
        .eq('id', user.id);

      if (profileUpdateError) {
        console.warn('[manual-upgrade-request] failed to mark profile pending_payment:', profileUpdateError.message);
      }
    }

    // Best-effort kirim WA — non-blocking, jangan gagalkan request kalau Fonnte error.
    (async () => {
      try {
        let userPhone = '';
        if (supabaseAdmin) {
          const { data: profile } = await supabaseAdmin
            .from('user_profiles')
            .select('phone_number')
            .eq('id', user.id)
            .maybeSingle();
          userPhone = profile?.phone_number ?? '';
        }

        const messages = [];
        if (userPhone) {
          messages.push({
            target: userPhone,
            message: tplUpgradeRequestReceived({
              customerName,
              planId,
              billingCycle,
              amount: amountToPay,
              orderId,
              appUrl: manualConfig.appUrl,
            }),
          });
        }

        if (manualConfig.adminWhatsApp) {
          messages.push({
            target: manualConfig.adminWhatsApp,
            message: tplAdminNotifNewUpgrade({
              customerName,
              customerEmail: user.email,
              planId,
              billingCycle,
              amount: amountToPay,
              orderId,
              paymentMethod,
              appUrl: manualConfig.appUrl,
            }),
          });
        }

        if (messages.length > 0) {
          await sendWhatsAppMany(messages);
        }
      } catch (waErr) {
        console.warn('[manual-upgrade-request] WA notify failed (ignored):', waErr?.message ?? waErr);
      }
    })();

    sendJson(res, 200, {
      requestId: requestRow.id,
      orderId,
      planId,
      billingCycle,
      baseAmount,
      uniqueCode,
      amountToPay,
      customerName,
      paymentMethod,
      paymentGateway: 'manual',
      createdAt: requestRow.created_at,
      instructions: {
        bankAccounts: {
          bca: manualConfig.bca,
          mandiri: manualConfig.mandiri,
        },
        qrisImage: manualConfig.qrisImage,
        adminWhatsApp: manualConfig.adminWhatsApp,
      },
    });
  } catch (error) {
    console.error('[manual-upgrade-request]', error);
    sendJson(
      res,
      error.message === 'Unauthorized' || error.message === 'Missing bearer token' ? 401 : 500,
      { error: error.message || 'Failed to create manual upgrade request' },
    );
  }
}
