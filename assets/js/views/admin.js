/* ============================================================
   Admin — users, access control, audit, security, analytics (§31)
   ============================================================ */
import {
  state, pendingUsers, setUserStatus, setUserRole, revokeSessions, addWhitelist,
  addDomain, toggleDomainAuto, logAudit,
} from '../data/store.js';
import { icon } from '../ui/icons.js';
import {
  card, segmented, empty, toast, openSheet, closeSheet, confBadge, delta, kv, meter,
} from '../ui/components.js';
import { barList, barsChart, donut, sparkline } from '../ui/charts.js';
import {
  esc, fmtInt, fmtNum, fmtDate, fmtDateTime, fmtTime, timeAgo, initials, sortBy, groupBy, round, DAY,
} from '../util.js';

export const title = () => 'Admin';

const SECTIONS = [
  ['overview', 'Overview'], ['users', 'Users'], ['access', 'Access'],
  ['audit', 'Audit Log'], ['security', 'Security'], ['analytics', 'User Analytics'],
];

const ROLES = ['SUPER_ADMIN', 'ADMIN', 'ANALYST', 'VIEWER'];
const ROLE_LABEL = { SUPER_ADMIN: 'Super Admin', ADMIN: 'Admin', ANALYST: 'Analyst', VIEWER: 'Viewer' };
const STATUS_BADGE = {
  ACTIVE: 'badge--pos', PENDING: 'badge--warn', REJECTED: 'badge--neg',
  BLOCKED: 'badge--neg', INVITED: 'badge--info',
};
const STATUS_LABEL = { ACTIVE: 'Activ', PENDING: 'În așteptare', REJECTED: 'Respins', BLOCKED: 'Blocat', INVITED: 'Invitat' };

let userFilter = 'all';
let userQuery = '';

/* ---------- stats ---------- */
function stats() {
  const u = state.users;
  const now = Date.now();
  return {
    total: u.length,
    active: u.filter((x) => x.status === 'ACTIVE').length,
    online: u.filter((x) => x.online).length,
    pending: u.filter((x) => x.status === 'PENDING').length,
    invited: u.filter((x) => x.status === 'INVITED').length,
    blocked: u.filter((x) => x.status === 'BLOCKED').length,
    inactive: u.filter((x) => x.status === 'ACTIVE' && (!x.lastLogin || x.lastLogin < now - 30 * DAY)).length,
  };
}

function statGrid() {
  const s = stats();
  const cells = [
    ['Total Users', s.total], ['Active Users', s.active], ['Online Now', s.online],
    ['Pending Approval', s.pending], ['Invited', s.invited], ['Blocked', s.blocked], ['Inactive 30+ zile', s.inactive],
  ];
  return `<div class="stat-grid stat-grid--7">${cells.map(([k, v]) => `
    <div class="ministat"><b>${fmtInt(v)}</b><span>${esc(k)}</span></div>`).join('')}</div>`;
}

/* ---------- overview ---------- */
function sectionOverview() {
  const pend = pendingUsers();
  return `
    ${statGrid()}
    <div class="grid grid--split">
      ${card({ title: 'Cereri de acces în așteptare', sub: `${pend.length} cereri`, cls: 'card--flush', body: pend.length
        ? `<div class="rows">${pend.map((u) => `<div class="row">
            <span class="avatar avatar--sm" style="background:var(--warn)">${esc(initials(`${u.first} ${u.last}`))}</span>
            <span class="row__main"><span class="row__title">${esc(u.first)} ${esc(u.last)}</span>
              <span class="row__meta">${esc(u.email)} · ${esc(u.company)}${u.title ? ` · ${esc(u.title)}` : ''} ·
                solicitat ${esc(timeAgo(u.created, state.now))}</span></span>
            <span class="hstack hstack--nowrap">
              <button class="btn btn--sm btn--primary" data-approve="${u.id}">Approve</button>
              <button class="btn btn--sm btn--secondary" data-reject="${u.id}">Reject</button>
              <button class="btn btn--sm btn--danger" data-block="${u.id}">Block</button>
            </span></div>`).join('')}</div>`
        : empty('Nicio cerere în așteptare', 'Toate cererile au fost procesate.', 'checkCircle') })}
      <div class="stack">
        ${card({ title: 'Evenimente de securitate', sub: 'Ultimele 25 de zile', cls: 'card--flush', body: `
          <div class="rows">${state.securityEvents.slice(0, 5).map((e) => `<div class="row">
            <span class="tile-link__icon" style="background:${e.sev === 'high' ? 'var(--neg-soft)' : 'var(--warn-soft)'};
              color:${e.sev === 'high' ? 'var(--neg)' : 'var(--warn)'}">${icon('alert', 16)}</span>
            <span class="row__main"><span class="row__title">${esc(e.label)}</span>
              <span class="row__meta">${esc(e.user)} · ${esc(e.detail)} · ${esc(timeAgo(e.at, state.now))}</span></span>
          </div>`).join('')}</div>` })}
        ${card({ title: 'Ultimele acțiuni', cls: 'card--flush', body: `<div>${state.audit.slice(0, 6).map(auditRow).join('')}</div>` })}
      </div>
    </div>`;
}

