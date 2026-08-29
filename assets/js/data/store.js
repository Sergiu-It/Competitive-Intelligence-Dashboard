/* ============================================================
   Application store — dataset, session, admin data, persistence.
   ============================================================ */
import { buildCompanies, PLATFORMS } from './generate.js';
import {
  companyMetrics, computeScores, buildTimeline, marketOverview, detectOpportunities,
  detectThreats, buildBrief, inWindow,
} from './analytics.js';
import { USERS_SEED, TRUSTED_DOMAINS, WHITELIST, COMPANIES } from './seed.js';
import { makeRng } from '../rng.js';
import { addDays, DAY, uid, iso, round, sortBy } from '../util.js';

const LS = 'carepack.v1';

function loadPersisted() {
  try { return JSON.parse(localStorage.getItem(LS) || '{}'); } catch { return {}; }
}
function persist() {
  try {
    localStorage.setItem(LS, JSON.stringify({
      session: state.session, theme: state.theme, users: state.users,
      audit: state.audit.slice(0, 300), alertRules: state.alertRules,
      alertsRead: state.alertsRead, watchlist: state.watchlist,
      whitelist: state.whitelist, domains: state.domains,
      addedCompanies: state.addedCompanies, settings: state.settings,
    }));
  } catch { /* storage unavailable — demo still works in-memory */ }
}

export const state = {
  now: new Date(),
  companies: [],
  market: null,
  opportunities: [],
  threats: [],
  session: null,
  theme: 'auto',
  users: [],
  audit: [],
  securityEvents: [],
  alertRules: [],
  alerts: [],
  alertsRead: [],
  watchlist: [],
  whitelist: [],
  domains: [],
  addedCompanies: [],
  settings: { briefFrequency: 'weekly', emailAlerts: true, pushAlerts: false, retentionDays: 180, currency: 'MDL' },
  ready: false,
};

/* ---------- alert rules ---------- */
const DEFAULT_RULES = [
  { id: 'neg_review',  label: 'Recenzie negativă nouă',            icon: 'star',      on: true,  severity: 'high' },
  { id: 'rating_drop', label: 'Scădere de rating',                 icon: 'trendDown', on: true,  severity: 'high' },
  { id: 'project_new', label: 'Proiect nou publicat',              icon: 'layers',    on: true,  severity: 'medium' },
  { id: 'product_new', label: 'Produs nou',                        icon: 'box',       on: true,  severity: 'low' },
  { id: 'price_change',label: 'Modificare de preț',                icon: 'tag',       on: true,  severity: 'medium' },
  { id: 'ad_new',      label: 'Campanie publicitară nouă',         icon: 'megaphone', on: true,  severity: 'medium' },
  { id: 'video_new',   label: 'Video YouTube nou',                 icon: 'youtube',   on: false, severity: 'low' },
  { id: 'job_new',     label: 'Anunț de angajare nou',             icon: 'briefcase', on: true,  severity: 'medium' },
  { id: 'news_new',    label: 'Articol / știre nouă',              icon: 'news',      on: true,  severity: 'medium' },
  { id: 'web_change',  label: 'Modificare importantă pe website',  icon: 'globe',     on: true,  severity: 'medium' },
  { id: 'activity_spike', label: 'Creștere bruscă a activității',  icon: 'zap',       on: true,  severity: 'high' },
  { id: 'momentum',    label: 'Momentum peste pragul setat (+25%)',icon: 'trendUp',   on: true,  severity: 'high' },
];

