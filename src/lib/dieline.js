// ============================================================
// Dieline SVG generator berdasarkan jenis kemasan + dimensi.
// Template-based (bukan AI-generated) supaya akurat & konsisten.
// ============================================================

export function parseDimensions(text) {
  if (!text || typeof text !== 'string') return null;

  const cleaned = text.toLowerCase().replace(/cm|mm|inch|in|"/g, ' ');
  const matches = cleaned.match(/(\d+(?:[.,]\d+)?)/g);
  if (!matches || matches.length < 2) return null;

  const nums = matches.slice(0, 3).map(s => parseFloat(s.replace(',', '.')));

  if (text.toLowerCase().includes('mm')) {
    return {
      length: +(nums[0] / 10).toFixed(1),
      width:  +((nums[1] ?? nums[0]) / 10).toFixed(1),
      height: +((nums[2] ?? nums[1] ?? nums[0]) / 10).toFixed(1),
    };
  }

  return {
    length: nums[0],
    width:  nums[1] ?? nums[0],
    height: nums[2] ?? Math.max(nums[0], nums[1]) * 0.4,
  };
}

export function detectBoxType(jenis) {
  if (!jenis) return 'tuck_end';
  const j = jenis.toLowerCase();
  if (j.includes('rigid'))                                  return 'rigid_box';
  if (j.includes('sleeve'))                                 return 'sleeve';
  if (j.includes('paperbag') || j.includes('paper bag') || j.includes('shopping bag')) return 'paperbag';
  if (j.includes('mailer'))                                 return 'mailer';
  if (j.includes('pouch') || j.includes('sachet'))          return 'pouch';
  return 'tuck_end';
}

const PALETTE = {
  panel:    '#F8FAFC',
  stroke:   '#1F2937',
  fold:     '#94A3B8',
  glue:     '#FEF3C7',
  glueStroke:'#F59E0B',
  flap:     '#EFF6FF',
  flapStroke:'#3B82F6',
  label:    '#475569',
  dim:      '#64748B',
};

function svgWrap(width, height, body) {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="100%" preserveAspectRatio="xMidYMid meet" style="background:#fff;border-radius:12px">${body}</svg>`;
}

function rect({ x, y, w, h, fill = PALETTE.panel, stroke = PALETTE.stroke, sw = 1.5, dash = null, rx = 2 }) {
  const dashAttr = dash ? ` stroke-dasharray="${dash}"` : '';
  return `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${fill}" stroke="${stroke}" stroke-width="${sw}" rx="${rx}"${dashAttr} />`;
}

function text({ x, y, str, size = 11, anchor = 'middle', fill = PALETTE.label, weight = 600 }) {
  return `<text x="${x}" y="${y}" font-family="ui-sans-serif,system-ui,-apple-system,sans-serif" font-size="${size}" font-weight="${weight}" text-anchor="${anchor}" dominant-baseline="middle" fill="${fill}">${str}</text>`;
}

function dimLine({ x1, y1, x2, y2, label, side = 'top', fill = PALETTE.dim }) {
  const offset = 14;
  let lx, ly, anchor = 'middle';
  if (side === 'top')    { lx = (x1 + x2) / 2; ly = Math.min(y1, y2) - offset; }
  if (side === 'bottom') { lx = (x1 + x2) / 2; ly = Math.max(y1, y2) + offset; }
  if (side === 'left')   { lx = Math.min(x1, x2) - offset; ly = (y1 + y2) / 2; anchor = 'end'; }
  if (side === 'right')  { lx = Math.max(x1, x2) + offset; ly = (y1 + y2) / 2; anchor = 'start'; }
  return [
    `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${fill}" stroke-width="1" stroke-dasharray="3 3" />`,
    text({ x: lx, y: ly, str: label, size: 10, anchor, fill, weight: 600 }),
  ].join('');
}

// ── Tuck End Box ───────────────────────────────────────────────────
function tuckEndDieline({ length, width, height }) {
  const L = length, W = width, H = height;
  const flapTuck = Math.max(W * 0.6, 2);
  const flapDust = Math.max(W * 0.5, 1.5);
  const glue = 1.5;

  const totalCmW = L + W + L + W + glue;
  const totalCmH = flapDust + H + flapDust;

  const PADDING = 60;
  const scale = Math.min(640 / totalCmW, 320 / totalCmH);
  const px = (cm) => cm * scale;

  const w = totalCmW * scale + PADDING * 2;
  const h = totalCmH * scale + PADDING * 2 + 60;

  let x = PADDING;
  const y0 = PADDING + 30;
  const yTopDust = y0;
  const yBody   = y0 + px(flapDust);
  const yBotDust = y0 + px(flapDust + H);

  const parts = [];

  // Side panel 1 (L)
  parts.push(rect({ x, y: yBody, w: px(L), h: px(H) }));
  parts.push(text({ x: x + px(L)/2, y: yBody + px(H)/2, str: 'Side', size: 10 }));
  // Top dust flap on side panel
  parts.push(rect({ x, y: yTopDust, w: px(L), h: px(flapDust), fill: PALETTE.flap, stroke: PALETTE.flapStroke }));
  // Bottom dust flap on side panel
  parts.push(rect({ x, y: yBotDust, w: px(L), h: px(flapDust), fill: PALETTE.flap, stroke: PALETTE.flapStroke }));
  x += px(L);

  // Front panel (W)
  parts.push(rect({ x, y: yBody, w: px(W), h: px(H) }));
  parts.push(text({ x: x + px(W)/2, y: yBody + px(H)/2 - 6, str: 'Front', size: 11, weight: 700 }));
  parts.push(text({ x: x + px(W)/2, y: yBody + px(H)/2 + 8, str: 'Panel utama cetak', size: 9, fill: PALETTE.dim, weight: 500 }));
  // Top tuck flap
  parts.push(rect({ x, y: y0, w: px(W), h: px(flapDust), fill: PALETTE.glue, stroke: PALETTE.glueStroke }));
  parts.push(text({ x: x + px(W)/2, y: y0 + px(flapDust)/2, str: 'Tuck Atas', size: 10, fill: '#92400E' }));
  // Bottom tuck flap
  parts.push(rect({ x, y: yBotDust, w: px(W), h: px(flapDust), fill: PALETTE.glue, stroke: PALETTE.glueStroke }));
  parts.push(text({ x: x + px(W)/2, y: yBotDust + px(flapDust)/2, str: 'Tuck Bawah', size: 10, fill: '#92400E' }));
  x += px(W);

  // Side panel 2 (L)
  parts.push(rect({ x, y: yBody, w: px(L), h: px(H) }));
  parts.push(text({ x: x + px(L)/2, y: yBody + px(H)/2, str: 'Side', size: 10 }));
  parts.push(rect({ x, y: yTopDust, w: px(L), h: px(flapDust), fill: PALETTE.flap, stroke: PALETTE.flapStroke }));
  parts.push(rect({ x, y: yBotDust, w: px(L), h: px(flapDust), fill: PALETTE.flap, stroke: PALETTE.flapStroke }));
  x += px(L);

  // Back panel (W)
  parts.push(rect({ x, y: yBody, w: px(W), h: px(H) }));
  parts.push(text({ x: x + px(W)/2, y: yBody + px(H)/2, str: 'Back', size: 11, weight: 700 }));
  x += px(W);

  // Glue tab
  parts.push(rect({ x, y: yBody, w: px(glue), h: px(H), fill: PALETTE.glue, stroke: PALETTE.glueStroke, dash: '4 3' }));
  parts.push(text({ x: x + px(glue)/2, y: yBody + px(H)/2, str: 'Lem', size: 8, fill: '#92400E', weight: 700 }));

  // Dimension labels
  const totalW = px(L) + px(W) + px(L) + px(W) + px(glue);
  parts.push(dimLine({
    x1: PADDING, y1: y0 - 18, x2: PADDING + totalW, y2: y0 - 18,
    label: `Bentangan total: ${(L + W + L + W + glue).toFixed(1)} cm`, side: 'top',
  }));
  parts.push(dimLine({
    x1: PADDING - 8, y1: yBody, x2: PADDING - 8, y2: yBody + px(H),
    label: `T: ${H} cm`, side: 'left',
  }));

  // Panel widths under
  let cx = PADDING;
  [['L', L], ['P', W], ['L', L], ['P', W]].forEach(([lab, val]) => {
    parts.push(text({ x: cx + px(val)/2, y: yBotDust + px(flapDust) + 22, str: `${lab}: ${val} cm`, size: 9, fill: PALETTE.dim, weight: 600 }));
    cx += px(val);
  });

  // Title
  parts.push(text({ x: w / 2, y: 22, str: `Dieline Tuck-End Box · ${L} × ${W} × ${H} cm`, size: 13, weight: 700, fill: PALETTE.stroke }));

  return svgWrap(w, h, parts.join(''));
}

// ── Rigid Box (lid + base, separate panels) ────────────────────────
function rigidBoxDieline({ length, width, height }) {
  const L = length, W = width, H = height;
  const lidExtra = 0.5;
  const PADDING = 60;
  const totalCmW = (L + 2 * H) + 30 + (L + 2 * (H + lidExtra));
  const totalCmH = W + 2 * H;

  const scale = Math.min(720 / totalCmW, 280 / totalCmH);
  const px = (cm) => cm * scale;

  const w = totalCmW * scale + PADDING * 2;
  const h = totalCmH * scale + PADDING * 2 + 60;

  const parts = [];

  // Base: cross shape
  const baseX = PADDING;
  const baseY = PADDING + 30;
  // Top flap
  parts.push(rect({ x: baseX + px(H), y: baseY, w: px(L), h: px(H), fill: PALETTE.flap, stroke: PALETTE.flapStroke }));
  parts.push(text({ x: baseX + px(H + L/2), y: baseY + px(H)/2, str: 'Side', size: 9 }));
  // Left flap
  parts.push(rect({ x: baseX, y: baseY + px(H), w: px(H), h: px(W), fill: PALETTE.flap, stroke: PALETTE.flapStroke }));
  parts.push(text({ x: baseX + px(H)/2, y: baseY + px(H + W/2), str: 'Side', size: 9 }));
  // Bottom (main)
  parts.push(rect({ x: baseX + px(H), y: baseY + px(H), w: px(L), h: px(W) }));
  parts.push(text({ x: baseX + px(H + L/2), y: baseY + px(H + W/2) - 6, str: 'Base', size: 11, weight: 700 }));
  parts.push(text({ x: baseX + px(H + L/2), y: baseY + px(H + W/2) + 8, str: `${L} × ${W} cm`, size: 9, fill: PALETTE.dim, weight: 500 }));
  // Right flap
  parts.push(rect({ x: baseX + px(H + L), y: baseY + px(H), w: px(H), h: px(W), fill: PALETTE.flap, stroke: PALETTE.flapStroke }));
  parts.push(text({ x: baseX + px(H + L) + px(H)/2, y: baseY + px(H + W/2), str: 'Side', size: 9 }));
  // Bottom flap
  parts.push(rect({ x: baseX + px(H), y: baseY + px(H + W), w: px(L), h: px(H), fill: PALETTE.flap, stroke: PALETTE.flapStroke }));
  parts.push(text({ x: baseX + px(H + L/2), y: baseY + px(H + W) + px(H)/2, str: 'Side', size: 9 }));

  // Title for base
  parts.push(text({ x: baseX + px((2*H + L)/2), y: baseY - 14, str: 'BASE', size: 11, weight: 700, fill: PALETTE.stroke }));

  // Lid: similar but slightly larger
  const lidL = L + 0.4;
  const lidW = W + 0.4;
  const lidH = H + lidExtra;
  const lidX = baseX + px(L + 2 * H) + 30;
  const lidY = baseY;

  parts.push(rect({ x: lidX + px(lidH), y: lidY, w: px(lidL), h: px(lidH), fill: PALETTE.flap, stroke: PALETTE.flapStroke }));
  parts.push(rect({ x: lidX, y: lidY + px(lidH), w: px(lidH), h: px(lidW), fill: PALETTE.flap, stroke: PALETTE.flapStroke }));
  parts.push(rect({ x: lidX + px(lidH), y: lidY + px(lidH), w: px(lidL), h: px(lidW) }));
  parts.push(text({ x: lidX + px(lidH + lidL/2), y: lidY + px(lidH + lidW/2) - 6, str: 'Lid', size: 11, weight: 700 }));
  parts.push(text({ x: lidX + px(lidH + lidL/2), y: lidY + px(lidH + lidW/2) + 8, str: 'Cetak utama', size: 9, fill: PALETTE.dim, weight: 500 }));
  parts.push(rect({ x: lidX + px(lidH + lidL), y: lidY + px(lidH), w: px(lidH), h: px(lidW), fill: PALETTE.flap, stroke: PALETTE.flapStroke }));
  parts.push(rect({ x: lidX + px(lidH), y: lidY + px(lidH + lidW), w: px(lidL), h: px(lidH), fill: PALETTE.flap, stroke: PALETTE.flapStroke }));
  parts.push(text({ x: lidX + px((2*lidH + lidL)/2), y: lidY - 14, str: 'LID (Tutup)', size: 11, weight: 700, fill: PALETTE.stroke }));

  // Title
  parts.push(text({ x: w / 2, y: 22, str: `Dieline Rigid Box · ${L} × ${W} × ${H} cm (lid +0.4 cm allowance)`, size: 13, weight: 700, fill: PALETTE.stroke }));

  return svgWrap(w, h, parts.join(''));
}

// ── Sleeve ─────────────────────────────────────────────────────────
function sleeveDieline({ length, width, height }) {
  const L = length, W = width, H = height;
  const glue = 1.5;
  const PADDING = 60;
  const totalCmW = L + H + L + H + glue;
  const totalCmH = W;

  const scale = Math.min(640 / totalCmW, 200 / totalCmH);
  const px = (cm) => cm * scale;

  const w = totalCmW * scale + PADDING * 2;
  const h = totalCmH * scale + PADDING * 2 + 40;

  const parts = [];
  let x = PADDING;
  const y = PADDING + 30;

  parts.push(rect({ x, y, w: px(L), h: px(W) }));
  parts.push(text({ x: x + px(L)/2, y: y + px(W)/2, str: 'Front', size: 11, weight: 700 }));
  x += px(L);

  parts.push(rect({ x, y, w: px(H), h: px(W) }));
  parts.push(text({ x: x + px(H)/2, y: y + px(W)/2, str: 'Side', size: 9 }));
  x += px(H);

  parts.push(rect({ x, y, w: px(L), h: px(W) }));
  parts.push(text({ x: x + px(L)/2, y: y + px(W)/2, str: 'Back', size: 11, weight: 700 }));
  x += px(L);

  parts.push(rect({ x, y, w: px(H), h: px(W) }));
  parts.push(text({ x: x + px(H)/2, y: y + px(W)/2, str: 'Side', size: 9 }));
  x += px(H);

  parts.push(rect({ x, y, w: px(glue), h: px(W), fill: PALETTE.glue, stroke: PALETTE.glueStroke, dash: '4 3' }));
  parts.push(text({ x: x + px(glue)/2, y: y + px(W)/2, str: 'Lem', size: 8, fill: '#92400E', weight: 700 }));

  parts.push(text({ x: w / 2, y: 22, str: `Dieline Sleeve · ${L} × ${W} × ${H} cm`, size: 13, weight: 700, fill: PALETTE.stroke }));

  return svgWrap(w, h, parts.join(''));
}

// ── Paperbag ───────────────────────────────────────────────────────
function paperbagDieline({ length, width, height }) {
  const L = length, W = width, H = height;
  const bottom = W;
  const fold = 2;
  const PADDING = 60;
  const totalCmW = L + W + L + W;
  const totalCmH = H + bottom + fold;

  const scale = Math.min(640 / totalCmW, 360 / totalCmH);
  const px = (cm) => cm * scale;

  const w = totalCmW * scale + PADDING * 2;
  const h = totalCmH * scale + PADDING * 2 + 40;

  const parts = [];
  let x = PADDING;
  const y = PADDING + 30;
  const yBottom = y + px(H);

  // Top body
  [['Front', L, true], ['Side', W, false], ['Back', L, true], ['Side', W, false]].forEach(([lab, val, main]) => {
    parts.push(rect({ x, y, w: px(val), h: px(H) }));
    parts.push(text({ x: x + px(val)/2, y: y + px(H)/2 - 6, str: lab, size: main ? 11 : 9, weight: main ? 700 : 600 }));
    if (main) {
      parts.push(text({ x: x + px(val)/2, y: y + px(H)/2 + 8, str: `${val} × ${H} cm`, size: 9, fill: PALETTE.dim, weight: 500 }));
    }
    x += px(val);
  });

  // Bottom flaps
  x = PADDING;
  [L, W, L, W].forEach((val) => {
    parts.push(rect({ x, y: yBottom, w: px(val), h: px(bottom), fill: PALETTE.flap, stroke: PALETTE.flapStroke }));
    parts.push(text({ x: x + px(val)/2, y: yBottom + px(bottom)/2, str: 'Bottom', size: 9, fill: '#1E40AF' }));
    x += px(val);
  });

  // Top fold (handle area)
  x = PADDING;
  parts.push(rect({ x, y: yBottom + px(bottom), w: px(totalCmW), h: px(fold), fill: PALETTE.glue, stroke: PALETTE.glueStroke, dash: '4 3' }));
  parts.push(text({ x: PADDING + px(totalCmW)/2, y: yBottom + px(bottom) + px(fold)/2, str: 'Lipatan dasar', size: 9, fill: '#92400E', weight: 600 }));

  parts.push(text({ x: w / 2, y: 22, str: `Dieline Paperbag · ${L} × ${W} × ${H} cm`, size: 13, weight: 700, fill: PALETTE.stroke }));

  return svgWrap(w, h, parts.join(''));
}

// ── Mailer Box (FEFCO 0427-style simplified) ───────────────────────
function mailerDieline({ length, width, height }) {
  const L = length, W = width, H = height;
  const PADDING = 60;

  const totalCmW = H + L + H;
  const totalCmH = H + W + H + W + H;

  const scale = Math.min(560 / totalCmW, 420 / totalCmH);
  const px = (cm) => cm * scale;

  const w = totalCmW * scale + PADDING * 2;
  const h = totalCmH * scale + PADDING * 2 + 40;

  const parts = [];
  const x0 = PADDING;
  const y0 = PADDING + 30;

  // Top tuck
  parts.push(rect({ x: x0 + px(H), y: y0, w: px(L), h: px(H), fill: PALETTE.glue, stroke: PALETTE.glueStroke }));
  parts.push(text({ x: x0 + px(H + L/2), y: y0 + px(H)/2, str: 'Tuck Atas', size: 10, fill: '#92400E' }));

  // Top wing 1
  parts.push(rect({ x: x0, y: y0 + px(H), w: px(H), h: px(W), fill: PALETTE.flap, stroke: PALETTE.flapStroke }));
  // Front panel
  parts.push(rect({ x: x0 + px(H), y: y0 + px(H), w: px(L), h: px(W) }));
  parts.push(text({ x: x0 + px(H + L/2), y: y0 + px(H + W/2) - 6, str: 'Front', size: 11, weight: 700 }));
  parts.push(text({ x: x0 + px(H + L/2), y: y0 + px(H + W/2) + 8, str: `${L} × ${W} cm`, size: 9, fill: PALETTE.dim, weight: 500 }));
  // Top wing 2
  parts.push(rect({ x: x0 + px(H + L), y: y0 + px(H), w: px(H), h: px(W), fill: PALETTE.flap, stroke: PALETTE.flapStroke }));

  // Bottom (base) middle
  parts.push(rect({ x: x0 + px(H), y: y0 + px(H + W), w: px(L), h: px(H) }));
  parts.push(text({ x: x0 + px(H + L/2), y: y0 + px(H + W) + px(H)/2, str: 'Base', size: 10, weight: 700 }));

  // Back panel
  parts.push(rect({ x: x0, y: y0 + px(H + W + H), w: px(H), h: px(W), fill: PALETTE.flap, stroke: PALETTE.flapStroke }));
  parts.push(rect({ x: x0 + px(H), y: y0 + px(H + W + H), w: px(L), h: px(W) }));
  parts.push(text({ x: x0 + px(H + L/2), y: y0 + px(H + W + H + W/2), str: 'Back', size: 11, weight: 700 }));
  parts.push(rect({ x: x0 + px(H + L), y: y0 + px(H + W + H), w: px(H), h: px(W), fill: PALETTE.flap, stroke: PALETTE.flapStroke }));

  // Bottom tuck
  parts.push(rect({ x: x0 + px(H), y: y0 + px(H + W + H + W), w: px(L), h: px(H), fill: PALETTE.glue, stroke: PALETTE.glueStroke }));
  parts.push(text({ x: x0 + px(H + L/2), y: y0 + px(H + W + H + W) + px(H)/2, str: 'Tuck Bawah', size: 10, fill: '#92400E' }));

  parts.push(text({ x: w / 2, y: 22, str: `Dieline Mailer Box · ${L} × ${W} × ${H} cm`, size: 13, weight: 700, fill: PALETTE.stroke }));

  return svgWrap(w, h, parts.join(''));
}

export function generateDielineSvg({ type, length, width, height }) {
  if (!length || !width || !height) return null;
  if (length < 1 || width < 1 || height < 0.5) return null;

  switch (type) {
    case 'rigid_box':  return rigidBoxDieline({ length, width, height });
    case 'sleeve':     return sleeveDieline({ length, width, height });
    case 'paperbag':   return paperbagDieline({ length, width, height });
    case 'mailer':     return mailerDieline({ length, width, height });
    case 'pouch':      return null; // pouch tidak punya dieline tradisional
    case 'tuck_end':
    default:           return tuckEndDieline({ length, width, height });
  }
}

const TYPE_LABEL = {
  tuck_end:  'Tuck-End Box',
  rigid_box: 'Rigid Box (Hard Box)',
  sleeve:    'Sleeve',
  paperbag:  'Paperbag',
  mailer:    'Mailer Box',
  pouch:     'Pouch',
};

function fmtCm(n) {
  return `${Number(n).toLocaleString('id-ID', { maximumFractionDigits: 1 })} cm`;
}

export function summarizeDieline({ type, dims }) {
  if (!type || !dims) return [];

  const { length, width, height } = dims;
  const rows = [
    { label: 'Tipe struktur', value: TYPE_LABEL[type] ?? type },
    { label: 'Dimensi jadi', value: `${fmtCm(length)} × ${fmtCm(width)} × ${fmtCm(height)}` },
  ];

  if (type === 'tuck_end') {
    rows.push(
      { label: 'Panel utama', value: `Front/back ${fmtCm(width)} × ${fmtCm(height)}` },
      { label: 'Panel samping', value: `${fmtCm(length)} × ${fmtCm(height)}` },
      { label: 'Area lem', value: 'Tab lem samping ±1.5 cm' },
      { label: 'Flap', value: 'Tuck atas/bawah + dust flap kiri/kanan' },
    );
  }

  if (type === 'rigid_box') {
    rows.push(
      { label: 'Komponen', value: 'Base tray + lid/tutup terpisah' },
      { label: 'Allowance', value: 'Tutup dibuat sedikit lebih longgar untuk fit' },
      { label: 'Rekomendasi', value: 'Cocok untuk rigid box premium / hard box' },
    );
  }

  if (type === 'sleeve') {
    rows.push(
      { label: 'Komponen', value: 'Panel front, back, 2 side panel, dan tab lem' },
      { label: 'Fungsi', value: 'Selongsong luar untuk tray, inner box, atau produk bundle' },
    );
  }

  if (type === 'paperbag') {
    rows.push(
      { label: 'Komponen', value: 'Front, back, 2 gusset samping, dan flap bawah' },
      { label: 'Catatan', value: 'Handle/lubang tali perlu penyesuaian final artwork' },
    );
  }

  if (type === 'mailer') {
    rows.push(
      { label: 'Komponen', value: 'Tutup atas, panel front/back, side wing, dan locking flap' },
      { label: 'Style', value: 'Template mailer box sederhana ala e-commerce subscription box' },
    );
  }

  if (type === 'pouch') {
    rows.push(
      { label: 'Catatan', value: 'Pouch biasanya butuh pola manufaktur khusus, bukan dieline box standar' },
    );
  }

  return rows;
}

export function getDielineAssumptions({ type, dims }) {
  if (!type || !dims) return [];

  const notes = [
    'Ukuran diambil dari hasil estimasi AI atau brief yang diberikan klien.',
    'Dieline ini adalah draft presentasi awal untuk approval struktur kemasan.',
    'Ukuran final, bleed, toleransi mesin, dan area lem tetap perlu divalidasi saat prepress.',
  ];

  if (type === 'rigid_box') {
    notes.push('Rigid box final biasanya perlu allowance board wrap, ketebalan board, dan konstruksi inner wall.');
  }

  if (type === 'paperbag') {
    notes.push('Posisi handle, lipatan atas, dan penguat dasar paperbag perlu disesuaikan saat artwork final.');
  }

  if (type === 'mailer') {
    notes.push('Locking system dan radius sudut bisa berubah mengikuti standar pisau pond actual.');
  }

  if (type === 'pouch') {
    notes.push('Untuk pouch, sebaiknya lanjut ke supplier fleksibel packaging untuk pola seal dan zipper.');
  }

  return notes;
}

export function getDielineMeta({ jenis, ukuran }) {
  const dims = parseDimensions(ukuran);
  if (!dims) return { ok: false, reason: 'Dimensi tidak terbaca dari teks' };

  const type = detectBoxType(jenis);
  const svg = generateDielineSvg({ type, ...dims });
  if (!svg) return { ok: false, reason: 'Tipe kemasan tidak punya dieline standar', type, dims };

  return {
    ok: true,
    type,
    typeLabel: TYPE_LABEL[type] ?? type,
    dims,
    svg,
    summary: summarizeDieline({ type, dims }),
    assumptions: getDielineAssumptions({ type, dims }),
  };
}
