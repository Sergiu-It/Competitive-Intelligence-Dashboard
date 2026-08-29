/* ============================================================
   AI Competitive Intelligence Assistant (spec §30)
   Answers are computed from the platform's own data and always
   cite the modules they came from.
   ============================================================ */
import { state, brief } from '../data/store.js';
import { trendingIssues, topicStats, inWindow } from '../data/analytics.js';
import { icon } from '../ui/icons.js';
import { card, coAvatar, confBadge, delta } from '../ui/components.js';
import { esc, fmtInt, fmtNum, fmtCompact, sortBy, round, timeAgo, DAY } from '../util.js';
import { fmtMd } from './dashboard.js';

let log = [];
export const title = () => 'Asistent AI';

const SUGGESTIONS = [
  'Ce competitor a crescut cel mai mult în ultimele 90 de zile?',
  'Care sunt principalele reclamații despre MetalDepo?',
  'Ce produse noi au apărut în ultimele 30 de zile?',
  'Cine a publicat cele mai multe proiecte?',
  'Ce competitor pare că se extinde?',
  'Care sunt cele mai importante 5 schimbări din piață luna aceasta?',
  'Compară ViTRA cu MetalDepo',
  'Cine are cel mai bun rating?',
];

function findCompanies(q) {
  const t = q.toLowerCase();
  return state.companies.filter((c) => t.includes(c.name.toLowerCase()) || t.includes(c.id));
}

