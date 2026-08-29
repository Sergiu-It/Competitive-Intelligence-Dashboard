/* ============================================================
   Analytics — windows, deltas, scores, detectors, briefs.
   Everything here is derived from the generated history so the
   numbers in the UI are internally consistent.
   ============================================================ */
import { DAY, clamp, round, pctChange, sortBy, groupBy, addDays } from '../util.js';
import { TOPICS, topicLabel } from './seed.js';
import { PLATFORMS } from './generate.js';

/* ---------- helpers ---------- */
export const inWindow = (items, days, now, key = 'date') =>
  items.filter((x) => x[key] > now - days * DAY);

export const inPrevWindow = (items, days, now, key = 'date') =>
  items.filter((x) => x[key] <= now - days * DAY && x[key] > now - 2 * days * DAY);

export function valueDaysAgo(series, days) {
  if (!series || !series.length) return null;
  const target = series[series.length - 1].t - days * DAY;
  let best = series[0];
  for (const p of series) if (Math.abs(p.t - target) < Math.abs(best.t - target)) best = p;
  return best.v;
}
export function seriesDelta(series, days) {
  if (!series || !series.length) return { now: null, before: null, abs: null, pct: null };
  const nowV = series[series.length - 1].v;
  const before = valueDaysAgo(series, days);
  return { now: nowV, before, abs: nowV - before, pct: pctChange(nowV, before) };
}
export const sliceSeries = (series, days) => {
  if (!series || !series.length) return [];
  const from = series[series.length - 1].t - days * DAY;
  return series.filter((p) => p.t >= from);
};

