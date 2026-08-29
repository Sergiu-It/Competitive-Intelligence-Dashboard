/* ============================================================
   Dataset generator — deterministic synthetic history.
   Produces daily series + event streams for every module so
   every delta (7/30/90/180/365 zile) is computed from real data.
   ============================================================ */
import { makeRng } from '../rng.js';
import {
  COMPANIES, TOPICS, REVIEW_TEXT, REPLY_TEXT, REVIEWERS, SECTORS, PROJECT_CLIENTS,
  PROJECT_LOCATIONS, PROJECT_TYPES, PRODUCT_TREE, PRODUCT_BRANDS, PRODUCT_MODIFIERS,
  WEB_CHANGES, JOB_TITLES, NEWS_SOURCES, NEWS_TYPES, NEWS_TPL, VIDEO_TPL, SHORTS_TPL,
  AD_PLATFORMS, AD_MESSAGES, KEYWORDS, INSTITUTIONS,
} from './seed.js';
import { addDays, iso, DAY, clamp, round, slugify } from '../util.js';

export const HISTORY_DAYS = 420;

/* Per-company behaviour so the market tells a coherent story. */
const PERSONA = {
  carepack:    { rating: 4.7, revPerMonth: 14, revTrend: 0.55, respRate: 0.92, respH: 6,  weak: ['termene'],                strong: ['profesionalism','calitate_serv'], projPM: 3.4, prodBase: 780, socGrowth: 0.031, postWeek: 4.2, vidMonth: 2.4, webPM: 7, jobPM: 1.1, newsPM: 0.5, adsN: 6, seo: 0.78, traffic: 14200 },
  vitra:       { rating: 4.6, revPerMonth: 22, revTrend: -0.15, respRate: 0.61, respH: 34, weak: ['termene','livrare'],     strong: ['disponibilitate','pret'],         projPM: 4.1, prodBase: 1240, socGrowth: 0.012, postWeek: 5.1, vidMonth: 3.1, webPM: 9, jobPM: 1.4, newsPM: 0.8, adsN: 9, seo: 0.86, traffic: 21800 },
  rafturipro:  { rating: 4.4, revPerMonth: 11, revTrend: 0.30, respRate: 0.48, respH: 51, weak: ['montaj','comunicare'],    strong: ['pret'],                           projPM: 2.2, prodBase: 410, socGrowth: 0.024, postWeek: 3.0, vidMonth: 1.6, webPM: 5, jobPM: 0.7, newsPM: 0.2, adsN: 4, seo: 0.54, traffic: 6400 },
  metaldepo:   { rating: 4.5, revPerMonth: 16, revTrend: 1.35, respRate: 0.74, respH: 12, weak: ['livrare'],                strong: ['calitate_prod','service'],        projPM: 5.6, prodBase: 690, socGrowth: 0.058, postWeek: 6.4, vidMonth: 4.2, webPM: 14, jobPM: 3.1, newsPM: 1.1, adsN: 12, seo: 0.71, traffic: 15900 },
  logisys:     { rating: 4.8, revPerMonth: 6,  revTrend: 0.42, respRate: 0.88, respH: 9,  weak: ['pret'],                   strong: ['profesionalism','tehnic'],        projPM: 1.9, prodBase: 260, socGrowth: 0.027, postWeek: 2.1, vidMonth: 1.1, webPM: 4, jobPM: 0.9, newsPM: 0.4, adsN: 3, seo: 0.44, traffic: 4100 },
  horecaexpert:{ rating: 4.3, revPerMonth: 19, revTrend: 0.05, respRate: 0.55, respH: 28, weak: ['service','garantie'],     strong: ['disponibilitate'],                projPM: 2.8, prodBase: 950, socGrowth: 0.019, postWeek: 4.6, vidMonth: 2.0, webPM: 8, jobPM: 1.2, newsPM: 0.5, adsN: 7, seo: 0.63, traffic: 11200 },
  shelfline:   { rating: 4.6, revPerMonth: 5,  revTrend: 0.62, respRate: 0.80, respH: 14, weak: ['disponibilitate'],        strong: ['comunicare'],                     projPM: 1.2, prodBase: 180, socGrowth: 0.041, postWeek: 3.4, vidMonth: 0.6, webPM: 3, jobPM: 0.4, newsPM: 0.1, adsN: 2, seo: 0.31, traffic: 2600 },
  nordicarack: { rating: 4.2, revPerMonth: 4,  revTrend: -0.30, respRate: 0.22, respH: 96, weak: ['comunicare','termene'],  strong: ['pret'],                           projPM: 0.9, prodBase: 210, socGrowth: 0.004, postWeek: 1.1, vidMonth: 0.4, webPM: 2, jobPM: 0.2, newsPM: 0.1, adsN: 1, seo: 0.22, traffic: 1500 },
  interstore:  { rating: 4.4, revPerMonth: 12, revTrend: -0.05, respRate: 0.66, respH: 22, weak: ['livrare','pret'],        strong: ['calitate_prod'],                  projPM: 2.5, prodBase: 640, socGrowth: 0.011, postWeek: 3.2, vidMonth: 1.2, webPM: 6, jobPM: 0.8, newsPM: 0.3, adsN: 5, seo: 0.57, traffic: 8300 },
  depomax:     { rating: 4.1, revPerMonth: 9,  revTrend: 0.88, respRate: 0.35, respH: 62, weak: ['montaj','tehnic'],        strong: ['pret','livrare'],                 projPM: 3.0, prodBase: 320, socGrowth: 0.047, postWeek: 4.0, vidMonth: 1.8, webPM: 7, jobPM: 2.0, newsPM: 0.3, adsN: 8, seo: 0.39, traffic: 5200 },
  eurorafturi: { rating: 3.9, revPerMonth: 3,  revTrend: -0.45, respRate: 0.09, respH: 140,weak: ['calitate_serv','service'],strong: ['pret'],                          projPM: 0.5, prodBase: 150, socGrowth: -0.006, postWeek: 0.5, vidMonth: 0.1, webPM: 1, jobPM: 0.1, newsPM: 0.05, adsN: 0, seo: 0.17, traffic: 900 },
  tehnostore:  { rating: 4.5, revPerMonth: 4,  revTrend: 0.95, respRate: 0.70, respH: 18, weak: ['disponibilitate'],        strong: ['personal'],                       projPM: 1.0, prodBase: 240, socGrowth: 0.062, postWeek: 3.8, vidMonth: 1.4, webPM: 4, jobPM: 0.6, newsPM: 0.1, adsN: 3, seo: 0.26, traffic: 2100 },
};

