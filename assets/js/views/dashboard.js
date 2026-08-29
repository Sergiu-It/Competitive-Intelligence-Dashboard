/* ============================================================
   Dashboard — "ce s-a schimbat?" first, data second
   ============================================================ */
import { state, brief, unreadAlerts, toggleWatch } from '../data/store.js';
import { buildTimeline, inWindow, shareOfVoice, seriesDelta, sliceSeries } from '../data/analytics.js';
import { icon } from '../ui/icons.js';
import {
  kpi, delta, coAvatar, threatBadge, card, segmented, confBadge, empty, toast,
} from '../ui/components.js';
import { radarChart, scatterChart, sparkline, barList, stackedBar, scoreRing, lineChart } from '../ui/charts.js';
import { esc, fmtInt, fmtCompact, fmtNum, timeAgo, dayLabel, groupBy, sortBy, round, periodDays, DAY } from '../util.js';

let period = '30';
let radarPick = null;

export const title = () => 'Dashboard';

function greeting() {
  const h = new Date().getHours();
  return h < 5 ? 'Noapte bună' : h < 12 ? 'Bună dimineața' : h < 18 ? 'Bună ziua' : 'Bună seara';
}

function heroSection() {
  const m = state.market;
  const days = periodDays(period);
  const nowMs = state.now.getTime();
  const list = state.companies;
  const changes = list.reduce((s, c) => s
    + inWindow(c.reviews, days, nowMs).length
    + inWindow(c.projects, days, nowMs).length
    + inWindow(c.webChanges, days, nowMs).length
    + c.products.filter((p) => p.addedAt > nowMs - days * DAY).length
    + inWindow(c.jobs, days, nowMs).length, 0);
  const hottest = sortBy(list.filter((c) => !c.isOwn), (c) => c.scores.momentum)[0];
  const own = list.find((c) => c.isOwn);

  return `<section class="hero">
    <div class="hero__top">
      <div class="stack stack--sm">
        <span class="page__eyebrow">${esc(greeting())}, ${esc((state.session?.name || '').split(' ')[0])}</span>
        <h1 class="hero__title">Ce s-a schimbat în piață</h1>
        <p class="hero__lede">${fmtInt(changes)} schimbări detectate la ${list.length} companii monitorizate în ultimele ${esc(periodDays(period))} de zile.
          ${hottest ? `Cea mai rapidă accelerare: <strong>${esc(hottest.name)}</strong> (${hottest.scores.momentum > 0 ? '+' : ''}${hottest.scores.momentum}% momentum).` : ''}</p>
      </div>
      <div class="hstack">
        ${segmented([
          { id: '7', label: '7 zile' }, { id: '30', label: '30 zile' },
          { id: '90', label: '90 zile' }, { id: '180', label: '6 luni' }, { id: '365', label: '1 an' },
        ], period, 'period')}
      </div>
    </div>
    <div class="hero__stats">
      <div class="hero__stat"><b>${fmtInt(m.totals.reviews30)}</b><span>Recenzii / 30 zile</span></div>
      <div class="hero__stat"><b>${fmtInt(m.totals.projects30)}</b><span>Proiecte noi</span></div>
      <div class="hero__stat"><b>${fmtInt(m.totals.products30)}</b><span>Produse noi</span></div>
      <div class="hero__stat"><b>${fmtInt(m.totals.jobs30)}</b><span>Anunțuri de angajare</span></div>
    </div>
    <div class="hstack">
      <a class="btn btn--primary" href="#/reports">${icon('sparkles', 16)} Brief AI săptămânal</a>
      <a class="btn btn--secondary" href="#/compare">${icon('compare', 16)} Compară companii</a>
      <a class="btn btn--secondary" href="#/alerts">${icon('bell', 16)} ${unreadAlerts().length} alerte noi</a>
      ${own ? `<a class="btn btn--outline" href="#/company/${own.id}">${icon('building', 16)} ${esc(own.name)} — profilul meu</a>` : ''}
    </div>
  </section>`;
}

