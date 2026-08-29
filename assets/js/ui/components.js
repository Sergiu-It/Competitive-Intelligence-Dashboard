/* ============================================================
   Shared UI building blocks (string-template components)
   ============================================================ */
import { icon } from './icons.js';
import {
  esc, fmtInt, fmtSigned, fmtSignedPct, fmtNum, initials, timeAgo, fmtDateTime,
} from '../util.js';
import { sparkline } from './charts.js';

/* ---------- confidence (spec §26) ---------- */
const CONF = {
  verified:  { cls: 'conf--verified',  label: 'Verified' },
  high:      { cls: 'conf--high',      label: 'High confidence' },
  estimated: { cls: 'conf--estimated', label: 'Estimated' },
  ai:        { cls: 'conf--ai',        label: 'AI detected' },
  needs:     { cls: 'conf--needs',     label: 'Needs verification' },
};
export function confBadge(kind = 'verified', extra = '') {
  const c = CONF[kind] || CONF.verified;
  return `<span class="conf ${c.cls}" title="Nivel de încredere a datelor">${c.label}${extra ? ` · ${esc(extra)}` : ''}</span>`;
}
export function sourceLine(source, when, conf) {
  return `<span class="source">${icon('link', 12)} ${esc(source)}${when ? ` · ${esc(timeAgo(when))}` : ''}
    ${conf ? confBadge(conf) : ''}</span>`;
}

/* ---------- deltas ---------- */
export function delta(value, opts = {}) {
  const { pct = false, decimals = 0, invert = false, suffix = '' } = opts;
  if (value === null || value === undefined || Number.isNaN(value)) return '<span class="delta delta--flat">—</span>';
  const good = invert ? value < 0 : value > 0;
  const cls = value === 0 ? 'delta--flat' : good ? 'delta--up' : 'delta--down';
  const ic = value === 0 ? '' : icon(value > 0 ? 'arrowUp' : 'arrowDown', 12, { stroke: 2.4 });
  const text = pct ? fmtSignedPct(value, decimals) : fmtSigned(value, decimals);
  return `<span class="delta ${cls}">${ic}${text}${esc(suffix)}</span>`;
}

/* ---------- KPI tile ---------- */
export function kpi({ label, value, sub, deltaVal, deltaPct, invert, series, color, conf, href }) {
  const inner = `
    <span class="kpi__label">${esc(label)}</span>
    <span class="kpi__value">${value}</span>
    <span class="kpi__foot">
      ${deltaVal !== undefined && deltaVal !== null ? delta(deltaVal, { invert, decimals: Number.isInteger(deltaVal) ? 0 : 2 }) : ''}
      ${deltaPct !== undefined && deltaPct !== null ? delta(deltaPct, { pct: true, invert }) : ''}
      ${sub ? `<span>${esc(sub)}</span>` : ''}
      ${conf ? confBadge(conf) : ''}
    </span>
    ${series && series.length > 2 ? `<div style="margin-top:6px">${sparkline(series, { w: 160, h: 26, color: color || 'var(--accent)' })}</div>` : ''}`;
  return href
    ? `<a class="kpi card--hover" href="${href}" style="text-decoration:none;color:inherit">${inner}</a>`
    : `<div class="kpi">${inner}</div>`;
}

/* ---------- company avatar ---------- */
export function coAvatar(co, size = 'md') {
  const cls = size === 'sm' ? 'avatar avatar--sm' : size === 'lg' ? 'avatar avatar--lg' : size === 'xl' ? 'avatar avatar--xl' : 'avatar avatar--square';
  return `<span class="${cls}" style="background:${co.color}" aria-hidden="true">${esc(initials(co.name))}</span>`;
}

/* ---------- stars ---------- */
export function stars(n, size = 13) {
  const full = Math.round(n);
  return `<span class="stars" aria-label="${fmtNum(n, 1)} din 5">${
    Array.from({ length: 5 }, (_, i) => icon('star', size, { fill: i < full })).join('')}</span>`;
}

/* ---------- threat badge ---------- */
export function threatBadge(level) {
  const map = {
    high:   { cls: 'badge--neg',  label: 'HIGH THREAT',   n: 3 },
    medium: { cls: 'badge--warn', label: 'MEDIUM THREAT', n: 2 },
    low:    { cls: 'badge--pos',  label: 'LOW THREAT',    n: 1 },
    own:    { cls: 'badge--accent', label: 'COMPANIA MEA', n: 0 },
  };
  const t = map[level] || map.low;
  return `<span class="badge ${t.cls} badge--dot">${t.label}</span>`;
}

