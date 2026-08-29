/* ============================================================
   Carepack — application bootstrap & shell
   ============================================================ */
import { initStore, state, setTheme, unreadAlerts, pendingUsers, trackActivity, logout } from './data/store.js';
import { route, setNotFound, start } from './router.js';
import { icon } from './ui/icons.js';
import { esc, initials, debounce } from './util.js';
import { toast, empty, openSheet, closeSheet } from './ui/components.js';

import * as Auth from './views/auth.js';
import * as Dashboard from './views/dashboard.js';
import * as Companies from './views/companies.js';
import * as Company from './views/company.js';
import * as Compare from './views/compare.js';
import * as Market from './views/market.js';
import * as Signals from './views/signals.js';
import * as Alerts from './views/alerts.js';
import * as Assistant from './views/assistant.js';
import * as Reports from './views/reports.js';
import * as Admin from './views/admin.js';
import * as Settings from './views/settings.js';

const NAV = [
  {
    group: 'Analiză', items: [
      { id: 'dashboard', href: '#/', label: 'Dashboard', icon: 'dashboard' },
      { id: 'market', href: '#/market', label: 'Piață', icon: 'market' },
      { id: 'companies', href: '#/companies', label: 'Companii', icon: 'building' },
      { id: 'compare', href: '#/compare', label: 'Comparație', icon: 'compare' },
    ],
  },
  {
    group: 'Semnale', items: [
      { id: 'signals', href: '#/signals', label: 'Oportunități & Amenințări', icon: 'target' },
      { id: 'alerts', href: '#/alerts', label: 'Alerte', icon: 'bell', count: () => unreadAlerts().length },
      { id: 'reports', href: '#/reports', label: 'Rapoarte AI', icon: 'report' },
    ],
  },
  {
    group: 'Inteligență', items: [
      { id: 'assistant', href: '#/assistant', label: 'Asistent AI', icon: 'sparkles' },
    ],
  },
  {
    group: 'Administrare', items: [
      { id: 'admin', href: '#/admin', label: 'Admin', icon: 'shield', count: () => pendingUsers().length },
      { id: 'settings', href: '#/settings', label: 'Setări', icon: 'settings' },
    ],
  },
];

const TABBAR = [
  { id: 'dashboard', href: '#/', label: 'Acasă', icon: 'dashboard' },
  { id: 'companies', href: '#/companies', label: 'Companii', icon: 'building' },
  { id: 'alerts', href: '#/alerts', label: 'Alerte', icon: 'bell', count: () => unreadAlerts().length },
  { id: 'assistant', href: '#/assistant', label: 'AI', icon: 'sparkles' },
  { id: 'more', href: '#more', label: 'Mai mult', icon: 'menu' },
];

let activeNav = 'dashboard';
let currentView = null;

/* ---------- shell ---------- */
function navItem(it) {
  const n = it.count ? it.count() : 0;
  return `<a class="navitem" href="${it.href}" data-nav="${it.id}" ${activeNav === it.id ? 'aria-current="page"' : ''}>
    <span class="navitem__icon">${icon(it.icon, 19)}</span>
    <span class="navitem__label">${esc(it.label)}</span>
    ${n ? `<span class="navitem__count">${n}</span>` : ''}
  </a>`;
}

function sidebarHtml() {
  const s = state.session;
  return `<aside class="sidebar">
    <div class="sidebar__brand">
      <span class="sidebar__logo">${icon('radar', 20)}</span>
      <span>
        <span class="sidebar__name">Carepack</span><br>
        <span class="sidebar__tag">Competitive Intelligence</span>
      </span>
    </div>
    <div class="sidebar__scroll">
      ${NAV.map((g) => `<div class="sidebar__group">
        <div class="sidebar__grouplabel">${esc(g.group)}</div>
        ${g.items.map(navItem).join('')}
      </div>`).join('')}
    </div>
    <div class="sidebar__foot">
      <button class="userchip" data-action="user-menu">
        <span class="avatar" style="background:linear-gradient(140deg,var(--accent),var(--hue-purple))">${esc(initials(s?.name || 'Guest'))}</span>
        <span style="flex:1;min-width:0;text-align:left">
          <span class="userchip__name">${esc(s?.name || 'Vizitator')}</span><br>
          <span class="userchip__role">${esc(roleLabel(s?.role))}</span>
        </span>
        ${icon('more', 16)}
      </button>
    </div>
  </aside>`;
}

export function roleLabel(role) {
  return ({ SUPER_ADMIN: 'Super Admin', ADMIN: 'Admin', ANALYST: 'Analyst', VIEWER: 'Viewer' })[role] || 'Viewer';
}

