// Shared master data utilities — localStorage CRUD + defaults

export const STORAGE = {
  kertas:         'naikcetak_master_kertas',
  finishing:      'naikcetak_master_finishing',
  mesin:          'naikcetak_master_mesin',
  riwayatPotong:  'naikcetak_riwayat_potong',
  riwayatCetak:   'naikcetak_riwayat_cetak',
};

export function genId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 5);
}

function load(key, defaults) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : defaults;
  } catch { return defaults; }
}
function persist(key, data) { localStorage.setItem(key, JSON.stringify(data)); }

// ── Default seeds ─────────────────────────────────────────────────────────────

const DEFAULT_KERTAS = [
  { id: 'k1', nama: 'Duplex',        gsm: 300, p: 79, l: 109, hargaRim: 2500000 },
  { id: 'k2', nama: 'Art Paper',     gsm: 150, p: 65, l: 100, hargaRim: 750000  },
  { id: 'k3', nama: 'Art Karton',    gsm: 300, p: 65, l: 100, hargaRim: 1433250 },
  { id: 'k4', nama: 'Ivory',         gsm: 300, p: 79, l: 109, hargaRim: 1937475 },
  { id: 'k5', nama: 'HVS',           gsm: 80,  p: 65, l: 100, hargaRim: 450000  },
  { id: 'k6', nama: 'Samson Kraft',  gsm: 70,  p: 65, l: 100, hargaRim: 500000  },
  { id: 'k7', nama: 'Ivory 230',     gsm: 230, p: 65, l: 100, hargaRim: 1500000 },
];

const DEFAULT_FINISHING = [
  { id: 'f1', nama: 'Laminating Doff',   jenis: 'per_cm2',        harga: 0.20, min: 0,      hargaTambah: 0  },
  { id: 'f2', nama: 'Laminating Glossy', jenis: 'per_cm2',        harga: 0.18, min: 0,      hargaTambah: 0  },
  { id: 'f3', nama: 'Pond',              jenis: 'minimum_charge', harga: 40,   min: 70000,  hargaTambah: 40 },
  { id: 'f4', nama: 'UV Spot',           jenis: 'per_cm2',        harga: 0.35, min: 150000, hargaTambah: 0  },
  { id: 'f5', nama: 'Hot Stamp',         jenis: 'per_cm2',        harga: 0.45, min: 200000, hargaTambah: 0  },
  { id: 'f6', nama: 'Emboss',            jenis: 'minimum_charge', harga: 60,   min: 100000, hargaTambah: 60 },
  { id: 'f7', nama: 'Varnish',           jenis: 'per_lembar',     harga: 150,  min: 0,      hargaTambah: 0  },
];

const DEFAULT_MESIN = [
  { id: 'm1', nama: 'SM52',       minLembar: 1000, hargaPer1000: 85000,  hargaWarnaKhusus: 50000, hargaPlat: 55000, hargaTambahan: 85  },
  { id: 'm2', nama: 'GTO',        minLembar: 500,  hargaPer1000: 65000,  hargaWarnaKhusus: 40000, hargaPlat: 45000, hargaTambahan: 65  },
  { id: 'm3', nama: 'Digital A3', minLembar: 1,    hargaPer1000: 150000, hargaWarnaKhusus: 0,     hargaPlat: 0,     hargaTambahan: 150 },
  { id: 'm4', nama: 'Risograph',  minLembar: 100,  hargaPer1000: 45000,  hargaWarnaKhusus: 30000, hargaPlat: 20000, hargaTambahan: 45  },
];

// ── CRUD ──────────────────────────────────────────────────────────────────────

export function loadKertas()          { return load(STORAGE.kertas,    DEFAULT_KERTAS);    }
export function saveKertas(d)         { persist(STORAGE.kertas, d);                        }
export function loadFinishing()       { return load(STORAGE.finishing, DEFAULT_FINISHING); }
export function saveFinishing(d)      { persist(STORAGE.finishing, d);                     }
export function loadMesin()           { return load(STORAGE.mesin,     DEFAULT_MESIN);     }
export function saveMesin(d)          { persist(STORAGE.mesin, d);                         }

export function loadRiwayatPotong()   { return load(STORAGE.riwayatPotong, []);            }
export function saveRiwayatPotong(d)  { persist(STORAGE.riwayatPotong, d.slice(-100));     }
export function loadRiwayatCetak()    { return load(STORAGE.riwayatCetak,  []);            }
export function saveRiwayatCetak(d)   { persist(STORAGE.riwayatCetak,  d.slice(-100));     }

// ── Utilities ─────────────────────────────────────────────────────────────────

export const hargaPerLembar = (hargaRim) => hargaRim / 500;

export const formatRp = (n) =>
  'Rp\u00A0' + Number(n ?? 0).toLocaleString('id-ID', { maximumFractionDigits: 0 });

export const pct = (n) => Number(n ?? 0).toFixed(1) + '%';

