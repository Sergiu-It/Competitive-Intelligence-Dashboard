/* ============================================================
   Charts — dependency-free, responsive inline SVG.
   Every chart uses a viewBox and width:100% so it scales from
   phone to desktop without JS resize handlers.
   ============================================================ */
import { fmtInt, fmtNum, fmtDateShort, round, clamp } from '../util.js';

const uidc = () => `c${Math.random().toString(36).slice(2, 8)}`;

/* ---------- sparkline ---------- */
export function sparkline(series, opts = {}) {
  const { w = 120, h = 32, color = 'var(--accent)', fill = true, strokeWidth = 1.8 } = opts;
  const pts = (series || []).map((p) => (typeof p === 'object' ? p.v : p));
  if (pts.length < 2) return `<svg class="spark" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}"></svg>`;
  const min = Math.min(...pts), max = Math.max(...pts);
  const span = max - min || 1;
  const x = (i) => (i / (pts.length - 1)) * (w - 2) + 1;
  const y = (v) => h - 2 - ((v - min) / span) * (h - 4);
  const d = pts.map((v, i) => `${i ? 'L' : 'M'}${round(x(i), 1)} ${round(y(v), 1)}`).join(' ');
  const id = uidc();
  return `<svg class="spark" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" preserveAspectRatio="none" aria-hidden="true">
    ${fill ? `<defs><linearGradient id="${id}" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="${color}" stop-opacity=".28"/>
      <stop offset="100%" stop-color="${color}" stop-opacity="0"/></linearGradient></defs>
      <path d="${d} L ${w - 1} ${h} L 1 ${h} Z" fill="url(#${id})" stroke="none"/>` : ''}
    <path d="${d}" fill="none" stroke="${color}" stroke-width="${strokeWidth}" stroke-linecap="round" stroke-linejoin="round"/>
  </svg>`;
}

/* ---------- line / area chart ---------- */
export function lineChart(datasets, opts = {}) {
  const {
    h = 220, area = true, yFormat = fmtInt, points = false,
    yZero = false, grid = true, xLabels = 5,
  } = opts;
  const W = 600, H = h, pad = { t: 12, r: 10, b: 26, l: 46 };
  const sets = datasets.filter((d) => d.data && d.data.length > 1);
  if (!sets.length) return `<div class="empty" style="padding:32px">Fără date suficiente</div>`;

  const allV = sets.flatMap((s) => s.data.map((p) => p.v));
  let min = Math.min(...allV), max = Math.max(...allV);
  if (yZero) min = Math.min(0, min);
  const padY = (max - min) * 0.12 || 1;
  max += padY; min = Math.max(yZero ? 0 : min - padY, min - padY);
  const allT = sets.flatMap((s) => s.data.map((p) => p.t));
  const t0 = Math.min(...allT), t1 = Math.max(...allT);
  const X = (t) => pad.l + ((t - t0) / (t1 - t0 || 1)) * (W - pad.l - pad.r);
  const Y = (v) => H - pad.b - ((v - min) / (max - min || 1)) * (H - pad.t - pad.b);

  const ticks = 4;
  let gridSvg = '';
  if (grid) {
    for (let i = 0; i <= ticks; i++) {
      const v = min + ((max - min) / ticks) * i;
      const y = round(Y(v), 1);
      gridSvg += `<line x1="${pad.l}" y1="${y}" x2="${W - pad.r}" y2="${y}" stroke="var(--grid-line)" stroke-width="1"/>
        <text x="${pad.l - 8}" y="${y + 4}" text-anchor="end" font-size="10" fill="var(--text-3)">${yFormat(v)}</text>`;
    }
  }
  let xSvg = '';
  for (let i = 0; i < xLabels; i++) {
    const t = t0 + ((t1 - t0) / (xLabels - 1)) * i;
    xSvg += `<text x="${round(X(t), 1)}" y="${H - 8}" text-anchor="${i === 0 ? 'start' : i === xLabels - 1 ? 'end' : 'middle'}"
      font-size="10" fill="var(--text-3)">${fmtDateShort(t)}</text>`;
  }

  const body = sets.map((s, si) => {
    const id = uidc();
    const color = s.color || 'var(--accent)';
    const d = s.data.map((p, i) => `${i ? 'L' : 'M'}${round(X(p.t), 1)} ${round(Y(p.v), 1)}`).join(' ');
    const last = s.data[s.data.length - 1];
    const fillPath = area && sets.length === 1
      ? `<defs><linearGradient id="${id}" x1="0" y1="0" x2="0" y2="1">
           <stop offset="0%" stop-color="${color}" stop-opacity=".26"/>
           <stop offset="100%" stop-color="${color}" stop-opacity="0"/></linearGradient></defs>
         <path d="${d} L ${round(X(last.t), 1)} ${H - pad.b} L ${round(X(s.data[0].t), 1)} ${H - pad.b} Z" fill="url(#${id})"/>` : '';
    const dots = points ? s.data.filter((_, i) => i % Math.ceil(s.data.length / 12) === 0)
      .map((p) => `<circle cx="${round(X(p.t), 1)}" cy="${round(Y(p.v), 1)}" r="2.6" fill="${color}">
        <title>${fmtDateShort(p.t)}: ${yFormat(p.v)}</title></circle>`).join('') : '';
    return `${fillPath}<path d="${d}" fill="none" stroke="${color}" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/>
      ${dots}<circle cx="${round(X(last.t), 1)}" cy="${round(Y(last.v), 1)}" r="3.6" fill="${color}" stroke="var(--surface)" stroke-width="2">
      <title>${yFormat(last.v)}</title></circle>`;
  }).join('');

  return `<svg class="chart" viewBox="0 0 ${W} ${H}" width="100%" height="${H}" role="img" preserveAspectRatio="none"
    style="overflow:visible">${gridSvg}${xSvg}${body}</svg>`;
}