/* ---------- users ---------- */
function filteredUsers() {
  let l = state.users;
  if (userFilter !== 'all') l = l.filter((u) => u.status === userFilter);
  if (userQuery) {
    const q = userQuery.toLowerCase();
    l = l.filter((u) => `${u.first} ${u.last} ${u.email} ${u.company}`.toLowerCase().includes(q));
  }
  return l;
}

function sectionUsers() {
  const l = filteredUsers();
  return `
    ${statGrid()}
    <div class="page__toolbar">
      <div class="search" style="flex:1;min-width:200px"><span class="search__icon">${icon('search', 16)}</span>
        <input class="input" data-uq type="search" placeholder="Caută utilizator…" value="${esc(userQuery)}"></div>
      ${segmented([{ id: 'all', label: 'Toți' }, { id: 'ACTIVE', label: 'Activi' }, { id: 'PENDING', label: 'În așteptare' },
        { id: 'BLOCKED', label: 'Blocați' }, { id: 'INVITED', label: 'Invitați' }], userFilter, 'ufilter')}
      <button class="btn btn--primary btn--sm" data-invite>${icon('plus', 14)} Invită utilizator</button>
    </div>
    ${card({ title: 'Utilizatori', sub: `${l.length} rezultate`, cls: 'card--flush', body: `
      <div class="table-wrap"><table class="table table--clickable"><thead><tr>
        <th>Name</th><th>Email</th><th>Company</th><th>Role</th><th>Status</th><th>Last Login</th>
        <th>Last Activity</th><th class="num">Logins 30d</th><th>Created</th><th>Approved By</th><th></th>
      </tr></thead><tbody>
        ${l.map((u) => `<tr data-user="${u.id}">
          <td><span class="hstack hstack--nowrap">
            <span class="avatar avatar--sm" style="background:${u.online ? 'var(--pos)' : 'var(--text-3)'}">${esc(initials(`${u.first} ${u.last}`))}</span>
            <span><strong>${esc(u.first)} ${esc(u.last)}</strong>${u.online ? ' <span class="badge badge--pos badge--dot">online</span>' : ''}
            ${u.title ? `<br><span class="card__sub">${esc(u.title)}</span>` : ''}</span></span></td>
          <td>${esc(u.email)}</td><td>${esc(u.company)}</td>
          <td><span class="badge badge--outline">${esc(ROLE_LABEL[u.role])}</span></td>
          <td><span class="badge ${STATUS_BADGE[u.status]}">${esc(STATUS_LABEL[u.status])}</span></td>
          <td>${u.lastLogin ? esc(timeAgo(u.lastLogin, state.now)) : '—'}</td>
          <td>${u.lastActivity ? esc(timeAgo(u.lastActivity, state.now)) : '—'}</td>
          <td class="num">${fmtInt(u.logins30 || 0)}</td>
          <td>${esc(fmtDate(u.created))}</td>
          <td>${esc(u.approvedBy || '—')}</td>
          <td><a class="btn btn--sm btn--secondary" href="#/admin/user/${u.id}">VIEW</a></td>
        </tr>`).join('')}
      </tbody></table></div>` })}`;
}