function briefCard() {
  const b = brief('weekly');
  return `<section class="card card--pad brief">
    <div class="hstack hstack--between">
      <div class="hstack">
        <span class="ai-mark">${icon('sparkles', 16)}</span>
        <div><h3 class="card__title">${esc(b.title)}</h3>
        <p class="card__sub">Generat automat · ${esc(timeAgo(b.generatedAt))} ${confBadge('ai')}</p></div>
      </div>
      <a class="btn btn--ghost btn--sm" href="#/reports">Toate rapoartele ${icon('chevronRight', 14)}</a>
    </div>
    <div class="brief__body">${b.paragraphs.map((p) => `<p>${fmtMd(p)}</p>`).join('')}</div>
    <div class="hstack">
      ${b.highlights.map((h) => `<a class="chip" href="#/company/${h.id}">
        <span class="legend-dot" style="background:${h.color}"></span>${esc(h.name)}
        <span style="color:${h.momentum >= 0 ? 'var(--pos)' : 'var(--neg)'}">${h.momentum >= 0 ? '+' : ''}${h.momentum}%</span></a>`).join('')}
    </div>
  </section>`;
}

export function fmtMd(text) {
  return esc(text).replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>').replace(/\*(.+?)\*/g, '<em>$1</em>');
}

function radarSection() {
  const list = state.companies;
  const picked = (radarPick || [
    list.find((c) => c.isOwn)?.id,
    ...sortBy(list.filter((c) => !c.isOwn), (c) => c.scores.activity).slice(0, 3).map((c) => c.id),
  ].filter(Boolean));
  const series = picked.map((id) => {
    const c = list.find((x) => x.id === id);
    return { name: c.name, color: c.color, fillOpacity: c.isOwn ? 0.22 : 0.1,
      values: [c.scores.reputation, c.scores.commercial, c.scores.digital, c.scores.growth] };
  });
  return card({
    title: 'Competitive Radar',
    sub: 'Reputation · Commercial · Digital · Growth (0–100)',
    body: `<div class="radar-wrap">
      ${radarChart(['REPUTATION', 'COMMERCIAL', 'DIGITAL', 'GROWTH'], series, { size: 340 })}
      <div class="radar-legend">
        ${list.map((c) => `<button class="chip" data-radar="${c.id}" aria-pressed="${picked.includes(c.id)}">
          <span class="legend-dot" style="background:${c.color}"></span>${esc(c.name)}</button>`).join('')}
      </div>
    </div>`,
  });
}

function scatterSection() {
  const items = state.companies.map((c) => ({
    x: c.scores.activity, y: c.scores.momentum, name: c.name, color: c.color, own: !!c.isOwn,
  }));
  return card({
    title: 'Activitate vs. Momentum',
    sub: 'Dreapta-sus = activi și în accelerare',
    body: `${scatterChart(items, { h: 300 })}
      <p class="chart-hint">Axa X: Activity Score (0–100). Axa Y: Momentum (% față de perioada precedentă).</p>`,
  });
}

function moversSection() {
  const rising = sortBy(state.companies, (c) => c.scores.momentum).slice(0, 4);
  const falling = sortBy(state.companies, (c) => -c.scores.momentum).slice(0, 3);
  const row = (c) => `<a class="row" href="#/company/${c.id}">
      ${coAvatar(c, 'sm')}
      <span class="row__main"><span class="row__title">${esc(c.name)}</span>
        <span class="row__meta">Activity ${c.scores.activity}/100 · ${c.metrics.reviews.d30} recenzii · ${c.metrics.projects.d30} proiecte / 30z</span></span>
      <span class="hstack hstack--nowrap">${delta(c.scores.momentum, { pct: true })}${icon('chevronRight', 16)}</span>
    </a>`;
  return card({
    title: 'Cine accelerează',
    sub: 'Momentum Score — ultimele 30 vs. 30 de zile anterioare',
    cls: 'card--flush',
    body: `<div class="rows rows--interactive">${rising.map(row).join('')}
      <div class="row" style="background:var(--surface-2)"><span class="row__meta">În scădere</span></div>
      ${falling.map(row).join('')}</div>`,
  });
}