/* ---------- vertical bars over time ---------- */
export function barsChart(data, opts = {}) {
  const { h = 160, color = 'var(--accent)', yFormat = fmtInt, labelEvery = 0 } = opts;
  if (!data || !data.length) return `<div class="empty" style="padding:24px">Fără date</div>`;
  const W = 600, H = h, pad = { t: 10, r: 6, b: 22, l: 40 };
  const max = Math.max(...data.map((d) => d.v), 1);
  const bw = (W - pad.l - pad.r) / data.length;
  const gap = Math.min(4, bw * 0.25);
  let grid = '';
  for (let i = 0; i <= 3; i++) {
    const v = (max / 3) * i;
    const y = H - pad.b - (v / max) * (H - pad.t - pad.b);
    grid += `<line x1="${pad.l}" y1="${round(y, 1)}" x2="${W - pad.r}" y2="${round(y, 1)}" stroke="var(--grid-line)"/>
      <text x="${pad.l - 6}" y="${round(y, 1) + 4}" text-anchor="end" font-size="10" fill="var(--text-3)">${yFormat(v)}</text>`;
  }
  const bars = data.map((d, i) => {
    const bh = (d.v / max) * (H - pad.t - pad.b);
    const x = pad.l + i * bw + gap / 2;
    const y = H - pad.b - bh;
    const label = labelEvery && i % labelEvery === 0
      ? `<text x="${round(x + (bw - gap) / 2, 1)}" y="${H - 7}" text-anchor="middle" font-size="9" fill="var(--text-3)">${d.k}</text>` : '';
    return `<rect x="${round(x, 1)}" y="${round(y, 1)}" width="${round(bw - gap, 1)}" height="${round(Math.max(bh, d.v ? 2 : 0), 1)}"
      rx="2.5" fill="${d.color || color}" opacity="${d.dim ? 0.45 : 1}"><title>${d.k}: ${yFormat(d.v)}</title></rect>${label}`;
  }).join('');
  return `<svg class="chart" viewBox="0 0 ${W} ${H}" width="100%" height="${H}" preserveAspectRatio="none" role="img">${grid}${bars}</svg>`;
}