function tabbarHtml() {
  return `<nav class="tabbar">${TABBAR.map((t) => {
    const n = t.count ? t.count() : 0;
    return `<a class="tabbar__item" href="${t.href}" data-nav="${t.id}" ${activeNav === t.id ? 'aria-current="page"' : ''}>
      <span style="position:relative">${icon(t.icon, 22)}${n ? `<span style="position:absolute;top:-3px;right:-6px;min-width:15px;height:15px;border-radius:99px;background:var(--neg);color:#fff;font-size:9px;font-weight:700;display:grid;place-items:center;padding:0 3px">${n > 9 ? '9+' : n}</span>` : ''}</span>
      <span>${esc(t.label)}</span></a>`;
  }).join('')}</nav>`;
}

function shellHtml() {
  return `<div class="app-shell">
    ${sidebarHtml()}
    <div class="main">
      <header class="topbar">
        <button class="btn btn--icon btn--secondary" data-action="drawer" aria-label="Meniu">${icon('menu', 20)}</button>
        <span class="topbar__title" id="topbar-title">Carepack</span>
        <div class="topbar__actions">
          <button class="btn btn--icon btn--secondary" data-action="search" aria-label="Caută">${icon('search', 18)}</button>
          <button class="btn btn--icon btn--secondary" data-action="theme" aria-label="Temă">${icon('sun', 18)}</button>
        </div>
      </header>
      <div class="deskbar">
        <div class="search" style="flex:1">
          <span class="search__icon">${icon('search', 16)}</span>
          <input class="input" type="search" placeholder="Caută companie, produs, proiect, cuvânt-cheie…" data-global-search>
        </div>
        <span style="flex:1"></span>
        <button class="btn btn--secondary btn--sm" data-action="add-company">${icon('plus', 16)} Adaugă companie</button>
        <button class="btn btn--icon btn--secondary" data-action="theme" aria-label="Schimbă tema">${icon('moon', 18)}</button>
        <button class="btn btn--icon btn--secondary" data-action="user-menu" aria-label="Cont">${icon('user', 18)}</button>
      </div>
      <main class="page" id="view" tabindex="-1"></main>
    </div>
    ${tabbarHtml()}
  </div>`;
}

function refreshChrome() {
  document.querySelectorAll('[data-nav]').forEach((el) => {
    if (el.dataset.nav === activeNav) el.setAttribute('aria-current', 'page');
    else el.removeAttribute('aria-current');
  });
  // refresh badges
  document.querySelectorAll('.sidebar .navitem').forEach((el) => {
    const id = el.dataset.nav;
    const def = NAV.flatMap((g) => g.items).find((i) => i.id === id);
    const n = def?.count ? def.count() : 0;
    const badge = el.querySelector('.navitem__count');
    if (n && badge) badge.textContent = n;
    else if (n && !badge) el.insertAdjacentHTML('beforeend', `<span class="navitem__count">${n}</span>`);
    else if (!n && badge) badge.remove();
  });
}

/* ---------- drawer (mobile full nav) ---------- */
function openDrawer() {
  const wrap = document.createElement('div');
  wrap.innerHTML = `<div class="drawer-backdrop" data-drawer-close></div>
    <div class="drawer">
      <div class="sidebar__brand">
        <span class="sidebar__logo">${icon('radar', 20)}</span>
        <span><span class="sidebar__name">Carepack</span><br><span class="sidebar__tag">Competitive Intelligence</span></span>
      </div>
      <div class="sidebar__scroll" style="flex:1">
        ${NAV.map((g) => `<div class="sidebar__group">
          <div class="sidebar__grouplabel">${esc(g.group)}</div>
          ${g.items.map(navItem).join('')}
        </div>`).join('')}
      </div>
      <div class="sidebar__foot">
        <button class="btn btn--block btn--secondary" data-action="add-company">${icon('plus', 16)} Adaugă companie</button>
      </div>
    </div>`;
  document.getElementById('sheet-root').appendChild(wrap);
  wrap.addEventListener('click', (e) => {
    if (e.target.closest('[data-drawer-close]') || e.target.closest('a')) wrap.remove();
  });
}

/* ---------- global search ---------- */
function globalSearch(q) {
  const term = q.trim().toLowerCase();
  if (!term) return [];
  const out = [];
  for (const co of state.companies) {
    if (co.name.toLowerCase().includes(term) || co.website.includes(term) || co.idno.includes(term))
      out.push({ kind: 'Companie', label: co.name, sub: co.website, href: `#/company/${co.id}`, color: co.color });
    co.products.slice(0, 400).forEach((p) => {
      if (out.length < 40 && p.name.toLowerCase().includes(term))
        out.push({ kind: 'Produs', label: p.name, sub: `${co.name} · ${p.category}`, href: `#/company/${co.id}/products`, color: co.color });
    });
    co.projects.forEach((p) => {
      if (out.length < 60 && (p.name.toLowerCase().includes(term) || p.client.toLowerCase().includes(term)))
        out.push({ kind: 'Proiect', label: p.name, sub: `${co.name} · ${p.sector}`, href: `#/company/${co.id}/projects`, color: co.color });
    });
  }
  return out.slice(0, 24);
}