/* ---------- user detail (§31.15) ---------- */
function sectionUserDetail(id) {
  const u = state.users.find((x) => x.id === id);
  if (!u) return `<div class="card card--pad">${empty('Utilizator inexistent', '', 'user')}</div>`;
  const sessions = u.sessions || [];
  const active = sessions.filter((s) => !s.revoked).slice(0, 4);
  const last = sessions[0];
  const sec = state.securityEvents.filter((e) => e.email === u.email);
  const perDay = Array.from({ length: 14 }, (_, i) => {
    const d = new Date(state.now.getTime() - (13 - i) * DAY);
    return { k: `${d.getDate()}`, v: sessions.filter((s) => new Date(s.start).toDateString() === d.toDateString()).length };
  });

  return `
    <div class="hstack hstack--between" style="flex-wrap:wrap;gap:12px">
      <a class="btn btn--ghost btn--sm" href="#/admin/users">${icon('chevronLeft', 14)} Toți utilizatorii</a>
      <div class="hstack">
        <button class="btn btn--secondary btn--sm" data-role="${u.id}">${icon('key', 14)} Change Role</button>
        <button class="btn btn--secondary btn--sm" data-revoke="${u.id}">${icon('logout', 14)} Revoke Sessions</button>
        ${u.status === 'BLOCKED'
          ? `<button class="btn btn--primary btn--sm" data-approve="${u.id}">${icon('check', 14)} Reactivează</button>`
          : `<button class="btn btn--danger btn--sm" data-block="${u.id}">${icon('lock', 14)} Block User</button>`}
      </div>
    </div>
    <header class="co-hero">
      <div class="co-hero__top">
        <span class="avatar avatar--xl" style="background:linear-gradient(140deg,var(--accent),var(--hue-purple))">${esc(initials(`${u.first} ${u.last}`))}</span>
        <div class="co-hero__id">
          <div class="hstack"><h1 class="co-hero__name">${esc(u.first)} ${esc(u.last)}</h1>
            <span class="badge ${STATUS_BADGE[u.status]}">${esc(STATUS_LABEL[u.status])}</span>
            <span class="badge badge--outline">${esc(ROLE_LABEL[u.role])}</span>
            ${u.online ? '<span class="badge badge--pos badge--dot">online</span>' : ''}</div>
          <div class="co-hero__meta">
            <span>${icon('mail', 13)} ${esc(u.email)}</span>
            <span>${icon('building', 13)} ${esc(u.company)}</span>
            ${u.title ? `<span>${icon('briefcase', 13)} ${esc(u.title)}</span>` : ''}
            ${u.phone ? `<span>${icon('phone', 13)} ${esc(u.phone)}</span>` : ''}
            <span>${icon('layers', 13)} Workspace: ${esc(u.workspace)}</span>
          </div>
        </div>
      </div>
    </header>
    <div class="grid grid--3">
      ${card({ title: 'ACCOUNT', body: kv([
        ['Status', STATUS_LABEL[u.status]],
        ['Aprobat de', u.approvedBy || '—'],
        ['Aprobat la', u.approvedAt ? fmtDate(u.approvedAt) : '—'],
        ['Creat', fmtDate(u.created)],
        ['Ultimul login', u.lastLogin ? fmtDateTime(u.lastLogin) : '—'],
        ['Ultima activitate', u.lastActivity ? fmtDateTime(u.lastActivity) : '—'],
      ]) })}
      ${card({ title: 'AUTHENTICATION', body: `
        <div class="filters">${(u.methods.length ? u.methods : ['Email OTP']).map((m) => `<span class="chip">
          ${icon(m === 'Google' ? 'globe' : m === 'Microsoft' ? 'grid' : m === 'Magic Link' ? 'link' : 'key', 14)} ${esc(m)}</span>`).join('')}</div>
        <p class="source" style="margin-top:12px">${icon('lock', 12)} Fără parole permanente — doar OTP, Magic Link sau SSO.</p>` })}
      ${card({ title: 'USAGE', body: kv([
        ['Competitori vizualizați', fmtInt(u.usage.competitorsViewed)],
        ['Comparații', fmtInt(u.usage.comparisons)],
        ['Rapoarte', fmtInt(u.usage.reports)],
        ['Întrebări AI', fmtInt(u.usage.aiQueries)],
        ['Exporturi', fmtInt(u.usage.exports)],
      ]) })}
    </div>
    <div class="grid grid--split">
      ${card({ title: 'ACTIVITY', sub: 'Sesiuni în ultimele 14 zile', body: `
        ${barsChart(perDay, { h: 150, color: 'var(--accent)', labelEvery: 2 })}
        <div class="grid grid--3" style="margin-top:14px;gap:8px">
          <div class="ministat"><b>${sessions.filter((s) => s.start > Date.now() - 30 * DAY).length}</b><span>sesiuni 30 zile</span></div>
          <div class="ministat"><b>${sessions.filter((s) => s.start > Date.now() - 90 * DAY).length}</b><span>sesiuni 90 zile</span></div>
          <div class="ministat"><b>${sessions.length}</b><span>total</span></div>
        </div>` })}
      ${card({ title: 'Jurnal de activitate', sub: last ? fmtDate(last.start) : '—', cls: 'card--flush', body: last ? `
        <div class="timeline" style="padding:0 var(--s5) var(--s4)">
          ${[
            [last.start, `Login — ${last.method}`, last.browser],
            [last.start + 3 * 60000, 'Competitor deschis: MetalDepo', 'Overview'],
            [last.start + 10 * 60000, 'Comparație creată', 'ViTRA vs. MetalDepo'],
            [last.start + 23 * 60000, 'Raport vizualizat', 'Weekly Brief'],
            [last.end, 'Ultima activitate', `Sesiune ~${last.minutes} min`],
          ].map(([t, titleTxt, meta]) => `<div class="tl-item">
            <span class="tl-item__dot">${icon('clock', 14)}</span>
            <div class="tl-item__body"><span class="tl-item__title">${esc(fmtTime(t))} · ${esc(titleTxt)}</span>
              <span class="tl-item__meta">${esc(meta)}</span></div></div>`).join('')}
        </div>
        <p class="source" style="padding:0 var(--s5) var(--s4)">${icon('info', 12)}
          Dacă utilizatorul închide browserul fără Logout, se afișează „Last activity”, nu o oră de ieșire inventată.</p>`
        : empty('Fără sesiuni înregistrate', '', 'clock') })}
    </div>
    <div class="grid grid--split">
      ${card({ title: 'SECURITY — sesiuni active', cls: 'card--flush', body: active.length ? `
        <div class="rows">${active.map((s) => `<div class="row">
          <span class="tile-link__icon" style="background:var(--surface-3)">${icon(s.device === 'mobile' ? 'device' : 'grid', 16)}</span>
          <span class="row__main"><span class="row__title">${esc(s.browser)}</span>
            <span class="row__meta">${esc(s.location)} · ${esc(s.ip)} · ${esc(timeAgo(s.start, state.now))} · ${esc(s.method)}</span></span>
          <button class="btn btn--sm btn--secondary" data-revoke-one="${u.id}">Log out</button>
        </div>`).join('')}</div>
        <div style="padding:12px var(--s5)"><button class="btn btn--danger btn--sm" data-revoke="${u.id}">Log out all devices</button></div>`
        : empty('Nicio sesiune activă', '', 'lock') })}
      ${card({ title: 'Evenimente de securitate', cls: 'card--flush', body: sec.length
        ? `<div class="rows">${sec.map((e) => `<div class="row">
            <span class="badge ${e.sev === 'high' ? 'badge--neg' : 'badge--warn'}">${esc(e.sev.toUpperCase())}</span>
            <span class="row__main"><span class="row__title">${esc(e.label)}</span>
              <span class="row__meta">${esc(e.detail)} · ${esc(timeAgo(e.at, state.now))}</span></span></div>`).join('')}</div>`
        : empty('Niciun eveniment', 'Contul nu a generat alerte de securitate.', 'shield') })}
    </div>`;
}