/* ---------- users ---------- */
function buildUsers(persistedUsers) {
  if (persistedUsers && persistedUsers.length) return persistedUsers;
  const now = Date.now();
  return USERS_SEED.map((u, i) => {
    const rng = makeRng(`user-${u.email}`);
    const created = addDays(now, -rng.int(20, 700)).getTime();
    const active = u.status === 'ACTIVE';
    const lastLogin = active ? addDays(now, -rng.int(0, 34)).getTime() : null;
    const sessions = [];
    const nSess = active ? rng.int(6, 48) : 0;
    for (let k = 0; k < nSess; k++) {
      const start = addDays(now, -rng.int(0, 90)).getTime() + rng.int(8, 20) * 3600000;
      const dur = rng.int(4, 95);
      sessions.push({
        id: uid('s'), start, end: start + dur * 60000, minutes: dur,
        method: rng.pick(['Google', 'Microsoft', 'Email OTP', 'Magic Link']),
        browser: rng.pick(['Chrome / macOS', 'Chrome / Windows', 'Safari / iPhone', 'Safari / macOS', 'Edge / Windows', 'Chrome / Android']),
        device: rng.pick(['desktop', 'mobile', 'tablet']),
        ip: `86.124.${rng.int(2, 250)}.${rng.int(2, 250)}`,
        location: rng.pick(['Chișinău, MD', 'Bălți, MD', 'București, RO', 'Chișinău, MD']),
        clean: rng.chance(0.72),
      });
    }
    sessions.sort((a, b) => b.start - a.start);
    return {
      id: `u_${i}`, ...u, title: u.title || '',
      phone: rng.chance(0.6) ? `+373 6${rng.int(0, 9)} ${rng.int(100, 999)} ${rng.int(100, 999)}` : '',
      created, lastLogin,
      lastActivity: lastLogin ? lastLogin + rng.int(5, 120) * 60000 : null,
      approvedBy: u.status === 'ACTIVE' ? (i === 0 ? 'System' : 'Sergiu Cebotari') : null,
      approvedAt: u.status === 'ACTIVE' ? created + DAY : null,
      logins30: active ? sessions.filter((s) => s.start > now - 30 * DAY).length : 0,
      sessions,
      methods: active ? [...new Set(sessions.slice(0, 8).map((s) => s.method))] : [],
      usage: {
        competitorsViewed: active ? rng.int(4, 260) : 0,
        comparisons: active ? rng.int(0, 48) : 0,
        reports: active ? rng.int(0, 32) : 0,
        aiQueries: active ? rng.int(0, 180) : 0,
        exports: active ? rng.int(0, 22) : 0,
      },
      online: active && rng.chance(0.25),
      workspace: rng.pick(['Toate companiile', 'Toate companiile', 'Retail', 'Moldova Market']),
    };
  });
}

function buildAudit(users) {
  const rng = makeRng('audit-v1');
  const now = Date.now();
  const actions = [
    ['a aprobat utilizatorul', 'user'], ['a blocat utilizatorul', 'user'],
    ['a schimbat rolul pentru', 'user'], ['a adăugat competitorul', 'company'],
    ['a creat un monitor pentru', 'company'], ['a modificat setările de monitorizare', 'company'],
    ['a generat raportul pentru', 'company'], ['a exportat raportul', 'report'],
    ['a modificat o alertă', 'alert'], ['a editat manual informația despre', 'company'],
    ['a șters monitorul pentru', 'company'],
  ];
  const admins = users.filter((u) => ['SUPER_ADMIN', 'ADMIN', 'ANALYST'].includes(u.role));
  return Array.from({ length: 42 }, (_, i) => {
    const [verb, kind] = rng.pick(actions);
    const actor = rng.pick(admins);
    const target = kind === 'company' ? rng.pick(COMPANIES).name
      : kind === 'user' ? `${rng.pick(users).first} ${rng.pick(users).last}`
      : kind === 'report' ? 'Weekly Brief' : 'Alertă „Proiect nou publicat”';
    return {
      id: `au_${i}`, actor: `${actor.first} ${actor.last}`, actorId: actor.id,
      verb, target, kind,
      at: addDays(now, -rng.int(0, 60)).getTime() - rng.int(0, 20) * 3600000,
    };
  }).sort((a, b) => b.at - a.at);
}

function buildSecurityEvents(users) {
  const rng = makeRng('sec-v1');
  const now = Date.now();
  const kinds = [
    { k: 'otp_attempts', label: 'Multe încercări OTP eșuate', sev: 'medium' },
    { k: 'failed_login', label: 'Login-uri repetate eșuate', sev: 'medium' },
    { k: 'many_sessions', label: 'Multe sesiuni într-o perioadă scurtă', sev: 'low' },
    { k: 'geo_change', label: 'Schimbare bruscă de locație', sev: 'high' },
    { k: 'blocked_attempt', label: 'Tentativă de acces a unui cont blocat', sev: 'high' },
  ];
  return Array.from({ length: 9 }, (_, i) => {
    const kind = rng.pick(kinds);
    const u = rng.pick(users);
    return {
      id: `se_${i}`, ...kind, user: `${u.first} ${u.last}`, email: u.email,
      at: addDays(now, -rng.int(0, 25)).getTime(),
      detail: kind.k === 'geo_change' ? 'Chișinău, MD → Frankfurt, DE (12 min)' :
        kind.k === 'otp_attempts' ? `${rng.int(4, 9)} coduri greșite în 10 minute` :
        kind.k === 'blocked_attempt' ? 'Acces respins — cont blocat' :
        `${rng.int(3, 12)} evenimente în ${rng.int(5, 45)} minute`,
    };
  }).sort((a, b) => b.at - a.at);
}