/* ---------- segmented control ---------- */
export function segmented(items, activeId, dataAttr = 'seg') {
  return `<div class="segmented" role="tablist">${items.map((i) => `
    <button class="segmented__item" role="tab" data-${dataAttr}="${esc(i.id)}"
      aria-selected="${String(i.id) === String(activeId)}">${esc(i.label)}</button>`).join('')}</div>`;
}

/* ---------- card ---------- */
export function card({ title, sub, action, body, foot, cls = '' }) {
  return `<section class="card ${cls}">
    ${title ? `<header class="card__head">
      <div><h3 class="card__title">${title}</h3>${sub ? `<p class="card__sub">${sub}</p>` : ''}</div>
      ${action || ''}
    </header>` : ''}
    <div class="card__body">${body}</div>
    ${foot ? `<footer class="card__foot">${foot}</footer>` : ''}
  </section>`;
}

/* ---------- empty state ---------- */
export function empty(title, text, iconName = 'search') {
  return `<div class="empty">
    <span class="empty__icon">${icon(iconName, 24)}</span>
    <h3>${esc(title)}</h3>${text ? `<p>${esc(text)}</p>` : ''}
  </div>`;
}

/* ---------- toast ---------- */
export function toast(message, kind = 'ok', ms = 3200) {
  const root = document.getElementById('toast-root');
  if (!root) return;
  const el = document.createElement('div');
  el.className = `toast toast--${kind}`;
  el.innerHTML = `<span class="toast__icon">${icon(kind === 'err' ? 'alert' : kind === 'info' ? 'info' : 'checkCircle', 18)}</span>
    <span>${esc(message)}</span>`;
  root.appendChild(el);
  setTimeout(() => {
    el.style.transition = 'opacity .25s, transform .25s';
    el.style.opacity = '0'; el.style.transform = 'translateY(8px)';
    setTimeout(() => el.remove(), 260);
  }, ms);
}

/* ---------- sheet / modal ---------- */
let sheetCloser = null;
export function openSheet({ title, body, foot, wide = false, onMount }) {
  closeSheet();
  const root = document.getElementById('sheet-root');
  const back = document.createElement('div');
  back.className = 'sheet-backdrop';
  back.innerHTML = `<div class="sheet ${wide ? 'sheet--wide' : ''}" role="dialog" aria-modal="true" aria-label="${esc(title || '')}">
    <div class="sheet__grab"></div>
    <header class="sheet__head">
      <h2 class="card__title">${title || ''}</h2>
      <button class="btn btn--icon btn--secondary" data-sheet-close aria-label="Închide">${icon('x', 18)}</button>
    </header>
    <div class="sheet__body">${body}</div>
    ${foot ? `<footer class="sheet__foot">${foot}</footer>` : ''}
  </div>`;
  root.appendChild(back);
  document.body.style.overflow = 'hidden';
  const close = () => closeSheet();
  back.addEventListener('click', (e) => { if (e.target === back || e.target.closest('[data-sheet-close]')) close(); });
  const esckey = (e) => { if (e.key === 'Escape') close(); };
  document.addEventListener('keydown', esckey);
  sheetCloser = () => { document.removeEventListener('keydown', esckey); back.remove(); document.body.style.overflow = ''; };
  if (onMount) onMount(back);
  return back;
}
export function closeSheet() { if (sheetCloser) { sheetCloser(); sheetCloser = null; } }

/* ---------- misc ---------- */
export function kv(rows) {
  return `<div class="kv">${rows.filter(Boolean).map((r) => `
    <div class="kv__row"><span class="kv__k">${esc(r[0])}</span><span class="kv__v">${r[2] ? r[1] : esc(r[1])}</span></div>`).join('')}</div>`;
}
export function chipRow(items) {
  return `<div class="topics">${items.map((t) => `<span class="chip">${esc(t)}</span>`).join('')}</div>`;
}
export function meter(pct, color = 'var(--accent)') {
  return `<span class="meter"><span class="meter__fill" style="width:${Math.max(0, Math.min(100, pct))}%;background:${color}"></span></span>`;
}
export function periodPicker(active, attr = 'period') {
  return segmented([
    { id: '7', label: '7 zile' }, { id: '30', label: '30 zile' }, { id: '90', label: '90 zile' },
    { id: '180', label: '6 luni' }, { id: '365', label: '1 an' },
  ], active, attr);
}
export function loadingRows(n = 4, h = 54) {
  return `<div class="stack stack--sm">${Array.from({ length: n }, () => `<div class="skeleton" style="height:${h}px"></div>`).join('')}</div>`;
}
export { icon, timeAgo, fmtDateTime, fmtInt };