/* ---------- per-company metrics ---------- */
export function companyMetrics(co, nowMs) {
  const R = co.reviews;
  const win = (d) => inWindow(R, d, nowMs).length;
  const prev30 = inPrevWindow(R, 30, nowMs).length;
  const prev90 = inPrevWindow(R, 90, nowMs).length;
  const r30 = win(30), r90 = win(90);
  const recent = inWindow(R, 90, nowMs);
  const sent = { pos: 0, neu: 0, neg: 0 };
  recent.forEach((r) => { sent[r.sentiment]++; });
  const replied90 = recent.filter((r) => r.replied);
  const repliedPrev = inPrevWindow(R, 90, nowMs).filter((r) => r.replied);
  const avgResp = (arr) => (arr.length ? Math.round(arr.reduce((s, x) => s + x.replyHours, 0) / arr.length) : null);

  const ratingD = seriesDelta(co.gmb.ratingSeries, 30);
  const ratingD90 = seriesDelta(co.gmb.ratingSeries, 90);

  const activeProducts = co.products.filter((p) => !p.removedAt);
  const priceChanges = co.products.filter((p) => p.history.length > 1 &&
    p.history[p.history.length - 1].v !== p.history[p.history.length - 2].v);

  const socialTotals = PLATFORMS.reduce((acc, plat) => {
    const s = co.social[plat.id];
    if (!s || !s.present) return acc;
    const d = seriesDelta(s.series, 30);
    acc.followers += s.followers;
    acc.growthAbs += d.abs || 0;
    acc.posts30 += inWindow(s.posts, 30, nowMs).length;
    acc.posts90 += inWindow(s.posts, 90, nowMs).length;
    acc.postsPrev30 += inPrevWindow(s.posts, 30, nowMs).length;
    acc.eng += s.posts.slice(0, 30).reduce((t, p) => t + p.likes + p.comments + p.shares, 0);
    acc.platforms.push({
      id: plat.id, label: plat.label, icon: plat.icon, handle: s.handle, url: s.url,
      followers: s.followers, growth30: d.abs || 0, growth30Pct: d.pct,
      posts30: inWindow(s.posts, 30, nowMs).length,
      series: s.series, posts: s.posts,
      engagementRate: s.followers ? round((s.posts.slice(0, 20)
        .reduce((t, p) => t + p.likes + p.comments + p.shares, 0) / Math.max(1, Math.min(20, s.posts.length)) / s.followers) * 100, 2) : 0,
    });
    return acc;
  }, { followers: 0, growthAbs: 0, posts30: 0, posts90: 0, postsPrev30: 0, eng: 0, platforms: [] });

  const yt = co.youtube.present ? {
    present: true, subs: co.youtube.subs,
    subsDelta30: seriesDelta(co.youtube.subsSeries, 30),
    videosTotal: co.youtube.videos.length,
    videos30: inWindow(co.youtube.videos, 30, nowMs).length,
    videos90: inWindow(co.youtube.videos, 90, nowMs).length,
    videosPrev30: inPrevWindow(co.youtube.videos, 30, nowMs).length,
    shorts: co.youtube.videos.filter((v) => v.isShort).length,
    views30: inWindow(co.youtube.videos, 30, nowMs).reduce((s, v) => s + v.views, 0),
    totalViews: co.youtube.totalViews,
    avgEngagement: round(co.youtube.videos.reduce((s, v) => s + v.engagement, 0) / Math.max(1, co.youtube.videos.length), 2),
    top: sortBy(co.youtube.videos, (v) => v.views).slice(0, 5),
  } : { present: false };

  const seoTop10 = co.seo.keywords.filter((k) => k.pos <= 10).length;

  const m = {
    reviews: {
      total: co.gmb.total, rating: co.gmb.rating,
      ratingDelta30: round(ratingD.abs || 0, 2), ratingDelta90: round(ratingD90.abs || 0, 2),
      d7: win(7), d30: r30, d90: r90, d180: win(180), d365: win(365),
      prev30, prev90,
      perWeek: round((r90 / 90) * 7, 1),
      accel: round(pctChange(r30 / 30, prev30 / 30), 0),
      accel90: round(pctChange(r90 / 90, prev90 / 90), 0),
      dist: co.gmb.dist,
      responseRate: co.gmb.responseRate,
      responseRate90: recent.length ? round((replied90.length / recent.length) * 100, 0) : 0,
      responseRatePrev: inPrevWindow(R, 90, nowMs).length ? round((repliedPrev.length / inPrevWindow(R, 90, nowMs).length) * 100, 0) : 0,
      avgResponseHours: avgResp(replied90) ?? co.gmb.avgResponseHours,
      avgResponsePrev: avgResp(repliedPrev),
      sentiment: sent,
      sentimentPct: recent.length ? {
        pos: round((sent.pos / recent.length) * 100, 0),
        neu: round((sent.neu / recent.length) * 100, 0),
        neg: round((sent.neg / recent.length) * 100, 0),
      } : { pos: 0, neu: 0, neg: 0 },
    },
    projects: {
      total: co.projects.length,
      d30: inWindow(co.projects, 30, nowMs).length,
      d90: inWindow(co.projects, 90, nowMs).length,
      d365: inWindow(co.projects, 365, nowMs).length,
      prev30: inPrevWindow(co.projects, 30, nowMs).length,
      prev90: inPrevWindow(co.projects, 90, nowMs).length,
      perMonth: round(inWindow(co.projects, 180, nowMs).length / 6, 1),
      bySector: [...groupBy(inWindow(co.projects, 365, nowMs), (p) => p.sector)]
        .map(([k, v]) => ({ k, v: v.length })).sort((a, b) => b.v - a.v),
    },
    products: {
      total: activeProducts.length,
      new30: co.products.filter((p) => p.addedAt > nowMs - 30 * DAY).length,
      new90: co.products.filter((p) => p.addedAt > nowMs - 90 * DAY).length,
      removed90: co.products.filter((p) => p.removedAt && p.removedAt > nowMs - 90 * DAY).length,
      promoted: activeProducts.filter((p) => p.promoted).length,
      withPrice: activeProducts.filter((p) => p.price).length,
      priceChanges30: priceChanges.length,
      categories: [...groupBy(activeProducts, (p) => p.category)].map(([k, v]) => ({ k, v: v.length })).sort((a, b) => b.v - a.v),
    },
    web: {
      d7: inWindow(co.webChanges, 7, nowMs).length,
      d30: inWindow(co.webChanges, 30, nowMs).length,
      d90: inWindow(co.webChanges, 90, nowMs).length,
      prev30: inPrevWindow(co.webChanges, 30, nowMs).length,
      important30: inWindow(co.webChanges, 30, nowMs).filter((c) => c.importance >= 3).length,
    },
    social: {
      followers: socialTotals.followers,
      growth30: socialTotals.growthAbs,
      growth30Pct: socialTotals.followers ? round(pctChange(socialTotals.followers, socialTotals.followers - socialTotals.growthAbs), 1) : 0,
      posts30: socialTotals.posts30, posts90: socialTotals.posts90, postsPrev30: socialTotals.postsPrev30,
      postsAccel: round(pctChange(socialTotals.posts30, socialTotals.postsPrev30), 0),
      platforms: socialTotals.platforms,
      engagementRate: socialTotals.platforms.length
        ? round(socialTotals.platforms.reduce((s, p) => s + p.engagementRate, 0) / socialTotals.platforms.length, 2) : 0,
    },
    youtube: yt,
    seo: {
      visibility: co.seo.visibility,
      visDelta30: round(seriesDelta(co.seo.visSeries, 30).abs || 0, 1),
      top10: seoTop10,
      improved: co.seo.keywords.filter((k) => k.delta > 0).length,
      declined: co.seo.keywords.filter((k) => k.delta < 0).length,
      newKeywords: co.seo.newKeywords, lostKeywords: co.seo.lostKeywords,
      backlinks: co.seo.backlinks, refDomains: co.seo.refDomains, organic: co.seo.organic,
    },
    traffic: {
      monthly: co.traffic.monthly,
      delta: round(pctChange(co.traffic.monthly, co.traffic.series[co.traffic.series.length - 4]?.v || co.traffic.monthly), 1),
    },
    ads: {
      active: co.ads.filter((a) => a.active).length,
      new30: inWindow(co.ads, 30, nowMs, 'start').length,
      prev30: inPrevWindow(co.ads, 30, nowMs, 'start').length,
    },
    news: {
      d30: inWindow(co.news, 30, nowMs).length,
      d90: inWindow(co.news, 90, nowMs).length,
      total: co.news.length,
    },
    jobs: {
      active: co.jobs.filter((j) => j.active).length,
      new30: inWindow(co.jobs, 30, nowMs).length,
      new90: inWindow(co.jobs, 90, nowMs).length,
      prev30: inPrevWindow(co.jobs, 30, nowMs).length,
      byDept: [...groupBy(inWindow(co.jobs, 90, nowMs), (j) => j.department)]
        .map(([k, v]) => ({ k, v: v.length })).sort((a, b) => b.v - a.v),
      avgDaysActive: co.jobs.length ? Math.round(co.jobs.reduce((s, j) => s + j.daysActive, 0) / co.jobs.length) : 0,
    },
    tenders: {
      total: co.tenders.length,
      won: co.tenders.filter((t) => t.status === 'won').length,
      value: co.tenders.filter((t) => t.status === 'won').reduce((s, t) => s + t.value, 0),
      d365: inWindow(co.tenders, 365, nowMs).length,
    },
  };
  return m;
}