const poisson = (rng, lambda) => {
  if (lambda <= 0) return 0;
  const L = Math.exp(-lambda);
  let k = 0, p = 1;
  do { k++; p *= rng(); } while (p > L);
  return k - 1;
};

const PLATFORMS = [
  { id: 'facebook',  label: 'Facebook',  icon: 'facebook',  base: 1.0,  share: 0.40 },
  { id: 'instagram', label: 'Instagram', icon: 'instagram', base: 0.62, share: 0.30 },
  { id: 'linkedin',  label: 'LinkedIn',  icon: 'linkedin',  base: 0.28, share: 0.10 },
  { id: 'tiktok',    label: 'TikTok',    icon: 'tiktok',    base: 0.35, share: 0.12 },
  { id: 'youtube',   label: 'YouTube',   icon: 'youtube',   base: 0.21, share: 0.08 },
];
export { PLATFORMS };

/* ---------------- reviews ---------------- */
function genReviews(co, p, rng, now) {
  const out = [];
  const negTopics = p.weak.concat(['livrare', 'termene']);
  for (let i = HISTORY_DAYS; i >= 0; i--) {
    const date = addDays(now, -i);
    const t = (HISTORY_DAYS - i) / HISTORY_DAYS;
    const trend = 1 + p.revTrend * t * t;
    const season = 1 + 0.22 * Math.sin((date.getMonth() / 12) * Math.PI * 2 + 1);
    const lambda = (p.revPerMonth / 30) * trend * season;
    const n = poisson(rng, lambda);
    for (let k = 0; k < n; k++) {
      // rating draw shaped by persona quality
      const q = p.rating;
      const r = rng();
      let stars;
      const pGood = clamp((q - 3.2) / 1.8, 0.15, 0.92);
      if (r < pGood) stars = rng.chance(0.72) ? 5 : 4;
      else if (r < pGood + 0.12) stars = 3;
      else stars = rng.chance(0.55) ? 1 : 2;

      // Market-wide delivery pressure in the recent window (drives Trending Issues)
      const recent = i <= 30;
      let topics;
      if (stars <= 2) {
        const bias = recent && rng.chance(0.55) ? rng.pick(['livrare', 'termene']) : rng.pick(negTopics);
        topics = [bias, ...rng.picks(TOPICS.map((x) => x.id).filter((x) => x !== bias), rng.int(0, 1))];
      } else if (stars === 3) {
        topics = rng.picks(TOPICS.map((x) => x.id), rng.int(1, 2));
      } else {
        const bias = rng.pick(p.strong);
        topics = [bias, ...rng.picks(TOPICS.map((x) => x.id).filter((x) => x !== bias), rng.int(0, 1))];
      }

      const sentiment = stars >= 4 ? 'pos' : stars === 3 ? 'neu' : 'neg';
      const bank = sentiment === 'neu' ? REVIEW_TEXT.neutral : REVIEW_TEXT[sentiment][topics[0]] || REVIEW_TEXT.neutral;
      const text = rng.pick(bank);

      // response behaviour improves/degrades slowly over time
      const respDrift = p.respRate * (1 + (t - 0.5) * (p.revTrend > 0.4 ? 0.35 : -0.2));
      const replied = rng.chance(clamp(respDrift, 0.02, 0.98)) && i > 1;
      const respHours = replied ? Math.max(1, Math.round(p.respH * (1 + rng.gauss(0, 0.5)) * (1 - (t - 0.5) * 0.35))) : null;

      const ts = new Date(date);
      ts.setHours(rng.int(8, 20), rng.int(0, 59), 0, 0);
      out.push({
        id: `rv_${co.id}_${out.length}`,
        author: rng.pick(REVIEWERS),
        stars, sentiment, topics, text,
        date: ts.getTime(),
        replied,
        replyText: replied ? rng.pick(sentiment === 'neg' ? REPLY_TEXT.slice(2) : REPLY_TEXT.slice(0, 2)) : null,
        replyHours: respHours,
        source: 'Google Business Profile',
        confidence: 'verified',
      });
    }
  }
  return out.sort((a, b) => b.date - a.date);
}

