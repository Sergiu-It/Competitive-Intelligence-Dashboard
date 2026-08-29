/* ============================================================
   Companies — listă, filtre, adăugare + descoperire automată surse
   ============================================================ */
import { state, toggleWatch, addMonitoredCompany } from '../data/store.js';
import { icon } from '../ui/icons.js';
import { coAvatar, delta, threatBadge, segmented, empty, toast, openSheet, closeSheet, confBadge } from '../ui/components.js';
import { sparkline, scoreRing } from '../ui/charts.js';
import { sliceSeries } from '../data/analytics.js';
import { esc, fmtInt, fmtNum, sortBy, slugify, debounce } from '../util.js';
import { companyCard } from './dashboard.js';

let view = 'grid';
let sortKey = 'activity';
let query = '';
let filter = 'all';

export const title = () => 'Companii';

const SORTS = [
  { id: 'activity', label: 'Activity Score', fn: (c) => c.scores.activity },
  { id: 'momentum', label: 'Momentum', fn: (c) => c.scores.momentum },
  { id: 'rating', label: 'Rating', fn: (c) => c.metrics.reviews.rating },
  { id: 'reviews', label: 'Recenzii', fn: (c) => c.metrics.reviews.total },
  { id: 'projects', label: 'Proiecte 90z', fn: (c) => c.metrics.projects.d90 },
];

function list() {
  let l = state.companies;
  if (filter === 'watch') l = l.filter((c) => state.watchlist.includes(c.id) || c.isOwn);
  if (filter === 'threat') l = l.filter((c) => c.scores.threat === 'high' || c.scores.threat === 'medium');
  if (query) {
    const q = query.toLowerCase();
    l = l.filter((c) => [c.name, c.legalName, c.website, c.idno, c.city, ...c.domains].join(' ').toLowerCase().includes(q));
  }
  const s = SORTS.find((x) => x.id === sortKey) || SORTS[0];
  return sortBy(l, s.fn);
}

function tableView(l) {
  return `<div class="card card--flush"><div class="table-wrap"><table class="table table--clickable">
    <thead><tr>
      <th>Companie</th><th class="num">Rating</th><th class="num">Recenzii</th>
      <th class="num">30z</th><th class="num">Proiecte 90z</th><th class="num">Produse noi</th>
      <th class="num">Social</th><th class="num">Activity</th><th class="num">Momentum</th><th>Threat</th><th></th>
    </tr></thead>
    <tbody>${l.map((c) => `<tr data-go="#/company/${c.id}">
      <td><span class="hstack hstack--nowrap">${coAvatar(c, 'sm')}
        <span><strong>${esc(c.name)}</strong><br><span class="card__sub">${esc(c.website)}</span></span></span></td>
      <td class="num">${fmtNum(c.metrics.reviews.rating, 2)}</td>
      <td class="num">${fmtInt(c.metrics.reviews.total)}</td>
      <td class="num">${delta(c.metrics.reviews.d30)}</td>
      <td class="num">${fmtInt(c.metrics.projects.d90)}</td>
      <td class="num">${fmtInt(c.metrics.products.new90)}</td>
      <td class="num">${fmtInt(c.metrics.social.followers)}</td>
      <td class="num"><strong>${c.scores.activity}</strong></td>
      <td class="num">${delta(c.scores.momentum, { pct: true })}</td>
      <td>${threatBadge(c.scores.threat)}</td>
      <td><button class="btn btn--icon btn--secondary" data-watch="${c.id}" aria-label="Urmărește"
        title="${state.watchlist.includes(c.id) ? 'Nu mai urmări' : 'Urmărește'}">
        ${icon(state.watchlist.includes(c.id) ? 'eye' : 'eyeOff', 16)}</button></td>
    </tr>`).join('')}</tbody></table></div></div>`;
}