/* ---------- topics / trending issues ---------- */
export function topicStats(reviews, days, nowMs, sentiment = null) {
  const cur = inWindow(reviews, days, nowMs).filter((r) => !sentiment || r.sentiment === sentiment);
  const prev = inPrevWindow(reviews, days, nowMs).filter((r) => !sentiment || r.sentiment === sentiment);
  const count = (arr) => {
    const m = new Map();
    arr.forEach((r) => r.topics.forEach((t) => m.set(t, (m.get(t) || 0) + 1)));
    return m;
  };
  const c = count(cur), pmap = count(prev);
  const ids = new Set([...c.keys(), ...pmap.keys()]);
  return [...ids].map((id) => {
    const now = c.get(id) || 0, before = pmap.get(id) || 0;
    return { id, label: topicLabel(id), now, before, delta: now - before, pct: pctChange(now, before) };
  }).sort((a, b) => b.now - a.now);
}

export function trendingIssues(reviews, nowMs, days = 30) {
  const neg = topicStats(reviews, days, nowMs, 'neg').filter((t) => t.now >= 2);
  const pos = topicStats(reviews, days, nowMs, 'pos').filter((t) => t.now >= 2);
  return {
    rising: sortBy(neg.filter((t) => t.delta > 0), (t) => t.pct).slice(0, 5),
    falling: sortBy(neg.filter((t) => t.delta < 0), (t) => -t.pct).slice(0, 3),
    praised: sortBy(pos, (t) => t.now).slice(0, 5),
    allNeg: neg, allPos: pos,
  };
}

/* ---------- scores ---------- */
const norm = (v, min, max) => (max === min ? 50 : clamp(((v - min) / (max - min)) * 100, 0, 100));

/** Percentage change with additive smoothing so small counts don't explode. */
export const smoothPct = (now, prev, k = 3) => ((now + k) / (prev + k) - 1) * 100;