/* ---------------- generic event helper ---------------- */
function eventDates(rng, perMonth, days, now, trendBoost = 0) {
  const dates = [];
  for (let i = days; i >= 0; i--) {
    const t = (days - i) / days;
    const lambda = (perMonth / 30) * (1 + trendBoost * t * t);
    const n = poisson(rng, lambda);
    for (let k = 0; k < n; k++) {
      const d = addDays(now, -i);
      d.setHours(rng.int(9, 19), rng.int(0, 59), 0, 0);
      dates.push(d.getTime());
    }
  }
  return dates.sort((a, b) => b - a);
}

/* ---------------- projects ---------------- */
function genProjects(co, p, rng, now) {
  const sectors = co.domains.length ? co.domains : SECTORS;
  return eventDates(rng, p.projPM, HISTORY_DAYS, now, p.revTrend).map((date, i) => {
    const sector = rng.chance(0.75) ? rng.pick(sectors) : rng.pick(SECTORS);
    const client = rng.pick(PROJECT_CLIENTS);
    const loc = rng.pick(PROJECT_LOCATIONS);
    const type = rng.pick(PROJECT_TYPES);
    const cat = rng.pick(PRODUCT_TREE);
    return {
      id: `pj_${co.id}_${i}`,
      name: `${type} — ${client}, ${loc}`,
      client, location: loc, sector, type, date,
      products: rng.picks(cat.subs, rng.int(1, 3)),
      size: rng.chance(0.55) ? `${rng.int(1, 9) * 100} m²` : null,
      images: rng.int(2, 8),
      sourceUrl: `https://${co.website}/proiecte/${slugify(client)}-${slugify(loc)}`,
      source: rng.pick(['Website', 'Facebook', 'YouTube', 'LinkedIn', 'Comunicat']),
      confidence: rng.chance(0.7) ? 'verified' : 'ai',
    };
  });
}