export function render() {
  const l = list();
  return `
    <header class="page__header">
      <span class="page__eyebrow">Monitorizare</span>
      <h1 class="page__title">Companii</h1>
      <p class="page__lede">${state.companies.length} companii monitorizate automat — Google Maps, website, social media, YouTube, joburi, SEO, știri și licitații.</p>
    </header>
    <div class="page__toolbar">
      <div class="search" style="flex:1;min-width:220px">
        <span class="search__icon">${icon('search', 16)}</span>
        <input class="input" type="search" placeholder="Caută după nume, website, IDNO…" data-q value="${esc(query)}">
      </div>
      ${segmented([{ id: 'all', label: 'Toate' }, { id: 'watch', label: 'Urmărite' }, { id: 'threat', label: 'Threat' }], filter, 'filter')}
      <select class="select" data-sort style="width:auto;min-width:160px">
        ${SORTS.map((s) => `<option value="${s.id}" ${s.id === sortKey ? 'selected' : ''}>Sortare: ${esc(s.label)}</option>`).join('')}
      </select>
      ${segmented([{ id: 'grid', label: 'Carduri' }, { id: 'table', label: 'Tabel' }], view, 'view')}
      <button class="btn btn--primary" data-action="add-company">${icon('plus', 16)} Adaugă companie</button>
    </div>
    ${state.addedCompanies.length ? `<div class="card card--pad stack stack--sm">
      <span class="section-title">În curs de descoperire</span>
      ${state.addedCompanies.map((a) => `<div class="hstack hstack--between">
        <span class="hstack">${icon('refresh', 16)}<strong>${esc(a.name)}</strong>
        <span class="card__sub">${esc(a.website || a.idno || '')}</span></span>
        <span class="badge badge--warn badge--dot">DISCOVERING</span></div>`).join('')}
    </div>` : ''}
    ${l.length ? (view === 'grid'
      ? `<div class="grid grid--cards">${l.map((c) => companyCard(c).replace('width:min(300px,84vw);', '')).join('')}</div>`
      : tableView(l))
      : `<div class="card card--pad">${empty('Nicio companie găsită', 'Modifică filtrele sau caută altceva.', 'building')}</div>`}
  `;
}

export function mount(host) {
  const rerender = () => { host.innerHTML = render(); };
  host.addEventListener('click', (e) => {
    const f = e.target.closest('[data-filter]'); if (f) { filter = f.dataset.filter; return rerender(); }
    const v = e.target.closest('[data-view]'); if (v) { view = v.dataset.view; return rerender(); }
    const w = e.target.closest('[data-watch]');
    if (w) { e.preventDefault(); e.stopPropagation(); toggleWatch(w.dataset.watch); toast('Listă de monitorizare actualizată', 'ok', 1600); return rerender(); }
    const row = e.target.closest('[data-go]');
    if (row) location.hash = row.dataset.go;
  });
  host.addEventListener('change', (e) => {
    if (e.target.matches('[data-sort]')) { sortKey = e.target.value; rerender(); }
  });
  host.addEventListener('input', debounce((e) => {
    if (e.target.matches('[data-q]')) {
      query = e.target.value;
      rerender();
      const input = host.querySelector('[data-q]');
      if (input) { input.focus(); input.setSelectionRange(input.value.length, input.value.length); }
    }
  }, 260));
}

/* ---------- Add company + source discovery (spec: identificare automată) ---------- */
const DISCOVERY = [
  { icon: 'mapPin', label: 'Google Business Profile', detail: 'profil găsit după denumire + adresă' },
  { icon: 'globe', label: 'Website oficial', detail: 'sitemap.xml indexat, 148 pagini' },
  { icon: 'facebook', label: 'Pagină Facebook', detail: 'potrivire după website și denumire' },
  { icon: 'instagram', label: 'Cont Instagram', detail: 'link din bio identic cu website-ul' },
  { icon: 'linkedin', label: 'Pagină LinkedIn', detail: 'potrivire după IDNO și denumire juridică' },
  { icon: 'youtube', label: 'Canal YouTube', detail: 'link din footer-ul site-ului' },
  { icon: 'tiktok', label: 'Cont TikTok', detail: 'potrivire după handle' },
  { icon: 'briefcase', label: 'Anunțuri de angajare', detail: 'rabota.md, delucru.md' },
  { icon: 'news', label: 'Mențiuni în presă', detail: '8 surse media monitorizate' },
  { icon: 'gavel', label: 'Licitații publice', detail: 'mtender.gov.md după IDNO' },
  { icon: 'seo', label: 'Vizibilitate SEO', detail: '15 cuvinte-cheie ale pieței' },
];