export function computeScores(list, nowMs) {
  const raw = list.map((co) => {
    const m = co.metrics;
    return {
      id: co.id,
      reviewAct: m.reviews.d90,
      socialAct: m.social.posts90 + (m.youtube.present ? m.youtube.videos90 * 2 : 0),
      projects: m.projects.d90,
      webAct: m.web.d90,
      products: m.products.new90,
      jobs: m.jobs.new90,
      seo: m.seo.visibility,
      ads: m.ads.active,
      news: m.news.d90,
      followers: m.social.followers,
      rating: m.reviews.rating,
      respRate: m.reviews.responseRate90,
      posShare: m.reviews.sentimentPct.pos,
      traffic: m.traffic.monthly,
      growthSignals: [
        0.6 * smoothPct(m.reviews.d30, m.reviews.prev30, 4) + 0.4 * smoothPct(m.reviews.d90, m.reviews.prev90, 8),
        0.6 * smoothPct(m.social.posts30, m.social.postsPrev30, 4) + 0.4 * smoothPct(m.social.posts90, m.social.posts90 - m.social.posts30 || 1, 8),
        0.6 * smoothPct(m.projects.d30, m.projects.prev30, 3) + 0.4 * smoothPct(m.projects.d90, m.projects.prev90, 5),
        smoothPct(m.web.d30, m.web.prev30, 4),
        smoothPct(m.jobs.new30, m.jobs.prev30, 2),
        smoothPct(m.ads.new30, m.ads.prev30, 2),
        m.youtube.present ? smoothPct(m.youtube.videos30, m.youtube.videosPrev30, 2) : 0,
        m.social.growth30Pct * 4,
      ],
    };
  });

  const range = (key) => {
    const vals = raw.map((r) => r[key]);
    return [Math.min(...vals), Math.max(...vals)];
  };
  const R = {};
  ['reviewAct','socialAct','projects','webAct','products','jobs','seo','ads','news','followers','traffic']
    .forEach((k) => { R[k] = range(k); });

  return list.map((co) => {
    const r = raw.find((x) => x.id === co.id);
    const m = co.metrics;

    const activity = round(
      0.20 * norm(r.reviewAct, ...R.reviewAct) +
      0.18 * norm(r.socialAct, ...R.socialAct) +
      0.16 * norm(r.projects, ...R.projects) +
      0.12 * norm(r.webAct, ...R.webAct) +
      0.10 * norm(r.products, ...R.products) +
      0.08 * norm(r.jobs, ...R.jobs) +
      0.07 * norm(r.seo, ...R.seo) +
      0.05 * norm(r.ads, ...R.ads) +
      0.04 * norm(r.news, ...R.news), 0);

    const weights = [0.22, 0.16, 0.18, 0.10, 0.12, 0.08, 0.08, 0.06];
    // volume damping: a tiny base of activity cannot produce a huge momentum claim
    const volume = clamp((r.reviewAct + r.socialAct + r.projects * 3 + r.webAct) / 90, 0.25, 1);
    const momentum = round(clamp(
      r.growthSignals.reduce((s, v, i) => s + clamp(v, -90, 180) * weights[i], 0) * volume, -70, 140), 0);

    const reputation = round(
      0.50 * norm(r.rating, 3.5, 5) +
      0.20 * clamp(r.respRate, 0, 100) +
      0.20 * clamp(r.posShare, 0, 100) +
      0.10 * norm(r.reviewAct, ...R.reviewAct), 0);

    const commercial = round(
      0.34 * norm(r.projects, ...R.projects) +
      0.24 * norm(r.products, ...R.products) +
      0.16 * norm(m.tenders.d365, 0, 8) +
      0.14 * norm(r.ads, ...R.ads) +
      0.12 * norm(r.jobs, ...R.jobs), 0);

    const digital = round(
      0.28 * norm(r.socialAct, ...R.socialAct) +
      0.22 * norm(r.followers, ...R.followers) +
      0.22 * norm(r.seo, ...R.seo) +
      0.18 * norm(r.traffic, ...R.traffic) +
      0.10 * norm(r.webAct, ...R.webAct), 0);

    const growth = round(clamp(50 + momentum * 0.55, 0, 100), 0);

    const threatRaw = 0.45 * activity + 0.40 * clamp(50 + momentum * 0.6, 0, 100) + 0.15 * commercial;
    const threat = co.isOwn ? 'own' : threatRaw >= 72 ? 'high' : threatRaw >= 52 ? 'medium' : 'low';

    return { ...co, scores: { activity, momentum, reputation, commercial, digital, growth, threat, threatRaw: round(threatRaw, 0) } };
  });
}

/* ---------- unified timeline ---------- */
const TL = {
  review:  { icon: 'star',      color: 'var(--hue-yellow)' },
  project: { icon: 'layers',    color: 'var(--hue-teal)' },
  product: { icon: 'box',       color: 'var(--hue-indigo)' },
  web:     { icon: 'globe',     color: 'var(--hue-blue)' },
  social:  { icon: 'message',   color: 'var(--hue-pink)' },
  video:   { icon: 'youtube',   color: 'var(--hue-red)' },
  job:     { icon: 'briefcase', color: 'var(--hue-purple)' },
  news:    { icon: 'news',      color: 'var(--hue-orange)' },
  ad:      { icon: 'megaphone', color: 'var(--hue-pink)' },
  tender:  { icon: 'gavel',     color: 'var(--hue-green)' },
};