function openSearchSheet() {
  openSheet({
    title: 'Căutare',
    body: `<div class="search"><span class="search__icon">${icon('search', 16)}</span>
      <input class="input" type="search" placeholder="Companie, produs, proiect…" data-search-input autofocus></div>
      <div data-search-results class="stack stack--sm"></div>`,
    onMount(rootEl) {
      const input = rootEl.querySelector('[data-search-input]');
      const res = rootEl.querySelector('[data-search-results]');
      const run = debounce(() => {
        const items = globalSearch(input.value);
        res.innerHTML = items.length ? `<div class="rows rows--interactive card card--flush">${items.map((i) => `
          <a class="row" href="${i.href}" data-close-on-click>
            <span class="avatar avatar--sm" style="background:${i.color}">${esc(initials(i.label))}</span>
            <span class="row__main"><span class="row__title">${esc(i.label)}</span>
            <span class="row__meta">${esc(i.kind)} · ${esc(i.sub)}</span></span>
            ${icon('chevronRight', 16)}</a>`).join('')}</div>`
          : (input.value ? empty('Niciun rezultat', 'Încearcă alt termen.', 'search') : '');
      }, 160);
      input.addEventListener('input', run);
      res.addEventListener('click', (e) => { if (e.target.closest('[data-close-on-click]')) closeSheet(); });
      setTimeout(() => input.focus(), 60);
    },
  });
}

/* ---------- add company (spec: identify by name/site/IDNO) ---------- */
function openAddCompany() {
  Companies.openAddCompanySheet();
}

/* ---------- user menu ---------- */
function openUserMenu() {
  const s = state.session;
  openSheet({
    title: 'Contul meu',
    body: `<div class="hstack">
        <span class="avatar avatar--lg" style="background:linear-gradient(140deg,var(--accent),var(--hue-purple))">${esc(initials(s?.name || 'G'))}</span>
        <div><h3>${esc(s?.name || '')}</h3><p class="card__sub">${esc(s?.email || '')} · ${esc(roleLabel(s?.role))}</p></div>
      </div>
      <div class="card card--flush"><div class="rows rows--interactive">
        <a class="row" href="#/admin/user/${esc(s?.userId || '')}" data-close-on-click>
          <span class="row__main"><span class="row__title">Profilul meu & activitate</span></span>${icon('chevronRight', 16)}</a>
        <a class="row" href="#/settings" data-close-on-click>
          <span class="row__main"><span class="row__title">Setări</span></span>${icon('chevronRight', 16)}</a>
      </div></div>
      <div class="card card--pad stack stack--sm">
        <span class="section-title">Temă</span>
        <div class="segmented" style="width:100%">
          ${['auto', 'light', 'dark'].map((t) => `<button class="segmented__item" style="flex:1" data-theme-set="${t}"
            aria-selected="${state.theme === t}">${t === 'auto' ? 'Automat' : t === 'light' ? 'Luminos' : 'Întunecat'}</button>`).join('')}
        </div>
      </div>`,
    foot: `<button class="btn btn--danger" data-action="logout">${icon('logout', 16)} Deconectare</button>`,
    onMount(rootEl) {
      rootEl.addEventListener('click', (e) => {
        const t = e.target.closest('[data-theme-set]');
        if (t) {
          setTheme(t.dataset.themeSet);
          rootEl.querySelectorAll('[data-theme-set]').forEach((b) => b.setAttribute('aria-selected', String(b.dataset.themeSet === state.theme)));
        }
        if (e.target.closest('[data-close-on-click]')) closeSheet();
      });
    },
  });
}

/* ---------- rendering ---------- */
const VIEWS = {
  dashboard: Dashboard, market: Market, companies: Companies, company: Company,
  compare: Compare, signals: Signals, alerts: Alerts, assistant: Assistant,
  reports: Reports, admin: Admin, settings: Settings,
};

function renderView(mod, ctx) {
  const old = document.getElementById('view');
  if (!old) return;
  currentView = mod;
  // Replace the node with a fresh clone so listeners from the previous view are dropped.
  const host = old.cloneNode(false);
  old.replaceWith(host);
  host.innerHTML = mod.render(ctx);
  host.classList.add('animate-in');
  document.getElementById('topbar-title').textContent = mod.title ? mod.title(ctx) : 'Carepack';
  if (mod.mount) mod.mount(host, ctx);
  refreshChrome();
  window.scrollTo({ top: 0, behavior: 'instant' in window ? 'instant' : 'auto' });
  host.focus({ preventScroll: true });
}