/* ---------- access ---------- */
function sectionAccess() {
  return `
    <div class="grid grid--split">
      ${card({ title: 'Trusted Domains', sub: 'Implicit: aprobare manuală pentru fiecare utilizator', cls: 'card--flush', body: `
        <div class="rows">${state.domains.map((d) => `<div class="row">
          <span class="tile-link__icon" style="background:var(--accent-soft);color:var(--accent)">${icon('globe', 16)}</span>
          <span class="row__main"><span class="row__title">@${esc(d.domain)}</span>
            <span class="row__meta">adăugat de ${esc(d.addedBy)} · ${d.autoApprove ? 'auto-approve activ' : 'necesită aprobare'}</span></span>
          <button class="switch" role="switch" data-domain="${esc(d.domain)}" aria-checked="${d.autoApprove}"
            aria-label="Auto-approve pentru ${esc(d.domain)}"></button>
        </div>`).join('')}</div>
        <div style="padding:12px var(--s5)"><button class="btn btn--secondary btn--sm" data-add-domain>${icon('plus', 14)} Adaugă domeniu</button></div>` })}
      ${card({ title: 'Whitelist email', sub: 'Adrese pre-aprobate', cls: 'card--flush', body: `
        <div class="rows">${state.whitelist.map((w) => `<div class="row">
          <span class="tile-link__icon" style="background:var(--pos-soft);color:var(--pos)">${icon('mail', 16)}</span>
          <span class="row__main"><span class="row__title">${esc(w.email)}</span>
            <span class="row__meta">${esc(w.note || '—')} · adăugat de ${esc(w.addedBy)}</span></span>
          <span class="badge badge--pos">pre-aprobat</span></div>`).join('')}</div>
        <div style="padding:12px var(--s5)"><button class="btn btn--secondary btn--sm" data-add-white>${icon('plus', 14)} Adaugă email</button></div>` })}
    </div>
    ${card({ title: 'Roluri & permisiuni', sub: 'USER → ROLE → WORKSPACE → DATA ACCESS', body: `
      <div class="table-wrap"><table class="table"><thead><tr>
        <th>Rol</th><th>Utilizatori</th><th>Date</th><th>Comparații & AI</th><th>Alerte & rapoarte</th><th>Utilizatori</th><th>Setări critice</th>
      </tr></thead><tbody>
        ${[
          ['SUPER_ADMIN', 'acces complet', 'da', 'da', 'da', 'da', 'da'],
          ['ADMIN', 'administrare generală', 'da', 'da', 'da', 'da', 'parțial'],
          ['ANALYST', 'analiză', 'da', 'da', 'da', 'nu', 'nu'],
          ['VIEWER', 'doar citire', 'da', 'doar vizualizare', 'nu', 'nu', 'nu'],
        ].map((r) => `<tr><td><strong>${esc(ROLE_LABEL[r[0]] || r[0])}</strong></td>
          <td>${esc(r[1])}</td>${r.slice(2).map((c) => `<td>${c === 'da' ? '<span class="badge badge--pos">da</span>'
            : c === 'nu' ? '<span class="badge">nu</span>' : `<span class="badge badge--warn">${esc(c)}</span>`}</td>`).join('')}</tr>`).join('')}
      </tbody></table></div>
      <p class="source" style="margin-top:12px">${icon('info', 12)} Autentificarea Google/Microsoft confirmă doar identitatea.
        Accesul rămâne condiționat de aprobarea administratorului.</p>` })}`;
}

