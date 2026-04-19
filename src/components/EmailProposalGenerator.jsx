import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, RefreshCw, Copy, Check, MessageCircle, Zap } from 'lucide-react';
import Groq from 'groq-sdk';

const GROQ_MODEL = 'llama-3.3-70b-versatile';

const TONES = [
  { id: 'profesional', label: 'Profesional',    desc: 'Formal & terpercaya',    color: 'text-blue-600',   bg: 'bg-blue-50',   border: 'border-blue-200' },
  { id: 'hangat',      label: 'Hangat & Ramah', desc: 'Santai namun serius',     color: 'text-emerald-600',bg: 'bg-emerald-50',border: 'border-emerald-200' },
  { id: 'persuasif',   label: 'Persuasif',      desc: 'Sales-focused, closing',  color: 'text-violet-600', bg: 'bg-violet-50', border: 'border-violet-200' },
];

const TYPES = [
  { id: 'email_cold',     label: 'Cold Outreach',   icon: '📧', desc: 'Kenalkan percetakan ke calon klien baru' },
  { id: 'email_followup', label: 'Follow-up',       icon: '🔄', desc: 'Setelah demo atau pertemuan pertama' },
  { id: 'proposal_full',  label: 'Proposal Lengkap',icon: '📋', desc: 'Dokumen proposal formal multi-section' },
  { id: 'email_reorder',  label: 'Reorder',         icon: '🔁', desc: 'Tawarkan repeat order ke klien lama' },
];

const PRODUCTS = ['Box Karton / Corrugated', 'Rigid Box Mewah', 'Paperbag Custom', 'Sleeve & Label', 'Semua Produk Kemasan'];

const SYSTEM_PROMPT = `Kamu adalah copywriter profesional spesialis B2B untuk percetakan kemasan di Indonesia. Tugasmu membuat email dan proposal penawaran yang persuasif, personal, dan efektif.

Buat konten dalam format JSON berikut (HANYA JSON, tanpa teks lain):
{
  "subject": "Subject email yang menarik (untuk email)",
  "preview_text": "Preview text 90 karakter (untuk email)",
  "content": "Isi lengkap email/proposal dalam format teks dengan markdown sederhana. Gunakan \\n untuk baris baru.",
  "cta_utama": "Call-to-action utama yang spesifik",
  "cta_whatsapp": "Teks pesan WA yang sudah diformat untuk dikirim",
  "tips": ["tip 1 untuk meningkatkan respons rate", "tip 2", "tip 3"],
  "estimasi_respons_rate": "persentase estimasi respons rate dengan penjelasan singkat"
}

Panduan penulisan:
- Bahasa Indonesia yang natural, tidak kaku
- Personalisasi menggunakan nama klien dan nama bisnis mereka
- Tonjolkan value proposition yang relevan untuk industri klien
- Hindari kata generik — gunakan bukti konkret
- Proposal lengkap: sertakan executive summary, spesifikasi, harga, timeline, why us, next steps
- Email cold: maksimal 180 kata, langsung ke nilai
- Selalu akhiri dengan CTA yang jelas dan mudah dilakukan`;

function renderContent(text) {
  if (!text) return null;
  return text.split('\n').map((line, i) => {
    if (!line.trim()) return <div key={i} className="h-2" />;
    const bold = line.replace(/\*\*(.+?)\*\*/g, (_, m) => `<b>${m}</b>`);
    if (line.startsWith('# '))  return <p key={i} className="text-sm font-bold text-zinc-900 mt-3 mb-1" dangerouslySetInnerHTML={{ __html: line.slice(2) }} />;
    if (line.startsWith('## ')) return <p key={i} className="text-xs font-semibold text-blue-600 mt-2 mb-0.5" dangerouslySetInnerHTML={{ __html: line.slice(3) }} />;
    if (line.startsWith('- '))  return (
      <div key={i} className="flex gap-2 text-xs text-zinc-600 leading-relaxed mb-1">
        <span className="text-zinc-400 shrink-0">•</span>
        <span dangerouslySetInnerHTML={{ __html: bold.slice(2) }} />
      </div>
    );
    return <p key={i} className="text-xs text-zinc-600 leading-relaxed mb-1" dangerouslySetInnerHTML={{ __html: bold }} />;
  });
}