/* ---------------- products & prices ---------------- */
function genProducts(co, p, rng, now) {
  const count = Math.round(p.prodBase * 0.14) + 24; // catalog sample kept workable
  const items = [];
  for (let i = 0; i < count; i++) {
    const node = rng.pick(PRODUCT_TREE);
    const sub = rng.pick(node.subs);
    const brand = rng.pick(PRODUCT_BRANDS);
    const mod = rng.pick(PRODUCT_MODIFIERS);
    const ageDays = rng.int(1, HISTORY_DAYS + 700);
    const addedAt = addDays(now, -ageDays).getTime();
    const removed = ageDays > 120 && rng.chance(0.06);
    const removedAt = removed ? addDays(now, -rng.int(1, 200)).getTime() : null;
    const hasPrice = rng.chance(0.72);
    const base = Math.round((rng.float(0.4, 12) ** 1.6) * 480 + 190);

    // monthly price history (last 14 months) with occasional changes
    const history = [];
    let price = Math.round(base * rng.float(0.86, 1.02));
    for (let m = 13; m >= 0; m--) {
      if (rng.chance(0.22)) price = Math.round(price * (1 + rng.gauss(0.008, 0.05)));
      history.push({ t: addDays(now, -m * 30).getTime(), v: price });
    }
    const promoted = rng.chance(0.14);
    const prices = history.map((h) => h.v);
    items.push({
      id: `pr_${co.id}_${i}`,
      name: `${sub} ${brand} ${mod}`,
      category: node.cat, subcategory: sub, brand,
      price: hasPrice ? price : null,
      prevPrice: hasPrice ? history[history.length - 2].v : null,
      min: hasPrice ? Math.min(...prices) : null,
      max: hasPrice ? Math.max(...prices) : null,
      history: hasPrice ? history : [],
      discount: promoted ? rng.int(5, 25) : 0,
      promoted,
      addedAt, removedAt,
      confidence: hasPrice ? 'verified' : 'estimated',
      url: `https://${co.website}/produse/${slugify(sub)}-${slugify(brand)}`,
    });
  }
  return items.sort((a, b) => b.addedAt - a.addedAt);
}

/* ---------------- website changes ---------------- */
function genWebChanges(co, p, rng, now) {
  return eventDates(rng, p.webPM, HISTORY_DAYS, now, p.revTrend * 0.6).map((date, i) => {
    const kind = rng.pick(WEB_CHANGES);
    const node = rng.pick(PRODUCT_TREE);
    const sub = rng.pick(node.subs);
    let before = null, after = null, page = '/';
    switch (kind.type) {
      case 'price_change': {
        const a = rng.int(1200, 18000), b = Math.round(a * rng.float(0.82, 1.22));
        before = `${a} MDL`; after = `${b} MDL`; page = `/produse/${slugify(sub)}`;
        break;
      }
      case 'product_new':  after = `${sub} ${rng.pick(PRODUCT_BRANDS)}`; page = `/produse/${slugify(sub)}`; break;
      case 'product_gone': before = `${sub} ${rng.pick(PRODUCT_BRANDS)}`; page = `/produse/${slugify(sub)}`; break;
      case 'category_new': after = node.cat; page = `/categorii/${slugify(node.cat)}`; break;
      case 'page_new':     after = `Pagină „${rng.pick(['Despre noi', 'Servicii montaj', 'Proiecte', 'Cariere', 'Livrare', 'Garanție'])}”`; page = '/'; break;
      case 'page_removed': before = `Pagină „${rng.pick(['Promoții vechi', 'Catalog 2024', 'Blog'])}”`; page = '/'; break;
      case 'promo':        after = `${rng.int(5, 30)}% reducere la ${node.cat.toLowerCase()}`; page = '/promotii'; break;
      case 'banner':       before = 'Banner „Soluții pentru depozite”'; after = `Banner „${rng.pick(AD_MESSAGES)}”`; page = '/'; break;
      case 'brand_new':    after = rng.pick(PRODUCT_BRANDS); page = '/branduri'; break;
      case 'service_new':  after = rng.pick(['Proiectare 3D', 'Montaj la cheie', 'Leasing echipament', 'Service abonament', 'Audit depozit']); page = '/servicii'; break;
      case 'project_new':  after = `Proiect: ${rng.pick(PROJECT_CLIENTS)}`; page = '/proiecte'; break;
      case 'case_study':   after = `Studiu de caz: ${rng.pick(PROJECT_CLIENTS)}`; page = '/studii-de-caz'; break;
      case 'structure':    before = 'Meniu: 6 categorii'; after = `Meniu: ${rng.int(7, 11)} categorii`; page = '/'; break;
      default:
        before = 'Livrare în 7–10 zile lucrătoare';
        after = `Livrare în ${rng.int(2, 6)}–${rng.int(7, 10)} zile lucrătoare`;
        page = rng.pick(['/livrare', '/despre-noi', '/servicii']);
    }
    return {
      id: `wc_${co.id}_${i}`, date, type: kind.type, label: kind.label,
      importance: kind.imp, page, before, after,
      url: `https://${co.website}${page}`,
      source: 'Website crawler', confidence: kind.imp >= 3 ? 'verified' : 'high',
    };
  });
}

