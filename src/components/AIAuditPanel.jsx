import { useState } from 'react';
import { motion } from 'framer-motion';
import { Brain, Copy, CheckCheck, Printer, Cpu, TrendingUp, AlertTriangle, Lightbulb } from 'lucide-react';

const ratingConfig = {
  'Sangat Baik': { color: 'text-emerald-700', bg: 'bg-emerald-50 border-emerald-200', icon: '🌟' },
  'Baik':        { color: 'text-blue-700',    bg: 'bg-blue-50 border-blue-200',       icon: '✅' },
  'Cukup':       { color: 'text-amber-700',   bg: 'bg-amber-50 border-amber-200',     icon: '⚠️' },
  'Perlu Evaluasi': { color: 'text-red-700',  bg: 'bg-red-50 border-red-200',         icon: '🔴' },
};

export default function AIAuditPanel({ data, productName }) {
  const [copied, setCopied] = useState(false);

  const rating = ratingConfig[data.profitabilityRating] ?? ratingConfig['Cukup'];
  const isOffset = data.printMethod === 'Offset';

  const copyWA = async () => {
    await navigator.clipboard.writeText(data.whatsappQuote);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <motion.div
      className="card"
      initial={{ opacity: 0, y: 20, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.4 }}
    >
      <div className="card-header bg-gradient-to-r from-zinc-900 to-zinc-800">
        <span className="section-title text-zinc-400">Audit Bisnis AI</span>
        <Brain size={14} className="text-zinc-400" />
      </div>

      <div className="p-5 space-y-4">
        {/* Method Recommendation */}
        <div className={`rounded-xl p-4 border flex items-start gap-3 ${isOffset ? 'bg-blue-50 border-blue-200' : 'bg-violet-50 border-violet-200'}`}>
          <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${isOffset ? 'bg-blue-600' : 'bg-violet-600'}`}>
            {isOffset ? <Printer size={16} className="text-white" /> : <Cpu size={16} className="text-white" />}
          </div>
          <div>
            <p className={`text-xs font-bold ${isOffset ? 'text-blue-800' : 'text-violet-800'}`}>
              Rekomendasi: Cetak {data.printMethod}
            </p>
            <p className={`text-[11px] mt-0.5 ${isOffset ? 'text-blue-700' : 'text-violet-700'}`}>
              {data.printMethodReason}
            </p>
          </div>
        </div>

        {/* Profitability Rating */}
        <div className={`rounded-xl p-4 border ${rating.bg}`}>
          <div className="flex items-center gap-2 mb-1">
            <TrendingUp size={13} className={rating.color} />
            <span className={`text-[11px] font-bold uppercase tracking-wider ${rating.color}`}>
              Profitabilitas: {data.profitabilityRating} {rating.icon}
            </span>
          </div>
          <p className={`text-[11px] ${rating.color} opacity-80`}>{data.profitabilityNote}</p>
        </div>

        {/* Risks & Opportunities */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-red-400 mb-2 flex items-center gap-1">
              <AlertTriangle size={10} /> Risiko
            </p>
            <ul className="space-y-1">
              {(data.risks ?? []).map((r, i) => (
                <li key={i} className="text-[11px] text-zinc-600 flex items-start gap-1.5">
                  <span className="text-red-400 mt-0.5">•</span> {r}
                </li>
              ))}
            </ul>
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-emerald-500 mb-2 flex items-center gap-1">
              <Lightbulb size={10} /> Peluang
            </p>
            <ul className="space-y-1">
              {(data.opportunities ?? []).map((o, i) => (
                <li key={i} className="text-[11px] text-zinc-600 flex items-start gap-1.5">
                  <span className="text-emerald-500 mt-0.5">•</span> {o}
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* WhatsApp Quote */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">
              Draft Penawaran WhatsApp
            </p>
            <button
              onClick={copyWA}
              className="flex items-center gap-1 text-[11px] font-semibold text-zinc-600 hover:text-zinc-900 transition-colors"
            >
              {copied ? (
                <><CheckCheck size={12} className="text-emerald-500" /> Tersalin!</>
              ) : (
                <><Copy size={12} /> Salin</>
              )}
            </button>
          </div>
          <div className="bg-[#ECF8F0] border border-green-200 rounded-xl p-4">
            <p className="text-[12px] text-zinc-800 whitespace-pre-wrap leading-relaxed font-sans">
              {data.whatsappQuote}
            </p>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
