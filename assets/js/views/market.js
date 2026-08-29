/* ============================================================
   Market Overview (spec §29) + Share of Voice (§17)
   ============================================================ */
import { state } from '../data/store.js';
import { icon } from '../ui/icons.js';
import { coAvatar, delta, card, threatBadge, confBadge, segmented } from '../ui/components.js';
import { barList, stackedBar, scatterChart, radarChart, donut, barsChart } from '../ui/charts.js';
import { esc, fmtInt, fmtNum, fmtCompact, sortBy, round } from '../util.js';

export const title = () => 'Piață';

function leaderCard(t, rows, fmt = fmtInt, ic = 'trendUp') {
  return card({
    title: t,
    body: `<div class="rows">${rows.map((r, i) => `<a class="row" href="#/company/${r.id}" style="padding-inline:0">
      <span class="badge ${i === 0 ? 'badge--accent' : ''}">${i + 1}</span>
      <span class="row__main"><span class="row__title">${esc(r.name)}</span></span>
      <strong class="tnum">${fmt(r.v)}</strong></a>`).join('')}</div>`,
  });
}

export function render() {
  const m = state.market;
  const list = state.companies;
  const sov = m.sov;
  return `
    <header class="page__header">
      <span class="page__eyebrow">Market Intelligence</span>
      <h1 class="page__title">Privire de ansamblu asupra pieței</h1>
      <p class="page__lede">${list.length} companii · ${esc(fmtInt(m.totals.reviews30))} recenzii, ${esc(fmtInt(m.totals.projects30))} proiecte
        și ${esc(fmtInt(m.totals.products30))} produse noi în ultimele 30 de zile.</p>
    </header>
    <div class="grid grid--4">
      <div class="ministat"><b>${fmtNum(m.avgRating, 2)}</b><span>Rating mediu în piață</span></div>
      <div class="ministat"><b>${fmtInt(m.totals.posts30)}</b><span>Postări sociale / 30z</span></div>
      <div class="ministat"><b>${fmtInt(m.totals.videos30)}</b><span>Videoclipuri / 30z</span></div>
      <div class="ministat"><b>${fmtInt(m.totals.jobs30)}</b><span>Anunțuri de angajare / 30z</span></div>
      <div class="ministat"><b>${fmtInt(m.totals.web30)}</b><span>Modificări website / 30z</span></div>
      <div class="ministat"><b>${fmtInt(m.totals.ads)}</b><span>Campanii active</span></div>
      <div class="ministat"><b>${fmtInt(list.reduce((s, c) => s + c.metrics.news.d30, 0))}</b><span>Mențiuni în presă / 30z</span></div>
      <div class="ministat"><b>${fmtInt(list.reduce((s, c) => s + c.metrics.tenders.d365, 0))}</b><span>Licitații / an</span></div>
    </div>
    <div class="grid grid--split">
      ${card({ title: 'Share of Voice', sub: 'Din activitatea observată — ultimele 90 de zile', body: `
        ${stackedBar(sov.map((s) => ({ k: s.name, v: s.total, color: s.color })), { h: 16 })}
        <div style="margin-top:16px">${barList(sov.map((s) => ({ k: s.name, v: s.share, color: s.color })),
          { format: (v) => `${fmtNum(v, 1)}%` })}</div>
        <p class="chart-hint" style="margin-top:10px">Compus din recenzii, postări, proiecte, știri, YouTube și reclame.</p>` })}
      ${card({ title: 'Poziționare', sub: 'Activitate vs. Momentum', body: scatterChart(list.map((c) => ({
        x: c.scores.activity, y: c.scores.momentum, name: c.name, color: c.color, own: !!c.isOwn })), { h: 320 }) })}
    </div>
    <div class="grid grid--3">
      ${leaderCard('Cei mai activi', m.leaders.active, (v) => `${v}/100`)}
      ${leaderCard('Cea mai rapidă creștere', m.leaders.momentum, (v) => `${v > 0 ? '+' : ''}${v}%`)}
      ${leaderCard('Cele mai multe recenzii (30z)', m.leaders.reviews)}
      ${leaderCard('Cele mai multe proiecte (90z)', m.leaders.projects)}
      ${leaderCard('Cei mai activi la recrutare', m.leaders.jobs)}
      ${leaderCard('Cel mai bun engagement', m.leaders.engagement, (v) => `${fmtNum(v, 2)}%`)}
      ${leaderCard('Cele mai multe produse noi', m.leaders.products)}
      ${leaderCard('Cea mai mare vizibilitate SEO', m.leaders.visibility, (v) => `${fmtNum(v, 1)}%`)}
      ${card({ title: 'Probleme dominante în piață', sub: 'Din recenziile tuturor companiilor', body: `
        ${barList(m.topics.allNeg.slice(0, 6).map((t) => ({ k: t.label, v: t.now, color: 'var(--neg)' })))}
        <div style="margin-top:10px">${confBadge('ai')}</div>` })}
    </div>
    ${card({ title: 'Clasament complet', cls: 'card--flush', body: `
      <div class="table-wrap"><table class="table table--clickable"><thead><tr>
        <th>#</th><th>Companie</th><th class="num">Rating</th><th class="num">Recenzii 30z</th>
        <th class="num">Proiecte 90z</th><th class="num">Produse noi</th><th class="num">Urmăritori</th>
        <th class="num">SEO</th><th class="num">Activity</th><th class="num">Momentum</th><th class="num">SoV</th><th>Threat</th>
      </tr></thead><tbody>
        ${sortBy(list, (c) => c.scores.activity).map((c, i) => `<tr data-go="#/company/${c.id}">
          <td>${i + 1}</td>
          <td><span class="hstack hstack--nowrap">${coAvatar(c, 'sm')}<strong>${esc(c.name)}</strong>
            ${c.isOwn ? '<span class="badge badge--accent">EU</span>' : ''}</span></td>
          <td class="num">${fmtNum(c.metrics.reviews.rating, 2)}</td>
          <td class="num">${fmtInt(c.metrics.reviews.d30)}</td>
          <td class="num">${fmtInt(c.metrics.projects.d90)}</td>
          <td class="num">${fmtInt(c.metrics.products.new90)}</td>
          <td class="num">${fmtCompact(c.metrics.social.followers)}</td>
          <td class="num">${fmtNum(c.metrics.seo.visibility, 0)}%</td>
          <td class="num"><strong>${c.scores.activity}</strong></td>
          <td class="num">${delta(c.scores.momentum, { pct: true })}</td>
          <td class="num">${fmtNum(sov.find((s) => s.id === c.id)?.share || 0, 1)}%</td>
          <td>${threatBadge(c.scores.threat)}</td>
        </tr>`).join('')}
      </tbody></table></div>` })}`;
}

export function mount(host) {
  host.addEventListener('click', (e) => {
    const row = e.target.closest('[data-go]');
    if (row && !e.target.closest('a')) location.hash = row.dataset.go;
  });
}