/* ---------------- social ---------------- */
function genSocial(co, p, rng, now) {
  const out = {};
  for (const plat of PLATFORMS) {
    const handle = co.socials[plat.id];
    if (!handle) { out[plat.id] = { present: false, label: plat.label, icon: plat.icon }; continue; }
    const growth = p.socGrowth * rng.float(0.7, 1.35) * (plat.id === 'tiktok' ? 1.7 : 1);
    const followersNow = Math.round(p.prodBase * plat.base * rng.float(2.2, 6.5) + 400);
    const series = [];
    let v = followersNow / (1 + growth) ** (HISTORY_DAYS / 30);
    for (let i = HISTORY_DAYS; i >= 0; i--) {
      v *= 1 + growth / 30 + rng.gauss(0, 0.0016);
      series.push({ t: addDays(now, -i).getTime(), v: Math.max(50, Math.round(v)) });
    }
    const postRate = (p.postWeek * plat.share * 30) / 7; // posts per month on this platform
    const posts = eventDates(rng, postRate, HISTORY_DAYS, now, p.revTrend * 0.8).map((date, i) => {
      const kind = rng.pick(['Produs', 'Proiect', 'Promoție', 'Recrutare', 'Eveniment', 'Educațional', 'Behind the scenes']);
      const f = series[series.length - 1].v;
      const likes = Math.max(1, Math.round(f * rng.float(0.004, 0.03)));
      return {
        id: `po_${co.id}_${plat.id}_${i}`, date, platform: plat.id, kind,
        text: `${kind}: ${rng.pick(AD_MESSAGES)}`,
        likes, comments: Math.round(likes * rng.float(0.03, 0.22)),
        shares: Math.round(likes * rng.float(0.01, 0.12)),
        views: Math.round(likes * rng.float(12, 45)),
      };
    });
    out[plat.id] = {
      present: true, label: plat.label, icon: plat.icon, handle,
      url: `https://${plat.id}.com/${handle}`,
      followers: series[series.length - 1].v, series, posts,
      confidence: 'verified',
    };
  }
  return out;
}

