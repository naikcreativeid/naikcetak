import { motion } from 'framer-motion';
import { BarChart3 } from 'lucide-react';
import { formatRupiah, formatNumber } from '../utils/calculator';

export default function BulkSimTable({ data }) {
  if (!data || data.length === 0 || data.every((r) => r.hpp === 0)) return null;

  return (
    <motion.div
      className="card"
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
    >
      <div className="card-header">
        <span className="section-title">Simulasi Volume</span>
        <BarChart3 size={14} className="text-zinc-300" />
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-zinc-100">
              {['Qty', 'Plano', 'HPP/unit', 'Harga Jual', 'Diskon', 'Laba Bersih'].map((h) => (
                <th key={h} className="px-4 py-2.5 text-left font-bold uppercase tracking-wider text-[10px] text-zinc-400">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.map((row, i) => (
              <motion.tr
                key={row.qty}
                className="border-b border-zinc-50 hover:bg-zinc-50 transition-colors"
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.05 * i }}
              >
                <td className="px-4 py-3 font-mono font-bold text-zinc-900">
                  {formatNumber(row.qty)}
                </td>
                <td className="px-4 py-3 font-mono text-zinc-600">
                  {formatNumber(row.totalPaper)}
                </td>
                <td className="px-4 py-3 font-mono text-zinc-700">
                  {formatRupiah(row.hpp)}
                </td>
                <td className="px-4 py-3 font-mono font-semibold text-zinc-900">
                  {formatRupiah(row.discountedPrice)}
                </td>
                <td className="px-4 py-3">
                  {row.discount > 0 ? (
                    <span className="inline-flex items-center px-1.5 py-0.5 rounded-md bg-red-100 text-red-700 font-bold text-[10px]">
                      -{row.discount}%
                    </span>
                  ) : (
                    <span className="text-zinc-300">—</span>
                  )}
                </td>
                <td className={`px-4 py-3 font-mono font-semibold ${row.netProfit > 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                  {formatRupiah(row.netProfit)}
                </td>
              </motion.tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="px-4 py-3 bg-zinc-50 border-t border-zinc-100">
        <p className="text-[10px] text-zinc-400">
          * Diskon otomatis: ≥1.000 pcs −5% | ≥5.000 pcs −10% pada harga jual
        </p>
      </div>
    </motion.div>
  );
}
