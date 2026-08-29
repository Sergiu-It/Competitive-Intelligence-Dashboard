/* ============================================================
   Alerts (spec §25) — feed + rule configuration
   ============================================================ */
import { state, unreadAlerts, markAlertsRead, toggleRule } from '../data/store.js';
import { icon } from '../ui/icons.js';
import { card, coAvatar, empty, segmented, toast, confBadge } from '../ui/components.js';
import { esc, fmtInt, timeAgo, dayLabel, groupBy } from '../util.js';

let filter = 'all';
export const title = () => 'Alerte';

function visible() {
  const on = new Set(state.alertRules.filter((r) => r.on).map((r) => r.id));
  let list = state.alerts.filter((a) => on.has(a.rule));
  if (filter === 'unread') list = list.filter((a) => !state.alertsRead.includes(a.id));
  if (filter === 'high') list = list.filter((a) => a.severity === 'high');
  return list;
}

function alertRow(a) {
  const read = state.alertsRead.includes(a.id);
  const rule = state.alertRules.find((r) => r.id === a.rule);
  return `<a class="row" href="${a.link}" data-read="${a.id}" style="align-items:flex-start;${read ? 'opacity:.62' : ''}">
    <span class="tile-link__icon" style="background:${a.color}1f;color:${a.color}">${icon(rule?.icon || 'bell', 16)}</span>
    <span class="row__main">
      <span class="row__title">${esc(a.title)}</span>
      <span class="row__meta">${esc(a.body)}</span>
      <span class="hstack" style="margin-top:6px;gap:6px">
        <span class="badge" style="background:${a.color}1f;color:${a.color}">${esc(a.company)}</span>
        <span class="badge ${a.severity === 'high' ? 'badge--neg' : a.severity === 'medium' ? 'badge--warn' : ''}">${esc(rule?.label || a.rule)}</span>
        <span class="card__sub">${esc(timeAgo(a.at, state.now))}</span>
      </span>
    </span>
    ${!read ? '<span class="badge badge--accent badge--dot">NOU</span>' : ''}
  </a>`;
}

export function render() {
  const list = visible();
  const byDay = groupBy(list.slice(0, 60), (a) => dayLabel(a.at, state.now));
  return `
    <header class="page__header">
      <span class="page__eyebrow">Notificări</span>
      <h1 class="page__title">Alerte</h1>
      <p class="page__lede">${unreadAlerts().length} alerte necitite din ${fmtInt(state.alerts.length)} evenimente detectate.</p>
    </header>
    <div class="page__toolbar">
      ${segmented([{ id: 'all', label: 'Toate' }, { id: 'unread', label: 'Necitite' }, { id: 'high', label: 'Prioritate mare' }], filter, 'afilter')}
      <span class="spacer"></span>
      <button class="btn btn--secondary btn--sm" data-mark-all>${icon('check', 14)} Marchează toate ca citite</button>
    </div>
    <div class="grid grid--split">
      ${card({ title: 'Flux de alerte', sub: `${list.length} afișate`, cls: 'card--flush', body: list.length
        ? `<div class="rows rows--interactive">${[...byDay].map(([day, arr]) => `
            <div class="row" style="background:var(--surface-2);padding-block:6px"><span class="section-title">${esc(day)}</span></div>
            ${arr.map(alertRow).join('')}`).join('')}</div>`
        : empty('Nicio alertă', 'Toate regulile active nu au generat evenimente noi.', 'bell') })}
      <div class="stack">
        ${card({ title: 'Reguli de alertă', sub: 'Activează evenimentele care te interesează', cls: 'card--flush', body: `
          <div class="rows">${state.alertRules.map((r) => `<div class="row">
            <span class="tile-link__icon" style="background:var(--surface-3)">${icon(r.icon, 16)}</span>
            <span class="row__main"><span class="row__title">${esc(r.label)}</span>
              <span class="row__meta">${r.severity === 'high' ? 'Prioritate mare' : r.severity === 'medium' ? 'Prioritate medie' : 'Informativ'}</span></span>
            <button class="switch" role="switch" data-rule="${r.id}" aria-checked="${r.on}" aria-label="${esc(r.label)}"></button>
          </div>`).join('')}</div>` })}
        ${card({ title: 'Canale de notificare', body: `
          <div class="rows">
            <div class="row" style="padding-inline:0"><span class="row__main"><span class="row__title">Email</span>
              <span class="row__meta">${esc(state.session?.email || '')}</span></span>
              <button class="switch" role="switch" aria-checked="${state.settings.emailAlerts}" data-channel="emailAlerts"></button></div>
            <div class="row" style="padding-inline:0"><span class="row__main"><span class="row__title">Push în platformă</span>
              <span class="row__meta">Notificări în timp real</span></span>
              <button class="switch" role="switch" aria-checked="${state.settings.pushAlerts}" data-channel="pushAlerts"></button></div>
          </div>` })}
      </div>
    </div>`;
}

export function mount(host) {
  const rerender = () => { host.innerHTML = render(); };
  host.addEventListener('click', (e) => {
    const f = e.target.closest('[data-afilter]'); if (f) { filter = f.dataset.afilter; return rerender(); }
    const r = e.target.closest('[data-rule]'); if (r) { toggleRule(r.dataset.rule); return rerender(); }
    const ch = e.target.closest('[data-channel]');
    if (ch) {
      state.settings[ch.dataset.channel] = !state.settings[ch.dataset.channel];
      toast('Preferință salvată', 'ok', 1400);
      return rerender();
    }
    if (e.target.closest('[data-mark-all]')) {
      markAlertsRead(state.alerts.map((a) => a.id));
      toast('Toate alertele au fost marcate ca citite', 'ok');
      return rerender();
    }
    const a = e.target.closest('[data-read]');
    if (a) markAlertsRead([a.dataset.read]);
  });
}