/* ---------------- youtube ---------------- */
function genYouTube(co, p, rng, now) {
  const handle = co.socials.youtube;
  if (!handle) return { present: false };
  const subsSeries = [];
  const subsNow = Math.round(p.prodBase * rng.float(0.6, 2.4) + 120);
  let v = subsNow / (1 + p.socGrowth) ** (HISTORY_DAYS / 30);
  for (let i = HISTORY_DAYS; i >= 0; i--) {
    v *= 1 + p.socGrowth / 30 + rng.gauss(0, 0.002);
    subsSeries.push({ t: addDays(now, -i).getTime(), v: Math.max(20, Math.round(v)) });
  }
  const videos = eventDates(rng, p.vidMonth, HISTORY_DAYS, now, p.revTrend).map((date, i) => {
    const isShort = rng.chance(0.34);
    const client = rng.pick(PROJECT_CLIENTS);
    const sector = rng.pick(SECTORS);
    const loc = rng.pick(PROJECT_LOCATIONS);
    const node = rng.pick(PRODUCT_TREE);
    const title = (isShort ? rng.pick(SHORTS_TPL) : rng.pick(VIDEO_TPL))
      .replace('{client}', client).replace('{sector}', sector.toLowerCase())
      .replace('{loc}', loc).replace('{product}', rng.pick(node.subs))
      .replace('{brand}', rng.pick(PRODUCT_BRANDS));
    const age = Math.max(1, Math.round((now - date) / DAY));
    const views = Math.round((isShort ? rng.float(400, 9000) : rng.float(180, 4200)) * (1 + age / 220));
    const likes = Math.round(views * rng.float(0.008, 0.05));
    // AI-detected commercial signals (spec §2)
    const signals = [];
    if (/Proiect|Studiu|Vizită/i.test(title)) signals.push({ k: 'proiect', v: client });
    if (/Prezentare produs|Noutăți|Produs nou/i.test(title)) signals.push({ k: 'produs', v: rng.pick(node.subs) });
    if (rng.chance(0.18)) signals.push({ k: 'parteneriat', v: rng.pick(PRODUCT_BRANDS) });
    if (rng.chance(0.14)) signals.push({ k: 'locație', v: loc });
    if (rng.chance(0.12)) signals.push({ k: 'echipament', v: rng.pick(['stivuitor nou', 'linie CNC', 'utilaj de debitare', 'presă hidraulică']) });
    if (rng.chance(0.09)) signals.push({ k: 'investiție', v: `${rng.int(2, 20)} mln MDL` });
    return {
      id: `yt_${co.id}_${i}`, date, title, isShort, views, likes,
      comments: Math.round(likes * rng.float(0.04, 0.2)),
      engagement: round((likes / Math.max(1, views)) * 100, 2),
      signals,
      url: `https://youtube.com/watch?v=${co.id}${i}`,
      confidence: 'verified',
    };
  });
  return {
    present: true, handle, url: `https://youtube.com/@${slugify(handle)}`,
    subs: subsSeries[subsSeries.length - 1].v, subsSeries, videos,
    totalViews: videos.reduce((s, x) => s + x.views, 0),
    confidence: 'verified',
  };
}

/* ---------------- SEO ---------------- */
function genSeo(co, p, rng, now) {
  const keywords = KEYWORDS.map((k) => {
    const strength = p.seo * rng.float(0.55, 1.45);
    const pos = clamp(Math.round(1 + (1 - strength) * rng.float(3, 42)), 1, 98);
    const drift = Math.round(rng.gauss(p.revTrend * -2.2, 3.4));
    const prev = clamp(pos + drift, 1, 100);
    return {
      kw: k.kw, volume: k.vol, pos, prev, delta: prev - pos,
      url: `https://${co.website}/${slugify(k.kw)}`,
      confidence: 'estimated',
    };
  }).sort((a, b) => a.pos - b.pos);
  const visSeries = [];
  let vis = p.seo * 100 * rng.float(0.8, 1.0);
  for (let i = HISTORY_DAYS; i >= 0; i--) {
    vis = clamp(vis * (1 + p.revTrend * 0.0009 + rng.gauss(0, 0.006)), 3, 100);
    visSeries.push({ t: addDays(now, -i).getTime(), v: round(vis, 1) });
  }
  return {
    keywords, visibility: visSeries[visSeries.length - 1].v, visSeries,
    newKeywords: rng.int(2, 24), lostKeywords: rng.int(1, 18),
    backlinks: Math.round(p.seo * rng.float(600, 5200)),
    refDomains: Math.round(p.seo * rng.float(40, 320)),
    organic: Math.round(p.traffic * rng.float(0.32, 0.58)),
    confidence: 'estimated',
  };
}

