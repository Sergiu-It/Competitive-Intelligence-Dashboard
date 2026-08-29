# Carepack — Competitive Intelligence Dashboard

Platformă web de **Competitive Intelligence + Reputation Monitoring + Market Intelligence + AI Analysis**
pentru piața de echipament comercial și logistic din Moldova (Carepack, ViTRA și restul concurenților).

> **OBSERVE → STORE HISTORY → COMPARE → DETECT CHANGES → INTERPRET → ALERT**

Interfață în stil Apple: tipografie de sistem, carduri rotunjite, blur translucid, mișcare discretă,
temă luminoasă/întunecată și layout complet adaptiv — **telefon, tabletă și desktop**.

---

## Rulare

Nu există build step și nicio dependență la runtime. Aplicația e HTML + CSS + JavaScript modular (ES modules).

```bash
# orice server static
python3 -m http.server 8000
# apoi: http://localhost:8000
```

Poate fi publicată direct pe GitHub Pages / orice hosting static (rutare pe hash, fără server-side routing).

### Conturi demo

| Email | Rol | Ce demonstrează |
|---|---|---|
| `sergiu022@gmail.com` | Super Admin | acces complet, Admin Panel |
| `elena.braga@carepack.md` | Admin | administrare utilizatori |
| `victor.rusu@carepack.md` | Analyst | analiză fără drepturi de administrare |
| `d.rotaru@carepack.md` | Viewer | doar citire |
| `igor@retailgroup.md` | *pending* | ecranul „Access requested” |
| `p.sandu@carepack.md` | *blocked* | ecranul de cont blocat |

Autentificarea este **passwordless**: email → cod OTP de 6 cifre (afișat pe ecran în demo) sau
**magic link**, plus **Continue with Google / Microsoft**. Identitatea nu acordă automat accesul —
contul trece prin aprobarea administratorului.

---

## Module implementate

| # | Modul | Unde se vede |
|---|---|---|
| 1 | Google Maps / Business Profile — rating, distribuție, ritm, accelerare, răspunsuri, timp de răspuns | `Companie → Google Maps`, `Reviews` |
| 2 | YouTube — abonați, video/Shorts, frecvență, engagement, semnale comerciale detectate de AI | `Companie → YouTube` |
| 3 | Social Media — Facebook, Instagram, LinkedIn, TikTok, YouTube: followers, postări, engagement | `Companie → Social` |
| 4 | Project Tracker — proiecte, client, locație, domeniu, produse, sursă | `Companie → Projects` |
| 5 | Website Change Monitor — BEFORE → AFTER cu data detectării | `Companie → Website` |
| 6 | Product Intelligence — catalog, categorii, produse noi/eliminate, acoperire vs. piață | `Companie → Products` |
| 7 | Price Monitor — preț curent/anterior/min/max, promoții, diferență față de media pieței | `Companie → Prices` |
| 8 | SEO & Google Visibility — poziții, keywords câștigate/pierdute, backlinks (ESTIMATED) | `Companie → SEO` |
| 9 | Website Traffic — trafic estimat, canale, țări, pagini | `Companie → Traffic` |
| 10 | Advertising Monitor — campanii active, creative, produse promovate, landing | `Companie → Advertising` |
| 11 | News & PR Monitor — mențiuni, tipuri, grupare duplicate | `Companie → News` |
| 12 | Jobs / Recruitment — joburi active, departamente, semnal de extindere | `Companie → Jobs` |
| 13 | Tenders — licitații, instituție, valoare, competitori | `Companie → Tenders` |
| 14 | Company Intelligence — profil consolidat + verificare duplicate | `Companie → Overview` |
| 15 | Competitor Activity Score (0–100) | peste tot |
| 16 | Momentum Score (accelerare / încetinire) | peste tot |
| 17 | Share of Voice | `Dashboard`, `Piață` |
| 18 | AI Sentiment & Topic Analysis | `Reviews`, `AI Analysis` |
| 19 | Opportunity Detector | `Oportunități & Amenințări` |
| 20 | Threat Detector (LOW / MEDIUM / HIGH) | `Oportunități & Amenințări` |
| 21 | Activity Timeline (toate sursele) | `Dashboard`, `Companie → Timeline` |
| 22 | Compare Companies (7z / 30z / 90z / 6l / 1an) | `Comparație` |
| 23 | Competitive Radar (Reputation · Commercial · Digital · Growth) | `Dashboard`, `Comparație` |
| 24 | AI Daily / Weekly / Monthly Brief | `Rapoarte AI` |
| 25 | Alerts + reguli configurabile | `Alerte` |
| 26 | Data Confidence (Verified / High / Estimated / AI detected / Needs verification) | peste tot |
| 27 | Historical data — deltas pe 7 / 30 / 90 / 180 / 365 zile | peste tot |
| 28 | Company Overview Page cu 17 tab-uri și KPI-uri sus | `Companie` |
| 29 | Market Overview | `Piață` |
| 30 | AI Competitive Intelligence Assistant | `Asistent AI` |
| 31 | Access, autentificare passwordless & Admin Control | ecran de login + `Admin` |

