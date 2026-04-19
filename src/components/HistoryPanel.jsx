import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { History, Trash2, ChevronRight, Loader2 } from 'lucide-react';
import { getUserProjects, deleteProject } from '../lib/supabase';
import { formatRupiah, formatNumber } from '../utils/calculator';

export default function HistoryPanel({ user, onLoad }) {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [open, setOpen]         = useState(false);

  useEffect(() => {
    if (!user || !open) return;
    setLoading(true);
    getUserProjects(user.id)
      .then(setProjects)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [user, open]);

  const handleDelete = async (id, e) => {
    e.stopPropagation();
    await deleteProject(id);
    setProjects((p) => p.filter((x) => x.id !== id));
  };

  if (!user) return null;

  return (
    <motion.div
      className="card"
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <button
        onClick={() => setOpen(!open)}
        className="card-header w-full hover:bg-zinc-50 transition-colors"
      >
        <span className="section-title flex items-center gap-2">
          <History size={12} /> Riwayat Proyek
        </span>
        <ChevronRight size={14} className={`text-zinc-400 transition-transform ${open ? 'rotate-90' : ''}`} />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }}
            className="overflow-hidden"
          >
            <div className="p-3">
              {loading ? (
                <div className="flex items-center justify-center py-6 text-zinc-400">
                  <Loader2 size={16} className="animate-spin mr-2" /> Memuat...
                </div>
              ) : projects.length === 0 ? (
                <p className="text-center text-xs text-zinc-400 py-6">Belum ada proyek tersimpan</p>
              ) : (
                <div className="space-y-1.5 max-h-64 overflow-y-auto">
                  {projects.map((p) => (
                    <div
                      key={p.id}
                      onClick={() => onLoad(p.payload)}
                      className="flex items-center justify-between p-3 rounded-xl bg-zinc-50 hover:bg-zinc-100 cursor-pointer transition-colors group"
                    >
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-zinc-900 truncate">{p.product_name || '—'}</p>
                        <p className="text-[11px] text-zinc-400 font-mono">
                          {formatNumber(p.target_qty)} pcs · HPP {formatRupiah(p.hpp)}
                        </p>
                      </div>
                      <button
                        onClick={(e) => handleDelete(p.id, e)}
                        className="text-zinc-300 hover:text-red-500 transition-colors p-1 opacity-0 group-hover:opacity-100"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