/* ---------- audit ---------- */
function auditRow(a) {
  return `<div class="audit-row">
    <span class="audit-row__line"><b>${esc(a.actor)}</b> ${esc(a.verb)} <b>${esc(a.target)}</b></span>
    <span class="audit-row__time">${esc(fmtDateTime(a.at))} · ${esc(timeAgo(a.at, state.now))}</span>
  </div>`;
}
function sectionAudit() {
  return card({
    title: 'Audit Log', sub: 'WHO → DID WHAT → TO WHAT → WHEN', cls: 'card--flush',
    body: `<div>${state.audit.slice(0, 60).map(auditRow).join('')}</div>`,
  });
}

/* ---------- security ---------- */
function sectionSecurity() {
  const byKind = [...groupBy(state.securityEvents, (e) => e.label)].map(([k, v]) => ({ k, v: v.length }));
  return `
    <div class="grid grid--split">
      ${card({ title: 'Security Events', cls: 'card--flush', body: `<div class="rows">
        ${state.securityEvents.map((e) => `<div class="row">
          <span class="badge ${e.sev === 'high' ? 'badge--neg' : e.sev === 'medium' ? 'badge--warn' : ''}">${esc(e.sev.toUpperCase())}</span>
          <span class="row__main"><span class="row__title">${esc(e.label)}</span>
            <span class="row__meta">${esc(e.user)} (${esc(e.email)}) · ${esc(e.detail)}</span></span>
          <span class="card__sub">${esc(timeAgo(e.at, state.now))}</span></div>`).join('')}</div>` })}
      <div class="stack">
        ${card({ title: 'Distribuție evenimente', body: barList(byKind, { color: 'var(--neg)' }) })}
        ${card({ title: 'Politici active', body: `<div class="rows">
          ${[['OTP valabil 5 minute', true], ['Cod OTP de unică folosință', true], ['Max. 5 încercări OTP', true],
             ['Revocare sesiuni la blocare', true], ['Aprobare admin obligatorie', true],
             [`Retenție loguri tehnice: ${state.settings.retentionDays} zile`, true]]
            .map(([label]) => `<div class="row" style="padding-inline:0">
              <span class="row__main"><span class="row__title">${esc(label)}</span></span>
              <span class="badge badge--pos">activ</span></div>`).join('')}</div>` })}
      </div>
    </div>`;
}