export function buildTimeline(co, nowMs, days = 90, limit = 400) {
  const from = nowMs - days * DAY;
  const items = [];
  const push = (kind, date, title, meta, extra = {}) => {
    if (date <= from) return;
    items.push({ kind, date, title, meta, ...TL[kind], ...extra });
  };

  // reviews grouped per day to avoid noise
  const byDay = groupBy(inWindow(co.reviews, days, nowMs), (r) => new Date(r.date).toDateString());
  for (const [, arr] of byDay) {
    const avg = round(arr.reduce((s, r) => s + r.stars, 0) / arr.length, 1);
    push('review', Math.max(...arr.map((r) => r.date)),
      `+${arr.length} recenzie${arr.length > 1 ? 'i' : ''} Google`,
      `medie ${avg}★ · ${arr.filter((r) => r.sentiment === 'neg').length} negative`,
      { link: `#/company/${co.id}/reviews`, confidence: 'verified' });
  }
  inWindow(co.projects, days, nowMs).forEach((p) =>
    push('project', p.date, `Proiect nou: ${p.name}`, `${p.sector} · sursă: ${p.source}`,
      { link: `#/company/${co.id}/projects`, confidence: p.confidence }));
  co.products.filter((p) => p.addedAt > from).slice(0, 60).forEach((p) =>
    push('product', p.addedAt, `Produs nou: ${p.name}`, `${p.category} · ${p.brand}`,
      { link: `#/company/${co.id}/products`, confidence: p.confidence }));
  inWindow(co.webChanges, days, nowMs).filter((c) => c.importance >= 2).forEach((c) =>
    push('web', c.date, `${c.label}${c.after ? `: ${c.after}` : ''}`, c.page,
      { link: `#/company/${co.id}/website`, confidence: c.confidence }));
  PLATFORMS.forEach((plat) => {
    const s = co.social[plat.id];
    if (!s || !s.present) return;
    inWindow(s.posts, days, nowMs).slice(0, 40).forEach((p) =>
      push('social', p.date, `${plat.label}: ${p.kind}`, `${p.likes} aprecieri · ${p.comments} comentarii`,
        { link: `#/company/${co.id}/social`, confidence: 'verified' }));
  });
  if (co.youtube.present) inWindow(co.youtube.videos, days, nowMs).forEach((v) =>
    push('video', v.date, `${v.isShort ? 'Short' : 'Video'} nou: ${v.title}`, `${v.views} vizualizări`,
      { link: `#/company/${co.id}/youtube`, confidence: 'verified' }));
  inWindow(co.jobs, days, nowMs).forEach((j) =>
    push('job', j.date, `Anunț nou: ${j.title}`, `${j.department} · ${j.location}`,
      { link: `#/company/${co.id}/jobs`, confidence: 'verified' }));
  inWindow(co.news, days, nowMs).forEach((n) =>
    push('news', n.date, n.title, n.source, { link: `#/company/${co.id}/news`, confidence: 'verified' }));
  inWindow(co.ads, days, nowMs, 'start').forEach((a) =>
    push('ad', a.start, `Campanie nouă ${a.platform}`, a.message, { link: `#/company/${co.id}/ads`, confidence: 'high' }));
  inWindow(co.tenders, days, nowMs).forEach((t) =>
    push('tender', t.date, `Licitație: ${t.title}`, `${t.institution} · ${t.status}`,
      { link: `#/company/${co.id}/tenders`, confidence: 'verified' }));

  return items.sort((a, b) => b.date - a.date).slice(0, limit);
}

/* ---------- share of voice ---------- */
export function shareOfVoice(list, nowMs, days = 90) {
  const rows = list.map((co) => {
    const parts = {
      reviews: inWindow(co.reviews, days, nowMs).length,
      social: PLATFORMS.reduce((s, p) => s + (co.social[p.id]?.present ? inWindow(co.social[p.id].posts, days, nowMs).length : 0), 0),
      projects: inWindow(co.projects, days, nowMs).length * 3,
      news: inWindow(co.news, days, nowMs).length * 4,
      youtube: co.youtube.present ? inWindow(co.youtube.videos, days, nowMs).length * 2 : 0,
      ads: inWindow(co.ads, days, nowMs, 'start').length * 2,
    };
    return { id: co.id, name: co.name, color: co.color, isOwn: !!co.isOwn, parts, total: Object.values(parts).reduce((a, b) => a + b, 0) };
  });
  const grand = rows.reduce((s, r) => s + r.total, 0) || 1;
  return rows.map((r) => ({ ...r, share: round((r.total / grand) * 100, 1) })).sort((a, b) => b.share - a.share);
}

