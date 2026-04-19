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
import OrderTrackingPortal from './components/OrderTrackingPortal';
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
import { watchAuth, saveProject, isConfigured } from './lib/supabase';

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
  const [showAuth, setShowAuth]         = useState(false);
  const [saveStatus, setSaveStatus]     = useState(null); // 'saving' | 'saved' | 'error'
  const [activePage, setActivePage]     = useState('dashboard');
  const [carryOverData, setCarryOver]   = useState(null);
  const [hash, setHash]                 = useState(window.location.hash);

  // ── Hash-based public tracking route ────────────────────────────────────
  useEffect(() => {
    const handler = () => setHash(window.location.hash);
    window.addEventListener('hashchange', handler);
    return () => window.removeEventListener('hashchange', handler);
  }, []);

  // ── Auth listener ────────────────────────────────────────────────────────
  useEffect(() => watchAuth(setUser), []);

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

  // ── Public routes (must be after all hooks) ─────────────────────────────
  const trackMatch = hash.match(/^#\/track(?:\/([A-Z0-9]+))?$/i);
  if (trackMatch) {
    return <TrackingPage initialToken={trackMatch[1] ?? ''} />;
  }

  const quotationMatch = hash.match(/^#\/quotation\/([A-Z0-9-]+)$/i);
  if (quotationMatch) {
    return <QuotationClientPage quotationId={quotationMatch[1]} />;
  }

  return (
    <div className="min-h-screen bg-[#F7F7F5] font-sans flex">
      <Header user={user} onLoginClick={() => setShowAuth(true)} activePage={activePage} onPageChange={setActivePage} />

      {/* Content area — shifted right on desktop to clear fixed sidebar */}
      <div className="flex-1 md:ml-56 pt-14 md:pt-0 min-w-0">
      <main className="max-w-7xl mx-auto px-4 py-6 lg:py-8">
        {activePage === 'dashboard' ? (
          <Dashboard user={user} onNavigate={setActivePage} />
        ) : activePage === 'invoice' ? (
          <InvoiceGenerator user={user} onLoginRequest={() => setShowAuth(true)} />
        ) : activePage === 'brief' ? (
          <AIBriefAnalyzer />
        ) : activePage === 'email' ? (
          <EmailProposalGenerator />
        ) : activePage === 'tracking' ? (
          <OrderTrackingPortal />
        ) : activePage === 'quotation' ? (
          <QuotationCountdown />
        ) : activePage === 'potong' ? (
          <PotongKertas
            user={user}
            onCarryOver={(data) => setCarryOver(data)}
            onNavigate={setActivePage}
          />
        ) : activePage === 'cetakan' ? (
          <HitungCetakan user={user} initialData={carryOverData} />
        ) : activePage === 'masterKertas' ? (
          <MasterKertas />
        ) : activePage === 'masterFinishing' ? (
          <MasterFinishing />
        ) : activePage === 'masterMesin' ? (
          <MasterMesin />
        ) : (
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
    </div>
  );
}
