/* ============================================================
   Company overview page — all modules per competitor (spec §28)
   ============================================================ */
import { state, getCompany, toggleWatch } from '../data/store.js';
import {
  inWindow, inPrevWindow, seriesDelta, sliceSeries, trendingIssues, topicStats, buildTimeline,
} from '../data/analytics.js';
import { icon } from '../ui/icons.js';
import {
  kpi, delta, coAvatar, threatBadge, card, segmented, confBadge, empty, stars, sourceLine,
  kv, meter, toast, openSheet,
} from '../ui/components.js';
import { lineChart, barsChart, donut, scoreRing, sparkline, barList, stackedBar, radarChart } from '../ui/charts.js';
import {
  esc, fmtInt, fmtNum, fmtCompact, fmtMoney, fmtDate, fmtDateShort, timeAgo, dayLabel, sortBy,
  groupBy, round, pctChange, DAY, slugify,
} from '../util.js';
import { topicLabel, TOPICS, PRODUCT_TREE } from '../data/seed.js';
import { fmtMd } from './dashboard.js';

const TABS = [
  ['overview', 'Overview'], ['gmb', 'Google Maps'], ['reviews', 'Reviews'], ['projects', 'Projects'],
  ['products', 'Products'], ['prices', 'Prices'], ['website', 'Website'], ['social', 'Social'],
  ['youtube', 'YouTube'], ['seo', 'SEO'], ['traffic', 'Traffic'], ['ads', 'Advertising'],
  ['jobs', 'Jobs'], ['news', 'News'], ['tenders', 'Tenders'], ['timeline', 'Timeline'], ['ai', 'AI Analysis'],
];

let uiState = { reviewFilter: 'all', reviewTopic: 'all', projectSector: 'all', webType: 'all',
  tlKind: 'all', period: '90', productCat: 'all' };

export const title = (ctx) => getCompany(ctx.params?.id)?.name || 'Companie';

const nowMs = () => state.now.getTime();

/* ---------- header ---------- */
function header(co, tab) {
  const m = co.metrics;
  const watched = state.watchlist.includes(co.id);
  return `<header class="co-hero">
    <div class="co-hero__top">
      ${coAvatar(co, 'xl')}
      <div class="co-hero__id">
        <div class="hstack">
          <h1 class="co-hero__name">${esc(co.name)}</h1>
          ${co.isOwn ? '<span class="badge badge--accent">COMPANIA MEA</span>' : threatBadge(co.scores.threat)}
        </div>
        <div class="co-hero__meta">
          <span>${icon('building2', 13)} ${esc(co.legalName)}</span>
          <span>${icon('shield', 13)} IDNO ${esc(co.idno)}</span>
          <a href="https://${esc(co.website)}" target="_blank" rel="noopener">${icon('globe', 13)} ${esc(co.website)}</a>
          <span>${icon('mapPin', 13)} ${esc(co.address)}</span>
          <span>${icon('phone', 13)} ${esc(co.phone)}</span>
        </div>
        <div class="hstack" style="gap:6px">
          ${Object.entries(co.socials).filter(([, v]) => v).map(([k, v]) =>
            `<a class="chip" href="https://${k}.com/${esc(v)}" target="_blank" rel="noopener">${icon(k, 14)} ${esc(v)}</a>`).join('')}
        </div>
      </div>
      <div class="co-hero__actions">
        <button class="btn ${watched ? 'btn--secondary' : 'btn--primary'}" data-watch="${co.id}">
          ${icon(watched ? 'eye' : 'plus', 16)} ${watched ? 'Se monitorizează' : 'Monitorizează'}</button>
        <a class="btn btn--secondary" href="#/compare?a=${co.id}">${icon('compare', 16)} Compară</a>
        <button class="btn btn--secondary" data-export>${icon('download', 16)} Export</button>
      </div>
    </div>
    <div class="kpi-strip">
      ${kpi({ label: 'Rating', value: fmtNum(m.reviews.rating, 2), deltaVal: m.reviews.ratingDelta30, sub: '30 zile', conf: 'verified' })}
      ${kpi({ label: 'Recenzii', value: fmtInt(m.reviews.total), deltaVal: m.reviews.d30, sub: '30 zile' })}
      ${kpi({ label: 'Proiecte', value: fmtInt(m.projects.d90), sub: '90 zile', deltaPct: round(pctChange(m.projects.d90, m.projects.prev90), 0) })}
      ${kpi({ label: 'Social growth', value: `${m.social.growth30Pct > 0 ? '+' : ''}${fmtNum(m.social.growth30Pct, 1)}%`, sub: `${fmtCompact(m.social.followers)} urmăritori` })}
      ${kpi({ label: 'Activity Score', value: `${co.scores.activity}<span style="font-size:.9rem;color:var(--text-3)">/100</span>` })}
      ${kpi({ label: 'Momentum', value: `${co.scores.momentum > 0 ? '+' : ''}${co.scores.momentum}%`, sub: 'vs. 30 zile anterioare' })}
      ${kpi({ label: 'Threat level', value: co.isOwn ? '—' : co.scores.threat.toUpperCase(), sub: co.isOwn ? 'compania mea' : `scor ${co.scores.threatRaw}` })}
    </div>
    <nav class="tabs">${TABS.map(([id, label]) =>
      `<a class="tab" href="#/company/${co.id}/${id}" aria-selected="${tab === id}">${esc(label)}</a>`).join('')}</nav>
  </header>`;
}

/* ---------- OVERVIEW ---------- */
function tabOverview(co) {
  const m = co.metrics;
  const ti = trendingIssues(co.reviews, nowMs(), 30);
  const tl = (co.timeline || []).slice(0, 8);
  const histNote = `${fmtInt(m.reviews.total)} recenzii · <strong>+${m.reviews.d180}</strong> în ultimele 6 luni, dintre care
    <strong>+${m.reviews.d30}</strong> în ultimele 30 de zile. Ritmul de acumulare
    ${m.reviews.accel >= 0 ? 'a crescut' : 'a scăzut'} cu <strong>${Math.abs(m.reviews.accel)}%</strong>.`;

  return `
    <div class="grid grid--split">
      ${card({
        title: 'Istoric recenzii',
        sub: 'Cumulat — 12 luni',
        body: `${lineChart([{ data: sliceSeries(co.gmb.series, 365), color: co.color }], { h: 220 })}
          <p class="chart-hint" style="margin-top:10px">${histNote}</p>`,
      })}
      ${card({
        title: 'Scoruri Carepack',
        body: `<div class="stack">
          <div class="hstack" style="justify-content:space-around">
            <div class="stack stack--sm" style="justify-items:center;text-align:center">
              ${scoreRing(co.scores.activity, { size: 92, color: co.color, label: 'activity' })}
              <span class="card__sub">Activity Score</span></div>
            <div class="stack stack--sm" style="justify-items:center;text-align:center">
              ${scoreRing(Math.max(0, Math.min(100, 50 + co.scores.momentum / 2)), { size: 92,
                color: co.scores.momentum >= 0 ? 'var(--pos)' : 'var(--neg)',
                label: 'momentum' }).replace(/<b>\d+<\/b>/, `<b>${co.scores.momentum > 0 ? '+' : ''}${co.scores.momentum}%</b>`)}
              <span class="card__sub">Momentum</span></div>
          </div>
          ${radarChart(['REPUTATION', 'COMMERCIAL', 'DIGITAL', 'GROWTH'],
            [{ name: co.name, color: co.color, values: [co.scores.reputation, co.scores.commercial, co.scores.digital, co.scores.growth] }],
            { size: 280 })}
        </div>`,
      })}
    </div>
    <div class="grid grid--3">
      ${card({ title: 'Sentiment (90 zile)', body: `
        ${stackedBar([
          { k: 'Pozitiv', v: m.reviews.sentiment.pos, color: 'var(--pos)' },
          { k: 'Neutru', v: m.reviews.sentiment.neu, color: 'var(--text-3)' },
          { k: 'Negativ', v: m.reviews.sentiment.neg, color: 'var(--neg)' },
        ], { h: 14 })}
        <div class="chart-legend" style="margin-top:12px">
          <span class="legend-item"><i class="legend-dot" style="background:var(--pos)"></i>Pozitiv ${m.reviews.sentimentPct.pos}%</span>
          <span class="legend-item"><i class="legend-dot" style="background:var(--text-3)"></i>Neutru ${m.reviews.sentimentPct.neu}%</span>
          <span class="legend-item"><i class="legend-dot" style="background:var(--neg)"></i>Negativ ${m.reviews.sentimentPct.neg}%</span>
        </div>` })}
      ${card({ title: 'Reclamații în creștere', body: ti.rising.length
        ? barList(ti.rising.map((t) => ({ k: t.label, v: t.now, color: 'var(--neg)' })))
        : '<p class="card__sub">Nicio temă negativă în creștere.</p>' })}
      ${card({ title: 'Cel mai apreciat', body: ti.praised.length
        ? barList(ti.praised.map((t) => ({ k: t.label, v: t.now, color: 'var(--pos)' })))
        : '<p class="card__sub">Date insuficiente.</p>' })}
    </div>
    <div class="grid grid--split">
      ${card({
        title: 'Ultimele semnale',
        sub: 'Din toate sursele monitorizate',
        action: `<a class="btn btn--ghost btn--sm" href="#/company/${co.id}/timeline">Timeline complet ${icon('chevronRight', 14)}</a>`,
        body: `<div class="timeline">${tl.map((t) => `<div class="tl-item">
          <span class="tl-item__dot" style="color:${t.color}">${icon(t.icon, 15)}</span>
          <div class="tl-item__body"><span class="tl-item__title">${esc(t.title)}</span>
          <span class="tl-item__meta">${esc(t.meta || '')} · ${esc(timeAgo(t.date, state.now))} ${confBadge(t.confidence || 'verified')}</span></div>
        </div>`).join('')}</div>`,
      })}
      ${card({
        title: 'Company Intelligence',
        sub: 'Profil consolidat din surse publice',
        body: kv([
          ['Denumire juridică', co.legalName],
          ['IDNO / cod fiscal', co.idno],
          ['Website', `<a href="https://${esc(co.website)}" target="_blank" rel="noopener">${esc(co.website)}</a>`, true],
          ['Telefon', co.phone],
          ['Email public', co.email],
          ['Adresă', co.address],
          ['Google Maps', `<a href="${esc(co.gmb.url)}" target="_blank" rel="noopener">${esc(co.gmb.name)}</a>`, true],
          ['Fondată', String(co.founded)],
          ['Angajați (estimat)', fmtInt(co.employees)],
          ['Branduri', co.brands.join(', ')],
          ['Domenii de activitate', co.domains.join(', ')],
          ['Locații', co.locations.join(' · ')],
        ]) + `<div class="hstack" style="margin-top:14px">${confBadge('verified')} ${confBadge('estimated', 'angajați')}
          <button class="btn btn--ghost btn--sm" data-merge>${icon('layers', 14)} Verifică duplicate</button></div>`,
      })}
    </div>
    ${quickTiles(co)}`;
}

