import Groq from 'groq-sdk';

const MODEL = 'llama-3.3-70b-versatile';
const VISION_MODEL = 'meta-llama/llama-4-scout-17b-16e-instruct';

function getClient() {
  const key = import.meta.env.VITE_GROQ_API_KEY;
  if (!key) throw new Error('VITE_GROQ_API_KEY tidak ditemukan di file .env');
  return new Groq({
    apiKey: key,
    dangerouslyAllowBrowser: true,
  });
}

function extractJSON(text) {
  const match = text.match(/\{[\s\S]*\}/);
  if (!match) throw new Error('Format respons AI tidak valid');
  return JSON.parse(match[0]);
}

function handleAPIError(err) {
  const msg = err?.message ?? String(err);
  if (err?.status === 429 || msg.includes('429') || msg.includes('rate_limit')) {
    throw new Error('Batas request tercapai. Tunggu 1 menit lalu coba lagi.');
  }
  if (err?.status === 401 || msg.includes('401') || msg.includes('api_key')) {
    throw new Error('API key tidak valid. Periksa VITE_GROQ_API_KEY di file .env');
  }
  throw new Error(`Error AI: ${msg}`);
}

/**
 * Ask AI to suggest technical specs for the box.
 */
export async function suggestTechSpecs({ productName, length, width, height, gsm }) {
  const client = getClient();

  const prompt = `Anda adalah konsultan teknis percetakan kemasan offset di Indonesia dengan pengalaman 20 tahun.
Berikan rekomendasi spesifikasi teknis produksi untuk:

Produk: ${productName}
Dimensi box: P=${length}cm × L=${width}cm × T=${height}cm
GSM target: ${gsm || 'auto'}

Kembalikan HANYA JSON valid (tanpa markdown, tanpa teks lain):
{
  "material": "nama material (Ivory 260gsm / Duplex 400gsm / Corrugated B-flute / dll)",
  "materialReason": "alasan teknis singkat 1 kalimat",
  "planoSize": "misal: 109x79",
  "planoLength": angka_cm,
  "planoWidth": angka_cm,
  "flatLength": angka_cm,
  "flatWidth": angka_cm,
  "estimatedPaperPrice": harga_per_lembar_rupiah,
  "estimatedPlatePrice": total_biaya_plate_rupiah,
  "estimatedFinishingPrice": biaya_per_pcs_rupiah,
  "colorCount": jumlah_warna,
  "notes": "catatan teknis 1 kalimat"
}

Standar Indonesia: plano 109×79cm atau 100×65cm. Bentangan = semua panel + flap (1.5–2.5× dimensi terbesar). Harga kertas Rp 1.200–3.500/lbr. Plate Rp 150.000–350.000/warna. Finishing Rp 150–800/pcs.`;

  try {
    const completion = await client.chat.completions.create({
      model: MODEL,
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 1024,
      temperature: 0.3,
    });
    return extractJSON(completion.choices[0].message.content);
  } catch (err) {
    handleAPIError(err);
  }
}

/**
 * Analisa foto kemasan via vision model. Mengembalikan JSON dengan
 * skema sama seperti AI Brief Analyzer (klien, kebutuhan, timeline,
 * quotation, rekomendasi_ai, status_brief, pertanyaan_klarifikasi).
 *
 * @param {object} args
 * @param {string} args.imageDataUrl  Data URL gambar (data:image/...;base64,...)
 * @param {string} [args.caption]     Catatan tambahan dari user (qty, deadline, dll)
 */