function threatsSection() {
  const t = state.threats.slice(0, 3);
  if (!t.length) return '';
  return card({
    title: 'Threat Detector',
    sub: 'Competitori care accelerează pe mai multe canale simultan',
    action: `<a class="btn btn--ghost btn--sm" href="#/signals">Toate ${icon('chevronRight', 14)}</a>`,
    body: `<div class="stack">${t.map((x) => `
      <a class="card card--tight card--hover" href="#/company/${x.companyId}" style="display:block;text-decoration:none;color:inherit">
        <div class="hstack hstack--between" style="margin-bottom:6px">
          <span class="hstack">${threatBadge(x.level)}<strong>${esc(x.company)}</strong></span>
          ${delta(x.momentum, { pct: true })}
        </div>
        <p style="font-size:.875rem;color:var(--text-2)">${esc(x.body)}</p>
      </a>`).join('')}</div>`,
  });
}

function opportunitiesSection() {
  const o = state.opportunities.slice(0, 3);
  return card({
    title: 'Opportunity Detector',
    sub: 'Ce poate folosi Carepack acum',
    action: `<a class="btn btn--ghost btn--sm" href="#/signals">Toate ${icon('chevronRight', 14)}</a>`,
    body: `<div class="stack">${o.map((x) => `
      <div class="card card--tight">
        <div class="hstack hstack--between" style="margin-bottom:6px">
          <span class="hstack">${icon('target', 16)}<strong>${esc(x.title)}</strong></span>
          <span class="badge ${x.impact === 'high' ? 'badge--pos' : 'badge--info'}">${x.impact === 'high' ? 'IMPACT MARE' : 'IMPACT MEDIU'}</span>
        </div>
        <p style="font-size:.875rem;color:var(--text-2)">${esc(x.body)}</p>
        <div class="hstack" style="margin-top:8px">${confBadge(x.confidence)}<span class="source">${esc(x.evidence)}</span></div>
      </div>`).join('')}</div>`,
  });
}

function trendingSection() {
  const t = state.market.topics;
  return card({
    title: 'Trending Issues în piață',
    sub: 'Teme din recenzii — ultimele 30 vs. 30 de zile anterioare',
    body: `<div class="stack">
      <div>
        <span class="section-title">Reclamații în creștere</span>
        <div style="margin-top:8px">
        ${t.rising.length ? t.rising.map((x) => `<div class="trend-row">
          ${icon('trendUp', 16, { cls: '' })}
          <span class="trend-row__name">${esc(x.label)}</span>
          <span class="badge badge--neg">${x.now} mențiuni</span>
          ${delta(round(x.pct, 0), { pct: true, invert: true })}
        </div>`).join('') : '<p class="card__sub">Nicio temă negativă în creștere semnificativă.</p>'}
        </div>
      </div>
      <div>
        <span class="section-title">Cel mai apreciat</span>
        <div style="margin-top:8px">
        ${t.praised.slice(0, 3).map((x) => `<div class="trend-row">
          ${icon('star', 16, { fill: true })}
          <span class="trend-row__name">${esc(x.label)}</span>
          <span class="badge badge--pos">${x.now} mențiuni</span>
        </div>`).join('')}
        </div>
      </div>
    </div>`,
  });
}

function sovSection() {
  const sov = state.market.sov;
  const parts = sov.slice(0, 8).map((s) => ({ k: s.name, v: s.total, color: s.color }));
  return card({
    title: 'Share of Voice',
    sub: 'Din activitatea observată în piață — ultimele 90 de zile',
    body: `${stackedBar(parts, { h: 14 })}
      <div style="margin-top:14px">${barList(sov.slice(0, 6).map((s) => ({ k: s.name, v: s.share, color: s.color })),
        { format: (v) => `${fmtNum(v, 1)}%` })}</div>`,
  });
}

function watchlistSection() {
  const watched = state.companies.filter((c) => state.watchlist.includes(c.id) || c.isOwn);
  return `<section class="stack stack--sm">
    <div class="hstack hstack--between">
      <h2 class="card__title">Companii urmărite</h2>
      <a class="btn btn--ghost btn--sm" href="#/companies">Toate companiile ${icon('chevronRight', 14)}</a>
    </div>
    <div class="scroller">
      ${watched.map((c) => companyCard(c)).join('')}
    </div>
  </section>`;
}

