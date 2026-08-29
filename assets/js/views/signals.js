/* ============================================================
   Opportunity Detector (§19) & Threat Detector (§20)
   ============================================================ */
import { state } from '../data/store.js';
import { icon } from '../ui/icons.js';
import { card, confBadge, threatBadge, delta, coAvatar, segmented, empty } from '../ui/components.js';
import { esc, fmtInt, sortBy } from '../util.js';

let tab = 'all';
export const title = () => 'Semnale';

function oppCard(o) {
  const cos = o.companies.map((id) => state.companies.find((c) => c.id === id)).filter(Boolean);
  return `<article class="card card--pad stack stack--sm">
    <div class="hstack hstack--between">
      <span class="hstack">
        <span class="tile-link__icon" style="background:var(--pos-soft);color:var(--pos)">${icon('target', 18)}</span>
        <strong>${esc(o.title)}</strong>
      </span>
      <span class="badge ${o.impact === 'high' ? 'badge--pos' : 'badge--info'}">${o.impact === 'high' ? 'IMPACT MARE' : 'IMPACT MEDIU'}</span>
    </div>
    <p style="color:var(--text-2)">${esc(o.body)}</p>
    ${cos.length ? `<div class="filters">${cos.map((c) => `<a class="chip" href="#/company/${c.id}">
      <span class="legend-dot" style="background:${c.color}"></span>${esc(c.name)}</a>`).join('')}</div>` : ''}
    <div class="hstack">${confBadge(o.confidence)}<span class="source">${icon('info', 12)} ${esc(o.evidence)}</span>
      <span class="badge badge--outline">${esc(o.type)}</span></div>
  </article>`;
}

function threatCard(t) {
  const co = state.companies.find((c) => c.id === t.companyId);
  return `<article class="card card--pad stack stack--sm">
    <div class="hstack hstack--between">
      <span class="hstack">${co ? coAvatar(co, 'sm') : ''}<strong>${esc(t.title)}</strong></span>
      ${threatBadge(t.level)}
    </div>
    <p style="color:var(--text-2)">${esc(t.body)}</p>
    <ul style="display:grid;gap:6px">${t.signals.map((s) => `<li style="font-size:.8125rem;color:var(--text-3);padding-left:14px;position:relative">
      <span style="position:absolute;left:0">•</span>${esc(s)}</li>`).join('')}</ul>
    <div class="hstack hstack--between">
      <span class="hstack">${confBadge(t.confidence)}<span class="source">Scor amenințare ${t.score}/100</span></span>
      <a class="btn btn--ghost btn--sm" href="#/company/${t.companyId}">Deschide profilul ${icon('chevronRight', 14)}</a>
    </div>
  </article>`;
}

export function render() {
  const opps = state.opportunities, threats = state.threats;
  return `
    <header class="page__header">
      <span class="page__eyebrow">AI Detection</span>
      <h1 class="page__title">Oportunități & Amenințări</h1>
      <p class="page__lede">Semnale detectate automat din toate datele colectate: ${opps.length} oportunități și
        ${threats.length} amenințări active.</p>
    </header>
    <div class="page__toolbar">
      ${segmented([{ id: 'all', label: 'Toate' }, { id: 'opp', label: `Oportunități (${opps.length})` },
        { id: 'thr', label: `Amenințări (${threats.length})` }], tab, 'stab')}
    </div>
    ${tab !== 'thr' ? `<section class="stack">
      <h2 class="card__title">${icon('target', 18)} Opportunity Detector</h2>
      <div class="grid grid--2">${opps.map(oppCard).join('') || empty('Nicio oportunitate detectată', '', 'target')}</div>
    </section>` : ''}
    ${tab !== 'opp' ? `<section class="stack">
      <h2 class="card__title">${icon('alert', 18)} Threat Detector</h2>
      <div class="grid grid--2">${threats.map(threatCard).join('') || empty('Nicio amenințare detectată', '', 'shield')}</div>
    </section>` : ''}`;
}

export function mount(host) {
  host.addEventListener('click', (e) => {
    const s = e.target.closest('[data-stab]');
    if (s) { tab = s.dataset.stab; host.innerHTML = render(); }
  });
}