### §31 — acces și administrare

`EMAIL → VERIFICARE → ADMIN APPROVAL → PASSWORDLESS LOGIN → AUDIT LOG`

* înregistrare cu status `PENDING APPROVAL`, aprobare/respingere/blocare din Admin;
* whitelist de email-uri și **Trusted Domains** (auto-approve dezactivat implicit);
* OTP de 6 cifre — valabil 5 minute, o singură utilizare, max. 5 încercări, resend;
* magic link și SSO Google / Microsoft (identitate ≠ acces);
* roluri `SUPER_ADMIN / ADMIN / ANALYST / VIEWER`, arhitectură pregătită pentru
  `USER → ROLE → WORKSPACE → DATA ACCESS`;
* sesiuni active, „log out all devices”, revocare la blocare;
* User Activity Log (login / last activity / sesiune, fără oră de logout inventată);
* Audit Log `WHO → DID WHAT → TO WHAT → WHEN`;
* Security Events și User Analytics (DAU / WAU / MAU, module folosite, competitori vizualizați);
* retenție configurabilă a logurilor tehnice (data minimization).

---

## Structura codului

```
index.html                  shell + preload CSS/JS
assets/css/
  tokens.css                design tokens (culori, spațieri, tipografie, motion, teme)
  base.css                  reset, tipografie, animații
  components.css            butoane, carduri, badge-uri, tabele, sheet, toast…
  layout.css                sidebar / topbar / tabbar, grid-uri, breakpoints
  views.css                 stiluri specifice ecranelor + print
assets/js/
  app.js                    bootstrap, shell, navigație, căutare globală
  router.js                 router pe hash
  util.js                   formatare RO (numere, date, „acum 3 zile”), helperi
  rng.js                    PRNG determinist (dataset identic la fiecare încărcare)
  data/
    seed.js                 companii, taxonomii, corpus de text
    generate.js             generator de istoric: serii zilnice + fluxuri de evenimente
    analytics.js            ferestre, deltas, scoruri, detectori, briefuri
    store.js                stare, sesiune, admin, alerte, persistență localStorage
  ui/
    icons.js                set de iconuri SVG inline
    charts.js               line/area, bare, donut, radar, scatter, sparkline, inele de scor
    components.js           KPI, badge-uri de încredere, carduri, sheet, toast…
  views/                    auth, dashboard, companies, company, compare, market,
                            signals, alerts, assistant, reports, admin, settings
```

### Datele

Demo-ul rulează pe un **dataset sintetic determinist** (seed fix): ~420 de zile de istoric pentru
12 companii — recenzii individuale cu text, temă și răspuns, proiecte, catalog de produse cu istoric
de preț, modificări de website, serii de followers, videoclipuri, joburi, știri, reclame și licitații.
Toate cifrele din interfață (deltas, ritm, accelerare, scoruri, Share of Voice, briefuri) sunt
**calculate din acest istoric**, nu scrise manual — deci sunt consistente între ecrane.

Integrarea cu surse reale înseamnă înlocuirea lui `data/generate.js` cu un API care returnează
aceleași forme de date; `analytics.js` și interfața rămân neschimbate.

---

## Accesibilitate & responsive

* mobile-first: bară de tab-uri jos + drawer pe telefon, sidebar pe desktop, layout intermediar pe tabletă;
* zero scroll orizontal pe toate ecranele (verificat automat la 390 / 834 / 1440 px);
* focus vizibil, `aria-*` pe controale, contrast verificat în ambele teme;
* respectă `prefers-reduced-motion` și `prefers-color-scheme`;
* tastatură: `⌘K` / `Ctrl+K` deschide căutarea globală.