/* ---------- alert feed ---------- */
function buildAlerts(companies, nowMs) {
  const items = [];
  const push = (o) => items.push({ id: uid('al'), ...o });
  for (const co of companies) {
    inWindow(co.reviews, 14, nowMs).filter((r) => r.stars <= 2).slice(0, 3).forEach((r) => push({
      rule: 'neg_review', severity: 'high', at: r.date, companyId: co.id, company: co.name, color: co.color,
      title: `Recenzie de ${r.stars}★ pentru ${co.name}`, body: r.text, link: `#/company/${co.id}/reviews`,
    }));
    if (co.metrics.reviews.ratingDelta30 <= -0.05) push({
      rule: 'rating_drop', severity: 'high', at: nowMs - 2 * DAY, companyId: co.id, company: co.name, color: co.color,
      title: `Rating în scădere la ${co.name}`,
      body: `Rating ${round(co.metrics.reviews.rating - co.metrics.reviews.ratingDelta30, 2)} → ${co.metrics.reviews.rating} în ultimele 30 de zile.`,
      link: `#/company/${co.id}/reviews`,
    });
    inWindow(co.projects, 10, nowMs).slice(0, 2).forEach((p) => push({
      rule: 'project_new', severity: 'medium', at: p.date, companyId: co.id, company: co.name, color: co.color,
      title: `Proiect nou: ${p.name}`, body: `${p.sector} · ${p.location} · sursă ${p.source}`, link: `#/company/${co.id}/projects`,
    }));
    inWindow(co.webChanges, 10, nowMs).filter((c) => c.type === 'price_change').slice(0, 2).forEach((c) => push({
      rule: 'price_change', severity: 'medium', at: c.date, companyId: co.id, company: co.name, color: co.color,
      title: `Modificare de preț la ${co.name}`, body: `${c.page}: ${c.before} → ${c.after}`, link: `#/company/${co.id}/prices`,
    }));
    inWindow(co.ads, 14, nowMs, 'start').slice(0, 1).forEach((a) => push({
      rule: 'ad_new', severity: 'medium', at: a.start, companyId: co.id, company: co.name, color: co.color,
      title: `Campanie nouă ${a.platform}`, body: `„${a.message}” · produs promovat: ${a.product}`, link: `#/company/${co.id}/ads`,
    }));
    inWindow(co.jobs, 12, nowMs).slice(0, 2).forEach((j) => push({
      rule: 'job_new', severity: 'medium', at: j.date, companyId: co.id, company: co.name, color: co.color,
      title: `${co.name} recrutează: ${j.title}`, body: `${j.department} · ${j.location}`, link: `#/company/${co.id}/jobs`,
    }));
    inWindow(co.news, 14, nowMs).slice(0, 1).forEach((n) => push({
      rule: 'news_new', severity: 'medium', at: n.date, companyId: co.id, company: co.name, color: co.color,
      title: n.title, body: `${n.typeLabel} · ${n.source}`, link: `#/company/${co.id}/news`,
    }));
    inWindow(co.webChanges, 8, nowMs).filter((c) => c.importance >= 3 && c.type !== 'price_change').slice(0, 1).forEach((c) => push({
      rule: 'web_change', severity: 'medium', at: c.date, companyId: co.id, company: co.name, color: co.color,
      title: `${c.label} pe ${co.website}`, body: c.after || c.before || c.page, link: `#/company/${co.id}/website`,
    }));
    co.products.filter((p) => p.addedAt > nowMs - 7 * DAY).slice(0, 1).forEach((p) => push({
      rule: 'product_new', severity: 'low', at: p.addedAt, companyId: co.id, company: co.name, color: co.color,
      title: `Produs nou la ${co.name}`, body: `${p.name} · ${p.category}`, link: `#/company/${co.id}/products`,
    }));
    if (co.scores.momentum >= 25 && !co.isOwn) push({
      rule: 'momentum', severity: 'high', at: nowMs - DAY, companyId: co.id, company: co.name, color: co.color,
      title: `${co.name} a depășit pragul de Momentum`,
      body: `Momentum ${co.scores.momentum > 0 ? '+' : ''}${co.scores.momentum}% · Activity Score ${co.scores.activity}/100.`,
      link: `#/company/${co.id}`,
    });
    if (co.metrics.web.important30 >= 8 || co.metrics.jobs.new30 >= 5) push({
      rule: 'activity_spike', severity: 'high', at: nowMs - 3 * DAY, companyId: co.id, company: co.name, color: co.color,
      title: `Creștere bruscă a activității — ${co.name}`,
      body: `${co.metrics.web.important30} modificări importante pe website și ${co.metrics.jobs.new30} anunțuri noi în 30 de zile.`,
      link: `#/company/${co.id}/timeline`,
    });
  }
  return items.sort((a, b) => b.at - a.at).slice(0, 120);
}