function quickTiles(co) {
  const m = co.metrics;
  const tiles = [
    ['projects', 'layers', 'Proiecte', `${m.projects.d90} în 90 zile`, 'var(--hue-teal)'],
    ['products', 'box', 'Produse', `${m.products.total} active · +${m.products.new90}`, 'var(--hue-indigo)'],
    ['website', 'globe', 'Website', `${m.web.d30} modificări / 30z`, 'var(--hue-blue)'],
    ['social', 'message', 'Social', `${fmtCompact(m.social.followers)} urmăritori`, 'var(--hue-pink)'],
    ['youtube', 'youtube', 'YouTube', m.youtube.present ? `${fmtCompact(m.youtube.subs)} abonați` : 'fără canal', 'var(--hue-red)'],
    ['seo', 'seo', 'SEO', `vizibilitate ${m.seo.visibility}%`, 'var(--hue-green)'],
    ['jobs', 'briefcase', 'Joburi', `${m.jobs.active} active`, 'var(--hue-purple)'],
    ['news', 'news', 'Știri', `${m.news.d90} în 90 zile`, 'var(--hue-orange)'],
  ];
  return `<div class="grid grid--4">${tiles.map(([tab, ic, label, sub, color]) => `
    <a class="tile-link" href="#/company/${co.id}/${tab}">
      <span class="tile-link__icon" style="background:${color}1f;color:${color}">${icon(ic, 18)}</span>
      <span><strong style="display:block;font-size:.875rem">${esc(label)}</strong>
      <span class="card__sub">${esc(sub)}</span></span>
    </a>`).join('')}</div>`;
}

/* ---------- GOOGLE MAPS ---------- */
function tabGmb(co) {
  const m = co.metrics, g = co.gmb;
  const dist = [5, 4, 3, 2, 1].map((s) => ({ s, v: g.dist[s] || 0 }));
  const maxD = Math.max(...dist.map((d) => d.v), 1);
  const windows = [
    ['7 zile', m.reviews.d7], ['30 zile', m.reviews.d30], ['90 zile', m.reviews.d90],
    ['180 zile', m.reviews.d180], ['365 zile', m.reviews.d365],
  ];
  return `
    <div class="grid grid--split">
      ${card({
        title: 'Google Business Profile',
        sub: esc(g.name),
        action: `<a class="btn btn--secondary btn--sm" href="${esc(g.url)}" target="_blank" rel="noopener">${icon('external', 14)} Deschide</a>`,
        body: `<div class="hstack" style="gap:24px;align-items:flex-start;flex-wrap:wrap">
          <div class="stack stack--sm" style="min-width:150px">
            <span style="font-size:3.25rem;font-weight:680;line-height:1;letter-spacing:-.03em">${fmtNum(g.rating, 2)}</span>
            ${stars(g.rating, 16)}
            <span class="card__sub">${fmtInt(g.total)} recenzii totale</span>
            <span class="hstack" style="gap:6px">${delta(m.reviews.ratingDelta30, { decimals: 2 })}<span class="card__sub">în 30 zile</span></span>
          </div>
          <div class="stars-dist" style="flex:1;min-width:220px">
            ${dist.map((d) => `<div class="stars-dist__row">
              <span>${d.s} ★</span>${meter((d.v / maxD) * 100, d.s >= 4 ? 'var(--pos)' : d.s === 3 ? 'var(--warn)' : 'var(--neg)')}
              <span class="tnum">${fmtInt(d.v)}</span></div>`).join('')}
          </div>
        </div>
        <div class="grid grid--4" style="margin-top:18px">
          ${kpi({ label: 'Ritm mediu', value: `${fmtNum(m.reviews.perWeek, 1)}`, sub: 'recenzii / săptămână' })}
          ${kpi({ label: 'Accelerare', value: `${m.reviews.accel > 0 ? '+' : ''}${m.reviews.accel}%`, sub: '30 vs. 30 zile' })}
          ${kpi({ label: 'Rata de răspuns', value: `${m.reviews.responseRate90}%`, deltaVal: m.reviews.responseRate90 - m.reviews.responseRatePrev, sub: 'pp vs. perioada anterioară' })}
          ${kpi({ label: 'Timp mediu răspuns', value: `${m.reviews.avgResponseHours ?? '—'}h`, deltaVal: m.reviews.avgResponsePrev ? m.reviews.avgResponseHours - m.reviews.avgResponsePrev : null, invert: true })}
        </div>`,
      })}
      ${card({
        title: 'Recenzii pe fereastră de timp',
        body: `<div class="table-wrap"><table class="table"><thead><tr><th>Perioadă</th><th class="num">Recenzii</th><th class="num">Ritm/zi</th></tr></thead>
          <tbody>${windows.map(([label, v]) => `<tr><td>${esc(label)}</td><td class="num">${fmtInt(v)}</td>
            <td class="num">${fmtNum(v / parseInt(label, 10), 2)}</td></tr>`).join('')}</tbody></table></div>
          <div style="margin-top:16px">${sourceLine('Google Business Profile', g.series[g.series.length - 1].t, 'verified')}</div>`,
      })}
    </div>
    <div class="grid grid--2">
      ${card({ title: 'Evoluția ratingului', sub: '12 luni',
        body: lineChart([{ data: sliceSeries(g.ratingSeries, 365), color: 'var(--hue-yellow)' }], { h: 200, yFormat: (v) => fmtNum(v, 1) }) })}
      ${card({ title: 'Recenzii noi pe lună', body: barsChart(monthlyBuckets(co.reviews, 12), { h: 200, color: co.color, labelEvery: 2 }) })}
    </div>`;
}

function monthlyBuckets(events, months, key = 'date') {
  const out = [];
  const base = new Date(state.now);
  for (let i = months - 1; i >= 0; i--) {
    const d = new Date(base.getFullYear(), base.getMonth() - i, 1);
    const end = new Date(base.getFullYear(), base.getMonth() - i + 1, 1);
    out.push({ k: fmtDateShort(d), v: events.filter((e) => e[key] >= d.getTime() && e[key] < end.getTime()).length });
  }
  return out;
}

