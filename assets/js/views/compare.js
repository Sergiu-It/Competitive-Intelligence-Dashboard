/* ============================================================
   Compare companies (spec §22)
   ============================================================ */
import { state } from '../data/store.js';
import { icon } from '../ui/icons.js';
import { coAvatar, delta, segmented, threatBadge, card, empty, toast } from '../ui/components.js';
import { radarChart, barList, sparkline } from '../ui/charts.js';
import { sliceSeries } from '../data/analytics.js';
import { esc, fmtInt, fmtNum, fmtCompact, sortBy, round, periodDays } from '../util.js';

let picked = null;
let period = '30';

export const title = () => 'Comparație';

function selection(ctx) {
  if (picked) return picked;
  const pre = ctx?.query?.a;
  const own = state.companies.find((c) => c.isOwn);
  const top = sortBy(state.companies.filter((c) => !c.isOwn), (c) => c.scores.activity).slice(0, 2);
  picked = [own?.id, ...(pre ? [pre] : []), ...top.map((c) => c.id)]
    .filter((v, i, a) => v && a.indexOf(v) === i).slice(0, 4);
  return picked;
}

const ROWS = [
  { k: 'Rating Google', get: (c) => c.metrics.reviews.rating, fmt: (v) => fmtNum(v, 2), best: 'max' },
  { k: 'Recenzii totale', get: (c) => c.metrics.reviews.total, fmt: fmtInt, best: 'max' },
  { k: 'Recenzii noi', get: (c, d) => c.metrics.reviews[`d${d}`] ?? c.metrics.reviews.d30, fmt: fmtInt, best: 'max' },
  { k: 'Ritm recenzii (accel.)', get: (c) => c.metrics.reviews.accel, fmt: (v) => `${v > 0 ? '+' : ''}${v}%`, best: 'max' },
  { k: 'Rata de răspuns', get: (c) => c.metrics.reviews.responseRate90, fmt: (v) => `${v}%`, best: 'max' },
  { k: 'Timp mediu răspuns', get: (c) => c.metrics.reviews.avgResponseHours ?? 999, fmt: (v) => (v === 999 ? '—' : `${v}h`), best: 'min' },
  { k: 'Sentiment pozitiv', get: (c) => c.metrics.reviews.sentimentPct.pos, fmt: (v) => `${v}%`, best: 'max' },
  { k: 'Proiecte (90 zile)', get: (c) => c.metrics.projects.d90, fmt: fmtInt, best: 'max' },
  { k: 'Proiecte / lună', get: (c) => c.metrics.projects.perMonth, fmt: (v) => fmtNum(v, 1), best: 'max' },
  { k: 'Produse active', get: (c) => c.metrics.products.total, fmt: fmtInt, best: 'max' },
  { k: 'Produse noi (90 zile)', get: (c) => c.metrics.products.new90, fmt: fmtInt, best: 'max' },
  { k: 'Urmăritori social', get: (c) => c.metrics.social.followers, fmt: fmtCompact, best: 'max' },
  { k: 'Creștere social 30z', get: (c) => c.metrics.social.growth30Pct, fmt: (v) => `${v > 0 ? '+' : ''}${fmtNum(v, 1)}%`, best: 'max' },
  { k: 'Postări (30 zile)', get: (c) => c.metrics.social.posts30, fmt: fmtInt, best: 'max' },
  { k: 'Engagement rate', get: (c) => c.metrics.social.engagementRate, fmt: (v) => `${fmtNum(v, 2)}%`, best: 'max' },
  { k: 'Abonați YouTube', get: (c) => (c.metrics.youtube.present ? c.metrics.youtube.subs : 0), fmt: fmtCompact, best: 'max' },
  { k: 'Video (30 zile)', get: (c) => (c.metrics.youtube.present ? c.metrics.youtube.videos30 : 0), fmt: fmtInt, best: 'max' },
  { k: 'Vizibilitate SEO', get: (c) => c.metrics.seo.visibility, fmt: (v) => `${fmtNum(v, 1)}%`, best: 'max' },
  { k: 'Keywords TOP 10', get: (c) => c.metrics.seo.top10, fmt: fmtInt, best: 'max' },
  { k: 'Trafic lunar (est.)', get: (c) => c.metrics.traffic.monthly, fmt: fmtCompact, best: 'max' },
  { k: 'Joburi noi (90 zile)', get: (c) => c.metrics.jobs.new90, fmt: fmtInt, best: 'max' },
  { k: 'Modificări website 30z', get: (c) => c.metrics.web.d30, fmt: fmtInt, best: 'max' },
  { k: 'Campanii active', get: (c) => c.metrics.ads.active, fmt: fmtInt, best: 'max' },
  { k: 'Activity Score', get: (c) => c.scores.activity, fmt: (v) => `${v}/100`, best: 'max' },
  { k: 'Momentum Score', get: (c) => c.scores.momentum, fmt: (v) => `${v > 0 ? '+' : ''}${v}%`, best: 'max' },
];