/* ---------- market-level trending issues ---------- */
export function marketTopics(list, nowMs, days = 30) {
  const all = list.flatMap((c) => c.reviews);
  return trendingIssues(all, nowMs, days);
}

/* ---------- opportunity & threat detectors ---------- */
export function detectOpportunities(list, nowMs) {
  const out = [];
  const own = list.find((c) => c.isOwn);
  const others = list.filter((c) => !c.isOwn);

  // 1. Shared complaint topic rising across competitors
  for (const t of TOPICS) {
    const affected = others.filter((c) => {
      const s = topicStats(c.reviews, 30, nowMs, 'neg').find((x) => x.id === t.id);
      return s && s.now >= 2 && s.delta > 0;
    });
    if (affected.length >= 3) {
      out.push({
        id: `opp_topic_${t.id}`, type: 'positioning', impact: affected.length >= 5 ? 'high' : 'medium',
        title: `Reclamațiile „${t.label}” cresc la ${affected.length} concurenți`,
        body: `În ultimele 30 de zile, ${affected.map((c) => c.name).join(', ')} au primit mai multe recenzii negative pe tema „${t.label.toLowerCase()}”. Oportunitate de poziționare comercială pe acest punct.`,
        companies: affected.map((c) => c.id), evidence: `${affected.length} companii · fereastră 30 zile`,
        confidence: 'ai',
      });
    }
  }
  // 2. Sector with low competitor coverage
  const sectorCount = new Map();
  others.forEach((c) => inWindow(c.projects, 90, nowMs).forEach((p) => sectorCount.set(p.sector, (sectorCount.get(p.sector) || 0) + 1)));
  const thin = [...sectorCount].filter(([, v]) => v <= 3).sort((a, b) => a[1] - b[1]).slice(0, 2);
  thin.forEach(([sector, v]) => out.push({
    id: `opp_sector_${sector}`, type: 'whitespace', impact: 'medium',
    title: `Segment slab acoperit: ${sector}`,
    body: `Concurenții au publicat doar ${v} proiecte pe segmentul ${sector} în ultimele 90 de zile, deși există cerere constantă în căutări. Spațiu liber pentru conținut și oferte dedicate.`,
    companies: [], evidence: `${v} proiecte / 90 zile în piață`, confidence: 'ai',
  }));

  // 3. Weak response rate at competitors
  const weakResp = others.filter((c) => c.metrics.reviews.responseRate90 < 40 && c.metrics.reviews.d90 >= 8);
  if (weakResp.length >= 2) out.push({
    id: 'opp_response', type: 'reputation', impact: 'medium',
    title: `${weakResp.length} concurenți răspund la sub 40% din recenzii`,
    body: `${weakResp.map((c) => `${c.name} (${c.metrics.reviews.responseRate90}%)`).join(', ')}. Un timp de răspuns rapid și vizibil poate deveni diferențiator în Google Business Profile.`,
    companies: weakResp.map((c) => c.id), evidence: 'rata de răspuns, 90 zile', confidence: 'high',
  });

  // 4. Keyword gaps where own company is behind but volume is high
  if (own) {
    const gaps = own.seo.keywords.filter((k) => k.pos > 8)
      .map((k) => {
        const best = others.map((c) => ({ c, k2: c.seo.keywords.find((x) => x.kw === k.kw) }))
          .filter((x) => x.k2).sort((a, b) => a.k2.pos - b.k2.pos)[0];
        return { kw: k.kw, pos: k.pos, volume: k.volume, best };
      }).sort((a, b) => b.volume - a.volume).slice(0, 2);
    gaps.forEach((g) => out.push({
      id: `opp_seo_${g.kw}`, type: 'seo', impact: g.volume > 1000 ? 'high' : 'medium',
      title: `Poziția ${g.pos} pe „${g.kw}” (${g.volume} căutări/lună)`,
      body: `${g.best ? `${g.best.c.name} este pe poziția ${g.best.k2.pos}. ` : ''}Recuperarea acestui cuvânt-cheie ar aduce trafic organic direct comercial.`,
      companies: g.best ? [g.best.c.id] : [], evidence: 'date SEO estimate', confidence: 'estimated',
    }));
  }

  // 5. Price undercutting opportunity
  const priceLeaders = others.filter((c) => c.metrics.products.priceChanges30 > 6);
  if (priceLeaders.length) out.push({
    id: 'opp_price', type: 'pricing', impact: 'medium',
    title: `Mișcări de preț la ${priceLeaders.length} concurenți`,
    body: `${priceLeaders.map((c) => c.name).join(', ')} au modificat prețuri publice în ultimele 30 de zile. Verifică pozițiile unde diferența depășește 10%.`,
    companies: priceLeaders.map((c) => c.id), evidence: 'monitorizare prețuri publice', confidence: 'high',
  });

  return out.slice(0, 8);
}