/* ---------- REVIEWS ---------- */
function tabReviews(co) {
  const m = co.metrics;
  const ti = trendingIssues(co.reviews, nowMs(), 30);
  let list = co.reviews;
  if (uiState.reviewFilter === 'neg') list = list.filter((r) => r.sentiment === 'neg');
  if (uiState.reviewFilter === 'pos') list = list.filter((r) => r.sentiment === 'pos');
  if (uiState.reviewFilter === 'noreply') list = list.filter((r) => !r.replied);
  if (uiState.reviewTopic !== 'all') list = list.filter((r) => r.topics.includes(uiState.reviewTopic));
  const shown = list.slice(0, 40);
  const topicRows = topicStats(co.reviews, 90, nowMs()).slice(0, 10);

  return `
    <div class="page__toolbar">
      ${segmented([{ id: 'all', label: 'Toate' }, { id: 'neg', label: 'Negative' }, { id: 'pos', label: 'Pozitive' },
        { id: 'noreply', label: 'Fără răspuns' }], uiState.reviewFilter, 'rfilter')}
      <select class="select" data-rtopic style="width:auto;min-width:200px">
        <option value="all">Toate temele</option>
        ${TOPICS.map((t) => `<option value="${t.id}" ${uiState.reviewTopic === t.id ? 'selected' : ''}>${esc(t.label)}</option>`).join('')}
      </select>
      <span class="count-note">${fmtInt(list.length)} recenzii</span>
    </div>
    <div class="grid grid--split">
      ${card({ title: 'Recenzii', sub: `${shown.length} afișate din ${fmtInt(list.length)}`, cls: 'card--flush',
        body: shown.length ? shown.map((r) => reviewRow(r)).join('') : empty('Nicio recenzie', 'Schimbă filtrele.', 'star') })}
      <div class="stack">
        ${card({ title: 'Trending Issues', sub: 'Ultimele 30 vs. 30 zile anterioare', body: `
          <div class="stack stack--sm">
            ${ti.rising.map((t) => `<div class="trend-row">${icon('trendUp', 15)}
              <span class="trend-row__name">${esc(t.label)}</span>
              <span class="badge badge--neg">${t.now}</span>${delta(round(t.pct, 0), { pct: true, invert: true })}</div>`).join('')
              || '<p class="card__sub">Nicio creștere semnificativă.</p>'}
            ${ti.falling.map((t) => `<div class="trend-row">${icon('trendDown', 15)}
              <span class="trend-row__name">${esc(t.label)}</span>
              <span class="badge badge--pos">${t.now}</span>${delta(round(t.pct, 0), { pct: true, invert: true })}</div>`).join('')}
          </div>
          ${ti.rising[0] ? `<p class="chart-hint" style="margin-top:12px">
            „În ultimele 30 de zile au ${ti.rising[0].pct > 0 ? 'crescut' : 'scăzut'} cu
            ${Math.abs(round(ti.rising[0].pct, 0))}% reclamațiile privind ${esc(ti.rising[0].label.toLowerCase())}.”</p>` : ''}` })}
        ${card({ title: 'Teme detectate de AI', sub: '90 de zile', body: barList(
          topicRows.map((t) => ({ k: t.label, v: t.now })), { color: 'var(--hue-purple)' }) + `
          <div style="margin-top:12px">${confBadge('ai', 'clasificare automată')}</div>` })}
        ${card({ title: 'Răspunsuri', body: `
          <div class="stack stack--sm">
            <div class="kv__row"><span class="kv__k">Rata de răspuns</span><span class="kv__v">${m.reviews.responseRate90}%</span></div>
            ${meter(m.reviews.responseRate90, 'var(--pos)')}
            <div class="kv__row"><span class="kv__k">Timp mediu</span><span class="kv__v">${m.reviews.avgResponseHours ?? '—'} ore</span></div>
            <div class="kv__row"><span class="kv__k">Evoluție</span><span class="kv__v">${delta(m.reviews.avgResponsePrev ? m.reviews.avgResponseHours - m.reviews.avgResponsePrev : null, { invert: true, suffix: 'h' })}</span></div>
          </div>` })}
      </div>
    </div>`;
}

function reviewRow(r) {
  return `<article class="review">
    <div class="review__head">
      <span class="avatar avatar--sm" style="background:var(--surface-3);color:var(--text-2)">${esc(r.author.slice(0, 1))}</span>
      <span class="review__author">${esc(r.author)}</span>
      ${stars(r.stars, 12)}
      <span class="card__sub">${esc(timeAgo(r.date, state.now))}</span>
      <span class="badge ${r.sentiment === 'pos' ? 'badge--pos' : r.sentiment === 'neg' ? 'badge--neg' : ''}">
        ${r.sentiment === 'pos' ? 'Pozitiv' : r.sentiment === 'neg' ? 'Negativ' : 'Neutru'}</span>
      ${r.replied ? `<span class="badge badge--info">Răspuns în ${r.replyHours}h</span>` : '<span class="badge badge--warn">Fără răspuns</span>'}
    </div>
    <p class="review__text">${esc(r.text)}</p>
    <div class="topics">${r.topics.map((t) => `<span class="chip">${esc(topicLabel(t))}</span>`).join('')}</div>
    ${r.replied ? `<div class="review__reply"><strong>Răspunsul companiei</strong><br>${esc(r.replyText)}</div>` : ''}
  </article>`;
}

/* ---------- PROJECTS ---------- */
function tabProjects(co) {
  const m = co.metrics;
  let list = co.projects;
  if (uiState.projectSector !== 'all') list = list.filter((p) => p.sector === uiState.projectSector);
  const sectors = [...new Set(co.projects.map((p) => p.sector))];
  return `
    <div class="grid grid--4">
      ${kpi({ label: 'Proiecte 30 zile', value: fmtInt(m.projects.d30), deltaVal: m.projects.d30 - m.projects.prev30 })}
      ${kpi({ label: 'Proiecte 90 zile', value: fmtInt(m.projects.d90), deltaVal: m.projects.d90 - m.projects.prev90 })}
      ${kpi({ label: 'Proiecte / an', value: fmtInt(m.projects.d365) })}
      ${kpi({ label: 'Ritm', value: `${fmtNum(m.projects.perMonth, 1)}`, sub: 'proiecte / lună' })}
    </div>
    <div class="grid grid--split">
      ${card({ title: 'Proiecte publicate', sub: 'Detectate pe website, social media, YouTube și presă', cls: 'card--flush', body: `
        <div style="padding:12px var(--s5) 0"><select class="select" data-sector style="width:auto;min-width:180px">
          <option value="all">Toate domeniile</option>
          ${sectors.map((s) => `<option value="${esc(s)}" ${uiState.projectSector === s ? 'selected' : ''}>${esc(s)}</option>`).join('')}
        </select></div>
        <div class="rows">${list.slice(0, 30).map((p) => `<div class="row" style="align-items:flex-start">
          <span class="tile-link__icon" style="background:var(--info-soft);color:var(--info)">${icon('layers', 16)}</span>
          <span class="row__main">
            <span class="row__title">${esc(p.name)}</span>
            <span class="row__meta">${esc(p.client)} · ${esc(p.location)} · ${esc(fmtDate(p.date))}${p.size ? ` · ${esc(p.size)}` : ''}</span>
            <span class="topics" style="margin-top:6px">
              <span class="badge badge--info">${esc(p.sector)}</span>
              <span class="badge">${esc(p.type)}</span>
              ${p.products.map((x) => `<span class="chip">${esc(x)}</span>`).join('')}
            </span>
            <span class="hstack" style="margin-top:6px">${sourceLine(p.source, p.date, p.confidence)}
              <a class="btn btn--ghost btn--sm" href="${esc(p.sourceUrl)}" target="_blank" rel="noopener">${icon('external', 13)} Sursă</a>
              <span class="card__sub">${icon('image', 12)} ${p.images} foto</span></span>
          </span>
        </div>`).join('') || empty('Niciun proiect', 'Schimbă filtrul de domeniu.', 'layers')}</div>` })}
      <div class="stack">
        ${card({ title: 'Domenii de activitate', sub: 'Proiecte în ultimul an',
          body: barList(m.projects.bySector.map((s) => ({ k: s.k, v: s.v })), { color: 'var(--hue-teal)' }) })}
        ${card({ title: 'Ritmul proiectelor', sub: '12 luni',
          body: barsChart(monthlyBuckets(co.projects, 12), { h: 180, color: 'var(--hue-teal)', labelEvery: 2 }) })}
      </div>
    </div>`;
}