/* ---------------- traffic ---------------- */
function genTraffic(co, p, rng, now) {
  const series = [];
  let v = p.traffic / (1 + p.socGrowth * 3) ** 12;
  for (let m = 11; m >= 0; m--) {
    v *= 1 + p.socGrowth * 1.6 + rng.gauss(0, 0.05);
    series.push({ t: addDays(now, -m * 30).getTime(), v: Math.max(200, Math.round(v)) });
  }
  const organic = rng.float(0.3, 0.55), direct = rng.float(0.15, 0.3), social = rng.float(0.06, 0.2),
        paid = rng.float(0.02, 0.18);
  const referral = Math.max(0.03, 1 - organic - direct - social - paid);
  const norm = organic + direct + social + paid + referral;
  return {
    monthly: series[series.length - 1].v, series,
    channels: [
      { k: 'Organic', v: round((organic / norm) * 100, 1) },
      { k: 'Direct', v: round((direct / norm) * 100, 1) },
      { k: 'Social', v: round((social / norm) * 100, 1) },
      { k: 'Referral', v: round((referral / norm) * 100, 1) },
      { k: 'Paid', v: round((paid / norm) * 100, 1) },
    ],
    countries: [
      { k: 'Moldova', v: round(rng.float(72, 91), 1) },
      { k: 'România', v: round(rng.float(3, 14), 1) },
      { k: 'Ucraina', v: round(rng.float(1, 6), 1) },
      { k: 'Italia', v: round(rng.float(0.5, 3), 1) },
    ],
    topPages: ['/', '/produse', '/rafturi-depozit', '/proiecte', '/contacte']
      .map((u) => ({ url: u, share: round(rng.float(4, 32), 1) })).sort((a, b) => b.share - a.share),
    source: 'Estimare agregată (similarweb-like)',
    confidence: 'estimated',
  };
}

/* ---------------- ads ---------------- */
function genAds(co, p, rng, now) {
  const list = [];
  const total = p.adsN + rng.int(0, 6);
  for (let i = 0; i < total; i++) {
    const start = addDays(now, -rng.int(1, 220)).getTime();
    const durDays = rng.int(5, 70);
    const end = start + durDays * DAY;
    const node = rng.pick(PRODUCT_TREE);
    list.push({
      id: `ad_${co.id}_${i}`, platform: rng.pick(AD_PLATFORMS),
      message: rng.pick(AD_MESSAGES), product: rng.pick(node.subs), category: node.cat,
      start, end, active: end > now.getTime(),
      landing: `https://${co.website}/${slugify(node.cat)}`,
      creatives: rng.int(1, 6),
      confidence: 'high',
    });
  }
  return list.sort((a, b) => b.start - a.start);
}

/* ---------------- news ---------------- */
function genNews(co, p, rng, now) {
  const items = eventDates(rng, p.newsPM, HISTORY_DAYS, now, p.revTrend * 0.5).map((date, i) => {
    const type = rng.pick(NEWS_TYPES);
    const tpl = rng.pick(NEWS_TPL[type.t]);
    const title = tpl.replace('{co}', co.name).replace('{loc}', rng.pick(PROJECT_LOCATIONS))
      .replace('{amount}', `${rng.int(2, 40)} mln MDL`).replace('{brand}', rng.pick(PRODUCT_BRANDS))
      .replace('{cat}', rng.pick(PRODUCT_TREE).cat.toLowerCase());
    return {
      id: `nw_${co.id}_${i}`, date, title, type: type.t, typeLabel: type.label,
      source: rng.pick(NEWS_SOURCES),
      url: `https://${rng.pick(NEWS_SOURCES)}/${slugify(title).slice(0, 48)}`,
      sentiment: rng.chance(0.82) ? 'pos' : 'neu',
      duplicates: rng.chance(0.35) ? rng.int(1, 4) : 0,
      confidence: 'verified',
    };
  });
  return items;
}

/* ---------------- jobs ---------------- */
function genJobs(co, p, rng, now) {
  return eventDates(rng, p.jobPM, HISTORY_DAYS, now, p.revTrend * 1.4).map((date, i) => {
    const j = rng.pick(JOB_TITLES);
    const life = rng.int(12, 70);
    const closes = date + life * DAY;
    return {
      id: `jb_${co.id}_${i}`, date, title: j.t, department: j.d,
      location: rng.chance(0.8) ? co.city : rng.pick(PROJECT_LOCATIONS),
      active: closes > now.getTime(), daysActive: Math.min(life, Math.round((now - date) / DAY)),
      source: rng.pick(['rabota.md', 'delucru.md', 'LinkedIn', 'Website']),
      confidence: 'verified',
    };
  });
}

