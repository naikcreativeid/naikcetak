import { useState, useEffect, useCallback } from 'react';
import { AnimatePresence } from 'framer-motion';
import Header from './components/Header';
import IdentitySection from './components/IdentitySection';
import SpecsSection from './components/SpecsSection';
import CostSection from './components/CostSection';
import ResultsPanel from './components/ResultsPanel';
import PricingCards from './components/PricingCards';
import BulkSimTable from './components/BulkSimTable';
import AIAuditPanel from './components/AIAuditPanel';
import AuthModal from './components/AuthModal';
import HistoryPanel from './components/HistoryPanel';
import InvoiceGenerator from './components/InvoiceGenerator';
import Dashboard from './components/Dashboard';
import AIBriefAnalyzer from './components/AIBriefAnalyzer';
import EmailProposalGenerator from './components/EmailProposalGenerator';
import ClientTracker from './components/ClientTracker';
import TrackingPage from './components/TrackingPage';
import QuotationCountdown from './components/QuotationCountdown';
import QuotationClientPage from './components/QuotationClientPage';
import PotongKertas from './components/PotongKertas';
import HitungCetakan from './components/HitungCetakan';
import MasterKertas from './components/MasterKertas';
import MasterFinishing from './components/MasterFinishing';
import MasterMesin from './components/MasterMesin';
import { calculateImposition, calculateResults, calculateBulkSimulation } from './utils/calculator';
import { suggestTechSpecs, generateBusinessAudit } from './lib/gemini';
import { supabase, watchAuth, saveProject, isConfigured, getUserProfile, applySiteSettingsToDocument, getSiteSettings } from './lib/supabase';
import LandingPage from './components/LandingPage';
import FeatureGate from './components/FeatureGate';
import AuthPage from './components/AuthPage';
import { usePlan } from './hooks/usePlan';
import { PlanContext } from './contexts/PlanContext';
import UpgradeModal from './components/UpgradeModal';
import AdminUpgrades from './components/AdminUpgrades';
import { ADMIN_EMAILS } from './lib/plans';
import ResetPasswordPage from './components/ResetPasswordPage';
import SubscriptionBanner from './components/SubscriptionBanner';
import UserSubscription from './components/UserSubscription';
import StorePublicPage from './components/StorePublicPage';
import StorefrontManager, { LockedPreview } from './components/StorefrontManager';
import AccountProfile from './components/AccountProfile';
import LaporanKeuangan from './components/LaporanKeuangan';
import SuratJalan from './components/SuratJalan';
import POSupplier from './components/POSupplier';
import SiteSettingsPanel from './components/SiteSettingsPanel';

const INIT_IDENTITY = { productName: '', dimLength: '', dimWidth: '', dimHeight: '', gsm: '' };
const INIT_SPECS    = { planoLength: 0, planoWidth: 0, flatLength: 0, flatWidth: 0, grip: 2, wasteRate: 5, colorCount: 4 };
const INIT_COSTS    = { paperPrice: 0, printCostPerSheet: 0, finishingCost: 0, printSetupCost: 0, pondCost: 0, targetQty: 1000, margin: 35 };