/* ---------- answer engine ---------- */
export function answer(q) {
  const t = q.toLowerCase();
  const nowMs = state.now.getTime();
  const cos = findCompanies(q);
  const src = (label, href) => ({ label, href });

  // compare two companies
  if ((t.includes('compar') || t.includes(' vs ')) && cos.length >= 2) {
    const [a, b] = cos;
    const rows = [
      ['Rating', fmtNum(a.metrics.reviews.rating, 2), fmtNum(b.metrics.reviews.rating, 2)],
      ['Recenzii 30z', a.metrics.reviews.d30, b.metrics.reviews.d30],
      ['Proiecte 90z', a.metrics.projects.d90, b.metrics.projects.d90],
      ['Produse noi 90z', a.metrics.products.new90, b.metrics.products.new90],
      ['Urmăritori', fmtCompact(a.metrics.social.followers), fmtCompact(b.metrics.social.followers)],
      ['Activity Score', a.scores.activity, b.scores.activity],
      ['Momentum', `${a.scores.momentum > 0 ? '+' : ''}${a.scores.momentum}%`, `${b.scores.momentum > 0 ? '+' : ''}${b.scores.momentum}%`],
    ];
    return {
      text: `**${a.name}** vs. **${b.name}** — pe datele din ultimele 90 de zile:`,
      table: { head: ['Indicator', a.name, b.name], rows },
      after: `${a.scores.activity > b.scores.activity ? a.name : b.name} este mai activ, iar ` +
             `${a.scores.momentum > b.scores.momentum ? a.name : b.name} accelerează mai rapid.`,
      sources: [src('Comparație completă', `#/compare?a=${a.id}`), src(a.name, `#/company/${a.id}`), src(b.name, `#/company/${b.id}`)],
    };
  }

  // complaints about a company
  if ((t.includes('reclamaț') || t.includes('problem') || t.includes('nemulțum') || t.includes('negativ')) && cos.length) {
    const co = cos[0];
    const ti = trendingIssues(co.reviews, nowMs, 90);
    const neg = co.reviews.filter((r) => r.sentiment === 'neg').slice(0, 3);
    return {
      text: `Principalele reclamații despre **${co.name}** (90 de zile, ${co.metrics.reviews.sentiment.neg} recenzii negative):`,
      bullets: ti.allNeg.slice(0, 5).map((x) => `**${x.label}** — ${x.now} mențiuni (${x.pct > 0 ? '+' : ''}${round(x.pct, 0)}% față de perioada anterioară)`),
      after: neg.length ? `Exemplu recent: „${neg[0].text}” (${neg[0].stars}★, ${timeAgo(neg[0].date, state.now)}).` : '',
      sources: [src(`Recenzii ${co.name}`, `#/company/${co.id}/reviews`), src('Analiză AI', `#/company/${co.id}/ai`)],
    };
  }

  // growth / momentum
  if (t.includes('crescut') || t.includes('creștere') || t.includes('momentum') || t.includes('accelere')) {
    const top = sortBy(state.companies, (c) => c.scores.momentum).slice(0, 4);
    return {
      text: 'Clasamentul după **Momentum Score** (ultimele 30 vs. 30 de zile anterioare):',
      bullets: top.map((c, i) => `${i + 1}. **${c.name}** — momentum *${c.scores.momentum > 0 ? '+' : ''}${c.scores.momentum}%*, ` +
        `Activity Score ${c.scores.activity}/100 (${c.metrics.projects.d90} proiecte/90z, ${c.metrics.social.posts30} postări/30z)`),
      after: `${top[0].name} este compania cu cea mai rapidă accelerare din piață.`,
      sources: [src('Market Overview', '#/market'), src(top[0].name, `#/company/${top[0].id}`)],
    };
  }

  // new products
  if (t.includes('produs')) {
    const rows = sortBy(state.companies, (c) => c.metrics.products.new30).slice(0, 5);
    const total = state.companies.reduce((s, c) => s + c.metrics.products.new30, 0);
    const examples = state.companies.flatMap((c) => c.products.filter((p) => p.addedAt > nowMs - 30 * DAY)
      .slice(0, 2).map((p) => ({ ...p, co: c }))).slice(0, 4);
    return {
      text: `În ultimele 30 de zile au apărut **${total} produse noi** în piață:`,
      bullets: rows.filter((c) => c.metrics.products.new30).map((c) => `**${c.name}** — ${c.metrics.products.new30} produse noi (${c.metrics.products.total} active)`),
      after: examples.length ? `Exemple: ${examples.map((e) => `${e.name} (${e.co.name})`).join(', ')}.` : '',
      sources: [src('Product Intelligence', `#/company/${rows[0].id}/products`), src('Piață', '#/market')],
    };
  }

  // projects
  if (t.includes('proiect')) {
    const rows = sortBy(state.companies, (c) => c.metrics.projects.d90).slice(0, 5);
    return {
      text: 'Cine publică cele mai multe proiecte (ultimele 90 de zile):',
      bullets: rows.map((c) => `**${c.name}** — ${c.metrics.projects.d90} proiecte, ritm ${fmtNum(c.metrics.projects.perMonth, 1)}/lună, ` +
        `cel mai activ pe ${c.metrics.projects.bySector[0]?.k || '—'}`),
      after: `Total în piață: ${state.market.totals.projects30} proiecte publicate în ultimele 30 de zile.`,
      sources: [src('Proiecte ' + rows[0].name, `#/company/${rows[0].id}/projects`)],
    };
  }

  // expansion signals
  if (t.includes('extind') || t.includes('angaj') || t.includes('recrut') || t.includes('job')) {
    const rows = sortBy(state.companies, (c) => c.metrics.jobs.new90).slice(0, 4);
    const top = rows[0];
    return {
      text: 'Semnale de extindere (recrutare + proiecte + produse noi):',
      bullets: rows.map((c) => `**${c.name}** — ${c.metrics.jobs.new90} anunțuri în 90z (${c.metrics.jobs.active} active), ` +
        `${c.metrics.projects.d90} proiecte, ${c.metrics.products.new90} produse noi`),
      after: `„${top.name} a publicat în ultimele 30 de zile ${top.metrics.jobs.new30} poziții noi. Posibil semnal de extindere.”`,
      sources: [src(`Joburi ${top.name}`, `#/company/${top.id}/jobs`), src('Amenințări', '#/signals')],
    };
  }

  // rating / reputation
  if (t.includes('rating') || t.includes('reputaț') || t.includes('recenzi')) {
    const rows = sortBy(state.companies, (c) => c.metrics.reviews.rating).slice(0, 5);
    return {
      text: 'Clasament după rating Google:',
      bullets: rows.map((c) => `**${c.name}** — ${fmtNum(c.metrics.reviews.rating, 2)}★ ` +
        `(${fmtInt(c.metrics.reviews.total)} recenzii, ${c.metrics.reviews.d30} noi în 30z, răspuns la ${c.metrics.reviews.responseRate90}%)`),
      after: `Rating mediu în piață: ${fmtNum(state.market.avgRating, 2)}.`,
      sources: [src('Market Overview', '#/market')],
    };
  }

  // biggest changes
  if (t.includes('schimbări') || t.includes('important') || t.includes('luna aceasta') || t.includes('noutăț')) {
    const events = sortBy(state.companies.flatMap((c) => (c.timeline || []).slice(0, 12).map((e) => ({ ...e, co: c }))),
      (e) => (e.kind === 'project' ? e.date + 5 * DAY : e.kind === 'news' ? e.date + 4 * DAY : e.date)).slice(0, 5);
    return {
      text: 'Cele mai importante 5 schimbări din piață în ultima perioadă:',
      bullets: events.map((e) => `**${e.co.name}** — ${e.title} (${timeAgo(e.date, state.now)})`),
      after: state.threats[0] ? `Atenție: ${state.threats[0].body}` : '',
      sources: [src('Timeline piață', '#/'), src('Semnale', '#/signals')],
    };
  }

  // single company summary
  if (cos.length === 1) {
    const co = cos[0];
    const m = co.metrics;
    return {
      text: `**${co.name}** — rezumat pe baza tuturor modulelor:`,
      bullets: [
        `Rating *${fmtNum(m.reviews.rating, 2)}* (${m.reviews.ratingDelta30 >= 0 ? '+' : ''}${m.reviews.ratingDelta30} în 30z), ${fmtInt(m.reviews.total)} recenzii`,
        `${m.projects.d90} proiecte în 90 de zile, ritm ${fmtNum(m.projects.perMonth, 1)}/lună`,
        `${fmtCompact(m.social.followers)} urmăritori (${m.social.growth30Pct > 0 ? '+' : ''}${fmtNum(m.social.growth30Pct, 1)}% în 30z), ${m.social.posts30} postări`,
        `${m.products.total} produse active, ${m.products.new90} noi în 90 de zile`,
        `Activity Score *${co.scores.activity}/100*, Momentum *${co.scores.momentum > 0 ? '+' : ''}${co.scores.momentum}%*, threat ${co.scores.threat.toUpperCase()}`,
      ],
      sources: [src(`Profil ${co.name}`, `#/company/${co.id}`), src('Analiză AI', `#/company/${co.id}/ai`)],
    };
  }

  // fallback → weekly brief
  const b = brief('weekly');
  return {
    text: 'Iată ce am observat recent în piață:',
    bullets: b.paragraphs.map((p) => p.replace(/\*\*/g, '**')),
    after: 'Poți întreba despre o companie anume, despre reclamații, proiecte, produse noi, prețuri sau extindere.',
    sources: [src('Brief complet', '#/reports'), src('Market Overview', '#/market')],
  };
}