function requireAuth(ctx) {
  if (state.session) return true;
  Auth.mountAuth(document.getElementById('app'), () => boot(true));
  return false;
}

function handle(mod, navId) {
  return (ctx) => {
    if (!requireAuth(ctx)) return;
    ensureShell();
    activeNav = navId;
    renderView(mod, ctx);
  };
}

function ensureShell() {
  const app = document.getElementById('app');
  if (!app.querySelector('.app-shell')) {
    app.innerHTML = shellHtml();
    wireShell(app);
  }
}

function wireShell(app) {
  app.addEventListener('click', (e) => {
    const act = e.target.closest('[data-action]');
    if (!act) return;
    const a = act.dataset.action;
    if (a === 'theme') {
      const order = ['auto', 'light', 'dark'];
      const next = order[(order.indexOf(state.theme) + 1) % order.length];
      setTheme(next);
      toast(`Temă: ${next === 'auto' ? 'automat' : next === 'light' ? 'luminos' : 'întunecat'}`, 'info', 1600);
    }
    if (a === 'search') { e.preventDefault(); openSearchSheet(); }
    if (a === 'drawer') { e.preventDefault(); openDrawer(); }
    if (a === 'add-company') { e.preventDefault(); closeSheet(); openAddCompany(); }
    if (a === 'user-menu') { e.preventDefault(); openUserMenu(); }
    if (a === 'logout') {
      logout(); closeSheet();
      document.getElementById('app').innerHTML = '';
      Auth.mountAuth(document.getElementById('app'), () => boot(true));
    }
  });
  const gs = app.querySelector('[data-global-search]');
  if (gs) {
    gs.addEventListener('focus', () => { gs.blur(); openSearchSheet(); });
  }
  // tabbar "more"
  app.addEventListener('click', (e) => {
    const more = e.target.closest('a[href="#more"]');
    if (more) { e.preventDefault(); openDrawer(); }
  });
  document.addEventListener('keydown', (e) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'k') { e.preventDefault(); openSearchSheet(); }
  });
}

/* ---------- routes ---------- */
function registerRoutes() {
  route('/', handle(Dashboard, 'dashboard'));
  route('/market', handle(Market, 'market'));
  route('/companies', handle(Companies, 'companies'));
  route('/company/:id/:tab?', handle(Company, 'companies'));
  route('/compare', handle(Compare, 'compare'));
  route('/signals', handle(Signals, 'signals'));
  route('/alerts', handle(Alerts, 'alerts'));
  route('/assistant', handle(Assistant, 'assistant'));
  route('/reports/:period?', handle(Reports, 'reports'));
  route('/admin/:section?/:id?', handle(Admin, 'admin'));
  route('/settings', handle(Settings, 'settings'));
  setNotFound((ctx) => {
    if (!requireAuth(ctx)) return;
    ensureShell();
    document.getElementById('view').innerHTML = `<div class="card card--pad">${
      empty('Pagina nu există', 'Verifică adresa sau întoarce-te la dashboard.', 'search')
    }<div style="text-align:center"><a class="btn btn--primary" href="#/">Înapoi la dashboard</a></div></div>`;
  });
}

/* ---------- boot ---------- */
let started = false;
function boot(afterLogin = false) {
  document.documentElement.dataset.theme = state.theme || 'auto';
  document.getElementById('boot')?.remove();
  document.getElementById('app').hidden = false;
  if (afterLogin) {
    document.getElementById('app').innerHTML = '';
    ensureShell();
  }
  if (!started) { started = true; registerRoutes(); start(onRoute); }
  else window.dispatchEvent(new HashChangeEvent('hashchange'));
}

function onRoute(ctx) {
  if (!ctx || !ctx.handler) return;
  ctx.handler(ctx);
  if (state.session) trackActivity(describeRoute(ctx));
}

function describeRoute(ctx) {
  const p = ctx.parts;
  if (!p.length) return 'Dashboard deschis';
  if (p[0] === 'company') {
    const co = state.companies.find((c) => c.id === p[1]);
    return `Competitor deschis: ${co ? co.name : p[1]}${p[2] ? ` · ${p[2]}` : ''}`;
  }
  const names = { market: 'Market Overview', companies: 'Lista companiilor', compare: 'Comparație creată',
    signals: 'Oportunități & amenințări', alerts: 'Alerte', assistant: 'Asistent AI', reports: 'Raport vizualizat',
    admin: 'Admin panel', settings: 'Setări' };
  return names[p[0]] || `Navigare: /${p.join('/')}`;
}

/* ---------- start ---------- */
initStore();
document.documentElement.dataset.theme = state.theme || 'auto';
if (state.session) boot();
else {
  document.getElementById('boot')?.remove();
  const app = document.getElementById('app');
  app.hidden = false;
  Auth.mountAuth(app, () => boot(true));
}

export { boot, NAV, globalSearch };