/* ---------- PRODUCTS ---------- */
function tabProducts(co) {
  const m = co.metrics;
  const active = co.products.filter((p) => !p.removedAt);
  let list = active;
  if (uiState.productCat !== 'all') list = list.filter((p) => p.category === uiState.productCat);
  const news = co.products.filter((p) => p.addedAt > nowMs() - 90 * DAY).slice(0, 8);
  const gone = co.products.filter((p) => p.removedAt && p.removedAt > nowMs() - 180 * DAY).slice(0, 6);

  // cross-market coverage: how many competitors offer the same subcategory
  const coverage = m.products.categories.slice(0, 6).map((c) => {
    const holders = state.companies.filter((x) => x.products.some((p) => !p.removedAt && p.category === c.k));
    return { k: c.k, v: holders.length, total: state.companies.length, mine: c.v };
  });

  return `
    <div class="grid grid--4">
      ${kpi({ label: 'Produse active', value: fmtInt(m.products.total) })}
      ${kpi({ label: 'Produse noi 30z', value: fmtInt(m.products.new30), deltaVal: m.products.new30 })}
      ${kpi({ label: 'Produse noi 90z', value: fmtInt(m.products.new90) })}
      ${kpi({ label: 'Eliminate 90z', value: fmtInt(m.products.removed90), invert: true })}
    </div>
    <div class="grid grid--split">
      ${card({ title: 'Catalog', sub: `${fmtInt(list.length)} produse`, cls: 'card--flush', body: `
        <div style="padding:12px var(--s5) 0"><select class="select" data-pcat style="width:auto;min-width:200px">
          <option value="all">Toate categoriile</option>
          ${m.products.categories.map((c) => `<option value="${esc(c.k)}" ${uiState.productCat === c.k ? 'selected' : ''}>${esc(c.k)} (${c.v})</option>`).join('')}
        </select></div>
        <div class="table-wrap"><table class="table"><thead><tr>
          <th>Produs</th><th>Categorie</th><th>Brand</th><th class="num">Preț</th><th>Status</th></tr></thead>
          <tbody>${list.slice(0, 40).map((p) => `<tr>
            <td><strong>${esc(p.name)}</strong><br><span class="card__sub">${esc(p.subcategory)}</span></td>
            <td>${esc(p.category)}</td><td>${esc(p.brand)}</td>
            <td class="num">${p.price ? fmtMoney(p.price) : `<span class="conf conf--needs">fără preț public</span>`}</td>
            <td>${p.addedAt > nowMs() - 90 * DAY ? '<span class="badge badge--pos">NOU</span>' : ''}
                ${p.promoted ? `<span class="badge badge--warn">-${p.discount}%</span>` : ''}</td>
          </tr>`).join('')}</tbody></table></div>` })}
      <div class="stack">
        ${card({ title: 'Categorii', body: barList(m.products.categories.map((c) => ({ k: c.k, v: c.v })), { color: 'var(--hue-indigo)' }) })}
        ${card({ title: 'Comparație cu piața', sub: 'Câți concurenți acoperă aceeași categorie', body: `
          <div class="stack stack--sm">${coverage.map((c) => `<div>
            <div class="hstack hstack--between" style="font-size:.8125rem">
              <span>${esc(c.k)}</span><strong>${c.v} din ${c.total}</strong></div>
            ${meter((c.v / c.total) * 100, 'var(--accent)')}
          </div>`).join('')}</div>
          <p class="chart-hint" style="margin-top:10px">Ex.: „${esc(coverage[0]?.k || '')}” este oferită de
            ${coverage[0]?.v || 0} din ${state.companies.length} companii monitorizate.</p>` })}
        ${card({ title: 'Produse noi', body: news.length ? `<div class="rows">${news.map((p) => `<div class="row">
          <span class="row__main"><span class="row__title">${esc(p.name)}</span>
          <span class="row__meta">${esc(p.category)} · ${esc(timeAgo(p.addedAt, state.now))}</span></span>
          ${p.price ? `<span class="tnum">${fmtMoney(p.price)}</span>` : ''}</div>`).join('')}</div>`
          : '<p class="card__sub">Niciun produs nou în 90 de zile.</p>' })}
        ${gone.length ? card({ title: 'Produse eliminate', body: `<div class="rows">${gone.map((p) => `<div class="row">
          <span class="row__main"><span class="row__title" style="text-decoration:line-through;color:var(--text-3)">${esc(p.name)}</span>
          <span class="row__meta">${esc(timeAgo(p.removedAt, state.now))}</span></span></div>`).join('')}</div>` }) : ''}
      </div>
    </div>`;
}

/* ---------- PRICES ---------- */
function tabPrices(co) {
  const priced = co.products.filter((p) => !p.removedAt && p.price).slice(0, 40);
  const movers = priced.filter((p) => p.prevPrice && p.price !== p.prevPrice)
    .map((p) => ({ ...p, chg: pctChange(p.price, p.prevPrice) }));
  const bigMoves = sortBy(movers, (p) => Math.abs(p.chg)).slice(0, 5);
  const marketAvg = (sub) => {
    const all = state.companies.flatMap((c) => c.products.filter((p) => p.subcategory === sub && p.price).map((p) => p.price));
    return all.length ? all.reduce((a, b) => a + b, 0) / all.length : null;
  };
  return `
    <div class="grid grid--4">
      ${kpi({ label: 'Produse cu preț public', value: fmtInt(co.metrics.products.withPrice) })}
      ${kpi({ label: 'Modificări de preț', value: fmtInt(movers.length), sub: 'ultima lună' })}
      ${kpi({ label: 'În promoție', value: fmtInt(co.metrics.products.promoted) })}
      ${kpi({ label: 'Discount mediu', value: `${fmtNum(co.products.filter((p) => p.promoted).reduce((s, p) => s + p.discount, 0) / Math.max(1, co.metrics.products.promoted), 0)}%` })}
    </div>
    ${bigMoves.length ? card({ title: 'Alerte de preț', sub: 'Cele mai mari modificări detectate', body: `
      <div class="stack stack--sm">${bigMoves.map((p) => `<div class="hstack hstack--between card card--tight">
        <span><strong>${esc(p.name)}</strong><br><span class="card__sub">${esc(p.category)}</span></span>
        <span class="hstack"><span class="pricecell"><s>${fmtMoney(p.prevPrice)}</s><b>${fmtMoney(p.price)}</b></span>
        ${delta(round(p.chg, 1), { pct: true, decimals: 1, invert: true })}</span>
      </div>`).join('')}</div>` }) : ''}
    ${card({ title: 'Price Monitor', sub: 'Istoric și comparație cu media pieței', cls: 'card--flush', body: `
      <div class="table-wrap"><table class="table"><thead><tr>
        <th>Produs</th><th class="num">Preț curent</th><th class="num">Anterior</th><th class="num">Min</th>
        <th class="num">Max</th><th class="num">Media pieței</th><th class="num">Diferență</th><th>Istoric</th></tr></thead>
        <tbody>${priced.map((p) => {
          const avg = marketAvg(p.subcategory);
          const diff = avg ? pctChange(p.price, avg) : null;
          return `<tr>
            <td><strong>${esc(p.name)}</strong><br><span class="card__sub">${esc(p.subcategory)}</span></td>
            <td class="num"><strong>${fmtMoney(p.price)}</strong>${p.promoted ? ` <span class="badge badge--warn">-${p.discount}%</span>` : ''}</td>
            <td class="num">${p.prevPrice ? fmtMoney(p.prevPrice) : '—'}</td>
            <td class="num">${fmtMoney(p.min)}</td><td class="num">${fmtMoney(p.max)}</td>
            <td class="num">${avg ? fmtMoney(Math.round(avg)) : '—'}</td>
            <td class="num">${diff === null ? '—' : delta(round(diff, 1), { pct: true, decimals: 1, invert: true })}</td>
            <td>${sparkline(p.history, { w: 90, h: 26, color: co.color, fill: false })}</td>
          </tr>`;
        }).join('')}</tbody></table></div>` })}
    <p class="source">${icon('info', 12)} Prețurile sunt colectate din paginile publice ale produsului. ${confBadge('verified')} ${confBadge('estimated', 'media pieței')}</p>`;
}