export function openAddCompanySheet() {
  openSheet({
    title: 'Adaugă o companie în monitorizare',
    wide: true,
    body: `
      <p class="card__sub">Introdu cel puțin un element de identificare. Carepack caută automat toate sursele publice asociate.</p>
      <form class="stack" data-form="add">
        <div class="field"><label class="field__label" for="cname">Denumire comercială *</label>
          <input class="input" id="cname" name="name" required placeholder="ex. MetalDepo"></div>
        <div class="grid grid--2" style="gap:12px">
          <div class="field"><label class="field__label" for="cweb">Website</label>
            <input class="input" id="cweb" name="website" placeholder="metaldepo.md"></div>
          <div class="field"><label class="field__label" for="cidno">IDNO / cod fiscal</label>
            <input class="input" id="cidno" name="idno" inputmode="numeric" placeholder="1011600028744"></div>
        </div>
        <div class="grid grid--2" style="gap:12px">
          <div class="field"><label class="field__label" for="clegal">Denumire juridică</label>
            <input class="input" id="clegal" name="legalName" placeholder="METAL DEPO GRUP SRL"></div>
          <div class="field"><label class="field__label" for="ccity">Oraș</label>
            <input class="input" id="ccity" name="city" placeholder="Chișinău"></div>
        </div>
        <div class="field"><label class="field__label" for="cnotes">Alte identificatoare (Google Maps, pagini social media)</label>
          <textarea class="textarea" id="cnotes" name="notes" placeholder="linkuri, separate prin linii noi"></textarea></div>
      </form>
      <div data-discovery hidden class="stack stack--sm">
        <span class="section-title">Surse identificate automat</span>
        <div class="stack stack--sm" data-discovery-list></div>
      </div>`,
    foot: `<button class="btn btn--secondary" data-sheet-close>Anulează</button>
      <button class="btn btn--primary" data-start-discovery>${icon('search', 16)} Identifică sursele</button>`,
    onMount(rootEl) {
      const form = rootEl.querySelector('[data-form="add"]');
      const box = rootEl.querySelector('[data-discovery]');
      const listEl = rootEl.querySelector('[data-discovery-list]');
      const btn = rootEl.querySelector('[data-start-discovery]');
      btn.addEventListener('click', () => {
        const f = Object.fromEntries(new FormData(form).entries());
        if (!f.name) { toast('Introdu cel puțin denumirea companiei', 'err'); return; }
        if (btn.dataset.stage === 'confirm') {
          addMonitoredCompany({ name: f.name, website: f.website, idno: f.idno, legalName: f.legalName, city: f.city });
          closeSheet();
          toast(`${f.name} a fost adăugată. Prima colectare rulează în fundal.`, 'ok', 4000);
          if (location.hash === '#/companies') window.dispatchEvent(new HashChangeEvent('hashchange'));
          return;
        }
        btn.dataset.stage = 'confirm';
        btn.innerHTML = `<span class="btn__spinner"></span> Se caută…`;
        box.hidden = false;
        listEl.innerHTML = '';
        DISCOVERY.forEach((d, i) => setTimeout(() => {
          listEl.insertAdjacentHTML('beforeend', `<div class="hstack hstack--between card card--tight" style="animation:fadeUp .3s var(--ease-out)">
            <span class="hstack">${icon(d.icon, 18)}<span><strong style="font-size:.875rem">${esc(d.label)}</strong>
              <br><span class="card__sub">${esc(d.detail)}</span></span></span>
            ${confBadge(i < 7 ? 'verified' : 'ai')}</div>`);
          listEl.parentElement.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
          if (i === DISCOVERY.length - 1) {
            btn.innerHTML = `${icon('check', 16)} Confirmă și pornește monitorizarea`;
          }
        }, 260 * (i + 1)));
      });
    },
  });
}
