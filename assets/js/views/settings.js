/* ============================================================
   Settings — monitorizare, alerte, date, confidențialitate
   ============================================================ */
import { state, saveSettings, setTheme, toggleWatch } from '../data/store.js';
import { icon } from '../ui/icons.js';
import { card, segmented, toast, confBadge, coAvatar } from '../ui/components.js';
import { esc, fmtInt } from '../util.js';
import { roleLabel } from '../app.js';

export const title = () => 'Setări';

export function render() {
  const s = state.settings;
  return `
    <header class="page__header">
      <span class="page__eyebrow">Configurare</span>
      <h1 class="page__title">Setări</h1>
      <p class="page__lede">Preferințele contului, monitorizarea și regulile de date.</p>
    </header>
    <div class="grid grid--2">
      ${card({ title: 'Aspect', body: `
        <div class="stack stack--sm">
          <span class="section-title">Temă</span>
          <div class="segmented" style="width:100%">
            ${[['auto', 'Automat'], ['light', 'Luminos'], ['dark', 'Întunecat']].map(([id, label]) =>
              `<button class="segmented__item" style="flex:1" data-theme-set="${id}" aria-selected="${state.theme === id}">${esc(label)}</button>`).join('')}
          </div>
          <p class="card__sub">Tema automată urmează setarea sistemului de operare.</p>
        </div>` })}
      ${card({ title: 'Contul meu', body: `
        <div class="kv">
          <div class="kv__row"><span class="kv__k">Nume</span><span class="kv__v">${esc(state.session?.name || '')}</span></div>
          <div class="kv__row"><span class="kv__k">Email</span><span class="kv__v">${esc(state.session?.email || '')}</span></div>
          <div class="kv__row"><span class="kv__k">Rol</span><span class="kv__v">${esc(roleLabel(state.session?.role))}</span></div>
          <div class="kv__row"><span class="kv__k">Metodă autentificare</span><span class="kv__v">${esc(state.session?.method || '')}</span></div>
        </div>
        <div class="hstack" style="margin-top:12px">
          <a class="btn btn--secondary btn--sm" href="#/admin/user/${esc(state.session?.userId || '')}">${icon('user', 14)} Profil & activitate</a>
          <button class="btn btn--danger btn--sm" data-action="logout">${icon('logout', 14)} Deconectare</button>
        </div>` })}
    </div>
    ${card({ title: 'Rapoarte AI', sub: 'Frecvența briefului trimis automat', body: `
      <div class="filters">
        ${[['daily', 'Zilnic'], ['weekly', 'Săptămânal'], ['monthly', 'Lunar']].map(([id, label]) =>
          `<button class="chip" data-freq="${id}" aria-pressed="${s.briefFrequency === id}">${esc(label)}</button>`).join('')}
      </div>` })}
    ${card({ title: 'Notificări', cls: 'card--flush', body: `<div class="rows">
      <div class="row"><span class="row__main"><span class="row__title">Alerte pe email</span>
        <span class="row__meta">${esc(state.session?.email || '')}</span></span>
        <button class="switch" role="switch" data-set="emailAlerts" aria-checked="${s.emailAlerts}"></button></div>
      <div class="row"><span class="row__main"><span class="row__title">Notificări în platformă</span>
        <span class="row__meta">Badge pe secțiunea Alerte</span></span>
        <button class="switch" role="switch" data-set="pushAlerts" aria-checked="${s.pushAlerts}"></button></div>
    </div>` })}
    ${card({ title: 'Companii monitorizate', sub: `${state.watchlist.length} în lista de urmărire`, cls: 'card--flush', body: `
      <div class="rows">${state.companies.filter((c) => !c.isOwn).map((c) => `<div class="row">
        ${coAvatar(c, 'sm')}
        <span class="row__main"><span class="row__title">${esc(c.name)}</span>
          <span class="row__meta">${esc(c.website)} · Activity ${c.scores.activity}/100</span></span>
        <button class="switch" role="switch" data-watch="${c.id}" aria-checked="${state.watchlist.includes(c.id)}"
          aria-label="Monitorizează ${esc(c.name)}"></button>
      </div>`).join('')}</div>` })}
    <div class="grid grid--2">
      ${card({ title: 'Date & confidențialitate', sub: 'Data minimization (§31.16)', body: `
        <div class="stack stack--sm">
          <div class="field">
            <label class="field__label" for="ret">Retenția logurilor tehnice (zile)</label>
            <select class="select" id="ret" data-set-select="retentionDays">
              ${[30, 90, 180, 365].map((d) => `<option value="${d}" ${s.retentionDays === d ? 'selected' : ''}>${d} zile</option>`).join('')}
            </select>
          </div>
          <p class="card__sub">Activitatea este urmărită doar pentru securitate, administrarea accesului și analiza utilizării.
            Datele fără scop concret nu sunt colectate.</p>
        </div>` })}
      ${card({ title: 'Nivele de încredere a datelor', sub: 'Cum sunt marcate informațiile în platformă', body: `
        <div class="stack stack--sm">
          <div class="hstack">${confBadge('verified')}<span class="card__sub">Observat direct din sursa oficială</span></div>
          <div class="hstack">${confBadge('high')}<span class="card__sub">Sursă publică, potrivire sigură</span></div>
          <div class="hstack">${confBadge('estimated')}<span class="card__sub">Estimare (SEO, trafic, dimensiuni)</span></div>
          <div class="hstack">${confBadge('ai')}<span class="card__sub">Detectat / clasificat de AI</span></div>
          <div class="hstack">${confBadge('needs')}<span class="card__sub">Necesită verificare manuală</span></div>
        </div>` })}
    </div>
    ${card({ title: 'Frecvența colectării datelor', body: `
      <div class="table-wrap"><table class="table"><thead><tr><th>Modul</th><th>Frecvență</th><th>Sursă</th><th>Încredere</th></tr></thead>
      <tbody>
        ${[
          ['Google Business Profile', 'zilnic', 'Google Maps', 'verified'],
          ['Website changes', 'zilnic', 'crawler propriu', 'verified'],
          ['Produse & prețuri', 'zilnic', 'pagini produs', 'verified'],
          ['Social media', 'la 6 ore', 'API-uri publice', 'verified'],
          ['YouTube', 'zilnic', 'YouTube Data', 'verified'],
          ['Joburi', 'zilnic', 'rabota.md, delucru.md', 'verified'],
          ['Știri & PR', 'la 3 ore', '8 surse media', 'verified'],
          ['SEO & trafic', 'săptămânal', 'estimări agregate', 'estimated'],
          ['Reclame', 'zilnic', 'biblioteci publice de reclame', 'high'],
          ['Licitații', 'zilnic', 'mtender.gov.md', 'verified'],
        ].map((r) => `<tr><td>${esc(r[0])}</td><td>${esc(r[1])}</td><td>${esc(r[2])}</td><td>${confBadge(r[3])}</td></tr>`).join('')}
      </tbody></table></div>` })}`;
}

export function mount(host) {
  const rerender = () => { host.innerHTML = render(); };
  host.addEventListener('click', (e) => {
    const t = e.target.closest('[data-theme-set]');
    if (t) { setTheme(t.dataset.themeSet); return rerender(); }
    const f = e.target.closest('[data-freq]');
    if (f) { saveSettings({ briefFrequency: f.dataset.freq }); toast('Salvat', 'ok', 1400); return rerender(); }
    const s = e.target.closest('[data-set]');
    if (s) { saveSettings({ [s.dataset.set]: !state.settings[s.dataset.set] }); return rerender(); }
    const w = e.target.closest('[data-watch]');
    if (w) { toggleWatch(w.dataset.watch); return rerender(); }
  });
  host.addEventListener('change', (e) => {
    const sel = e.target.closest('[data-set-select]');
    if (sel) { saveSettings({ [sel.dataset.setSelect]: Number(sel.value) }); toast('Setare salvată', 'ok', 1400); }
  });
}