/* ---------- WEBSITE ---------- */
function tabWebsite(co) {
  const m = co.metrics;
  let list = co.webChanges;
  if (uiState.webType !== 'all') list = list.filter((c) => c.type === uiState.webType);
  const types = [...new Set(co.webChanges.map((c) => c.type))];
  const typeLabel = (t) => co.webChanges.find((c) => c.type === t)?.label || t;
  return `
    <div class="grid grid--4">
      ${kpi({ label: 'Modificări 7 zile', value: fmtInt(m.web.d7) })}
      ${kpi({ label: 'Modificări 30 zile', value: fmtInt(m.web.d30), deltaVal: m.web.d30 - m.web.prev30 })}
      ${kpi({ label: 'Importante 30 zile', value: fmtInt(m.web.important30) })}
      ${kpi({ label: 'Modificări 90 zile', value: fmtInt(m.web.d90) })}
    </div>
    <div class="page__toolbar">
      <select class="select" data-webtype style="width:auto;min-width:220px">
        <option value="all">Toate tipurile de modificări</option>
        ${types.map((t) => `<option value="${esc(t)}" ${uiState.webType === t ? 'selected' : ''}>${esc(typeLabel(t))}</option>`).join('')}
      </select>
      <span class="count-note">${fmtInt(list.length)} modificări detectate</span>
    </div>
    ${card({ title: 'Website Change Monitor', sub: `Crawl zilnic · ${esc(co.website)}`, cls: 'card--flush', body: `
      <div class="rows">${list.slice(0, 30).map((c) => `<div class="row" style="align-items:flex-start;flex-direction:column;gap:8px">
        <span class="hstack hstack--between" style="width:100%">
          <span class="hstack">
            <span class="badge ${c.importance >= 3 ? 'badge--accent' : ''}">${esc(c.label)}</span>
            <span class="card__sub">${esc(c.page)}</span>
          </span>
          <span class="card__sub">${esc(timeAgo(c.date, state.now))}</span>
        </span>
        ${(c.before || c.after) ? `<div class="diff" style="width:100%">
          <div class="diff__col diff__col--before"><div class="diff__label">Before</div>${esc(c.before || '— (nu exista)')}</div>
          <div class="diff__arrow">${icon('arrowRight', 18)}</div>
          <div class="diff__col diff__col--after"><div class="diff__label">After</div>${esc(c.after || '— (eliminat)')}</div>
        </div>` : ''}
        <span class="hstack">${sourceLine('Website crawler', c.date, c.confidence)}
          <a class="btn btn--ghost btn--sm" href="${esc(c.url)}" target="_blank" rel="noopener">${icon('external', 13)} Pagina</a></span>
      </div>`).join('') || empty('Nicio modificare', 'Schimbă filtrul.', 'globe')}</div>` })}`;
}

/* ---------- SOCIAL ---------- */
function tabSocial(co) {
  const m = co.metrics;
  const plats = m.social.platforms;
  if (!plats.length) return `<div class="card card--pad">${empty('Fără conturi social media detectate', '', 'message')}</div>`;
  const contentTypes = [...groupBy(plats.flatMap((p) => p.posts.slice(0, 40)), (p) => p.kind)]
    .map(([k, v]) => ({ k, v: v.length })).sort((a, b) => b.v - a.v);
  return `
    <div class="grid grid--4">
      ${kpi({ label: 'Total urmăritori', value: fmtCompact(m.social.followers), deltaVal: m.social.growth30, sub: '30 zile' })}
      ${kpi({ label: 'Creștere', value: `${m.social.growth30Pct > 0 ? '+' : ''}${fmtNum(m.social.growth30Pct, 1)}%`, sub: '30 zile' })}
      ${kpi({ label: 'Postări 30 zile', value: fmtInt(m.social.posts30), deltaPct: m.social.postsAccel })}
      ${kpi({ label: 'Engagement rate', value: `${fmtNum(m.social.engagementRate, 2)}%` })}
    </div>
    <div class="grid grid--2">
      ${plats.map((p) => `${card({
        title: `${p.label}`,
        sub: `@${esc(p.handle)}`,
        action: `<a class="btn btn--ghost btn--sm" href="${esc(p.url)}" target="_blank" rel="noopener">${icon('external', 14)}</a>`,
        body: `<div class="hstack hstack--between" style="margin-bottom:10px">
            <span><span style="font-size:1.625rem;font-weight:660">${fmtCompact(p.followers)}</span>
              <span class="card__sub">urmăritori</span></span>
            ${delta(round(p.growth30Pct, 1), { pct: true, decimals: 1 })}
          </div>
          ${lineChart([{ data: sliceSeries(p.series, 180), color: co.color }], { h: 130, grid: false })}
          <div class="grid grid--3" style="margin-top:12px;gap:8px">
            <div class="ministat"><b>${p.posts30}</b><span>postări 30z</span></div>
            <div class="ministat"><b>${fmtNum(p.engagementRate, 2)}%</b><span>engagement</span></div>
            <div class="ministat"><b>${fmtNum(p.posts30 / 4.3, 1)}</b><span>postări/săpt.</span></div>
          </div>`,
      })}`).join('')}
    </div>
    <div class="grid grid--split">
      ${card({ title: 'Ultimele postări', cls: 'card--flush', body: `<div class="rows">
        ${sortBy(plats.flatMap((p) => p.posts.slice(0, 12).map((x) => ({ ...x, plat: p }))), (p) => p.date).slice(0, 14)
          .map((p) => `<div class="row">
            <span class="tile-link__icon" style="background:var(--surface-3)">${icon(p.plat.icon, 16)}</span>
            <span class="row__main"><span class="row__title">${esc(p.text)}</span>
              <span class="row__meta">${esc(p.plat.label)} · ${esc(p.kind)} · ${esc(timeAgo(p.date, state.now))}</span></span>
            <span class="card__sub hstack" style="gap:8px">${icon('star', 12)} ${fmtInt(p.likes)}
              ${icon('message', 12)} ${fmtInt(p.comments)}</span>
          </div>`).join('')}</div>` })}
      ${card({ title: 'Tipuri de conținut', sub: 'Ultimele postări clasificate de AI',
        body: barList(contentTypes, { color: 'var(--hue-pink)' }) + `<div style="margin-top:10px">${confBadge('ai')}</div>` })}
    </div>`;
}

/* ---------- YOUTUBE ---------- */
function tabYoutube(co) {
  const y = co.youtube;
  if (!y.present) return `<div class="card card--pad">${empty('Fără canal YouTube detectat', 'Nu am identificat un canal asociat acestei companii.', 'youtube')}</div>`;
  const m = co.metrics.youtube;
  const signals = y.videos.slice(0, 40).flatMap((v) => v.signals.map((s) => ({ ...s, video: v })));
  const byKind = [...groupBy(signals, (s) => s.k)].map(([k, v]) => ({ k, v: v.length })).sort((a, b) => b.v - a.v);
  return `
    <div class="grid grid--4">
      ${kpi({ label: 'Abonați', value: fmtCompact(y.subs), deltaVal: m.subsDelta30.abs, sub: '30 zile' })}
      ${kpi({ label: 'Videoclipuri', value: fmtInt(m.videosTotal), sub: `${m.shorts} Shorts` })}
      ${kpi({ label: 'Video noi 30z', value: fmtInt(m.videos30), deltaVal: m.videos30 - m.videosPrev30 })}
      ${kpi({ label: 'Vizualizări 30z', value: fmtCompact(m.views30) })}
    </div>
    <div class="grid grid--split">
      ${card({ title: 'Evoluția abonaților', body: lineChart([{ data: sliceSeries(y.subsSeries, 365), color: 'var(--hue-red)' }], { h: 200 }) })}
      ${card({ title: 'Frecvența publicării', sub: '12 luni', body: barsChart(monthlyBuckets(y.videos, 12), { h: 200, color: 'var(--hue-red)', labelEvery: 2 }) })}
    </div>
    <div class="grid grid--split">
      ${card({ title: 'Cele mai performante videoclipuri', cls: 'card--flush', body: `<div class="rows">
        ${m.top.map((v) => `<a class="row" href="${esc(v.url)}" target="_blank" rel="noopener">
          <span class="tile-link__icon" style="background:var(--neg-soft);color:var(--neg)">${icon('play', 16, { fill: true })}</span>
          <span class="row__main"><span class="row__title">${esc(v.title)}</span>
            <span class="row__meta">${fmtInt(v.views)} vizualizări · ${fmtInt(v.likes)} aprecieri · ${esc(timeAgo(v.date, state.now))}
            ${v.isShort ? ' · Short' : ''}</span></span>
          <span class="badge">${fmtNum(v.engagement, 1)}%</span></a>`).join('')}</div>` })}
      ${card({ title: 'Semnale comerciale detectate de AI', sub: 'Din titluri, descrieri și transcrieri', body: `
        ${barList(byKind.map((b) => ({ k: b.k, v: b.v })), { color: 'var(--hue-purple)' })}
        <div class="stack stack--sm" style="margin-top:14px">
          ${signals.slice(0, 6).map((s) => `<div class="hstack hstack--between" style="font-size:.8125rem">
            <span><span class="badge badge--accent">${esc(s.k)}</span> ${esc(s.v)}</span>
            <span class="card__sub">${esc(timeAgo(s.video.date, state.now))}</span></div>`).join('')}
        </div>
        <div style="margin-top:10px">${confBadge('ai')}</div>` })}
    </div>
    ${card({ title: 'Toate videoclipurile', cls: 'card--flush', body: `<div class="table-wrap"><table class="table">
      <thead><tr><th>Titlu</th><th>Tip</th><th class="num">Vizualizări</th><th class="num">Aprecieri</th><th class="num">Comentarii</th><th class="num">Engagement</th><th>Data</th></tr></thead>
      <tbody>${y.videos.slice(0, 25).map((v) => `<tr>
        <td>${esc(v.title)}</td><td>${v.isShort ? '<span class="badge">Short</span>' : '<span class="badge">Video</span>'}</td>
        <td class="num">${fmtInt(v.views)}</td><td class="num">${fmtInt(v.likes)}</td><td class="num">${fmtInt(v.comments)}</td>
        <td class="num">${fmtNum(v.engagement, 2)}%</td><td>${esc(fmtDate(v.date))}</td></tr>`).join('')}</tbody></table></div>` })}`;
}