export default function App() {
  const [identity, setIdentity]         = useState(INIT_IDENTITY);
  const [specs, setSpecs]               = useState(INIT_SPECS);
  const [costs, setCosts]               = useState(INIT_COSTS);
  const [results, setResults]           = useState(null);
  const [bulkSim, setBulkSim]           = useState([]);

  const [aiLoading, setAiLoading]       = useState(false);
  const [aiError, setAiError]           = useState(null);
  const [aiSuggest, setAiSuggest]       = useState(null);
  const [auditLoading, setAuditLoading] = useState(false);
  const [auditData, setAuditData]       = useState(null);

  const [user, setUser]                 = useState(null);
  const [authReady, setAuthReady]       = useState(false);
  const [showAuth, setShowAuth]         = useState(false);
  const [showUpgrade, setShowUpgrade]   = useState(false);
  const isAdmin = user && ADMIN_EMAILS.includes(user.email);
  const [saveStatus, setSaveStatus]     = useState(null); // 'saving' | 'saved' | 'error'
  const [activePage, setActivePage]     = useState('dashboard');
  const [carryOverData, setCarryOver]   = useState(null);
  const [hash, setHash]                 = useState(window.location.hash);
  const [pathname, setPathname]         = useState(window.location.pathname);
  const [userProfile, setUserProfile]   = useState(null);
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileRedirecting, setProfileRedirecting] = useState(false);
  const [siteSettings, setSiteSettings] = useState(null);

  const planHook = usePlan(user);

  const refreshUserProfile = useCallback(async () => {
    if (!user) {
      setUserProfile(null);
      setProfileLoading(false);
      return;
    }

    setProfileLoading(true);
    try {
      const profile = await getUserProfile(user.id);
      setUserProfile(profile);
    } catch (err) {
      console.error('Profile load error:', err);
    } finally {
      setProfileLoading(false);
    }
  }, [user]);

  const handleProfileSaved = useCallback(async (savedProfile) => {
    setProfileRedirecting(true);

    if (savedProfile) {
      setUserProfile((prev) => ({ ...prev, ...savedProfile }));
    }

    try {
      await Promise.all([
        refreshUserProfile(),
        planHook.refreshPlan(),
      ]);
    } catch (err) {
      console.error('Profile refresh after save error:', err);
    }

    await new Promise((resolve) => {
      window.setTimeout(resolve, 700);
    });

    setActivePage('dashboard');
    setProfileRedirecting(false);
  }, [refreshUserProfile, planHook]);

  useEffect(() => {
    if (activePage !== 'profil' && profileRedirecting) {
      setProfileRedirecting(false);
    }
  }, [activePage, profileRedirecting]);

  // ── Hash-based public tracking route ────────────────────────────────────
  useEffect(() => {
    const handler = () => setHash(window.location.hash);
    window.addEventListener('hashchange', handler);
    return () => window.removeEventListener('hashchange', handler);
  }, []);

  useEffect(() => {
    const handler = () => setPathname(window.location.pathname);
    window.addEventListener('popstate', handler);
    return () => window.removeEventListener('popstate', handler);
  }, []);

  // ── Auth listener — INITIAL_SESSION marks when auth is determined ────────
  useEffect(() => {
    if (!supabase) { setAuthReady(true); return; }
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user ?? null);
      if (event === 'INITIAL_SESSION') setAuthReady(true);
    });
    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    refreshUserProfile();
  }, [refreshUserProfile]);

  useEffect(() => {
    getSiteSettings()
      .then((settings) => {
        setSiteSettings(settings);
        applySiteSettingsToDocument(settings);
      })
      .catch((err) => console.error('Site settings load error:', err));
  }, []);

  useEffect(() => {
    if (!siteSettings) return;
    applySiteSettingsToDocument(siteSettings);
  }, [siteSettings]);

  useEffect(() => {
    if (!siteSettings?.disable_right_click) return undefined;

    const handler = (event) => event.preventDefault();
    window.addEventListener('contextmenu', handler);
    return () => window.removeEventListener('contextmenu', handler);
  }, [siteSettings?.disable_right_click]);

  const starterNeedsWhatsapp = Boolean(
    user &&
    !isAdmin &&
    !planHook.loading &&
    !profileLoading &&
    planHook.plan === 'starter' &&
    !userProfile?.phone_number
  );

  useEffect(() => {
    if (starterNeedsWhatsapp && activePage !== 'profil') {
      setActivePage('profil');
    }
  }, [starterNeedsWhatsapp, activePage]);

  // ── Real-time HPP Calculation Engine ────────────────────────────────────
  useEffect(() => {
    const maxYield = calculateImposition(specs);
    const res = calculateResults({
      maxYield,
      wasteRate:         specs.wasteRate,
      paperPrice:        costs.paperPrice,
      printCostPerSheet: costs.printCostPerSheet,
      finishingCost:     costs.finishingCost,
      printSetupCost:    costs.printSetupCost,
      pondCost:          costs.pondCost,
      targetQty:         costs.targetQty,
      margin:            costs.margin,
    });
    if (res) {
      setResults({ ...res, maxYield });
      setBulkSim(calculateBulkSimulation(specs, costs));
    } else {
      setResults(null);
      setBulkSim([]);
    }
  }, [specs, costs]);

  // ── AI: Suggest Tech Specs ───────────────────────────────────────────────
  const handleAISuggest = async () => {
    if (!identity.productName) { setAiError('Isi nama produk terlebih dahulu'); return; }
    if (!identity.dimLength || !identity.dimWidth || !identity.dimHeight) {
      setAiError('Isi dimensi P × L × T terlebih dahulu'); return;
    }
    setAiLoading(true); setAiError(null); setAiSuggest(null);
    try {
      const s = await suggestTechSpecs({
        productName: identity.productName,
        length: identity.dimLength, width: identity.dimWidth,
        height: identity.dimHeight, gsm: identity.gsm,
      });
      setAiSuggest(s);
      setSpecs((p) => ({ ...p, planoLength: +s.planoLength||p.planoLength, planoWidth: +s.planoWidth||p.planoWidth, flatLength: +s.flatLength||p.flatLength, flatWidth: +s.flatWidth||p.flatWidth }));
      setCosts((p) => ({ ...p, paperPrice: +s.estimatedPaperPrice||p.paperPrice, printSetupCost: +s.estimatedPlatePrice||p.printSetupCost, finishingCost: +s.estimatedFinishingPrice||p.finishingCost }));
    } catch (err) {
      setAiError(err.message.includes('VITE_GEMINI') ? 'Tambahkan VITE_GEMINI_API_KEY ke file .env' : `Error: ${err.message}`);
    } finally { setAiLoading(false); }
  };

  // ── AI: Business Audit ───────────────────────────────────────────────────
  const handleAIAudit = async () => {
    if (!results) return;
    setAuditLoading(true); setAuditData(null);
    try {
      const audit = await generateBusinessAudit({
        productName: identity.productName || 'Kemasan Box',
        qty: costs.targetQty, hpp: results.hpp, margin: costs.margin,
        sellingPrice: results.sellingPrice, totalCost: results.totalProductionCost,
        bep: results.bep, roi: results.roi.toFixed(1),
      });
      setAuditData(audit);
    } catch (err) { console.error('Audit error:', err); }
    finally { setAuditLoading(false); }
  };

  // ── Save to Supabase ─────────────────────────────────────────────────────
  const handleSave = async () => {
    if (!user) { setShowAuth(true); return; }
    if (!results) return;
    setSaveStatus('saving');
    try {
      await saveProject(user.id, {
        productName: identity.productName,
        targetQty: costs.targetQty,
        hpp: results.hpp,
        sellingPrice: results.sellingPrice,
        totalCost: results.totalProductionCost,
        margin: costs.margin,
        identity, specs, costs,
      });
      setSaveStatus('saved');
      setTimeout(() => setSaveStatus(null), 3000);
    } catch { setSaveStatus('error'); setTimeout(() => setSaveStatus(null), 3000); }
  };

  // ── Load project from history ────────────────────────────────────────────
  const handleLoad = (payload) => {
    if (!payload) return;
    if (payload.identity) setIdentity(payload.identity);
    if (payload.specs)    setSpecs(payload.specs);
    if (payload.costs)    setCosts(payload.costs);
  };

  const updateSpec = useCallback((k, v) => setSpecs((p)  => ({ ...p, [k]: parseFloat(v) || 0 })), []);
  const updateCost = useCallback((k, v) => setCosts((p)  => ({ ...p, [k]: parseFloat(v) || 0 })), []);
  const setMargin  = useCallback((m)    => setCosts((p)  => ({ ...p, margin: m })), []);

  // ── Auth loading screen — tunggu Supabase tentukan session ─────────────
  if (!authReady) {
    return (
      <div className="min-h-screen bg-[#F7F7F5] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 bg-zinc-900 rounded-2xl flex items-center justify-center">
            <span className="text-white font-bold text-lg">n</span>
          </div>
          <div className="w-5 h-5 border-2 border-zinc-300 border-t-zinc-700 rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  // ── Public routes (must be after all hooks) ─────────────────────────────
  const trackMatch = hash.match(/^#\/track(?:\/([A-Za-z0-9_-]+))?$/);
  if (trackMatch) {
    return <TrackingPage initialToken={trackMatch[1] ?? ''} />;
  }

  const quotationMatch = hash.match(/^#\/quotation\/([A-Z0-9-]+)(?:\?(.*))?$/i);
  if (quotationMatch) {
    const quotationParams = new URLSearchParams(quotationMatch[2] ?? '');
    return <QuotationClientPage quotationId={quotationMatch[1]} encodedData={quotationParams.get('data') ?? ''} />;
  }

  const hostname = window.location.hostname;
  const trimmedPath = pathname.replace(/^\/+|\/+$/g, '');
  const reservedRoots = ['login', 'reset-password', 'track', 'quotation'];
  const looksLikeStorePath = trimmedPath && !trimmedPath.includes('/') && !reservedRoots.includes(trimmedPath);

  if (looksLikeStorePath) {
    return <StorePublicPage slug={trimmedPath} />;
  }

  // ── Reset password route ─────────────────────────────────────────────────
  // Supabase sends recovery token as: #access_token=...&type=recovery
  const isRecovery = hash.includes('type=recovery') || hash.startsWith('#/reset-password');
  if (isRecovery) {
    return (
      <ResetPasswordPage
        hasSession={!!user || hash.includes('type=recovery')}
        onLogin={() => { window.location.hash = '#/login'; }}
      />
    );
  }

  // ── Login route ──────────────────────────────────────────────────────────
  if (hash.startsWith('#/login')) {
    if (user) {
      // Already logged in → redirect to dashboard
      window.location.hash = '';
      return null;
    }
    const tabParam = hash.includes('tab=daftar') ? 'daftar' : 'masuk';
    return (
      <AuthPage
        defaultTab={tabParam}
        onSuccess={() => { window.location.hash = ''; }}
      />
    );
  }

  // ── Landing page route ───────────────────────────────────────────────────
  if ((hostname === 'naikcetak.com' || hostname === 'www.naikcetak.com') && !trimmedPath) {
    return <LandingPage />;
  }

  // ── Auth gate — unauthenticated users: redirect to landing in prod, show login in dev ──
  if (!user) {
    const isLocalDev = ['localhost', '127.0.0.1'].includes(window.location.hostname);
    if (!isLocalDev) {
      window.location.href = import.meta.env.VITE_LANDING_URL ?? 'https://naikcetak.com';
      return null;
    }
    return (
      <AuthPage
        defaultTab="masuk"
        onSuccess={() => {}}
      />
    );
  }

  // Expose openUpgrade via context
  const planContextValue = {
    ...planHook,
    isAdmin,
    showUpgrade,
    openUpgrade:  () => user ? setShowUpgrade(true) : setShowAuth(true),
    closeUpgrade: () => setShowUpgrade(false),
  };

  return (
    <PlanContext.Provider value={planContextValue}>
    <div className="min-h-screen bg-[#F7F7F5] font-sans flex">
      <Header
        user={user}
        onLoginClick={() => setShowAuth(true)}
        activePage={activePage}
        onPageChange={setActivePage}
        plan={planHook.plan}
        onUpgradeClick={() => user ? setShowUpgrade(true) : setShowAuth(true)}
        isAdmin={isAdmin}
      />

      {/* Content area — shifted right on desktop to clear fixed sidebar */}
      <div className="flex-1 md:ml-56 pt-14 md:pt-0 min-w-0">
      <main className="max-w-7xl mx-auto px-4 py-6 lg:py-8">
        {user && !isAdmin && <SubscriptionBanner onManageClick={() => setActivePage('subscription')} />}
        {activePage === 'subscription' && user ? (
          <UserSubscription user={user} onUpgradeClick={() => setShowUpgrade(true)} />
        ) : activePage === 'dashboard' ? (
          <Dashboard user={user} onNavigate={setActivePage} />
        ) : activePage === 'laporan' ? (
          <FeatureGate feature="laporanKeuangan">
            <LaporanKeuangan user={user} onNavigate={setActivePage} />
          </FeatureGate>
        ) : activePage === 'invoice' ? (
          <FeatureGate feature="invoice">
            <InvoiceGenerator user={user} onLoginRequest={() => setShowAuth(true)} />
          </FeatureGate>
        ) : activePage === 'suratJalan' ? (
          <FeatureGate feature="suratJalan">
            <SuratJalan />
          </FeatureGate>
        ) : activePage === 'poSupplier' ? (
          <FeatureGate feature="poSupplier">
            <POSupplier />
          </FeatureGate>
        ) : activePage === 'brief' ? (
          <FeatureGate feature="groqAI">
            <AIBriefAnalyzer />
          </FeatureGate>
        ) : activePage === 'email' ? (
          <FeatureGate feature="groqAI">
            <EmailProposalGenerator />
          </FeatureGate>
        ) : activePage === 'tracking' ? (
          <FeatureGate feature="trackingOrder">
            <ClientTracker user={user} />
          </FeatureGate>
        ) : activePage === 'profil' ? (
          <AccountProfile
            user={user}
            profile={userProfile}
            plan={planHook.plan}
            enforceWhatsapp={starterNeedsWhatsapp}
            redirecting={profileRedirecting}
            onBack={() => setActivePage('dashboard')}
            onSaved={handleProfileSaved}
          />
        ) : activePage === 'tokoSaya' ? (
          <FeatureGate feature="publicStore" fallback={<LockedPreview />}>
            <StorefrontManager user={user} />
          </FeatureGate>
        ) : activePage === 'quotation' ? (
          <FeatureGate feature="quotation">
            <QuotationCountdown />
          </FeatureGate>
        ) : activePage === 'potong' ? (
          <PotongKertas
            user={user}
            planHook={planHook}
            onCarryOver={(data) => setCarryOver(data)}
            onNavigate={setActivePage}
            onUpgradeClick={() => user ? setShowUpgrade(true) : setShowAuth(true)}
          />
        ) : activePage === 'cetakan' ? (
          <HitungCetakan
            user={user}
            planHook={planHook}
            initialData={carryOverData}
            onUpgradeClick={() => user ? setShowUpgrade(true) : setShowAuth(true)}
          />
        ) : activePage === 'masterKertas' ? (
          <MasterKertas />
        ) : activePage === 'masterFinishing' ? (
          <MasterFinishing />
        ) : activePage === 'masterMesin' ? (
          <MasterMesin />
        ) : activePage === 'adminUpgrades' && isAdmin ? (
          <AdminUpgrades user={user} />
        ) : activePage === 'siteSettings' && isAdmin ? (
          <SiteSettingsPanel user={user} />
        ) : (
          <FeatureGate feature="kalkulatorHPP">
          <>
            {/* AI Suggestion Banner */}
            <AnimatePresence>
              {aiSuggest && (
                <div className="mb-4 flex items-start gap-3 bg-blue-50 border border-blue-200 rounded-xl px-4 py-3 text-sm text-blue-800">
                  <span className="shrink-0">✨</span>
                  <span><strong>AI menyarankan:</strong> {aiSuggest.material} — Plano {aiSuggest.planoSize} — {aiSuggest.notes}</span>
                </div>
              )}
            </AnimatePresence>

            <div className="grid grid-cols-1 lg:grid-cols-[1fr_440px] xl:grid-cols-[1fr_480px] gap-6 items-start">
              {/* LEFT — Input Forms */}
              <div className="space-y-4 min-w-0">
                <IdentitySection
                  identity={identity} onChange={setIdentity}
                  onAISuggest={handleAISuggest} aiLoading={aiLoading} aiError={aiError}
                />
                <SpecsSection specs={specs} onUpdate={updateSpec} />
                <CostSection  costs={costs} onUpdate={updateCost} />
              </div>

              {/* RIGHT — Results & Projections */}
              <div className="space-y-4 lg:sticky lg:top-20 h-fit">
                <ResultsPanel
                  results={results} costs={costs} specs={specs}
                  onAudit={handleAIAudit} auditLoading={auditLoading}
                  onSave={handleSave} saveStatus={saveStatus}
                  userLoggedIn={!!user}
                />
                <PricingCards hpp={results?.hpp} activeMargin={costs.margin} onSelectMargin={setMargin} />
                <BulkSimTable data={bulkSim} />
                <HistoryPanel user={user} onLoad={handleLoad} />
                <AnimatePresence>
                  {auditData && <AIAuditPanel key="audit" data={auditData} productName={identity.productName} />}
                </AnimatePresence>
              </div>
            </div>
          </>
          </FeatureGate>
        )}
      </main>
      </div>

      {/* Auth Modal */}
      <AnimatePresence>
        {showAuth && (
          <AuthModal
            onClose={() => setShowAuth(false)}
            onSuccess={(u) => { setUser(u); setShowAuth(false); }}
          />
        )}
      </AnimatePresence>

      {/* Upgrade Modal */}
      <AnimatePresence>
        {showUpgrade && user && (
          <UpgradeModal
            user={user}
            currentPlan={planHook.plan}
            onClose={() => setShowUpgrade(false)}
            onSuccess={() => { planHook.refreshPlan(); }}
          />
        )}
      </AnimatePresence>
    </div>
    </PlanContext.Provider>
  );
}
