import { motion } from 'framer-motion';
import { formatRupiah } from '../utils/calculator';

const PRESETS = [
  { label: 'Hemat',   margin: 20, color: 'zinc',   description: 'Volume tinggi' },
  { label: 'Standar', margin: 35, color: 'blue',    description: 'Disarankan'   },
  { label: 'Premium', margin: 50, color: 'violet',  description: 'Nilai tinggi' },
];

const colorMap = {
  zinc:   { bg: 'bg-zinc-900',   text: 'text-white',        ring: 'ring-zinc-900',  badge: 'bg-zinc-700 text-zinc-200', active: 'border-zinc-900'  },
  blue:   { bg: 'bg-blue-600',   text: 'text-white',        ring: 'ring-blue-600',  badge: 'bg-blue-500 text-blue-100', active: 'border-blue-600'  },
  violet: { bg: 'bg-violet-600', text: 'text-white',        ring: 'ring-violet-600',badge: 'bg-violet-500 text-violet-100', active: 'border-violet-600' },
};

export default function PricingCards({ hpp, activeMargin, onSelectMargin }) {
  if (!hpp) return null;

  return (
    <motion.div
      className="card"
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.15 }}
    >
      <div className="card-header">
        <span className="section-title">Saran Harga Jual</span>
      </div>

      <div className="p-4 grid grid-cols-3 gap-2">
        {PRESETS.map(({ label, margin, color, description }) => {
          const sellingPrice = hpp / (1 - margin / 100);
          const profit = sellingPrice - hpp;
          const isActive = activeMargin === margin;
          const c = colorMap[color];

          return (
            <motion.button
              key={margin}
              onClick={() => onSelectMargin(margin)}
              whileTap={{ scale: 0.97 }}
              className={`relative rounded-xl border-2 p-3 text-left transition-all
                          ${isActive ? `${c.active} ${c.bg} ${c.text}` : 'border-zinc-200 bg-white hover:border-zinc-300'}
              `}
            >
              <span className={`text-[10px] font-bold uppercase tracking-widest ${isActive ? 'opacity-60' : 'text-zinc-400'}`}>
                {label}
              </span>

              <p className={`font-mono font-bold text-lg mt-1 leading-none ${isActive ? 'text-white' : 'text-zinc-900'}`}>
                {margin}%
              </p>

              <p className={`font-mono text-[11px] font-semibold mt-2 ${isActive ? 'opacity-80' : 'text-zinc-600'}`}>
                {formatRupiah(sellingPrice)}
              </p>

              <p className={`text-[10px] mt-0.5 ${isActive ? 'opacity-60' : 'text-zinc-400'}`}>
                +{formatRupiah(profit)}/unit
              </p>

              {isActive && (
                <span className={`absolute top-2 right-2 text-[9px] font-bold px-1.5 py-0.5 rounded-full ${c.badge}`}>
                  Aktif
                </span>
              )}
            </motion.button>
          );
        })}
      </div>

      <div className="px-4 pb-4">
        <p className="text-[10px] text-zinc-400 text-center">Klik kartu untuk menggunakan margin. Sesuaikan via slider di form.</p>
      </div>
    </motion.div>
  );
}