/* ---------- SEO ---------- */
function tabSeo(co) {
  const m = co.metrics.seo, s = co.seo;
  return `
    <div class="grid grid--4">
      ${kpi({ label: 'Vizibilitate SEO', value: `${fmtNum(m.visibility, 1)}%`, deltaVal: m.visDelta30, conf: 'estimated' })}
      ${kpi({ label: 'Keywords în TOP 10', value: fmtInt(m.top10), sub: `din ${s.keywords.length} urmărite` })}
      ${kpi({ label: 'Trafic organic estimat', value: fmtCompact(m.organic), sub: '/ lună', conf: 'estimated' })}
      ${kpi({ label: 'Domenii de referință', value: fmtInt(m.refDomains), sub: `${fmtCompact(m.backlinks)} backlinks`, conf: 'estimated' })}
    </div>
    <div class="grid grid--split">
      ${card({ title: 'Poziții Google', sub: 'Cuvintele-cheie principale ale pieței', cls: 'card--flush', body: `
        <div class="table-wrap"><table class="table"><thead><tr>
          <th>Cuvânt-cheie</th><th class="num">Poziție</th><th class="num">Anterior</th><th class="num">Schimbare</th><th class="num">Volum</th></tr></thead>
          <tbody>${s.keywords.map((k) => `<tr>
            <td>${esc(k.kw)}</td>
            <td class="num"><strong>${k.pos}</strong></td>
            <td class="num">${k.prev}</td>
            <td class="num">${delta(k.delta, { suffix: ' poz.' })}</td>
            <td class="num">${fmtInt(k.volume)}</td></tr>`).join('')}</tbody></table></div>` })}
      <div class="stack">
        ${card({ title: 'Evoluția vizibilității', body: lineChart([{ data: sliceSeries(s.visSeries, 365), color: 'var(--hue-green)' }],
          { h: 180, yFormat: (v) => `${Math.round(v)}%` }) })}
        ${card({ title: 'Keywords', body: `
          <div class="kv">
            <div class="kv__row"><span class="kv__k">Câștigate (30z)</span><span class="kv__v">${delta(m.newKeywords)}</span></div>
            <div class="kv__row"><span class="kv__k">Pierdute (30z)</span><span class="kv__v">${delta(-m.lostKeywords)}</span></div>
            <div class="kv__row"><span class="kv__k">În creștere</span><span class="kv__v">${m.improved}</span></div>
            <div class="kv__row"><span class="kv__k">În scădere</span><span class="kv__v">${m.declined}</span></div>
          </div>
          <p class="source" style="margin-top:12px">${icon('info', 12)} Datele SEO provin din estimări agregate. ${confBadge('estimated')}</p>` })}
      </div>
    </div>`;
}

/* ---------- TRAFFIC ---------- */
function tabTraffic(co) {
  const t = co.traffic;
  return `
    <div class="grid grid--4">
      ${kpi({ label: 'Trafic lunar estimat', value: fmtCompact(t.monthly), deltaPct: co.metrics.traffic.delta, conf: 'estimated' })}
      ${kpi({ label: 'Organic', value: `${t.channels[0].v}%`, conf: 'estimated' })}
      ${kpi({ label: 'Direct', value: `${t.channels[1].v}%`, conf: 'estimated' })}
      ${kpi({ label: 'Paid', value: `${t.channels[4].v}%`, conf: 'estimated' })}
    </div>
    <div class="grid grid--split">
      ${card({ title: 'Trafic lunar', sub: '12 luni · estimare',
        body: lineChart([{ data: t.series, color: co.color }], { h: 220, yFormat: fmtCompact }) })}
      ${card({ title: 'Surse de trafic', body: `<div class="hstack" style="justify-content:center">
        ${donut(t.channels.map((c, i) => ({ k: c.k, v: c.v, color: ['var(--hue-green)', 'var(--hue-blue)', 'var(--hue-pink)', 'var(--hue-orange)', 'var(--hue-purple)'][i] })),
          { center: `<b style="font-size:1.375rem">${fmtCompact(t.monthly)}</b><br><span style="font-size:.6875rem;color:var(--text-3)">vizite/lună</span>` })}</div>
        <div class="chart-legend" style="margin-top:14px;justify-content:center">
          ${t.channels.map((c, i) => `<span class="legend-item"><i class="legend-dot" style="background:${['var(--hue-green)', 'var(--hue-blue)', 'var(--hue-pink)', 'var(--hue-orange)', 'var(--hue-purple)'][i]}"></i>${esc(c.k)} ${c.v}%</span>`).join('')}
        </div>` })}
    </div>
    <div class="grid grid--2">
      ${card({ title: 'Țări principale', body: barList(t.countries.map((c) => ({ k: c.k, v: c.v })), { format: (v) => `${fmtNum(v, 1)}%`, color: 'var(--hue-teal)' }) })}
      ${card({ title: 'Pagini principale', body: barList(t.topPages.map((p) => ({ k: p.url, v: p.share })), { format: (v) => `${fmtNum(v, 1)}%` }) })}
    </div>
    <p class="source">${icon('info', 12)} Sursă: ${esc(t.source)} ${confBadge('estimated')} — datele estimate sunt marcate distinct de cele observate direct.</p>`;
}

/* ---------- ADS ---------- */
function tabAds(co) {
  const active = co.ads.filter((a) => a.active);
  const byProduct = [...groupBy(co.ads, (a) => a.category)].map(([k, v]) => ({ k, v: v.length })).sort((a, b) => b.v - a.v);
  return `
    <div class="grid grid--4">
      ${kpi({ label: 'Campanii active', value: fmtInt(active.length) })}
      ${kpi({ label: 'Campanii noi 30z', value: fmtInt(co.metrics.ads.new30), deltaVal: co.metrics.ads.new30 - co.metrics.ads.prev30 })}
      ${kpi({ label: 'Creative', value: fmtInt(co.ads.reduce((s, a) => s + a.creatives, 0)) })}
      ${kpi({ label: 'Platforme', value: fmtInt(new Set(co.ads.map((a) => a.platform)).size) })}
    </div>
    ${card({ title: 'Advertising Monitor', sub: 'Reclame identificate în bibliotecile publice', cls: 'card--flush', body: `
      <div class="table-wrap"><table class="table"><thead><tr>
        <th>Mesaj</th><th>Platformă</th><th>Produs promovat</th><th>Start</th><th>Durată</th><th>Status</th><th>Landing</th></tr></thead>
        <tbody>${co.ads.slice(0, 25).map((a) => `<tr>
          <td><strong>${esc(a.message)}</strong></td>
          <td><span class="badge">${esc(a.platform)}</span></td>
          <td>${esc(a.product)}</td>
          <td>${esc(fmtDate(a.start))}</td>
          <td class="num">${Math.round((Math.min(a.end, nowMs()) - a.start) / DAY)} zile</td>
          <td>${a.active ? '<span class="badge badge--pos badge--dot">ACTIVĂ</span>' : '<span class="badge">încheiată</span>'}</td>
          <td><a href="${esc(a.landing)}" target="_blank" rel="noopener">${icon('external', 14)}</a></td>
        </tr>`).join('')}</tbody></table></div>` })}
    <div class="grid grid--2">
      ${card({ title: 'Categorii promovate', body: barList(byProduct, { color: 'var(--hue-pink)' }) })}
      ${card({ title: 'Interpretare', body: `<p style="color:var(--text-2)">
        ${active.length >= 6
          ? `<strong>${esc(co.name)}</strong> promovează agresiv: ${active.length} campanii active, concentrate pe
             <strong>${esc(byProduct[0]?.k || '')}</strong>. Posibilă împingere comercială pe acest segment.`
          : active.length
            ? `Activitate publicitară moderată — ${active.length} campanii active, focus pe ${esc(byProduct[0]?.k || '')}.`
            : 'Nicio campanie publicitară activă detectată.'}
        </p><div style="margin-top:10px">${confBadge('ai')}</div>` })}
    </div>`;
}