export default function EmailProposalGenerator() {
  const [type, setType]   = useState('email_cold');
  const [tone, setTone]   = useState('profesional');
  const [form, setForm]   = useState({
    nama_klien: '', bisnis_klien: '', industri_klien: '',
    produk: PRODUCTS[0], qty: '', budget: '',
    nama_percetakan: '', kota: '',
    keunggulan: '',
    catatan_tambahan: '',
  });
  const [loading, setLoading] = useState(false);
  const [result, setResult]   = useState(null);
  const [error, setError]     = useState('');
  const [copied, setCopied]   = useState(false);
  const [stepMsg, setStepMsg] = useState('');

  const STEPS = ['Menghubungi Groq...', 'Menganalisis profil klien...', 'Menyusun narasi...', 'Mengoptimasi CTA...', 'Finalisasi konten...'];

  function set(k, v) { setForm(f => ({ ...f, [k]: v })); }

  async function generate() {
    if (!form.nama_klien || !form.bisnis_klien) { setError('Nama klien dan nama bisnis wajib diisi.'); return; }
    setLoading(true); setResult(null); setError(''); setStepMsg(STEPS[0]);

    let si = 0;
    const iv = setInterval(() => { si = Math.min(si + 1, STEPS.length - 1); setStepMsg(STEPS[si]); }, 800);

    const typeLabels = {
      email_cold:     'Email Cold Outreach',
      email_followup: 'Email Follow-up Quotation',
      proposal_full:  'Proposal Penawaran Lengkap (multi-section, detail)',
      email_reorder:  'Email Penawaran Repeat Order',
    };
    const toneLabels = { profesional: 'formal dan profesional', hangat: 'hangat, ramah, dan personal', persuasif: 'persuasif dan berorientasi closing' };

    const userPrompt = `Buat ${typeLabels[type]} dengan tone ${toneLabels[tone]}.

Data klien:
- Nama: ${form.nama_klien}
- Bisnis: ${form.bisnis_klien}
- Industri: ${form.industri_klien || 'umum'}

Data penawaran:
- Percetakan: ${form.nama_percetakan || 'Percetakan'} (${form.kota || 'Indonesia'})
- Produk: ${form.produk}
- Qty: ${form.qty || 'fleksibel'}
- Budget klien: ${form.budget || 'belum diketahui'}
- Keunggulan percetakan: ${form.keunggulan || '-'}
- Catatan tambahan: ${form.catatan_tambahan || '-'}

${type === 'proposal_full' ? 'Untuk proposal lengkap, sertakan: cover opener, executive summary, profil perusahaan singkat, spesifikasi produk yang ditawarkan, estimasi harga (gunakan range harga pasar), timeline produksi, keunggulan kompetitif, testimonial placeholder, next steps yang jelas.' : ''}`;

    try {
      const key = import.meta.env.VITE_GROQ_API_KEY;
      if (!key) throw new Error('VITE_GROQ_API_KEY tidak ditemukan di file .env');
      const groq = new Groq({ apiKey: key, dangerouslyAllowBrowser: true });
      const completion = await groq.chat.completions.create({
        model: GROQ_MODEL,
        temperature: 0.65,
        max_tokens: type === 'proposal_full' ? 2000 : 1000,
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user',   content: userPrompt },
        ],
      });
      clearInterval(iv);
      const raw = completion.choices[0].message.content.trim().replace(/```json|```/g, '').trim();
      const match = raw.match(/\{[\s\S]*\}/);
      if (!match) throw new Error('Format respons AI tidak valid');
      setResult(JSON.parse(match[0]));
    } catch (e) {
      clearInterval(iv);
      const msg = e?.message ?? String(e);
      if (e?.status === 429 || msg.includes('429')) setError('Batas request tercapai. Tunggu 1 menit lalu coba lagi.');
      else setError(msg);
    }
    setLoading(false);
  }

  function copyText() {
    if (!result?.content) return;
    navigator.clipboard.writeText(result.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  const curType = TYPES.find(t => t.id === type);
  const curTone = TONES.find(t => t.id === tone);

  return (
    <div className="space-y-4">
      {/* Page header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-violet-600 rounded-xl flex items-center justify-center shrink-0">
          <Mail size={18} className="text-white" />
        </div>
        <div>
          <h1 className="text-base font-black text-zinc-900 tracking-tight">Generator Email & Proposal</h1>
          <p className="text-[11px] text-zinc-400">Generate email & proposal klien dalam hitungan detik</p>
        </div>
        <span className="ml-auto text-[10px] font-bold text-violet-600 bg-violet-50 border border-violet-200 px-2.5 py-1 rounded-full">
          AI Copywriter
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_440px] xl:grid-cols-[1fr_480px] gap-4 items-start">

        {/* LEFT — Form */}
        <div className="space-y-4">

          {/* Jenis dokumen */}
          <div className="card">
            <div className="card-header"><span className="section-title">Jenis Dokumen</span></div>
            <div className="p-4 grid grid-cols-2 gap-2">
              {TYPES.map(t => (
                <button key={t.id} onClick={() => setType(t.id)}
                  className={`text-left rounded-xl border p-3 transition-all ${type === t.id ? 'bg-violet-50 border-violet-300' : 'bg-zinc-50 border-zinc-200 hover:border-zinc-300'}`}>
                  <div className="text-xl mb-1.5">{t.icon}</div>
                  <p className={`text-xs font-bold leading-tight mb-0.5 ${type === t.id ? 'text-violet-700' : 'text-zinc-800'}`}>{t.label}</p>
                  <p className="text-[10px] text-zinc-400 leading-snug">{t.desc}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Tone */}
          <div className="card">
            <div className="card-header"><span className="section-title">Tone Penulisan</span></div>
            <div className="p-4 flex gap-2 flex-wrap">
              {TONES.map(t => (
                <button key={t.id} onClick={() => setTone(t.id)}
                  className={`flex-1 min-w-[120px] rounded-xl border p-3 text-left transition-all ${tone === t.id ? `${t.bg} ${t.border}` : 'bg-zinc-50 border-zinc-200 hover:border-zinc-300'}`}>
                  <p className={`text-xs font-bold ${tone === t.id ? t.color : 'text-zinc-700'}`}>{t.label}</p>
                  <p className="text-[10px] text-zinc-400 mt-0.5">{t.desc}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Data klien */}
          <div className="card">
            <div className="card-header"><span className="section-title">Data Klien</span></div>
            <div className="p-4 space-y-3">
              <div>
                <label className="label">Nama Klien *</label>
                <input value={form.nama_klien} onChange={e => set('nama_klien', e.target.value)} placeholder="Contoh: Budi Santoso" className="input-field" />
              </div>
              <div>
                <label className="label">Nama Bisnis Klien *</label>
                <input value={form.bisnis_klien} onChange={e => set('bisnis_klien', e.target.value)} placeholder="Contoh: Glowby Skincare" className="input-field" />
              </div>
              <div>
                <div className="flex justify-between mb-1">
                  <label className="label mb-0">Industri Klien</label>
                  <span className="text-[10px] text-zinc-400">opsional</span>
                </div>
                <input value={form.industri_klien} onChange={e => set('industri_klien', e.target.value)} placeholder="Contoh: kosmetik, kuliner, fashion..." className="input-field" />
              </div>
            </div>
          </div>

          {/* Detail penawaran */}
          <div className="card">
            <div className="card-header"><span className="section-title">Detail Penawaran</span></div>
            <div className="p-4 space-y-3">
              <div>
                <label className="label">Produk Kemasan</label>
                <select value={form.produk} onChange={e => set('produk', e.target.value)} className="input-field">
                  {PRODUCTS.map(p => <option key={p}>{p}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <div className="flex justify-between mb-1"><label className="label mb-0">Qty</label><span className="text-[10px] text-zinc-400">opsional</span></div>
                  <input value={form.qty} onChange={e => set('qty', e.target.value)} placeholder="500 pcs" className="input-field" />
                </div>
                <div>
                  <div className="flex justify-between mb-1"><label className="label mb-0">Budget Klien</label><span className="text-[10px] text-zinc-400">opsional</span></div>
                  <input value={form.budget} onChange={e => set('budget', e.target.value)} placeholder="5 juta" className="input-field" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">Nama Percetakan</label>
                  <input value={form.nama_percetakan} onChange={e => set('nama_percetakan', e.target.value)} placeholder="Nama percetakan" className="input-field" />
                </div>
                <div>
                  <label className="label">Kota</label>
                  <input value={form.kota} onChange={e => set('kota', e.target.value)} placeholder="Bandung" className="input-field" />
                </div>
              </div>
              <div>
                <label className="label">Keunggulan Percetakan</label>
                <textarea value={form.keunggulan} onChange={e => set('keunggulan', e.target.value)} rows={2} placeholder="Contoh: 9 tahun pengalaman, MOQ 50 pcs, free desain..." className="input-field resize-none" />
              </div>
              <div>
                <div className="flex justify-between mb-1"><label className="label mb-0">Catatan Tambahan</label><span className="text-[10px] text-zinc-400">opsional</span></div>
                <textarea value={form.catatan_tambahan} onChange={e => set('catatan_tambahan', e.target.value)} rows={2} placeholder="Contoh: klien sudah pernah meeting, tertarik rigid box..." className="input-field resize-none" />
              </div>
            </div>
          </div>

          {error && (
            <div className="rounded-xl bg-red-50 border border-red-200 p-3 text-xs text-red-700">
              ⚠️ {error}
            </div>
          )}

          <button onClick={generate} disabled={loading}
            className="w-full btn-primary flex items-center justify-center gap-2 py-3">
            {loading
              ? <><RefreshCw size={14} className="animate-spin" /><span className="animate-pulse">{stepMsg}</span></>
              : <><Zap size={14} /> Generate {curType?.label}</>}
          </button>
        </div>

        {/* RIGHT — Result */}
        <div className="lg:sticky lg:top-20 h-fit space-y-3">
          {!result && !loading && (
            <div className="card p-8 text-center">
              <div className="text-4xl mb-3">✍️</div>
              <p className="text-sm text-zinc-400 leading-relaxed mb-4">Isi form dan klik Generate untuk membuat konten</p>
              <div className="space-y-2 text-left">
                {TYPES.map(t => (
                  <div key={t.id} className="flex items-center gap-2.5 p-2.5 bg-zinc-50 rounded-lg">
                    <span className="text-base">{t.icon}</span>
                    <div>
                      <p className="text-xs font-semibold text-zinc-700">{t.label}</p>
                      <p className="text-[10px] text-zinc-400">{t.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {loading && (
            <div className="card p-10 text-center">
              <div className="w-10 h-10 border-2 border-zinc-200 border-t-zinc-900 rounded-full animate-spin mx-auto mb-4" />
              <p className="text-sm font-semibold text-zinc-700 animate-pulse">{stepMsg}</p>
              <p className="text-xs text-zinc-400 mt-1">Groq AI sedang menulis untuk Anda...</p>
            </div>
          )}

          <AnimatePresence>
            {result && (
              <motion.div key="result" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-3">

                {/* Meta */}
                <div className="card">
                  <div className="card-header">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
                      <span className="text-[10px] font-bold text-emerald-600">Konten siap</span>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${curTone?.bg} ${curTone?.border} ${curTone?.color}`}>{curTone?.label}</span>
                    </div>
                  </div>
                  {result.subject && (
                    <div className="px-5 py-3 border-b border-zinc-100">
                      <p className="section-title mb-1">Subject Email</p>
                      <p className="text-sm font-semibold text-zinc-900">{result.subject}</p>
                    </div>
                  )}
                  {result.preview_text && (
                    <div className="px-5 py-3">
                      <p className="section-title mb-1">Preview Text</p>
                      <p className="text-xs text-zinc-500 italic">{result.preview_text}</p>
                    </div>
                  )}
                </div>

                {/* Content */}
                <div className="card">
                  <div className="card-header">
                    <span className="section-title">Isi Konten</span>
                    <button onClick={copyText}
                      className={`flex items-center gap-1.5 text-[11px] font-semibold px-3 py-1.5 rounded-lg border transition-all ${copied ? 'bg-emerald-50 border-emerald-200 text-emerald-600' : 'bg-zinc-50 border-zinc-200 text-zinc-500 hover:text-zinc-700'}`}>
                      {copied ? <><Check size={11} /> Tersalin</> : <><Copy size={11} /> Salin</>}
                    </button>
                  </div>
                  <div className="p-5 max-h-72 overflow-y-auto">
                    {renderContent(result.content)}
                  </div>
                </div>

                {/* CTA */}
                {result.cta_utama && (
                  <div className="card p-4 bg-blue-50 border-blue-200">
                    <p className="section-title text-blue-500 mb-1.5">Call-to-Action Utama</p>
                    <p className="text-xs font-semibold text-blue-700">{result.cta_utama}</p>
                  </div>
                )}

                {/* Tips */}
                {result.tips?.length > 0 && (
                  <div className="card p-4 bg-emerald-50 border-emerald-200">
                    <p className="section-title text-emerald-600 mb-2">💡 Tips Respons Rate</p>
                    <div className="space-y-1.5">
                      {result.tips.map((t, i) => (
                        <div key={i} className="flex gap-2 text-xs text-emerald-800">
                          <span className="font-bold shrink-0">{i + 1}.</span>
                          <span>{t}</span>
                        </div>
                      ))}
                    </div>
                    {result.estimasi_respons_rate && (
                      <p className="text-[10px] text-emerald-600 mt-2 pt-2 border-t border-emerald-200">
                        📊 Est. respons rate: <span className="font-bold">{result.estimasi_respons_rate}</span>
                      </p>
                    )}
                  </div>
                )}

                {/* Actions */}
                <div className="grid grid-cols-2 gap-2">
                  <a href={`https://wa.me/?text=${encodeURIComponent(result.cta_whatsapp || '')}`}
                    target="_blank" rel="noreferrer"
                    className="flex items-center justify-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold px-4 py-2.5 rounded-xl transition-colors">
                    <MessageCircle size={13} /> Kirim via WA
                  </a>
                  <button onClick={generate} className="btn-ghost flex items-center justify-center gap-2 text-xs">
                    <RefreshCw size={13} /> Generate Ulang
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