export function render(ctx) {
  const sel = selection(ctx).map((id) => state.companies.find((c) => c.id === id)).filter(Boolean);
  const d = periodDays(period);
  return `
    <header class="page__header">
      <span class="page__eyebrow">Analiză comparativă</span>
      <h1 class="page__title">Compară companii</h1>
      <p class="page__lede">Selectează 2–6 companii și compară toți indicatorii pe perioada dorită.</p>
    </header>
    <div class="card card--pad stack stack--sm">
      <span class="section-title">Companii selectate (${sel.length})</span>
      <div class="filters">
        ${state.companies.map((c) => `<button class="chip" data-pick="${c.id}" aria-pressed="${sel.some((s) => s.id === c.id)}">
          <span class="legend-dot" style="background:${c.color}"></span>${esc(c.name)}</button>`).join('')}
      </div>
      <div class="hstack" style="margin-top:8px">
        <span class="section-title">Perioadă</span>
        ${segmented([{ id: '7', label: '7 zile' }, { id: '30', label: '30 zile' }, { id: '90', label: '90 zile' },
          { id: '180', label: '6 luni' }, { id: '365', label: '1 an' }], period, 'cperiod')}
      </div>
    </div>
    ${sel.length < 2 ? `<div class="card card--pad">${empty('Selectează cel puțin 2 companii', 'Alege companiile de mai sus.', 'compare')}</div>` : `
      <div class="grid grid--split">
        ${card({ title: 'Competitive Radar', body: `<div class="radar-wrap">
          ${radarChart(['REPUTATION', 'COMMERCIAL', 'DIGITAL', 'GROWTH'], sel.map((c) => ({
            name: c.name, color: c.color, values: [c.scores.reputation, c.scores.commercial, c.scores.digital, c.scores.growth],
          })), { size: 340 })}
          <div class="radar-legend">${sel.map((c) => `<span class="legend-item">
            <i class="legend-dot" style="background:${c.color}"></i>${esc(c.name)}</span>`).join('')}</div></div>` })}
        ${card({ title: 'Scoruri', body: `
          <div class="stack">
            <div><span class="section-title">Activity Score</span>
              ${barList(sel.map((c) => ({ k: c.name, v: c.scores.activity, color: c.color })), { max: 100 })}</div>
            <div><span class="section-title">Momentum</span>
              ${barList(sel.map((c) => ({ k: c.name, v: c.scores.momentum, color: c.scores.momentum >= 0 ? 'var(--pos)' : 'var(--neg)' })),
                { format: (v) => `${v > 0 ? '+' : ''}${v}%` })}</div>
          </div>` })}
      </div>
      ${card({ title: 'Comparație detaliată', sub: `Perioada selectată: ${esc(d)} de zile`, cls: 'card--flush', body: `
        <div class="cmp-wrap"><table class="cmp"><thead><tr><th>Indicator</th>
          ${sel.map((c) => `<th><a class="cmp__co" href="#/company/${c.id}" style="color:inherit">
            ${coAvatar(c, 'sm')}<strong style="font-size:.8125rem">${esc(c.name)}</strong>
            ${c.isOwn ? '<span class="badge badge--accent">EU</span>' : threatBadge(c.scores.threat)}</a></th>`).join('')}
        </tr></thead><tbody>
          ${ROWS.map((r) => {
            const vals = sel.map((c) => r.get(c, d));
            const best = r.best === 'max' ? Math.max(...vals) : Math.min(...vals);
            return `<tr><th>${esc(r.k)}</th>${vals.map((v) => `
              <td class="${v === best && sel.length > 1 ? 'best' : ''}">${r.fmt(v)}</td>`).join('')}</tr>`;
          }).join('')}
        </tbody></table></div>` })}
      ${card({ title: 'Evoluția recenziilor', sub: 'Cumulat — 12 luni', body: `
        <div class="stack stack--sm">${sel.map((c) => `<div class="hstack">
          <span style="min-width:130px" class="hstack">${coAvatar(c, 'sm')}<strong style="font-size:.8125rem">${esc(c.name)}</strong></span>
          <span style="flex:1">${sparkline(sliceSeries(c.gmb.series, 365), { w: 400, h: 34, color: c.color })}</span>
          <span class="tnum" style="min-width:70px;text-align:right">${fmtInt(c.metrics.reviews.total)}</span>
        </div>`).join('')}</div>` })}
    `}`;
}

export function mount(host, ctx) {
  host.addEventListener('click', (e) => {
    const p = e.target.closest('[data-pick]');
    if (p) {
      const id = p.dataset.pick;
      const cur = selection(ctx);
      let next = cur.includes(id) ? cur.filter((x) => x !== id) : [...cur, id];
      if (next.length > 6) { toast('Maxim 6 companii în comparație', 'info', 1800); return; }
      picked = next;
      host.innerHTML = render(ctx);
      return;
    }
    const s = e.target.closest('[data-cperiod]');
    if (s) { period = s.dataset.cperiod; host.innerHTML = render(ctx); }
  });
}
