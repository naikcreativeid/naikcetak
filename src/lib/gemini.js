import Groq from 'groq-sdk';

const MODEL = 'llama-3.3-70b-versatile';

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