/* ---------- donut ---------- */
export function donut(parts, opts = {}) {
  const { size = 148, thickness = 18, center = '' } = opts;
  const total = parts.reduce((s, p) => s + p.v, 0) || 1;
  const r = (size - thickness) / 2;
  const c = size / 2;
  const circ = 2 * Math.PI * r;
  let off = 0;
  const rings = parts.map((p) => {
    const len = (p.v / total) * circ;
    const el = `<circle cx="${c}" cy="${c}" r="${r}" fill="none" stroke="${p.color}" stroke-width="${thickness}"
      stroke-dasharray="${round(len, 2)} ${round(circ - len, 2)}" stroke-dashoffset="${round(-off, 2)}"
      transform="rotate(-90 ${c} ${c})" stroke-linecap="butt"><title>${p.k}: ${round((p.v / total) * 100, 1)}%</title></circle>`;
    off += len;
    return el;
  }).join('');
  return `<div style="position:relative;width:${size}px;height:${size}px">
    <svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
      <circle cx="${c}" cy="${c}" r="${r}" fill="none" stroke="var(--chart-track)" stroke-width="${thickness}"/>${rings}
    </svg>
    ${center ? `<div style="position:absolute;inset:0;display:grid;place-content:center;text-align:center">${center}</div>` : ''}
  </div>`;
}

/* ---------- score ring ---------- */
export function scoreRing(value, opts = {}) {
  const { size = 86, thickness = 8, color = 'var(--accent)', label = '' } = opts;
  const r = (size - thickness) / 2, c = size / 2, circ = 2 * Math.PI * r;
  const v = clamp(value, 0, 100);
  return `<div class="score__ring" style="width:${size}px;height:${size}px">
    <svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
      <circle cx="${c}" cy="${c}" r="${r}" fill="none" stroke="var(--chart-track)" stroke-width="${thickness}"/>
      <circle cx="${c}" cy="${c}" r="${r}" fill="none" stroke="${color}" stroke-width="${thickness}" stroke-linecap="round"
        stroke-dasharray="${round((v / 100) * circ, 2)} ${circ}" transform="rotate(-90 ${c} ${c})"/>
    </svg>
    <div class="score__num"><b>${Math.round(v)}</b>${label ? `<span>${label}</span>` : ''}</div>
  </div>`;
}

/* ---------- radar (competitive radar, spec §23) ---------- */
export function radarChart(axes, series, opts = {}) {
  const { size = 320, levels = 4 } = opts;
  const c = size / 2, r = size / 2 - 46;
  const n = axes.length;
  const angle = (i) => (Math.PI * 2 * i) / n - Math.PI / 2;
  const pt = (i, val) => [c + Math.cos(angle(i)) * r * (val / 100), c + Math.sin(angle(i)) * r * (val / 100)];

  let web = '';
  for (let l = 1; l <= levels; l++) {
    const pts = axes.map((_, i) => pt(i, (100 / levels) * l).map((x) => round(x, 1)).join(',')).join(' ');
    web += `<polygon points="${pts}" fill="none" stroke="var(--grid-line)" stroke-width="1"/>`;
  }
  web += axes.map((_, i) => {
    const [x, y] = pt(i, 100);
    return `<line x1="${c}" y1="${c}" x2="${round(x, 1)}" y2="${round(y, 1)}" stroke="var(--grid-line)"/>`;
  }).join('');

  const labels = axes.map((a, i) => {
    const [x, y] = pt(i, 122);
    const anchor = Math.abs(x - c) < 12 ? 'middle' : x > c ? 'start' : 'end';
    return `<text x="${round(x, 1)}" y="${round(y + 4, 1)}" text-anchor="${anchor}" font-size="10.5"
      font-weight="600" fill="var(--text-3)">${a}</text>`;
  }).join('');

  const shapes = series.map((s) => {
    const pts = s.values.map((v, i) => pt(i, clamp(v, 0, 100)).map((x) => round(x, 1)).join(',')).join(' ');
    return `<polygon points="${pts}" fill="${s.color}" fill-opacity="${s.fillOpacity ?? 0.14}"
      stroke="${s.color}" stroke-width="2" stroke-linejoin="round"><title>${s.name}</title></polygon>
      ${s.values.map((v, i) => {
        const [x, y] = pt(i, clamp(v, 0, 100));
        return `<circle cx="${round(x, 1)}" cy="${round(y, 1)}" r="3" fill="${s.color}"><title>${s.name} — ${axes[i]}: ${Math.round(v)}</title></circle>`;
      }).join('')}`;
  }).join('');

  // extra horizontal room so axis labels never clip
  const padX = 72, padY = 16;
  return `<svg class="chart" viewBox="${-padX} ${-padY} ${size + padX * 2} ${size + padY * 2}" width="100%"
    style="max-width:${size + padX}px;height:auto;overflow:visible" role="img">${web}${labels}${shapes}</svg>`;
}