/* ---------- rendering ---------- */
function msgHtml(m) {
  if (m.role === 'me') return `<div class="chat__msg chat__msg--me"><div class="chat__bubble">${esc(m.text)}</div></div>`;
  const a = m.data;
  return `<div class="chat__msg">
    <span class="ai-mark">${icon('sparkles', 15)}</span>
    <div class="chat__bubble">
      <p>${fmtMd(a.text)}</p>
      ${a.bullets ? `<ul>${a.bullets.map((b) => `<li>${fmtMd(b)}</li>`).join('')}</ul>` : ''}
      ${a.table ? `<div class="table-wrap" style="margin-top:10px"><table class="table">
        <thead><tr>${a.table.head.map((h) => `<th>${esc(h)}</th>`).join('')}</tr></thead>
        <tbody>${a.table.rows.map((r) => `<tr>${r.map((c, i) => `<td class="${i ? 'num' : ''}">${esc(c)}</td>`).join('')}</tr>`).join('')}</tbody>
      </table></div>` : ''}
      ${a.after ? `<p style="margin-top:8px">${fmtMd(a.after)}</p>` : ''}
      <div class="chat__sources">${confBadge('ai')}
        ${(a.sources || []).map((s) => `<a class="chip" href="${s.href}">${icon('link', 12)} ${esc(s.label)}</a>`).join('')}</div>
    </div>
  </div>`;
}

export function render() {
  return `
    <header class="page__header">
      <span class="page__eyebrow">Inteligență</span>
      <h1 class="page__title">Asistent AI</h1>
      <p class="page__lede">Întreabă orice despre datele din platformă. Răspunsurile sunt calculate din modulele monitorizate
        și indică sursele.</p>
    </header>
    <div class="chat">
      <div class="chat__log" data-log>
        ${log.length ? log.map(msgHtml).join('') : `<div class="chat__msg">
          <span class="ai-mark">${icon('sparkles', 15)}</span>
          <div class="chat__bubble">
            <p>Bună! Sunt asistentul Carepack. Am acces la recenzii, proiecte, produse, prețuri, website, social media,
            YouTube, SEO, trafic, reclame, joburi, știri și licitații pentru ${state.companies.length} companii.</p>
            <p style="margin-top:8px">Încearcă una dintre întrebările de mai jos.</p>
          </div></div>`}
      </div>
      <div class="stack stack--sm">
        <div class="suggestions">${SUGGESTIONS.map((s) => `<button class="chip" data-ask="${esc(s)}">${esc(s)}</button>`).join('')}</div>
        <form class="chat__composer" data-form="ask">
          <input class="input" name="q" placeholder="Întreabă despre concurență…" autocomplete="off" style="border-radius:99px">
          <button class="btn btn--primary btn--icon" type="submit" aria-label="Trimite">${icon('send', 18)}</button>
        </form>
      </div>
    </div>`;
}

export function mount(host) {
  const logEl = host.querySelector('[data-log]');
  const input = host.querySelector('input[name="q"]');

  const ask = (q) => {
    if (!q.trim()) return;
    log.push({ role: 'me', text: q });
    logEl.insertAdjacentHTML('beforeend', msgHtml(log[log.length - 1]));
    const typing = document.createElement('div');
    typing.className = 'chat__msg';
    typing.innerHTML = `<span class="ai-mark">${icon('sparkles', 15)}</span>
      <div class="chat__bubble"><span class="typing"><i></i><i></i><i></i></span></div>`;
    logEl.appendChild(typing);
    typing.scrollIntoView({ block: 'end', behavior: 'smooth' });
    setTimeout(() => {
      const data = answer(q);
      typing.remove();
      log.push({ role: 'ai', data });
      logEl.insertAdjacentHTML('beforeend', msgHtml(log[log.length - 1]));
      logEl.lastElementChild.scrollIntoView({ block: 'end', behavior: 'smooth' });
    }, 520);
  };

  host.addEventListener('submit', (e) => {
    if (e.target.matches('[data-form="ask"]')) {
      e.preventDefault();
      const q = input.value;
      input.value = '';
      ask(q);
    }
  });
  host.addEventListener('click', (e) => {
    const s = e.target.closest('[data-ask]');
    if (s) ask(s.dataset.ask);
  });
}