/* ---------- JOBS ---------- */
function tabJobs(co) {
  const m = co.metrics.jobs;
  const sales = m.byDept.find((d) => d.k === 'Vânzări')?.v || 0;
  const tech = (m.byDept.find((d) => d.k === 'Tehnic')?.v || 0) + (m.byDept.find((d) => d.k === 'Producție')?.v || 0);
  return `
    <div class="grid grid--4">
      ${kpi({ label: 'Joburi active', value: fmtInt(m.active) })}
      ${kpi({ label: 'Noi 30 zile', value: fmtInt(m.new30), deltaVal: m.new30 - m.prev30 })}
      ${kpi({ label: 'Noi 90 zile', value: fmtInt(m.new90) })}
      ${kpi({ label: 'Durata medie', value: `${m.avgDaysActive} zile`, sub: 'cât rămâne activ un anunț' })}
    </div>
    <div class="grid grid--split">
      ${card({ title: 'Anunțuri de angajare', cls: 'card--flush', body: `<div class="rows">
        ${co.jobs.slice(0, 25).map((j) => `<div class="row">
          <span class="tile-link__icon" style="background:rgba(140,70,212,.14);color:var(--hue-purple)">${icon('briefcase', 16)}</span>
          <span class="row__main"><span class="row__title">${esc(j.title)}</span>
            <span class="row__meta">${esc(j.department)} · ${esc(j.location)} · publicat ${esc(timeAgo(j.date, state.now))} · sursă ${esc(j.source)}</span></span>
          ${j.active ? '<span class="badge badge--pos">ACTIV</span>' : '<span class="badge">închis</span>'}
        </div>`).join('')}</div>` })}
      <div class="stack">
        ${card({ title: 'Departamente', sub: '90 de zile', body: barList(m.byDept, { color: 'var(--hue-purple)' }) })}
        ${card({ title: 'Semnal AI', body: `<p style="color:var(--text-2)">
          ${m.new30 >= 3
            ? `„${esc(co.name)} a publicat în ultimele 30 de zile ${m.new30} poziții noi${sales ? `, dintre care ${sales} în vânzări` : ''}${tech ? ` și ${tech} tehnice` : ''}. Posibil semnal de extindere.”`
            : `Activitate de recrutare redusă — ${m.new30} poziții noi în ultimele 30 de zile.`}
          </p><div style="margin-top:10px">${confBadge('ai')}</div>` })}
      </div>
    </div>`;
}

/* ---------- NEWS ---------- */
function tabNews(co) {
  const clusters = [...groupBy(co.news, (n) => n.type)];
  return `
    <div class="grid grid--4">
      ${kpi({ label: 'Mențiuni 30 zile', value: fmtInt(co.metrics.news.d30) })}
      ${kpi({ label: 'Mențiuni 90 zile', value: fmtInt(co.metrics.news.d90) })}
      ${kpi({ label: 'Total urmărite', value: fmtInt(co.metrics.news.total) })}
      ${kpi({ label: 'Duplicate grupate', value: fmtInt(co.news.reduce((s, n) => s + n.duplicates, 0)), sub: 'de AI' })}
    </div>
    <div class="grid grid--split">
      ${card({ title: 'News & PR Monitor', cls: 'card--flush', body: `<div class="rows">
        ${co.news.slice(0, 25).map((n) => `<a class="row" href="${esc(n.url)}" target="_blank" rel="noopener">
          <span class="tile-link__icon" style="background:var(--warn-soft);color:var(--warn)">${icon('news', 16)}</span>
          <span class="row__main"><span class="row__title">${esc(n.title)}</span>
            <span class="row__meta">${esc(n.source)} · ${esc(fmtDate(n.date))}
            ${n.duplicates ? ` · <span class="badge">+${n.duplicates} articole similare grupate</span>` : ''}</span></span>
          <span class="badge badge--info">${esc(n.typeLabel)}</span></a>`).join('') || empty('Nicio mențiune', '', 'news')}</div>` })}
      ${card({ title: 'Tipuri de mențiuni', body: barList(clusters.map(([k, v]) => ({
        k: v[0].typeLabel, v: v.length })).sort((a, b) => b.v - a.v), { color: 'var(--hue-orange)' }) })}
    </div>`;
}

/* ---------- TENDERS ---------- */
function tabTenders(co) {
  const t = co.metrics.tenders;
  return `
    <div class="grid grid--4">
      ${kpi({ label: 'Participări', value: fmtInt(t.total) })}
      ${kpi({ label: 'Contracte câștigate', value: fmtInt(t.won) })}
      ${kpi({ label: 'Valoare câștigată', value: fmtMoney(t.value) })}
      ${kpi({ label: 'Rata de succes', value: `${t.total ? Math.round((t.won / t.total) * 100) : 0}%` })}
    </div>
    ${card({ title: 'Licitații publice', sub: 'Sursă: mtender.gov.md', cls: 'card--flush', body: co.tenders.length ? `
      <div class="table-wrap"><table class="table"><thead><tr>
        <th>Obiect</th><th>Instituție</th><th class="num">Valoare</th><th>Data</th><th>Status</th><th>Competitori</th></tr></thead>
        <tbody>${co.tenders.map((x) => `<tr>
          <td>${esc(x.title)}</td><td>${esc(x.institution)}</td>
          <td class="num">${fmtMoney(x.value)}</td><td>${esc(fmtDate(x.date))}</td>
          <td>${x.status === 'won' ? '<span class="badge badge--pos">CÂȘTIGAT</span>'
            : x.status === 'lost' ? '<span class="badge badge--neg">PIERDUT</span>'
            : '<span class="badge badge--warn">ÎN CURS</span>'}</td>
          <td class="card__sub">${esc(x.competitors.join(', '))}</td></tr>`).join('')}</tbody></table></div>`
      : empty('Nicio licitație publică găsită', '', 'gavel') })}`;
}

/* ---------- TIMELINE ---------- */
function tabTimeline(co) {
  const all = buildTimeline(co, nowMs(), 180, 500);
  const kinds = [...new Set(all.map((t) => t.kind))];
  const list = uiState.tlKind === 'all' ? all : all.filter((t) => t.kind === uiState.tlKind);
  const byDay = groupBy(list.slice(0, 120), (t) => dayLabel(t.date, state.now));
  const kindLabel = { review: 'Recenzii', project: 'Proiecte', product: 'Produse', web: 'Website',
    social: 'Social', video: 'YouTube', job: 'Joburi', news: 'Știri', ad: 'Reclame', tender: 'Licitații' };
  return `
    <div class="page__toolbar">
      <div class="filters">
        <button class="chip" data-tlkind="all" aria-pressed="${uiState.tlKind === 'all'}">Toate</button>
        ${kinds.map((k) => `<button class="chip" data-tlkind="${k}" aria-pressed="${uiState.tlKind === k}">${esc(kindLabel[k] || k)}</button>`).join('')}
      </div>
      <span class="count-note">${fmtInt(list.length)} evenimente / 180 zile</span>
    </div>
    ${card({ title: 'Activity Timeline', sub: 'Toate sursele într-o singură cronologie', body: `
      <div class="timeline">${[...byDay].map(([day, arr]) => `
        <div class="tl-day">${esc(day)}</div>
        ${arr.map((t) => `<div class="tl-item">
          <span class="tl-item__dot" style="color:${t.color}">${icon(t.icon, 15)}</span>
          <div class="tl-item__body">
            <a class="tl-item__title" href="${t.link || '#'}" style="color:inherit">${esc(t.title)}</a>
            <span class="tl-item__meta">${esc(t.meta || '')} · ${esc(timeAgo(t.date, state.now))} ${confBadge(t.confidence || 'verified')}</span>
          </div></div>`).join('')}`).join('')}
      </div>` })}`;
}