export function detectThreats(list, nowMs) {
  const out = [];
  for (const co of list.filter((c) => !c.isOwn)) {
    const m = co.metrics, s = co.scores;
    const signals = [];
    if (m.projects.d90 > m.projects.prev90 * 1.4 && m.projects.d90 >= 5)
      signals.push(`a crescut frecvența proiectelor cu ${round(pctChange(m.projects.d90, m.projects.prev90), 0)}%`);
    if (m.jobs.new90 >= 6) signals.push(`a publicat ${m.jobs.new90} anunțuri de angajare în 90 zile`);
    if (m.products.new90 >= 8) signals.push(`a introdus ${m.products.new90} produse noi`);
    if (m.social.growth30Pct > 3) signals.push(`audiența socială a crescut cu ${m.social.growth30Pct}% într-o lună`);
    if (m.youtube.present && m.youtube.videos30 >= 4) signals.push(`a publicat ${m.youtube.videos30} videoclipuri în 30 zile`);
    if (m.ads.active >= 6) signals.push(`are ${m.ads.active} campanii publicitare active`);
    if (m.reviews.accel > 40) signals.push(`ritmul recenziilor a accelerat cu ${m.reviews.accel}%`);
    if (m.web.important30 >= 6) signals.push(`${m.web.important30} modificări importante pe website în 30 zile`);
    if (signals.length >= 2) {
      out.push({
        id: `thr_${co.id}`, companyId: co.id, company: co.name, color: co.color,
        level: s.threat, score: s.threatRaw, momentum: s.momentum,
        title: `${co.name} accelerează pe mai multe canale`,
        body: `${co.name} ${signals.slice(0, 4).join(', ')}.`,
        signals, confidence: 'ai',
      });
    }
  }
  return sortBy(out, (t) => t.score);
}

/* ---------- top movers ---------- */
export function topMovers(list) {
  return sortBy(list, (c) => c.scores.momentum).slice(0, 5);
}

/* ---------- Romanian pluralisation helpers ---------- */
export const plural = (n, one, many, few = null) => {
  const f = few || many;
  if (n === 1) return `${n} ${one}`;
  if (n === 0 || (n % 100 >= 1 && n % 100 <= 19)) return `${n} ${f}`;
  return `${n} ${many}`;
};
const nProjects = (n) => plural(n, 'proiect nou', 'de proiecte noi', 'proiecte noi');
const nReviews  = (n) => plural(n, 'recenzie', 'de recenzii', 'recenzii');
const nPosts    = (n) => plural(n, 'postare', 'de postări', 'postări');
const nVideos   = (n) => plural(n, 'videoclip', 'de videoclipuri', 'videoclipuri');
const nProducts = (n) => plural(n, 'produs nou', 'de produse noi', 'produse noi');
const nJobs     = (n) => plural(n, 'anunț de angajare', 'de anunțuri de angajare', 'anunțuri de angajare');