/* ---------- scatter (activity vs momentum) ---------- */
export function scatterChart(items, opts = {}) {
  const { h = 300, xLabel = 'Activity Score', yLabel = 'Momentum' } = opts;
  const W = 600, H = h, pad = { t: 16, r: 16, b: 34, l: 46 };
  const xs = items.map((i) => i.x), ys = items.map((i) => i.y);
  const xMin = 0, xMax = Math.max(100, ...xs);
  const yMin = Math.min(-40, ...ys) - 5, yMax = Math.max(40, ...ys) + 5;
  const X = (v) => pad.l + ((v - xMin) / (xMax - xMin)) * (W - pad.l - pad.r);
  const Y = (v) => H - pad.b - ((v - yMin) / (yMax - yMin)) * (H - pad.t - pad.b);
  let grid = '';
  for (let i = 0; i <= 4; i++) {
    const v = yMin + ((yMax - yMin) / 4) * i;
    grid += `<line x1="${pad.l}" y1="${round(Y(v), 1)}" x2="${W - pad.r}" y2="${round(Y(v), 1)}" stroke="var(--grid-line)"/>
      <text x="${pad.l - 6}" y="${round(Y(v), 1) + 4}" text-anchor="end" font-size="10" fill="var(--text-3)">${Math.round(v)}%</text>`;
  }
  grid += `<line x1="${pad.l}" y1="${round(Y(0), 1)}" x2="${W - pad.r}" y2="${round(Y(0), 1)}" stroke="var(--line-strong)" stroke-dasharray="4 4"/>`;
  for (let i = 0; i <= 4; i++) {
    const v = xMin + ((xMax - xMin) / 4) * i;
    grid += `<text x="${round(X(v), 1)}" y="${H - 12}" text-anchor="middle" font-size="10" fill="var(--text-3)">${Math.round(v)}</text>`;
  }
  const dots = items.map((it) => `<g>
      <circle cx="${round(X(it.x), 1)}" cy="${round(Y(it.y), 1)}" r="${it.own ? 9 : 7}" fill="${it.color}" fill-opacity="${it.own ? 0.95 : 0.75}"
        stroke="var(--surface)" stroke-width="2"><title>${it.name} — ${xLabel} ${Math.round(it.x)}, ${yLabel} ${Math.round(it.y)}%</title></circle>
      <text x="${round(X(it.x), 1)}" y="${round(Y(it.y) - 12, 1)}" text-anchor="middle" font-size="10" font-weight="600"
        fill="var(--text-2)">${it.name}</text></g>`).join('');
  return `<svg class="chart" viewBox="0 0 ${W} ${H}" width="100%" height="${H}" role="img"
    style="overflow:visible">${grid}${dots}
    <text x="${W / 2}" y="${H - 1}" text-anchor="middle" font-size="10" fill="var(--text-3)">${xLabel} →</text></svg>`;
}

/* ---------- stacked share bar ---------- */
export function stackedBar(parts, opts = {}) {
  const { h = 12 } = opts;
  const total = parts.reduce((s, p) => s + p.v, 0) || 1;
  return `<div style="display:flex;height:${h}px;border-radius:99px;overflow:hidden;background:var(--chart-track)">
    ${parts.map((p) => `<div title="${p.k}: ${round((p.v / total) * 100, 1)}%"
      style="width:${(p.v / total) * 100}%;background:${p.color}"></div>`).join('')}
  </div>`;
}

/* ---------- horizontal bar list ---------- */
export function barList(rows, opts = {}) {
  const { color = 'var(--accent)', format = fmtInt, max: forcedMax } = opts;
  const max = forcedMax || Math.max(...rows.map((r) => Math.abs(r.v)), 1);
  return `<div class="barlist">${rows.map((r) => `
    <div class="barlist__row">
      <span class="barlist__label" title="${r.k}">${r.k}</span>
      <span class="meter"><span class="meter__fill" style="width:${(Math.abs(r.v) / max) * 100}%;background:${r.color || color}"></span></span>
      <span class="barlist__val">${format(r.v)}</span>
    </div>`).join('')}</div>`;
}

export { fmtNum };
