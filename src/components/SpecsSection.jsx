import { motion } from 'framer-motion';
import { Layers, Info } from 'lucide-react';
import { calculateImposition } from '../utils/calculator';

function Field({ label, children, hint }) {
  return (
    <div>
      <label className="label">{label}{hint && <span className="normal-case font-normal ml-1 text-zinc-300">{hint}</span>}</label>
      {children}
    </div>
  );
}

function NumInput({ value, onChange, placeholder = '0', step = '1' }) {
  return (
    <input
      type="number"
      className="input-mono"
      placeholder={placeholder}
      min="0"
      step={step}
      value={value || ''}
      onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
    />
  );
}

export default function SpecsSection({ specs, onUpdate }) {
  const maxYield = calculateImposition(specs);

  return (
    <motion.div
      className="card"
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: 0.05 }}
    >
      <div className="card-header">
        <span className="section-title">Spesifikasi Teknis &amp; Bahan Baku</span>
        {maxYield > 0 && (
          <span className="flex items-center gap-1 text-[11px] font-bold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full">
            <Layers size={11} />
            Yield: {maxYield} up/plano
          </span>
        )}
      </div>

      <div className="p-5 space-y-4">
        {/* Plano Size */}
        <div>
          <p className="label mb-2 flex items-center gap-1">
            Ukuran Plano (Lembar Kertas)
            <Info size={11} className="text-zinc-300" />
          </p>
          <div className="grid grid-cols-2 gap-2">
            <Field label="Panjang (cm)">
              <NumInput value={specs.planoLength} onChange={(v) => onUpdate('planoLength', v)} />
            </Field>
            <Field label="Lebar (cm)">
              <NumInput value={specs.planoWidth} onChange={(v) => onUpdate('planoWidth', v)} />
            </Field>
          </div>
        </div>

        {/* Flat / Bentangan Size */}
        <div>
          <p className="label mb-2">Ukuran Bentangan / Net Size</p>
          <div className="grid grid-cols-2 gap-2">
            <Field label="Panjang (cm)">
              <NumInput value={specs.flatLength} onChange={(v) => onUpdate('flatLength', v)} />
            </Field>
            <Field label="Lebar (cm)">
              <NumInput value={specs.flatWidth} onChange={(v) => onUpdate('flatWidth', v)} />
            </Field>
          </div>
        </div>

        {/* Parameters */}
        <div className="grid grid-cols-3 gap-2">
          <Field label="Grip (cm)">
            <NumInput value={specs.grip} onChange={(v) => onUpdate('grip', v)} step="0.5" />
          </Field>
          <Field label="Waste (%)">
            <NumInput value={specs.wasteRate} onChange={(v) => onUpdate('wasteRate', v)} />
          </Field>
          <Field label="Warna">
            <NumInput value={specs.colorCount} onChange={(v) => onUpdate('colorCount', v)} />
          </Field>
        </div>

        {/* Imposition info box */}
        {specs.planoLength > 0 && specs.flatLength > 0 && (
          <div className="bg-zinc-50 border border-zinc-100 rounded-xl p-3">
            <p className="text-[11px] text-zinc-500 font-medium">
              <span className="font-bold text-zinc-700">Imposition: </span>
              floor(({specs.planoLength}-{specs.grip})/{specs.flatLength}) × floor(({specs.planoWidth}-{specs.grip})/{specs.flatWidth})
              = <span className="font-bold text-zinc-900 font-mono">{maxYield} up</span>
            </p>
          </div>
        )}
      </div>
    </motion.div>
  );
}
