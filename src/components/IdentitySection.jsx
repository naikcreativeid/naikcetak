import { Sparkles, Loader2, AlertCircle } from 'lucide-react';
import { motion } from 'framer-motion';

function Field({ label, children }) {
  return (
    <div>
      <label className="label">{label}</label>
      {children}
    </div>
  );
}

export default function IdentitySection({ identity, onChange, onAISuggest, aiLoading, aiError }) {
  const set = (key) => (e) => onChange((prev) => ({ ...prev, [key]: e.target.value }));

  return (
    <motion.div
      className="card"
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
    >
      <div className="card-header">
        <span className="section-title">Identitas Produk</span>
      </div>

      <div className="p-5 space-y-4">
        <Field label="Nama Produk">
          <input
            type="text"
            className="input-field"
            placeholder="contoh: Box Sabun Kecantikan Premium"
            value={identity.productName}
            onChange={set('productName')}
          />
        </Field>

        <div className="grid grid-cols-4 gap-2">
          <Field label="Panjang (cm)">
            <input
              type="number"
              className="input-mono"
              placeholder="0"
              min="0"
              value={identity.dimLength}
              onChange={set('dimLength')}
            />
          </Field>
          <Field label="Lebar (cm)">
            <input
              type="number"
              className="input-mono"
              placeholder="0"
              min="0"
              value={identity.dimWidth}
              onChange={set('dimWidth')}
            />
          </Field>
          <Field label="Tinggi (cm)">
            <input
              type="number"
              className="input-mono"
              placeholder="0"
              min="0"
              value={identity.dimHeight}
              onChange={set('dimHeight')}
            />
          </Field>
          <Field label="GSM">
            <input
              type="number"
              className="input-mono"
              placeholder="0"
              min="0"
              value={identity.gsm}
              onChange={set('gsm')}
            />
          </Field>
        </div>

        <button
          onClick={onAISuggest}
          disabled={aiLoading}
          className="w-full flex items-center justify-center gap-2.5 py-3 rounded-xl
                     bg-gradient-to-r from-blue-600 to-blue-500 text-white font-semibold text-sm
                     hover:from-blue-700 hover:to-blue-600 active:scale-[0.99]
                     transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-sm shadow-blue-200"
        >
          {aiLoading ? (
            <>
              <Loader2 size={16} className="animate-spin" />
              AI sedang menganalisis...
            </>
          ) : (
            <>
              <Sparkles size={16} />
              AI Saran Spesifikasi Teknis
            </>
          )}
        </button>

        {aiError && (
          <div className="flex items-start gap-2 text-xs text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
            <AlertCircle size={13} className="mt-0.5 shrink-0" />
            <span>{aiError}</span>
          </div>
        )}
      </div>
    </motion.div>
  );
}
