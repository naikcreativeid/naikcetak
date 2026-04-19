import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, Loader2, Brain, TrendingUp, AlertTriangle, CheckCircle2, Save, Check } from 'lucide-react';
import { formatRupiah, formatNumber } from '../utils/calculator';

function Metric({ label, value, sub, accent }) {
  return (
    <div className={`rounded-xl p-3 ${accent ? 'bg-emerald-50 border border-emerald-100' : 'bg-zinc-50 border border-zinc-100'}`}>
      <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 mb-1">{label}</p>
      <p className={`font-mono font-bold text-base ${accent ? 'text-emerald-700' : 'text-zinc-900'}`}>{value}</p>
      {sub && <p className="text-[10px] text-zinc-400 mt-0.5">{sub}</p>}
    </div>
  );
}

function CostRow({ label, value, highlight }) {
  return (
    <div className={`flex justify-between items-center py-1.5 ${highlight ? 'font-bold' : ''}`}>
      <span className={`text-xs ${highlight ? 'text-zinc-900' : 'text-zinc-500'}`}>{label}</span>
      <span className={`font-mono text-xs ${highlight ? 'text-zinc-900' : 'text-zinc-600'}`}>{formatRupiah(value)}</span>
    </div>
  );
}

export default function ResultsPanel({ results, costs, specs, onAudit, auditLoading, onSave, saveStatus, userLoggedIn }) {
  const [showBreakdown, setShowBreakdown] = useState(false);

  if (!results) {
    return (
      <motion.div
        className="card"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="card-header">
          <span className="section-title">Hasil Kalkulasi HPP</span>
        </div>
        <div className="p-8 text-center">
          <div className="w-14 h-14 bg-zinc-100 rounded-2xl flex items-center justify-center mx-auto mb-3">
            <TrendingUp size={24} className="text-zinc-300" />
          </div>
          <p className="text-sm font-medium text-zinc-400">Isi spesifikasi & biaya produksi</p>
          <p className="text-xs text-zinc-300 mt-1">Hasil akan muncul secara real-time</p>
        </div>
      </motion.div>
    );
  }

  const isHealthy = results.roi >= 20;
  const roiColor = results.roi >= 30 ? 'text-emerald-600' : results.roi >= 10 ? 'text-amber-600' : 'text-red-500';

  return (
    <motion.div
      className="card"
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <div className="card-header">
        <span className="section-title">Hasil Kalkulasi HPP</span>
        {isHealthy ? (
          <span className="flex items-center gap-1 text-[11px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
            <CheckCircle2 size={11} /> Sehat
          </span>
        ) : (
          <span className="flex items-center gap-1 text-[11px] font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full">
            <AlertTriangle size={11} /> Perlu Review
          </span>
        )}
      </div>

      <div className="p-5 space-y-5">
        {/* HPP — Hero Number */}
        <div className="bg-zinc-900 rounded-2xl p-5 text-white">
          <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 mb-2">HPP per Unit</p>
          <motion.p
            key={results.hpp}
            className="font-mono font-bold text-4xl tracking-tight"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
          >
            {formatRupiah(results.hpp)}
          </motion.p>
          <div className="mt-3 flex items-center gap-4 text-sm">
            <span className="text-zinc-400 text-xs">Harga Jual →</span>
            <motion.span
              key={results.sellingPrice}
              className="font-mono font-bold text-xl text-white"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              {formatRupiah(results.sellingPrice)}
            </motion.span>
            <span className="text-xs text-zinc-400 ml-auto">{costs.margin}% margin</span>
          </div>
        </div>

        {/* Key Metrics Grid */}
        <div className="grid grid-cols-2 gap-2">
          <Metric
            label="Total Plano"
            value={formatNumber(results.totalPaper)}
            sub={`${formatNumber(results.rawSheets)} raw + ${specs.wasteRate}% waste`}
          />
          <Metric
            label="BEP"
            value={`${formatNumber(results.bep)} pcs`}
            sub="titik impas"
          />
          <Metric
            label="Laba Bersih"
            value={formatRupiah(results.netProfit)}
            sub={`dari ${formatNumber(costs.targetQty)} pcs`}
            accent={results.netProfit > 0}
          />
          <Metric
            label="ROI"
            value={`${results.roi.toFixed(1)}%`}
            sub="return on invest"
            accent={results.roi >= 20}
          />
        </div>

        {/* Cost Breakdown Toggle */}
        <div>
          <button
            onClick={() => setShowBreakdown(!showBreakdown)}
            className="w-full flex items-center justify-between text-xs font-semibold text-zinc-500 hover:text-zinc-900 transition-colors py-1"
          >
            Rincian Biaya Produksi
            <ChevronDown
              size={14}
              className={`transition-transform ${showBreakdown ? 'rotate-180' : ''}`}
            />
          </button>

          <AnimatePresence>
            {showBreakdown && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden"
              >
                <div className="border-t border-zinc-100 pt-3 mt-1 divide-y divide-zinc-50">
                  <CostRow label="Biaya Kertas" value={results.paperCost} />
                  <CostRow label="Biaya Cetak" value={results.printCost} />
                  <CostRow label="Finishing" value={results.finishingTotal} />
                  <CostRow label="Total Variabel" value={results.totalVariableCost} />
                  <CostRow label="Plate + Pond (Fixed)" value={results.fixedCosts} />
                  <CostRow label="Total Produksi" value={results.totalProductionCost} highlight />
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Actions */}
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={onAudit}
            disabled={auditLoading}
            className="flex items-center justify-center gap-2 py-2.5 rounded-xl border-2 border-zinc-900 text-zinc-900
                       font-semibold text-sm hover:bg-zinc-900 hover:text-white transition-all disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {auditLoading
              ? <><Loader2 size={15} className="animate-spin" /> Analisis...</>
              : <><Brain size={15} /> Audit AI</>}
          </button>

          <button
            onClick={onSave}
            disabled={saveStatus === 'saving'}
            className={`flex items-center justify-center gap-2 py-2.5 rounded-xl font-semibold text-sm transition-all disabled:opacity-40
              ${saveStatus === 'saved'
                ? 'bg-emerald-600 text-white'
                : saveStatus === 'error'
                ? 'bg-red-500 text-white'
                : 'bg-zinc-900 text-white hover:bg-zinc-700'}`}
          >
            {saveStatus === 'saving' ? <><Loader2 size={15} className="animate-spin" /> Menyimpan...</>
            : saveStatus === 'saved'  ? <><Check size={15} /> Tersimpan!</>
            : saveStatus === 'error'  ? 'Gagal simpan'
            : <><Save size={15} /> {userLoggedIn ? 'Simpan' : 'Simpan'}</>}
          </button>
        </div>
      </div>
    </motion.div>
  );
}