/* ---------- AI brief ---------- */
export function buildBrief(list, nowMs, period = 'weekly') {
  const days = period === 'daily' ? 1 : period === 'monthly' ? 30 : 7;
  const others = list.filter((c) => !c.isOwn);
  const own = list.find((c) => c.isOwn);

  const scored = others.map((co) => {
    const acts = inWindow(co.reviews, days, nowMs).length
      + inWindow(co.projects, days, nowMs).length * 3
      + (co.youtube.present ? inWindow(co.youtube.videos, days, nowMs).length * 2 : 0)
      + PLATFORMS.reduce((s, p) => s + (co.social[p.id]?.present ? inWindow(co.social[p.id].posts, days, nowMs).length : 0), 0)
      + co.products.filter((p) => p.addedAt > nowMs - days * DAY).length
      + inWindow(co.webChanges, days, nowMs).length * 0.5
      + inWindow(co.jobs, days, nowMs).length * 2;
    return { co, acts };
  }).sort((a, b) => b.acts - a.acts);

  const lead = scored[0];
  const runner = scored[1];
  const market = marketTopics(list, nowMs, Math.max(30, days));
  const rising = market.rising[0];

  const stat = (co) => ({
    reviews: inWindow(co.reviews, days, nowMs).length,
    projects: inWindow(co.projects, days, nowMs).length,
    posts: PLATFORMS.reduce((s, p) => s + (co.social[p.id]?.present ? inWindow(co.social[p.id].posts, days, nowMs).length : 0), 0),
    videos: co.youtube.present ? inWindow(co.youtube.videos, days, nowMs).length : 0,
    products: co.products.filter((p) => p.addedAt > nowMs - days * DAY).length,
    jobs: inWindow(co.jobs, days, nowMs).length,
    ratingDelta: round(seriesDelta(co.gmb.ratingSeries, days).abs || 0, 2),
  });

  const l = lead ? stat(lead.co) : null;
  const paragraphs = [];
  if (lead) {
    paragraphs.push(`**${lead.co.name}** a fost cel mai activ competitor în ultimele ${days === 1 ? '24 de ore' : `${days} zile`}. ` +
      `A publicat ${nProjects(l.projects)}, a primit ${nReviews(l.reviews)}${l.ratingDelta ? ` (rating ${l.ratingDelta > 0 ? '+' : '−'}${Math.abs(l.ratingDelta)})` : ''}, ` +
      `${nPosts(l.posts)} pe social media, ${nVideos(l.videos)} și a adăugat ${nProducts(l.products)}. ` +
      `Momentum: *${lead.co.scores.momentum > 0 ? '+' : ''}${lead.co.scores.momentum}%*.`);
  }
  if (runner) {
    const r = stat(runner.co);
    paragraphs.push(`**${runner.co.name}** urmează cu ${nProjects(r.projects)}, ${nPosts(r.posts)} și ${nJobs(r.jobs)}. ` +
      `Activity Score: *${runner.co.scores.activity}/100*.`);
  }
  if (rising) {
    paragraphs.push(`Principala problemă în creștere în piață rămâne **${rising.label.toLowerCase()}**: ` +
      `${rising.now} mențiuni negative în ultimele 30 de zile, *${rising.pct > 0 ? '+' : ''}${round(rising.pct, 0)}%* față de perioada precedentă.`);
  }
  if (own) {
    const o = stat(own);
    paragraphs.push(`Pentru **${own.name}**: ${nReviews(o.reviews)} noi, ${nProjects(o.projects)} publicate, Activity Score *${own.scores.activity}/100*, ` +
      `Momentum *${own.scores.momentum > 0 ? '+' : ''}${own.scores.momentum}%*. Rata de răspuns la recenzii: ${own.metrics.reviews.responseRate90}%.`);
  }

  return {
    period, days,
    generatedAt: nowMs,
    title: period === 'daily' ? 'Brief zilnic' : period === 'monthly' ? 'Brief lunar' : 'Brief săptămânal',
    paragraphs,
    leader: lead?.co || null,
    highlights: scored.slice(0, 5).map((s) => ({ id: s.co.id, name: s.co.name, color: s.co.color, acts: round(s.acts, 0), momentum: s.co.scores.momentum })),
  };
}

/* ---------- market overview ---------- */
export function marketOverview(list, nowMs) {
  const totals = {
    reviews30: list.reduce((s, c) => s + c.metrics.reviews.d30, 0),
    projects30: list.reduce((s, c) => s + c.metrics.projects.d30, 0),
    products30: list.reduce((s, c) => s + c.metrics.products.new30, 0),
    posts30: list.reduce((s, c) => s + c.metrics.social.posts30, 0),
    jobs30: list.reduce((s, c) => s + c.metrics.jobs.new30, 0),
    web30: list.reduce((s, c) => s + c.metrics.web.d30, 0),
    videos30: list.reduce((s, c) => s + (c.metrics.youtube.present ? c.metrics.youtube.videos30 : 0), 0),
    ads: list.reduce((s, c) => s + c.metrics.ads.active, 0),
  };
  const lead = (fn) => sortBy(list, fn).slice(0, 3).map((c) => ({ id: c.id, name: c.name, color: c.color, v: fn(c) }));
  return {
    totals,
    avgRating: round(list.reduce((s, c) => s + c.metrics.reviews.rating, 0) / list.length, 2),
    leaders: {
      active: lead((c) => c.scores.activity),
      momentum: lead((c) => c.scores.momentum),
      reviews: lead((c) => c.metrics.reviews.d30),
      projects: lead((c) => c.metrics.projects.d90),
      jobs: lead((c) => c.metrics.jobs.new90),
      engagement: lead((c) => c.metrics.social.engagementRate),
      products: lead((c) => c.metrics.products.new90),
      visibility: lead((c) => c.metrics.seo.visibility),
    },
    topics: marketTopics(list, nowMs, 30),
    sov: shareOfVoice(list, nowMs, 90),
  };
}
