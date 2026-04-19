import { useEffect, useState, useCallback } from 'react';
import { PLANS, canAccessFeature, isWithinLimit } from '../lib/plans';
import { getUserProfile, trackUsage } from '../lib/supabase';

const DEFAULT_PLAN_DATA = {
  plan: 'starter',
  planStatus: 'active',
  planExpiresAt: null,
  usagePotongKertas: 0,
  usageHitungCetakan: 0,
  usageResetAt: null,
};

export function usePlan(user) {
  const [planData, setPlanData] = useState(DEFAULT_PLAN_DATA);
  const [loading, setLoading] = useState(true);

  const fetchPlan = useCallback(async () => {
    if (!user) {
      setPlanData(DEFAULT_PLAN_DATA);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const profile = await getUserProfile(user.id);
      if (profile) {
        setPlanData({
          plan:               profile.plan          ?? 'starter',
          planStatus:         profile.plan_status   ?? 'active',
          planExpiresAt:      profile.plan_expires_at  ? new Date(profile.plan_expires_at) : null,
          usagePotongKertas:  profile.usage_potong_kertas_count  ?? 0,
          usageHitungCetakan: profile.usage_hitung_cetakan_count ?? 0,
          usageResetAt:       profile.usage_reset_at ? new Date(profile.usage_reset_at) : null,
        });
      }
    } catch { /* fallback ke starter */ }
    finally { setLoading(false); }
  }, [user]);

  useEffect(() => { fetchPlan(); }, [fetchPlan]);

  // ── Derived helpers ────────────────────────────────────────────────────────

  const isPlanActive = () => {
    if (planData.planStatus !== 'active') return false;
    if (!planData.planExpiresAt) return true; // starter tidak punya expiry
    return new Date() < planData.planExpiresAt;
  };

  const can = (feature) => canAccessFeature(planData.plan, feature);

  const withinLimit = (feature) => {
    if (feature === 'potong_kertas')
      return isWithinLimit(planData.plan, 'potongKertasPerMonth', planData.usagePotongKertas);
    if (feature === 'hitung_cetakan')
      return isWithinLimit(planData.plan, 'hitungCetakanPerMonth', planData.usageHitungCetakan);
    return true;
  };

  const remainingUsage = (feature) => {
    const plan = planData.plan;
    if (feature === 'potong_kertas') {
      const limit = PLANS[plan].limits.potongKertasPerMonth;
      if (limit === null) return Infinity;
      return Math.max(0, limit - planData.usagePotongKertas);
    }
    if (feature === 'hitung_cetakan') {
      const limit = PLANS[plan].limits.hitungCetakanPerMonth;
      if (limit === null) return Infinity;
      return Math.max(0, limit - planData.usageHitungCetakan);
    }
    return Infinity;
  };

  // Track usage dan refresh counter lokal
  const consumeUsage = async (feature) => {
    if (!user) return;
    await trackUsage(user.id, feature);
    setPlanData(prev => ({
      ...prev,
      usagePotongKertas:  feature === 'potong_kertas'  ? prev.usagePotongKertas  + 1 : prev.usagePotongKertas,
      usageHitungCetakan: feature === 'hitung_cetakan' ? prev.usageHitungCetakan + 1 : prev.usageHitungCetakan,
    }));
  };

  return {
    planData,
    loading,
    plan:        planData.plan,
    planConfig:  PLANS[planData.plan] ?? PLANS.starter,
    isPlanActive,
    can,
    withinLimit,
    remainingUsage,
    consumeUsage,
    refreshPlan: fetchPlan,
  };
}