/* ---------- AI ANALYSIS ---------- */
function tabAi(co) {
  const m = co.metrics;
  const ti = trendingIssues(co.reviews, nowMs(), 30);
  const sov = state.market.sov.find((s) => s.id === co.id);
  const threats = state.threats.filter((t) => t.companyId === co.id);
  const opps = state.opportunities.filter((o) => o.companies.includes(co.id));
  const topicsOverTime = [90, 60, 30].map((d) => ({
    d, top: topicStats(co.reviews, d, nowMs(), 'neg').slice(0, 3).map((t) => t.label).join(', ') || '—',
  }));
  const summary = [
    `**${co.name}** are un Activity Score de *${co.scores.activity}/100* și un Momentum de *${co.scores.momentum > 0 ? '+' : ''}${co.scores.momentum}%*. ` +
    `${co.scores.momentum > 15 ? 'Compania accelerează vizibil pe mai multe canale.'
      : co.scores.momentum < -10 ? 'Activitatea companiei este în scădere față de perioada precedentă.'
      : 'Activitatea este relativ stabilă.'}`,
    `Reputația online: rating *${fmtNum(m.reviews.rating, 2)}* (${m.reviews.ratingDelta30 >= 0 ? '+' : ''}${m.reviews.ratingDelta30} în 30 de zile), ` +
    `${m.reviews.sentimentPct.pos}% recenzii pozitive, rata de răspuns *${m.reviews.responseRate90}%*` +
    `${m.reviews.avgResponseHours ? `, timp mediu de răspuns ${m.reviews.avgResponseHours} ore` : ''}.`,
    ti.rising[0]
      ? `Principala problemă în creștere: **${ti.rising[0].label.toLowerCase()}** — ${ti.rising[0].now} mențiuni negative în 30 de zile (*${ti.rising[0].pct > 0 ? '+' : ''}${round(ti.rising[0].pct, 0)}%*).`
      : 'Nu au fost detectate probleme în creștere în ultimele 30 de zile.',
    `Prezență comercială: *${m.projects.d90}* proiecte publicate în 90 de zile, *${m.products.new90}* produse noi, ` +
    `*${m.jobs.new90}* anunțuri de angajare și *${m.ads.active}* campanii publicitare active.`,
    sov ? `Share of Voice în piață: *${sov.share}%* din activitatea observată (locul ${state.market.sov.findIndex((s) => s.id === co.id) + 1} din ${state.market.sov.length}).` : '',
  ].filter(Boolean);

  return `
    ${card({ title: 'AI Competitive Analysis', sub: `Generat din toate modulele · ${esc(fmtDate(state.now))}`, body: `
      <div class="brief__body">${summary.map((p) => `<p>${fmtMd(p)}</p>`).join('')}</div>
      <div class="hstack" style="margin-top:12px">${confBadge('ai')}
        <a class="btn btn--ghost btn--sm" href="#/assistant">${icon('sparkles', 14)} Întreabă asistentul despre ${esc(co.name)}</a></div>` })}
    <div class="grid grid--split">
      ${card({ title: 'Evoluția temelor negative', sub: 'Cum se schimbă subiectele în timp', body: `
        <div class="table-wrap"><table class="table"><thead><tr><th>Fereastră</th><th>Teme dominante</th></tr></thead>
        <tbody>${topicsOverTime.map((t) => `<tr><td>Ultimele ${t.d} zile</td><td>${esc(t.top)}</td></tr>`).join('')}</tbody></table></div>` })}
      ${card({ title: 'Sentiment pe teme', body: barList(
        topicStats(co.reviews, 90, nowMs(), 'neg').slice(0, 6).map((t) => ({ k: t.label, v: t.now, color: 'var(--neg)' })),
        { color: 'var(--neg)' }) })}
    </div>
    <div class="grid grid--2">
      ${card({ title: 'Amenințări detectate', body: threats.length ? threats.map((t) => `
        <div class="card card--tight"><div class="hstack" style="margin-bottom:6px">${threatBadge(t.level)}<strong>${esc(t.title)}</strong></div>
        <p style="font-size:.875rem;color:var(--text-2)">${esc(t.body)}</p>
        <ul style="margin-top:8px;display:grid;gap:4px">${t.signals.map((s) => `<li style="font-size:.8125rem;color:var(--text-3)">• ${esc(s)}</li>`).join('')}</ul></div>`).join('')
        : '<p class="card__sub">Nicio amenințare semnificativă detectată pentru această companie.</p>' })}
      ${card({ title: 'Oportunități legate', body: opps.length ? opps.map((o) => `
        <div class="card card--tight"><strong>${esc(o.title)}</strong>
        <p style="font-size:.875rem;color:var(--text-2);margin-top:4px">${esc(o.body)}</p></div>`).join('')
        : '<p class="card__sub">Nicio oportunitate directă legată de această companie.</p>' })}
    </div>`;
}

/* ---------- render ---------- */
const RENDERERS = {
  overview: tabOverview, gmb: tabGmb, reviews: tabReviews, projects: tabProjects, products: tabProducts,
  prices: tabPrices, website: tabWebsite, social: tabSocial, youtube: tabYoutube, seo: tabSeo,
  traffic: tabTraffic, ads: tabAds, jobs: tabJobs, news: tabNews, tenders: tabTenders,
  timeline: tabTimeline, ai: tabAi,
};

export function render(ctx) {
  const co = getCompany(ctx.params.id);
  if (!co) return `<div class="card card--pad">${empty('Compania nu a fost găsită', 'Verifică linkul.', 'building')}</div>`;
  const tab = ctx.params.tab && RENDERERS[ctx.params.tab] ? ctx.params.tab : 'overview';
  return `${header(co, tab)}${RENDERERS[tab](co)}`;
}

export function mount(host, ctx) {
  const co = getCompany(ctx.params.id);
  if (!co) return;
  const rerender = () => { host.innerHTML = render(ctx); };
  host.addEventListener('click', (e) => {
    const w = e.target.closest('[data-watch]');
    if (w) { toggleWatch(w.dataset.watch); toast('Monitorizare actualizată', 'ok', 1500); return rerender(); }
    const f = e.target.closest('[data-rfilter]'); if (f) { uiState.reviewFilter = f.dataset.rfilter; return rerender(); }
    const k = e.target.closest('[data-tlkind]'); if (k) { uiState.tlKind = k.dataset.tlkind; return rerender(); }
    if (e.target.closest('[data-export]')) {
      toast('Raport pregătit pentru export (PDF / XLSX)', 'ok', 2600);
      return;
    }
    if (e.target.closest('[data-merge]')) {
      openSheet({
        title: 'Verifică și unește duplicatele',
        body: `<p class="card__sub">Carepack a legat următoarele identități la aceeași companie:</p>
          <div class="card card--flush"><div class="rows">
            ${[['building2', 'Companie juridică', co.legalName], ['tag', 'Brand comercial', co.name],
               ['globe', 'Website', co.website], ['mapPin', 'Google Maps', co.gmb.name],
               ...Object.entries(co.socials).filter(([, v]) => v).map(([k2, v]) => [k2, k2[0].toUpperCase() + k2.slice(1), v])]
              .map(([ic, label, val]) => `<div class="row">${icon(ic, 16)}
                <span class="row__main"><span class="row__title">${esc(val)}</span>
                <span class="row__meta">${esc(label)}</span></span>
                <span class="badge badge--pos">legat</span></div>`).join('')}
          </div></div>
          <p class="source">${icon('info', 12)} Potrivirile au fost confirmate prin IDNO, website și linkuri reciproce.</p>`,
        foot: `<button class="btn btn--secondary" data-sheet-close>Închide</button>`,
      });
    }
  });
  host.addEventListener('change', (e) => {
    if (e.target.matches('[data-rtopic]')) { uiState.reviewTopic = e.target.value; rerender(); }
    if (e.target.matches('[data-sector]')) { uiState.projectSector = e.target.value; rerender(); }
    if (e.target.matches('[data-webtype]')) { uiState.webType = e.target.value; rerender(); }
    if (e.target.matches('[data-pcat]')) { uiState.productCat = e.target.value; rerender(); }
  });
}