// Paper cutting calculation engine
export function calculateCuts(paperW, paperH, cutW, cutH, mode = 'greedy') {
  if (!paperW || !paperH || !cutW || !cutH) return null;

  const colsN = Math.floor(paperW / cutW);
  const rowsN = Math.floor(paperH / cutH);
  const countN = colsN * rowsN;

  const colsR = Math.floor(paperW / cutH);
  const rowsR = Math.floor(paperH / cutW);
  const countR = colsR * rowsR;

  let best = countR > countN
    ? { cols: colsR, rows: rowsR, count: countR, rotated: true, type: 'simple', strategy: 'Rotasi 90°' }
    : { cols: colsN, rows: rowsN, count: countN, rotated: false, type: 'simple', strategy: 'Grid Normal' };

  if (mode === 'brute') {
    const minStep = Math.min(cutW, cutH, 1);

    // Vertical strip splits
    for (let x = minStep; x < paperW - minStep; x += minStep) {
      // left normal + right rotated
      const a = Math.floor(x / cutW) * Math.floor(paperH / cutH) +
                Math.floor((paperW - x) / cutH) * Math.floor(paperH / cutW);
      if (a > best.count) {
        best = {
          count: a, type: 'vsplit', strategy: 'Mixed',
          left:  { x: 0, w: x,         cols: Math.floor(x / cutW),         rows: Math.floor(paperH / cutH), rotated: false },
          right: { x,    w: paperW - x, cols: Math.floor((paperW-x) / cutH), rows: Math.floor(paperH / cutW), rotated: true  },
        };
      }
      // left rotated + right normal
      const b = Math.floor(x / cutH) * Math.floor(paperH / cutW) +
                Math.floor((paperW - x) / cutW) * Math.floor(paperH / cutH);
      if (b > best.count) {
        best = {
          count: b, type: 'vsplit', strategy: 'Mixed',
          left:  { x: 0, w: x,         cols: Math.floor(x / cutH),         rows: Math.floor(paperH / cutW), rotated: true  },
          right: { x,    w: paperW - x, cols: Math.floor((paperW-x) / cutW), rows: Math.floor(paperH / cutH), rotated: false },
        };
      }
    }

    // Horizontal strip splits
    for (let y = minStep; y < paperH - minStep; y += minStep) {
      const c = Math.floor(paperW / cutW) * Math.floor(y / cutH) +
                Math.floor(paperW / cutH) * Math.floor((paperH - y) / cutW);
      if (c > best.count) {
        best = {
          count: c, type: 'hsplit', strategy: 'Mixed',
          top: { y: 0, h: y,         cols: Math.floor(paperW / cutW), rows: Math.floor(y / cutH),         rotated: false },
          bot: { y,    h: paperH - y, cols: Math.floor(paperW / cutH), rows: Math.floor((paperH-y) / cutW), rotated: true  },
        };
      }
      const d = Math.floor(paperW / cutH) * Math.floor(y / cutW) +
                Math.floor(paperW / cutW) * Math.floor((paperH - y) / cutH);
      if (d > best.count) {
        best = {
          count: d, type: 'hsplit', strategy: 'Mixed',
          top: { y: 0, h: y,         cols: Math.floor(paperW / cutH), rows: Math.floor(y / cutW),         rotated: true  },
          bot: { y,    h: paperH - y, cols: Math.floor(paperW / cutW), rows: Math.floor((paperH-y) / cutH), rotated: false },
        };
      }
    }
  }

  // Build SVG piece list
  const pieces = [];
  let num = 1;

  function addZone(ox, oy, cols, rows, rotated) {
    const [pw, ph] = rotated ? [cutH, cutW] : [cutW, cutH];
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        pieces.push({ x: ox + c * pw, y: oy + r * ph, w: pw, h: ph, num: num++ });
      }
    }
  }

  if (best.type === 'vsplit') {
    addZone(best.left.x,  0, best.left.cols,  best.left.rows,  best.left.rotated);
    addZone(best.right.x, 0, best.right.cols, best.right.rows, best.right.rotated);
  } else if (best.type === 'hsplit') {
    addZone(0, best.top.y, best.top.cols, best.top.rows, best.top.rotated);
    addZone(0, best.bot.y, best.bot.cols, best.bot.rows, best.bot.rotated);
  } else {
    addZone(0, 0, best.cols, best.rows, best.rotated);
  }

  const luasKertas = paperW * paperH;
  const luasTerpakai = cutW * cutH * best.count;
  const efisiensi = luasKertas > 0 ? (luasTerpakai / luasKertas) * 100 : 0;

  return {
    potonganPerLembar: best.count,
    strategy: best.strategy,
    efisiensi,
    pieces,
    best,
  };
}

// Finishing cost calculator
export function calcFinishing(item, { lebarPotong, tinggiPotong, jumlah, potonganPerLembar }) {
  const { jenis, harga, min, hargaTambah } = item;
  let total = 0;
  let rumus = '';
  const lbr = Math.ceil(jumlah / (potonganPerLembar || 1));

  if (jenis === 'per_cm2') {
    const raw = lebarPotong * tinggiPotong * harga * jumlah;
    total = min > 0 ? Math.max(min, raw) : raw;
    rumus = `${lebarPotong}×${tinggiPotong}×${harga}×${jumlah} = ${formatRp(total)}`;
  } else if (jenis === 'per_lembar') {
    total = lbr * harga;
    rumus = `${lbr} lbr × ${formatRp(harga)} = ${formatRp(total)}`;
  } else if (jenis === 'minimum_charge') {
    total = Math.max(min, lbr * hargaTambah) + min;
    if (lbr * hargaTambah < min) total = min;
    else total = min + lbr * hargaTambah;
    rumus = `Min ${formatRp(min)} + (${lbr}×${formatRp(hargaTambah)}) = ${formatRp(total)}`;
  } else {
    total = harga;
    rumus = formatRp(total);
  }
  return { total, rumus };
}
