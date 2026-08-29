/* ============================================================
   Utilities: formatting, dates, DOM helpers
   ============================================================ */

export const $  = (sel, root = document) => root.querySelector(sel);
export const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

/** Escape untrusted text for interpolation into HTML templates. */
export function esc(v) {
  return String(v ?? '')
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

/** Tagged template that escapes interpolations unless they are marked raw. */
export function html(strings, ...values) {
  return strings.reduce((out, s, i) => {
    const v = values[i - 1];
    let chunk;
    if (v === undefined || v === null || v === false) chunk = '';
    else if (Array.isArray(v)) chunk = v.join('');
    else if (typeof v === 'object' && v.__raw) chunk = v.__raw;
    else chunk = esc(v);
    return out + chunk + s;
  });
}
export const raw = (s) => ({ __raw: String(s ?? '') });

/* ---------- numbers ---------- */
const RO = 'ro-RO';
export const clamp = (n, min, max) => Math.min(max, Math.max(min, n));
export const sum = (a) => a.reduce((x, y) => x + y, 0);
export const avg = (a) => (a.length ? sum(a) / a.length : 0);
export const round = (n, d = 0) => { const p = 10 ** d; return Math.round(n * p) / p; };

export function fmtInt(n) {
  if (n === null || n === undefined || Number.isNaN(n)) return '—';
  return new Intl.NumberFormat(RO, { maximumFractionDigits: 0 }).format(n);
}
export function fmtNum(n, d = 1) {
  if (n === null || n === undefined || Number.isNaN(n)) return '—';
  return new Intl.NumberFormat(RO, { minimumFractionDigits: d, maximumFractionDigits: d }).format(n);
}
export function fmtCompact(n) {
  if (n === null || n === undefined || Number.isNaN(n)) return '—';
  if (Math.abs(n) < 1000) return fmtInt(n);
  return new Intl.NumberFormat(RO, { notation: 'compact', maximumFractionDigits: 1 }).format(n);
}
export function fmtSigned(n, d = 0) {
  if (n === null || n === undefined || Number.isNaN(n)) return '—';
  const s = d ? fmtNum(Math.abs(n), d) : fmtInt(Math.abs(n));
  return (n > 0 ? '+' : n < 0 ? '−' : '') + s;
}
export function fmtPct(n, d = 0) {
  if (n === null || n === undefined || Number.isNaN(n) || !Number.isFinite(n)) return '—';
  return `${fmtNum(n, d)}%`;
}
export function fmtSignedPct(n, d = 0) {
  if (n === null || n === undefined || Number.isNaN(n) || !Number.isFinite(n)) return '—';
  return `${n > 0 ? '+' : n < 0 ? '−' : ''}${fmtNum(Math.abs(n), d)}%`;
}
export function fmtMoney(n, cur = 'MDL') {
  if (n === null || n === undefined || Number.isNaN(n)) return '—';
  return `${new Intl.NumberFormat(RO, { maximumFractionDigits: 0 }).format(n)} ${cur}`;
}

/* ---------- dates ---------- */
export const DAY = 86400000;
export const startOfDay = (d) => { const x = new Date(d); x.setHours(0, 0, 0, 0); return x; };
export const addDays = (d, n) => new Date(new Date(d).getTime() + n * DAY);
export const daysBetween = (a, b) => Math.round((startOfDay(b) - startOfDay(a)) / DAY);
export const iso = (d) => new Date(d).toISOString().slice(0, 10);

const MONTHS_RO = ['ian', 'feb', 'mar', 'apr', 'mai', 'iun', 'iul', 'aug', 'sep', 'oct', 'noi', 'dec'];
const MONTHS_RO_LONG = ['ianuarie','februarie','martie','aprilie','mai','iunie','iulie','august','septembrie','octombrie','noiembrie','decembrie'];

export function fmtDate(d) {
  const x = new Date(d);
  return `${x.getDate()} ${MONTHS_RO[x.getMonth()]} ${x.getFullYear()}`;
}
export function fmtDateShort(d) {
  const x = new Date(d);
  return `${x.getDate()} ${MONTHS_RO[x.getMonth()]}`;
}
export function fmtMonth(d) {
  const x = new Date(d);
  return `${MONTHS_RO_LONG[x.getMonth()]} ${x.getFullYear()}`;
}
export function fmtTime(d) {
  const x = new Date(d);
  return `${String(x.getHours()).padStart(2, '0')}:${String(x.getMinutes()).padStart(2, '0')}`;
}
export function fmtDateTime(d) { return `${fmtDate(d)}, ${fmtTime(d)}`; }

export function timeAgo(d, now = new Date()) {
  const diff = now - new Date(d);
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'chiar acum';
  if (mins < 60) return `acum ${mins} min`;
  const hours = Math.floor(mins / 60);
  if (hours < 24 && startOfDay(now).getTime() === startOfDay(d).getTime())
    return `acum ${hours} ${hours === 1 ? 'oră' : 'ore'}`;
  const days = daysBetween(d, now);
  if (days === 0) return 'astăzi';
  if (days === 1) return 'ieri';
  if (days < 30) return `acum ${days} zile`;
  const months = Math.round(days / 30);
  if (months < 12) return `acum ${months} ${months === 1 ? 'lună' : 'luni'}`;
  const years = Math.round(days / 365);
  return `acum ${years} ${years === 1 ? 'an' : 'ani'}`;
}

export function dayLabel(d, now = new Date()) {
  const days = daysBetween(d, now);
  if (days === 0) return 'Astăzi';
  if (days === 1) return 'Ieri';
  if (days < 7) return `Acum ${days} zile`;
  return fmtDate(d);
}

/* ---------- misc ---------- */
export function initials(name) {
  return String(name).split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0]).join('').toUpperCase();
}
export function slugify(s) {
  return String(s).toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}
export function maskEmail(email) {
  const [u, d] = String(email).split('@');
  if (!d) return email;
  return `${u.slice(0, 1)}${'*'.repeat(Math.max(3, u.length - 1))}@${d}`;
}
export function pctChange(now, before) {
  if (!before) return now ? 100 : 0;
  return ((now - before) / Math.abs(before)) * 100;
}
export function debounce(fn, ms = 220) {
  let t; return (...a) => { clearTimeout(t); t = setTimeout(() => fn(...a), ms); };
}
export function groupBy(arr, keyFn) {
  const m = new Map();
  for (const it of arr) {
    const k = keyFn(it);
    if (!m.has(k)) m.set(k, []);
    m.get(k).push(it);
  }
  return m;
}
export function sortBy(arr, fn, dir = 'desc') {
  return [...arr].sort((a, b) => (dir === 'desc' ? fn(b) - fn(a) : fn(a) - fn(b)));
}
export function uid(prefix = 'id') {
  return `${prefix}_${Math.random().toString(36).slice(2, 9)}`;
}

/** Deterministic pastel-ish brand colour from a string. */
export function colorFor(str) {
  let h = 0;
  for (let i = 0; i < str.length; i++) h = (h * 31 + str.charCodeAt(i)) % 360;
  return `hsl(${h} 62% 46%)`;
}

export const PERIODS = [
  { id: '7',   label: '7 zile',  days: 7 },
  { id: '30',  label: '30 zile', days: 30 },
  { id: '90',  label: '90 zile', days: 90 },
  { id: '180', label: '6 luni',  days: 180 },
  { id: '365', label: '1 an',    days: 365 },
];
export const periodDays = (id) => (PERIODS.find((p) => p.id === String(id)) || PERIODS[1]).days;
export const periodLabel = (id) => (PERIODS.find((p) => p.id === String(id)) || PERIODS[1]).label;