export async function analyzeBriefImage({ imageDataUrl, caption = '' }) {
  const client = getClient();

  const systemInstr = `Kamu konsultan kemasan percetakan profesional di Indonesia. Analisa FOTO kemasan yang dikirim user dan generate quotation lengkap untuk klien.

Dari foto, identifikasi:
- Jenis kemasan (rigid box, paperbag, sleeve, mailer box, dus lipat, pouch, dll)
- Estimasi dimensi (PxLxT cm) berdasarkan proporsi & objek referensi yang terlihat
- Material (Ivory, Duplex, Art Carton, Kraft, Corrugated, dll) + GSM perkiraan
- Finishing terlihat (laminasi doff/glossy, hot stamping, emboss, deboss, spot UV, varnish, die-cut, dll)
- Warna cetak (full color CMYK / spot color / monochrome)
- Industri / kategori produk berdasarkan visual

Output HANYA JSON valid (tanpa markdown, tanpa teks lain) dengan skema:
{
  "klien": { "nama_bisnis": "—", "industri": "...", "kontak_person": "—" },
  "kebutuhan": {
    "jenis_kemasan": "...",
    "deskripsi": "deskripsi visual kemasan dari foto",
    "ukuran_estimasi": "P x L x T cm (dengan catatan estimasi)",
    "qty": angka_default_500,
    "bahan_rekomendasi": "...",
    "finishing": ["...", "..."],
    "warna_cetak": "..."
  },
  "timeline": {
    "deadline_klien": "—",
    "estimasi_produksi": "10-14 hari kerja",
    "status_urgency": "normal"
  },
  "quotation": {
    "harga_satuan_min": angka,
    "harga_satuan_max": angka,
    "total_min": angka,
    "total_max": angka,
    "dp_50pct": angka,
    "catatan_harga": "harga estimasi berdasarkan analisa visual, final price setelah konfirmasi spec"
  },
  "rekomendasi_ai": {
    "saran_utama": "...",
    "upsell": "...",
    "resiko": "estimasi dimensi dari foto bisa meleset, perlu konfirmasi ukuran sebenarnya"
  },
  "status_brief": "perlu_klarifikasi",
  "pertanyaan_klarifikasi": [
    "Berapa qty pasti yang dibutuhkan?",
    "Apakah dimensi sesuai estimasi atau ada ukuran spesifik?",
    "Kapan deadline produksi?",
    "Apakah ada referensi warna brand atau pantone tertentu?"
  ]
}

Referensi harga pasar Indonesia 2024:
- Rigid box premium: Rp 15.000–45.000/pcs
- Box karton custom: Rp 2.500–8.000/pcs
- Paperbag art paper: Rp 3.500–9.000/pcs
- Sleeve karton: Rp 2.000–6.000/pcs
- Mailer box: Rp 4.000–12.000/pcs
- Pouch: Rp 1.500–5.000/pcs
Total = harga_satuan * qty. DP 50% dari total_min.

Jika user memberi caption tambahan (qty, deadline, info bisnis), masukkan ke field terkait.`;

  const userText = caption.trim()
    ? `Caption tambahan dari user: "${caption.trim()}"\n\nAnalisa foto kemasan ini sesuai instruksi system.`
    : 'Analisa foto kemasan ini sesuai instruksi system.';

  try {
    const completion = await client.chat.completions.create({
      model: VISION_MODEL,
      max_tokens: 1500,
      temperature: 0.3,
      messages: [
        { role: 'system', content: systemInstr },
        {
          role: 'user',
          content: [
            { type: 'text', text: userText },
            { type: 'image_url', image_url: { url: imageDataUrl } },
          ],
        },
      ],
    });
    return extractJSON(completion.choices[0].message.content);
  } catch (err) {
    handleAPIError(err);
  }
}

/**
 * Generate a business audit and WhatsApp quotation draft.
 */
export async function generateBusinessAudit({ productName, qty, hpp, margin, sellingPrice, totalCost, bep, roi }) {
  const client = getClient();

  const prompt = `Anda adalah konsultan bisnis percetakan kemasan premium di Indonesia.
Lakukan audit bisnis untuk job order berikut:

Produk: ${productName || 'Kemasan Box'}
Quantity: ${Number(qty).toLocaleString('id-ID')} pcs
HPP per unit: Rp ${Math.round(hpp).toLocaleString('id-ID')}
Margin: ${margin}%
Harga Jual: Rp ${Math.round(sellingPrice).toLocaleString('id-ID')}
Total Biaya Produksi: Rp ${Math.round(totalCost).toLocaleString('id-ID')}
BEP: ${bep?.toLocaleString('id-ID') || 'N/A'} pcs
ROI: ${roi}%

Kembalikan HANYA JSON valid (tanpa markdown, tanpa teks lain):
{
  "printMethod": "Digital" atau "Offset",
  "printMethodReason": "alasan teknis dan ekonomis dalam 2 kalimat bahasa Indonesia",
  "profitabilityRating": "Sangat Baik" atau "Baik" atau "Cukup" atau "Perlu Evaluasi",
  "profitabilityNote": "analisis singkat 2 kalimat",
  "risks": ["risiko 1", "risiko 2"],
  "opportunities": ["peluang 1", "peluang 2"],
  "whatsappQuote": "Draft WA profesional Bahasa Indonesia. Kemasan adalah investasi brand identity. Sertakan nama produk, qty, harga jual, keunggulan material, CTA. Emoji minimal. Maksimal 180 kata."
}`;

  try {
    const completion = await client.chat.completions.create({
      model: MODEL,
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 1024,
      temperature: 0.3,
    });
    return extractJSON(completion.choices[0].message.content);
  } catch (err) {
    handleAPIError(err);
  }
}