/* ---------- analytics ---------- */
function sectionAnalytics() {
  const u = state.users.filter((x) => x.status === 'ACTIVE');
  const now = Date.now();
  const dau = u.filter((x) => x.lastActivity && x.lastActivity > now - DAY).length;
  const wau = u.filter((x) => x.lastActivity && x.lastActivity > now - 7 * DAY).length;
  const mau = u.filter((x) => x.lastActivity && x.lastActivity > now - 30 * DAY).length;
  const allSessions = u.flatMap((x) => x.sessions);
  const avgDur = allSessions.length ? Math.round(allSessions.reduce((s, x) => s + x.minutes, 0) / allSessions.length) : 0;
  const mostActive = sortBy(u, (x) => x.sessions.length).slice(0, 5);
  const modules = [
    { k: 'Dashboard', v: 100 }, { k: 'Companii', v: 82 }, { k: 'Comparație', v: 61 },
    { k: 'Asistent AI', v: 54 }, { k: 'Alerte', v: 47 }, { k: 'Rapoarte', v: 38 }, { k: 'Admin', v: 12 },
  ];
  const viewed = sortBy(state.companies, (c) => c.scores.activity).slice(0, 5)
    .map((c, i) => ({ k: c.name, v: 120 - i * 17, color: c.color }));
  return `
    <div class="stat-grid">
      <div class="ministat"><b>${dau}</b><span>Daily Active Users</span></div>
      <div class="ministat"><b>${wau}</b><span>Weekly Active Users</span></div>
      <div class="ministat"><b>${mau}</b><span>Monthly Active Users</span></div>
      <div class="ministat"><b>${avgDur} min</b><span>Durată medie sesiune</span></div>
      <div class="ministat"><b>${fmtNum(allSessions.length / Math.max(1, u.length), 1)}</b><span>Sesiuni / utilizator</span></div>
      <div class="ministat"><b>${fmtInt(u.reduce((s, x) => s + x.usage.reports, 0))}</b><span>Rapoarte generate</span></div>
      <div class="ministat"><b>${fmtInt(u.reduce((s, x) => s + x.usage.aiQueries, 0))}</b><span>Întrebări AI</span></div>
      <div class="ministat"><b>${fmtInt(u.reduce((s, x) => s + x.usage.exports, 0))}</b><span>Exporturi</span></div>
    </div>
    <div class="grid grid--3">
      ${card({ title: 'Cei mai activi utilizatori', body: barList(mostActive.map((x) => ({ k: `${x.first} ${x.last}`, v: x.sessions.length })),
        { format: (v) => `${v} sesiuni` }) })}
      ${card({ title: 'Module cele mai folosite', body: barList(modules, { color: 'var(--hue-purple)', format: (v) => `${v}%` }) })}
      ${card({ title: 'Competitori cei mai vizualizați', body: barList(viewed) })}
    </div>
    ${card({ title: 'Utilizatori inactivi', sub: 'Fără activitate de peste 30 de zile', cls: 'card--flush', body: `
      <div class="rows">${u.filter((x) => !x.lastActivity || x.lastActivity < now - 30 * DAY).map((x) => `<div class="row">
        <span class="row__main"><span class="row__title">${esc(x.first)} ${esc(x.last)}</span>
          <span class="row__meta">${esc(x.email)} · ultima activitate ${x.lastActivity ? esc(timeAgo(x.lastActivity, state.now)) : 'niciodată'}</span></span>
        <a class="btn btn--sm btn--secondary" href="#/admin/user/${x.id}">VIEW</a></div>`).join('')
        || empty('Toți utilizatorii sunt activi', '', 'checkCircle')}</div>` })}`;
}