/* ---------- init ---------- */
export function initStore() {
  const saved = loadPersisted();
  const now = new Date();
  state.now = now;
  const nowMs = now.getTime();

  let companies = buildCompanies(now);
  companies = companies.map((co) => ({ ...co, metrics: companyMetrics(co, nowMs) }));
  companies = computeScores(companies, nowMs);
  companies.forEach((co) => { co.timeline = buildTimeline(co, nowMs, 120); });

  state.companies = companies;
  state.market = marketOverview(companies, nowMs);
  state.opportunities = detectOpportunities(companies, nowMs);
  state.threats = detectThreats(companies, nowMs);

  state.users = buildUsers(saved.users);
  state.audit = saved.audit?.length ? saved.audit : buildAudit(state.users);
  state.securityEvents = buildSecurityEvents(state.users);
  state.alertRules = saved.alertRules?.length ? saved.alertRules : DEFAULT_RULES;
  state.alerts = buildAlerts(companies, nowMs);
  state.alertsRead = saved.alertsRead || [];
  state.watchlist = saved.watchlist?.length ? saved.watchlist : companies.filter((c) => !c.isOwn).slice(0, 4).map((c) => c.id);
  state.whitelist = saved.whitelist || WHITELIST;
  state.domains = saved.domains || TRUSTED_DOMAINS;
  state.addedCompanies = saved.addedCompanies || [];
  state.settings = { ...state.settings, ...(saved.settings || {}) };
  state.session = saved.session || null;
  state.theme = saved.theme || 'auto';
  state.ready = true;
  return state;
}

/* ---------- accessors ---------- */
export const getCompany = (id) => state.companies.find((c) => c.id === id);
export const ownCompany = () => state.companies.find((c) => c.isOwn);
export const competitors = () => state.companies.filter((c) => !c.isOwn);
export const brief = (period) => buildBrief(state.companies, state.now.getTime(), period);
export const unreadAlerts = () => state.alerts.filter((a) => !state.alertsRead.includes(a.id)
  && (state.alertRules.find((r) => r.id === a.rule)?.on ?? true));
export const pendingUsers = () => state.users.filter((u) => u.status === 'PENDING');

/* ---------- mutations ---------- */
export function setTheme(t) { state.theme = t; document.documentElement.dataset.theme = t; persist(); }

export function logAudit(verb, target, kind = 'system') {
  const actor = state.session ? state.session.name : 'System';
  state.audit.unshift({ id: uid('au'), actor, actorId: state.session?.userId, verb, target, kind, at: Date.now() });
  persist();
}

export function login(user, method) {
  state.session = {
    userId: user.id, name: `${user.first} ${user.last}`, email: user.email,
    role: user.role, company: user.company, method, at: Date.now(),
    activity: [{ at: Date.now(), what: `Autentificare — ${method}` }],
  };
  const u = state.users.find((x) => x.id === user.id);
  if (u) { u.lastLogin = Date.now(); u.lastActivity = Date.now(); u.logins30 = (u.logins30 || 0) + 1; u.online = true; }
  logAudit('s-a autentificat', method, 'auth');
  persist();
  return state.session;
}
export function logout() {
  const u = state.users.find((x) => x.id === state.session?.userId);
  if (u) u.online = false;
  logAudit('s-a deconectat', '—', 'auth');
  state.session = null;
  persist();
}
export function trackActivity(what) {
  if (!state.session) return;
  state.session.activity = state.session.activity || [];
  state.session.activity.unshift({ at: Date.now(), what });
  state.session.activity = state.session.activity.slice(0, 60);
  const u = state.users.find((x) => x.id === state.session.userId);
  if (u) u.lastActivity = Date.now();
  persist();
}

