import { createContext, useContext, useState } from 'react';

export const PlanContext = createContext(null);

export function usePlanContext() {
  const ctx = useContext(PlanContext);
  // Fallback jika dipakai di luar provider (guest/unauthenticated)
  if (!ctx) return {
    plan: 'starter', planConfig: null, loading: false,
    can: () => false, withinLimit: () => true,
    remainingUsage: () => Infinity, consumeUsage: async () => {},
    refreshPlan: async () => {}, planData: null,
    isAdmin: false,
    showUpgrade: false, openUpgrade: () => {}, closeUpgrade: () => {},
  };
  return ctx;
}