export function companyCard(c) {
  const m = c.metrics;
  return `<a class="card card--pad card--hover" href="#/company/${c.id}" style="width:min(300px,84vw);text-decoration:none;color:inherit">
    <div class="hstack hstack--between" style="margin-bottom:12px">
      <span class="hstack">${coAvatar(c)}<span>
        <strong style="display:block">${esc(c.name)}</strong>
        <span class="card__sub">${esc(c.website)}</span></span></span>
      ${c.isOwn ? '<span class="badge badge--accent">EU</span>' : threatBadge(c.scores.threat)}
    </div>
    <div class="score" style="margin-bottom:12px">
      ${scoreRing(c.scores.activity, { size: 72, color: c.color, label: 'activity' })}
      <div class="stack stack--sm" style="gap:4px">
        <div class="hstack" style="gap:6px">${icon('star', 14, { fill: true })}<strong>${fmtNum(m.reviews.rating, 2)}</strong>
          <span class="card__sub">${fmtInt(m.reviews.total)} recenzii</span></div>
        <div class="hstack" style="gap:6px">${icon('activity', 14)}<span class="card__sub">Momentum</span>${delta(c.scores.momentum, { pct: true })}</div>
        <div class="hstack" style="gap:6px">${icon('layers', 14)}<span class="card__sub">${m.projects.d30} proiecte / 30z</span></div>
      </div>
    </div>
    ${sparkline(sliceSeries(c.gmb.series, 180), { w: 260, h: 34, color: c.color })}
    <div class="hstack" style="margin-top:8px;gap:6px;font-size:.75rem;color:var(--text-3)">
      <span>${icon('message', 12)} ${m.social.posts30} postări</span>
      <span>${icon('box', 12)} ${m.products.new30} produse</span>
      <span>${icon('briefcase', 12)} ${m.jobs.new30} joburi</span>
    </div>
  </a>`;
}

function marketTimeline() {
  const nowMs = state.now.getTime();
  const all = state.companies.flatMap((c) => (c.timeline || []).slice(0, 40).map((t) => ({ ...t, co: c })));
  const items = sortBy(all, (t) => t.date).slice(0, 26);
  const byDay = groupBy(items, (t) => dayLabel(t.date, state.now));
  return card({
    title: 'Activity Timeline — toată piața',
    sub: 'Toate sursele într-o singură cronologie',
    cls: 'card--flush',
    body: `<div style="padding:0 var(--s5) var(--s5)">
      <div class="timeline">
      ${[...byDay].map(([day, arr]) => `
        <div class="tl-day">${esc(day)}</div>
        ${arr.map((t) => `<div class="tl-item">
          <span class="tl-item__dot" style="color:${t.color}">${icon(t.icon, 16)}</span>
          <div class="tl-item__body">
            <a class="tl-item__title" href="${t.link || `#/company/${t.co.id}`}" style="color:inherit">${esc(t.title)}</a>
            <span class="tl-item__meta">
              <a href="#/company/${t.co.id}" class="badge" style="background:${t.co.color}22;color:${t.co.color}">${esc(t.co.name)}</a>
              <span>${esc(t.meta || '')}</span><span>· ${esc(timeAgo(t.date, state.now))}</span>
            </span>
          </div>
        </div>`).join('')}
      `).join('')}
      </div></div>`,
  });
}

export function render() {
  return `
    ${heroSection()}
    ${briefCard()}
    <div class="grid grid--split">
      ${radarSection()}
      ${moversSection()}
    </div>
    ${watchlistSection()}
    <div class="grid grid--split">
      ${scatterSection()}
      ${trendingSection()}
    </div>
    <div class="grid grid--2">
      ${threatsSection()}
      ${opportunitiesSection()}
    </div>
    <div class="grid grid--split">
      ${marketTimeline()}
      ${sovSection()}
    </div>`;
}

export function mount(host) {
  host.addEventListener('click', (e) => {
    const seg = e.target.closest('[data-period]');
    if (seg) { period = seg.dataset.period; host.innerHTML = render(); return; }
    const r = e.target.closest('[data-radar]');
    if (r) {
      const id = r.dataset.radar;
      const cur = radarPick || [state.companies.find((c) => c.isOwn)?.id,
        ...sortBy(state.companies.filter((c) => !c.isOwn), (c) => c.scores.activity).slice(0, 3).map((c) => c.id)].filter(Boolean);
      let next = cur.includes(id) ? cur.filter((x) => x !== id) : [...cur, id];
      if (!next.length) next = [id];
      if (next.length > 5) { toast('Maxim 5 companii pe radar', 'info', 1800); return; }
      radarPick = next;
      host.innerHTML = render();
    }
  });
}