/* ---------------- tenders ---------------- */
function genTenders(co, p, rng, now) {
  const n = Math.round(p.projPM * rng.float(0.4, 1.4));
  const out = [];
  for (let i = 0; i < n; i++) {
    const date = addDays(now, -rng.int(5, HISTORY_DAYS)).getTime();
    const won = rng.chance(0.42);
    out.push({
      id: `td_${co.id}_${i}`, date,
      title: `Achiziție ${rng.pick(PRODUCT_TREE).cat.toLowerCase()}`,
      institution: rng.pick(INSTITUTIONS),
      value: rng.int(80, 4200) * 1000,
      status: won ? 'won' : rng.chance(0.5) ? 'lost' : 'participating',
      competitors: rng.picks(COMPANIES.filter((c) => c.id !== co.id).map((c) => c.name), rng.int(1, 4)),
      source: 'mtender.gov.md', confidence: 'verified',
    });
  }
  return out.sort((a, b) => b.date - a.date);
}

/* ---------------- gmb aggregate ---------------- */
function buildGmb(co, p, reviews, now) {
  const total = Math.round(p.prodBase * 0.42) + reviews.length;
  const seriesDays = HISTORY_DAYS;
  const series = [];
  let running = total - reviews.length;
  const byDay = new Map();
  for (const r of reviews) {
    const k = iso(r.date);
    byDay.set(k, (byDay.get(k) || 0) + 1);
  }
  const ratingSeries = [];
  for (let i = seriesDays; i >= 0; i--) {
    const d = addDays(now, -i);
    running += byDay.get(iso(d)) || 0;
    series.push({ t: d.getTime(), v: running });
    const win = reviews.filter((r) => r.date <= d.getTime() && r.date > d.getTime() - 120 * DAY);
    const rAvg = win.length ? win.reduce((s, x) => s + x.stars, 0) / win.length : p.rating;
    ratingSeries.push({ t: d.getTime(), v: round(p.rating * 0.55 + rAvg * 0.45, 2) });
  }
  const dist = [1, 2, 3, 4, 5].reduce((o, s) => { o[s] = reviews.filter((r) => r.stars === s).length; return o; }, {});
  const replied = reviews.filter((r) => r.replied);
  return {
    name: co.gmaps, address: co.address, phone: co.phone,
    rating: ratingSeries[ratingSeries.length - 1].v,
    ratingSeries,
    total: series[series.length - 1].v,
    series, dist,
    responseRate: reviews.length ? round((replied.length / reviews.length) * 100, 0) : 0,
    avgResponseHours: replied.length ? Math.round(replied.reduce((s, x) => s + x.replyHours, 0) / replied.length) : null,
    url: `https://maps.google.com/?q=${encodeURIComponent(co.gmaps)}`,
    confidence: 'verified',
  };
}

/* ---------------- main ---------------- */
export function buildCompanies(now = new Date()) {
  return COMPANIES.map((co) => {
    const p = PERSONA[co.id];
    const rng = makeRng(`carepack-${co.id}-v3`);
    const reviews = genReviews(co, p, rng, now);
    const company = {
      ...co,
      persona: p,
      gmb: buildGmb(co, p, reviews, now),
      reviews,
      projects: genProjects(co, p, rng, now),
      products: genProducts(co, p, rng, now),
      webChanges: genWebChanges(co, p, rng, now),
      social: genSocial(co, p, rng, now),
      youtube: genYouTube(co, p, rng, now),
      seo: genSeo(co, p, rng, now),
      traffic: genTraffic(co, p, rng, now),
      ads: genAds(co, p, rng, now),
      news: genNews(co, p, rng, now),
      jobs: genJobs(co, p, rng, now),
      tenders: genTenders(co, p, rng, now),
    };
    return company;
  });
}
