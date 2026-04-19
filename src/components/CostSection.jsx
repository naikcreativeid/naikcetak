import { motion } from 'framer-motion';
import { formatRupiah } from '../utils/calculator';

function Field({ label, hint, children }) {
  return (
    <div>
      <label className="label">
        {label}
        {hint && <span className="normal-case font-normal ml-1 text-zinc-300">{hint}</span>}
      </label>
      {children}
    </div>
  );
}

function MoneyInput({ value, onChange, placeholder = '0' }) {
  return (
    <div className="relative">
      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-mono text-zinc-400 pointer-events-none">Rp</span>
      <input
        type="number"
        className="input-mono pl-8"
        placeholder={placeholder}
        min="0"
        value={value || ''}
        onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
      />
    </div>
  );
}

function QtyInput({ value, onChange }) {
  return (
    <input
      type="number"
      className="input-mono text-xl font-bold py-3"
      placeholder="0"
      min="0"
      step="100"
      value={value || ''}
      onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
    />
  );
}

export default function CostSection({ costs, onUpdate }) {
  return (
    <motion.div
      className="card"
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: 0.1 }}
    >
      <div className="card-header">
        <span className="section-title">Harga Pokok Produksi</span>
      </div>

      <div className="p-5 space-y-5">
        {/* Target Qty — extra prominent */}
        <div className="bg-zinc-50 border border-zinc-200 rounded-xl p-4">
          <Field label="Target Quantity (pcs)">
            <QtyInput
              value={costs.targetQty}
              onChange={(v) => onUpdate('targetQty', v)}
            />
          </Field>
          {costs.targetQty >= 1000 && (
            <p className="mt-2 text-[11px] font-semibold text-blue-600">
              {costs.targetQty >= 5000 ? '🎉 Diskon 10% berlaku pada harga jual' : '✓ Diskon 5% berlaku pada harga jual'}
            </p>
          )}
        </div>

        {/* Variable Costs */}
        <div>
          <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-300 mb-3">Biaya Variabel</p>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <Field label="Harga Kertas /plano">
                <MoneyInput value={costs.paperPrice} onChange={(v) => onUpdate('paperPrice', v)} />
              </Field>
              <Field label="Biaya Cetak /tarikan">
                <MoneyInput value={costs.printCostPerSheet} onChange={(v) => onUpdate('printCostPerSheet', v)} />
              </Field>
            </div>
            <Field label="Finishing /pcs" hint="(laminasi, varnish, dll)">
              <MoneyInput value={costs.finishingCost} onChange={(v) => onUpdate('finishingCost', v)} />
            </Field>
          </div>
        </div>

        {/* Fixed / Setup Costs */}
        <div>
          <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-300 mb-3">Biaya Setup (Per Job)</p>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Biaya Plate" hint="(semua warna)">
              <MoneyInput value={costs.printSetupCost} onChange={(v) => onUpdate('printSetupCost', v)} />
            </Field>
            <Field label="Biaya Pond" hint="(dies cut)">
              <MoneyInput value={costs.pondCost} onChange={(v) => onUpdate('pondCost', v)} />
            </Field>
          </div>
        </div>

        {/* Margin slider */}
        <div>
          <div className="flex justify-between items-center mb-2">
            <label className="label mb-0">Margin Keuntungan</label>
            <span className="font-mono font-bold text-sm text-zinc-900">{costs.margin}%</span>
          </div>
          <input
            type="range"
            min="5"
            max="80"
            step="1"
            value={costs.margin}
            onChange={(e) => onUpdate('margin', parseFloat(e.target.value))}
            className="w-full h-2 bg-zinc-200 rounded-full appearance-none cursor-pointer
                       [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4
                       [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:bg-zinc-900
                       [&::-webkit-slider-thumb]:rounded-full"
          />
          <div className="flex justify-between text-[10px] text-zinc-400 mt-1">
            <span>5%</span>
            <span>Standar 35%</span>
            <span>80%</span>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
