/* ============================================================
   AI Daily / Weekly / Monthly Brief (spec §24)
   ============================================================ */
import { state, brief } from '../data/store.js';
import { icon } from '../ui/icons.js';
import { card, segmented, confBadge, coAvatar, delta, toast } from '../ui/components.js';
import { barList, stackedBar } from '../ui/charts.js';
import { esc, fmtInt, fmtDate, fmtNum, sortBy, timeAgo } from '../util.js';
import { fmtMd } from './dashboard.js';

export const title = () => 'Rapoarte AI';

export function render(ctx) {
  const period = ctx?.params?.period || state.settings.briefFrequency || 'weekly';
  const b = brief(period);
  const m = state.market;
  return `
    <header class="page__header">
      <span class="page__eyebrow">AI Reporting</span>
      <h1 class="page__title">${esc(b.title)}</h1>
      <p class="page__lede">Rezumat automat al pieței — generat ${esc(timeAgo(b.generatedAt, state.now))} pentru
        ${state.companies.length} companii monitorizate.</p>
    </header>
    <div class="page__toolbar">
      ${segmented([{ id: 'daily', label: 'Daily' }, { id: 'weekly', label: 'Weekly' }, { id: 'monthly', label: 'Monthly' }], period, 'rperiod')}
      <span class="spacer"></span>
      <button class="btn btn--secondary btn--sm" data-export="pdf">${icon('download', 14)} PDF</button>
      <button class="btn btn--secondary btn--sm" data-export="email">${icon('mail', 14)} Trimite pe email</button>
      <button class="btn btn--secondary btn--sm" data-print>${icon('report', 14)} Printează</button>
    </div>
    <div class="grid grid--split">
      ${card({ title: 'Rezumat', sub: `${esc(fmtDate(b.generatedAt))} · fereastră de ${b.days} zile`, body: `
        <div class="brief__body">${b.paragraphs.map((p) => `<p>${fmtMd(p)}</p>`).join('')}</div>
        <div class="hstack" style="margin-top:14px">${confBadge('ai')} <span class="source">Generat din toate modulele monitorizate</span></div>` })}
      ${card({ title: 'Cei mai activi în perioadă', body: barList(b.highlights.map((h) => ({ k: h.name, v: h.acts, color: h.color })),
        { format: (v) => `${v} acțiuni` }) })}
    </div>
    <div class="grid grid--3">
      ${card({ title: 'Piața în cifre', body: `<div class="kv">
        <div class="kv__row"><span class="kv__k">Recenzii (30z)</span><span class="kv__v">${fmtInt(m.totals.reviews30)}</span></div>
        <div class="kv__row"><span class="kv__k">Proiecte (30z)</span><span class="kv__v">${fmtInt(m.totals.projects30)}</span></div>
        <div class="kv__row"><span class="kv__k">Produse noi</span><span class="kv__v">${fmtInt(m.totals.products30)}</span></div>
        <div class="kv__row"><span class="kv__k">Postări sociale</span><span class="kv__v">${fmtInt(m.totals.posts30)}</span></div>
        <div class="kv__row"><span class="kv__k">Joburi noi</span><span class="kv__v">${fmtInt(m.totals.jobs30)}</span></div>
        <div class="kv__row"><span class="kv__k">Rating mediu</span><span class="kv__v">${fmtNum(m.avgRating, 2)}</span></div>
      </div>` })}
      ${card({ title: 'Probleme dominante', body: barList(m.topics.allNeg.slice(0, 5).map((t) => ({ k: t.label, v: t.now, color: 'var(--neg)' }))) })}
      ${card({ title: 'Share of Voice', body: `${stackedBar(m.sov.map((s) => ({ k: s.name, v: s.total, color: s.color })), { h: 12 })}
        <div style="margin-top:12px">${barList(m.sov.slice(0, 5).map((s) => ({ k: s.name, v: s.share, color: s.color })),
          { format: (v) => `${fmtNum(v, 1)}%` })}</div>` })}
    </div>
    ${card({ title: 'Semnale de urmărit', body: `<div class="stack stack--sm">
      ${state.threats.slice(0, 3).map((t) => `<div class="hstack hstack--between card card--tight">
        <span><strong>${esc(t.title)}</strong><br><span class="card__sub">${esc(t.body)}</span></span>
        <a class="btn btn--ghost btn--sm" href="#/company/${t.companyId}">${icon('chevronRight', 16)}</a></div>`).join('')}
      ${state.opportunities.slice(0, 2).map((o) => `<div class="hstack hstack--between card card--tight">
        <span><strong>${esc(o.title)}</strong><br><span class="card__sub">${esc(o.body)}</span></span>
        <a class="btn btn--ghost btn--sm" href="#/signals">${icon('chevronRight', 16)}</a></div>`).join('')}
    </div>` })}
    ${card({ title: 'Programare rapoarte', body: `
      <p class="card__sub">Raportul este trimis automat pe email către utilizatorii activi.</p>
      <div class="filters" style="margin-top:12px">
        ${['daily', 'weekly', 'monthly'].map((p) => `<button class="chip" data-freq="${p}"
          aria-pressed="${state.settings.briefFrequency === p}">${p === 'daily' ? 'Zilnic' : p === 'weekly' ? 'Săptămânal' : 'Lunar'}</button>`).join('')}
      </div>` })}`;
}

export function mount(host, ctx) {
  host.addEventListener('click', (e) => {
    const p = e.target.closest('[data-rperiod]');
    if (p) { location.hash = `#/reports/${p.dataset.rperiod}`; return; }
    const f = e.target.closest('[data-freq]');
    if (f) { state.settings.briefFrequency = f.dataset.freq; toast('Frecvența rapoartelor a fost salvată', 'ok'); host.innerHTML = render(ctx); return; }
    const x = e.target.closest('[data-export]');
    if (x) { toast(x.dataset.export === 'pdf' ? 'Raport exportat în PDF' : 'Raport trimis pe email', 'ok', 2400); return; }
    if (e.target.closest('[data-print]')) window.print();
  });
}