/* ---------- render ---------- */
export function render(ctx) {
  const section = ctx.params?.section || 'overview';
  if (section === 'user') return sectionUserDetail(ctx.params.id);
  const body = {
    overview: sectionOverview, users: sectionUsers, access: sectionAccess,
    audit: sectionAudit, security: sectionSecurity, analytics: sectionAnalytics,
  }[section] || sectionOverview;
  return `
    <header class="page__header">
      <span class="page__eyebrow">Administrare</span>
      <h1 class="page__title">Admin Panel</h1>
      <p class="page__lede">Control complet asupra accesului: aprobări, roluri, sesiuni, audit și securitate.</p>
    </header>
    <nav class="tabs">${SECTIONS.map(([id, label]) =>
      `<a class="tab" href="#/admin/${id}" aria-selected="${section === id}">${esc(label)}</a>`).join('')}</nav>
    ${body()}`;
}

export function mount(host, ctx) {
  const rerender = () => { host.innerHTML = render(ctx); };
  host.addEventListener('click', (e) => {
    const ap = e.target.closest('[data-approve]');
    if (ap) { setUserStatus(ap.dataset.approve, 'ACTIVE'); toast('Utilizator aprobat — email de confirmare trimis', 'ok'); return rerender(); }
    const rj = e.target.closest('[data-reject]');
    if (rj) { setUserStatus(rj.dataset.reject, 'REJECTED'); toast('Cerere respinsă', 'info'); return rerender(); }
    const bl = e.target.closest('[data-block]');
    if (bl) { setUserStatus(bl.dataset.block, 'BLOCKED'); toast('Utilizator blocat — toate sesiunile au fost revocate', 'err'); return rerender(); }
    const rv = e.target.closest('[data-revoke]') || e.target.closest('[data-revoke-one]');
    if (rv) { revokeSessions(rv.dataset.revoke || rv.dataset.revokeOne); toast('Sesiuni revocate', 'ok'); return rerender(); }
    const f = e.target.closest('[data-ufilter]'); if (f) { userFilter = f.dataset.ufilter; return rerender(); }
    const d = e.target.closest('[data-domain]'); if (d) { toggleDomainAuto(d.dataset.domain); return rerender(); }
    const row = e.target.closest('[data-user]');
    if (row && !e.target.closest('a,button')) { location.hash = `#/admin/user/${row.dataset.user}`; return; }

    const rl = e.target.closest('[data-role]');
    if (rl) {
      const u = state.users.find((x) => x.id === rl.dataset.role);
      openSheet({
        title: `Schimbă rolul — ${u.first} ${u.last}`,
        body: `<div class="stack stack--sm">${ROLES.map((r) => `<button class="pick" data-set-role="${r}" aria-pressed="${u.role === r}">
          <span class="tile-link__icon" style="background:var(--accent-soft);color:var(--accent)">${icon('key', 16)}</span>
          <span><strong>${esc(ROLE_LABEL[r])}</strong><br><span class="card__sub">${esc({
            SUPER_ADMIN: 'Acces complet: utilizatori, permisiuni, monitorizare, audit.',
            ADMIN: 'Administrare generală; unele setări critice rămân la Super Admin.',
            ANALYST: 'Vede date, compară, folosește AI, creează rapoarte și alerte.',
            VIEWER: 'Doar citire — dashboard-uri și rapoarte.',
          }[r])}</span></span></button>`).join('')}</div>`,
        onMount(el) {
          el.addEventListener('click', (ev) => {
            const b = ev.target.closest('[data-set-role]');
            if (!b) return;
            setUserRole(u.id, b.dataset.setRole);
            closeSheet(); toast('Rol actualizat', 'ok'); rerender();
          });
        },
      });
      return;
    }
    if (e.target.closest('[data-add-white]')) {
      openSheet({
        title: 'Adaugă email în whitelist',
        body: `<form class="stack" data-form="wl">
          <div class="field"><label class="field__label" for="wlemail">Email</label>
            <input class="input" id="wlemail" name="email" type="email" required placeholder="nume@companie.md"></div>
          <div class="field"><label class="field__label" for="wlnote">Notă</label>
            <input class="input" id="wlnote" name="note" placeholder="motivul accesului"></div>
        </form>`,
        foot: `<button class="btn btn--secondary" data-sheet-close>Anulează</button>
          <button class="btn btn--primary" data-save-wl>Adaugă</button>`,
        onMount(el) {
          el.querySelector('[data-save-wl]').addEventListener('click', () => {
            const f = Object.fromEntries(new FormData(el.querySelector('[data-form="wl"]')).entries());
            if (!f.email) return toast('Introdu un email', 'err');
            addWhitelist(f.email, f.note); closeSheet(); toast('Email adăugat în whitelist', 'ok'); rerender();
          });
        },
      });
      return;
    }
    if (e.target.closest('[data-add-domain]')) {
      openSheet({
        title: 'Adaugă domeniu de încredere',
        body: `<form class="stack" data-form="dm">
          <div class="field"><label class="field__label" for="dmname">Domeniu</label>
            <input class="input" id="dmname" name="domain" required placeholder="companie.md"></div>
          <label class="hstack" style="justify-content:space-between">
            <span><strong>Auto-approve</strong><br><span class="card__sub">Implicit dezactivat — fiecare utilizator necesită aprobare.</span></span>
            <input type="checkbox" name="auto"></label>
        </form>`,
        foot: `<button class="btn btn--secondary" data-sheet-close>Anulează</button>
          <button class="btn btn--primary" data-save-dm>Adaugă</button>`,
        onMount(el) {
          el.querySelector('[data-save-dm]').addEventListener('click', () => {
            const form = el.querySelector('[data-form="dm"]');
            const f = Object.fromEntries(new FormData(form).entries());
            if (!f.domain) return toast('Introdu un domeniu', 'err');
            addDomain(f.domain.replace(/^@/, ''), !!f.auto); closeSheet(); toast('Domeniu adăugat', 'ok'); rerender();
          });
        },
      });
      return;
    }
    if (e.target.closest('[data-invite]')) {
      openSheet({
        title: 'Invită utilizator',
        body: `<form class="stack" data-form="inv">
          <div class="grid grid--2" style="gap:12px">
            <div class="field"><label class="field__label" for="ifirst">Nume</label><input class="input" id="ifirst" name="first" required></div>
            <div class="field"><label class="field__label" for="ilast">Prenume</label><input class="input" id="ilast" name="last"></div>
          </div>
          <div class="field"><label class="field__label" for="iemail">Email</label><input class="input" id="iemail" name="email" type="email" required></div>
          <div class="field"><label class="field__label" for="icompany">Companie</label><input class="input" id="icompany" name="company"></div>
          <div class="field"><label class="field__label" for="irole">Rol</label>
            <select class="select" id="irole" name="role">${ROLES.map((r) => `<option value="${r}">${esc(ROLE_LABEL[r])}</option>`).join('')}</select></div>
        </form>`,
        foot: `<button class="btn btn--secondary" data-sheet-close>Anulează</button>
          <button class="btn btn--primary" data-save-inv>Trimite invitația</button>`,
        onMount(el) {
          el.querySelector('[data-save-inv]').addEventListener('click', () => {
            const f = Object.fromEntries(new FormData(el.querySelector('[data-form="inv"]')).entries());
            if (!f.email || !f.first) return toast('Completează numele și email-ul', 'err');
            state.users.unshift({
              id: `u_${Date.now()}`, first: f.first, last: f.last || '', email: f.email,
              company: f.company || '—', title: '', phone: '', role: f.role, status: 'INVITED',
              created: Date.now(), lastLogin: null, lastActivity: null, approvedBy: state.session?.name,
              approvedAt: Date.now(), logins30: 0, sessions: [], methods: [],
              usage: { competitorsViewed: 0, comparisons: 0, reports: 0, aiQueries: 0, exports: 0 },
              online: false, workspace: 'Toate companiile',
            });
            logAudit('a invitat utilizatorul', f.email, 'user');
            closeSheet(); toast('Invitație trimisă', 'ok'); rerender();
          });
        },
      });
    }
  });
  host.addEventListener('input', (e) => {
    if (e.target.matches('[data-uq]')) {
      userQuery = e.target.value;
      rerender();
      const inp = host.querySelector('[data-uq]');
      if (inp) { inp.focus(); inp.setSelectionRange(inp.value.length, inp.value.length); }
    }
  });
}