export function setUserStatus(userId, status) {
  const u = state.users.find((x) => x.id === userId);
  if (!u) return;
  u.status = status;
  if (status === 'ACTIVE') { u.approvedBy = state.session?.name || 'Admin'; u.approvedAt = Date.now(); }
  if (status === 'BLOCKED') { u.sessions = u.sessions.map((s) => ({ ...s, revoked: true })); u.online = false; }
  const verb = status === 'ACTIVE' ? 'a aprobat utilizatorul'
    : status === 'BLOCKED' ? 'a blocat utilizatorul'
    : status === 'REJECTED' ? 'a respins utilizatorul' : 'a schimbat statusul pentru';
  logAudit(verb, `${u.first} ${u.last}`, 'user');
  persist();
}
export function setUserRole(userId, role) {
  const u = state.users.find((x) => x.id === userId);
  if (!u) return;
  u.role = role;
  logAudit('a schimbat rolul pentru', `${u.first} ${u.last} → ${role}`, 'user');
  persist();
}
export function revokeSessions(userId) {
  const u = state.users.find((x) => x.id === userId);
  if (!u) return;
  u.sessions = u.sessions.map((s) => ({ ...s, revoked: true }));
  u.online = false;
  logAudit('a revocat sesiunile pentru', `${u.first} ${u.last}`, 'user');
  persist();
}
export function addUserRequest({ first, last, email, company, title, phone }) {
  const existing = state.users.find((u) => u.email.toLowerCase() === email.toLowerCase());
  if (existing) return existing;
  const domain = email.split('@')[1];
  const trusted = state.domains.find((d) => d.domain === domain);
  const whitelisted = state.whitelist.some((w) => w.email.toLowerCase() === email.toLowerCase());
  const status = whitelisted || (trusted && trusted.autoApprove) ? 'ACTIVE' : 'PENDING';
  const u = {
    id: uid('u'), first, last, email, company: company || '—', title: title || '', phone: phone || '',
    role: 'VIEWER', status, created: Date.now(), lastLogin: null, lastActivity: null,
    approvedBy: status === 'ACTIVE' ? (whitelisted ? 'Whitelist' : `Domeniu ${domain}`) : null,
    approvedAt: status === 'ACTIVE' ? Date.now() : null,
    logins30: 0, sessions: [], methods: [],
    usage: { competitorsViewed: 0, comparisons: 0, reports: 0, aiQueries: 0, exports: 0 },
    online: false, workspace: 'Toate companiile',
  };
  state.users.unshift(u);
  logAudit('a solicitat acces', `${first} ${last} (${email})`, 'user');
  persist();
  return u;
}
export function toggleRule(id) {
  const r = state.alertRules.find((x) => x.id === id);
  if (!r) return;
  r.on = !r.on;
  logAudit('a modificat alerta', `${r.label} → ${r.on ? 'activă' : 'oprită'}`, 'alert');
  persist();
}
export function markAlertsRead(ids) {
  state.alertsRead = [...new Set([...state.alertsRead, ...ids])];
  persist();
}
export function toggleWatch(id) {
  state.watchlist = state.watchlist.includes(id)
    ? state.watchlist.filter((x) => x !== id) : [...state.watchlist, id];
  const co = getCompany(id);
  logAudit(state.watchlist.includes(id) ? 'a creat un monitor pentru' : 'a șters monitorul pentru', co?.name || id, 'company');
  persist();
}
export function addWhitelist(email, note) {
  state.whitelist.unshift({ email, note: note || '', addedBy: state.session?.name || 'Admin' });
  logAudit('a adăugat în whitelist', email, 'user');
  persist();
}
export function addDomain(domain, autoApprove) {
  state.domains.unshift({ domain, autoApprove: !!autoApprove, addedBy: state.session?.name || 'Admin' });
  logAudit('a adăugat domeniul de încredere', `${domain}${autoApprove ? ' (auto-approve)' : ''}`, 'settings');
  persist();
}
export function toggleDomainAuto(domain) {
  const d = state.domains.find((x) => x.domain === domain);
  if (!d) return;
  d.autoApprove = !d.autoApprove;
  logAudit('a modificat setările domeniului', `${domain} → ${d.autoApprove ? 'auto-approve' : 'aprobare manuală'}`, 'settings');
  persist();
}
export function addMonitoredCompany(payload) {
  state.addedCompanies.unshift({ ...payload, id: uid('co'), at: Date.now(), status: 'DISCOVERING' });
  logAudit('a adăugat competitorul', payload.name, 'company');
  persist();
}
export function saveSettings(patch) {
  state.settings = { ...state.settings, ...patch };
  logAudit('a modificat setările', Object.keys(patch).join(', '), 'settings');
  persist();
}
export { persist, PLATFORMS };
