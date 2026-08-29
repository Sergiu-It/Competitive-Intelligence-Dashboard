/* ============================================================
   Seed data — market definition and text corpora.
   The demo market: echipament comercial & logistic (Moldova).
   ============================================================ */

export const MARKET = {
  name: 'Echipament comercial & logistic — Moldova',
  currency: 'MDL',
  country: 'Moldova',
};

export const COMPANIES = [
  {
    id: 'carepack', name: 'Carepack', legalName: 'CAREPACK GRUP SRL', idno: '1013600021458',
    website: 'carepack.md', phone: '+373 22 84 55 10', email: 'office@carepack.md',
    address: 'str. Uzinelor 15, Chișinău', city: 'Chișinău', founded: 2013, employees: 74,
    isOwn: true, tier: 'leader', color: '#0071e3',
    brands: ['Carepack Store', 'Carepack Logistic'],
    domains: ['Retail', 'Logistică', 'Depozitare', 'HoReCa'],
    locations: ['Showroom Chișinău', 'Depozit Chișinău', 'Filiala Bălți'],
    socials: { facebook: 'carepack.md', instagram: 'carepack.md', linkedin: 'carepack-grup', tiktok: 'carepack.md', youtube: 'Carepack' },
    gmaps: 'Carepack — Echipament comercial',
  },
  {
    id: 'vitra', name: 'ViTRA', legalName: 'VITRA COM SRL', idno: '1008600014422',
    website: 'vitra.md', phone: '+373 22 49 71 22', email: 'info@vitra.md',
    address: 'bd. Dacia 49/3, Chișinău', city: 'Chișinău', founded: 2008, employees: 112,
    tier: 'leader', color: '#8c46d4',
    brands: ['ViTRA Shelving', 'ViTRA HoReCa'],
    domains: ['Retail', 'HoReCa', 'Depozitare', 'Office'],
    locations: ['Showroom Chișinău', 'Depozit Stăuceni', 'Filiala Cahul'],
    socials: { facebook: 'vitra.md', instagram: 'vitra.md', linkedin: 'vitra-com', tiktok: 'vitra.md', youtube: 'ViTRA Moldova' },
    gmaps: 'ViTRA — Echipamente comerciale',
  },
  {
    id: 'rafturipro', name: 'RafturiPro', legalName: 'RAFTURI PRO SRL', idno: '1014600032117',
    website: 'rafturipro.md', phone: '+373 79 22 41 08', email: 'vanzari@rafturipro.md',
    address: 'str. Muncești 121, Chișinău', city: 'Chișinău', founded: 2014, employees: 41,
    tier: 'challenger', color: '#1f9d55',
    brands: ['RafturiPro', 'RP Metal'],
    domains: ['Retail', 'Depozitare'],
    locations: ['Showroom Chișinău', 'Depozit Sîngera'],
    socials: { facebook: 'rafturipro', instagram: 'rafturipro.md', linkedin: '', tiktok: 'rafturipro', youtube: 'RafturiPro' },
    gmaps: 'RafturiPro — Rafturi metalice',
  },
  {
    id: 'metaldepo', name: 'MetalDepo', legalName: 'METAL DEPO GRUP SRL', idno: '1011600028744',
    website: 'metaldepo.md', phone: '+373 22 31 88 40', email: 'office@metaldepo.md',
    address: 'str. Industrială 34, Chișinău', city: 'Chișinău', founded: 2011, employees: 63,
    tier: 'challenger', color: '#e07b00',
    brands: ['MetalDepo', 'MD Rack'],
    domains: ['Depozitare', 'Industrial', 'Logistică'],
    locations: ['Depozit Chișinău', 'Punct Bălți', 'Punct Ungheni'],
    socials: { facebook: 'metaldepo.md', instagram: 'metaldepo', linkedin: 'metaldepo', tiktok: '', youtube: 'MetalDepo MD' },
    gmaps: 'MetalDepo — Sisteme de depozitare',
  },
  {
    id: 'logisys', name: 'LogiSystems', legalName: 'LOGI SYSTEMS SRL', idno: '1016600045210',
    website: 'logisystems.md', phone: '+373 60 44 12 90', email: 'contact@logisystems.md',
    address: 'șos. Muncești 801, Chișinău', city: 'Chișinău', founded: 2016, employees: 38,
    tier: 'challenger', color: '#12879b',
    brands: ['LogiSystems', 'LS Automation'],
    domains: ['Logistică', 'Depozitare', 'Industrial'],
    locations: ['Birou Chișinău', 'Depozit Anenii Noi'],
    socials: { facebook: 'logisystems.md', instagram: '', linkedin: 'logisystems-md', tiktok: '', youtube: 'LogiSystems' },
    gmaps: 'LogiSystems — Soluții de depozitare',
  },
  {
    id: 'horecaexpert', name: 'HoReCa Expert', legalName: 'HORECA EXPERT SRL', idno: '1012600019903',
    website: 'horecaexpert.md', phone: '+373 22 55 63 71', email: 'info@horecaexpert.md',
    address: 'str. Alba Iulia 75, Chișinău', city: 'Chișinău', founded: 2012, employees: 55,
    tier: 'challenger', color: '#d81f5a',
    brands: ['HoReCa Expert', 'Chef Line'],
    domains: ['HoReCa', 'Retail'],
    locations: ['Showroom Chișinău', 'Service Chișinău'],
    socials: { facebook: 'horecaexpert', instagram: 'horeca.expert', linkedin: 'horeca-expert', tiktok: 'horecaexpert', youtube: 'HoReCa Expert' },
    gmaps: 'HoReCa Expert — Echipamente profesionale',
  },
  {
    id: 'shelfline', name: 'ShelfLine', legalName: 'SHELF LINE SRL', idno: '1018600051336',
    website: 'shelfline.md', phone: '+373 68 90 33 21', email: 'hello@shelfline.md',
    address: 'str. Calea Ieșilor 10, Chișinău', city: 'Chișinău', founded: 2018, employees: 22,
    tier: 'niche', color: '#4f4bd6',
    brands: ['ShelfLine'],
    domains: ['Retail', 'Office'],
    locations: ['Showroom Chișinău'],
    socials: { facebook: 'shelfline.md', instagram: 'shelfline.md', linkedin: '', tiktok: 'shelfline', youtube: '' },
    gmaps: 'ShelfLine — Rafturi magazin',
  },
  {
    id: 'nordicarack', name: 'Nordica Rack', legalName: 'NORDICA RACK SRL', idno: '1015600038820',
    website: 'nordicarack.md', phone: '+373 231 5 44 12', email: 'office@nordicarack.md',
    address: 'str. Ștefan cel Mare 202, Bălți', city: 'Bălți', founded: 2015, employees: 29,
    tier: 'niche', color: '#b98600',
    brands: ['Nordica Rack'],
    domains: ['Depozitare', 'Industrial'],
    locations: ['Depozit Bălți'],
    socials: { facebook: 'nordicarack', instagram: '', linkedin: '', tiktok: '', youtube: 'Nordica Rack' },
    gmaps: 'Nordica Rack — Bălți',
  },
  {
    id: 'interstore', name: 'Interstore', legalName: 'INTERSTORE SOLUTIONS SRL', idno: '1009600016655',
    website: 'interstore.md', phone: '+373 22 27 19 05', email: 'sales@interstore.md',
    address: 'str. Columna 104, Chișinău', city: 'Chișinău', founded: 2009, employees: 47,
    tier: 'challenger', color: '#30b0c7',
    brands: ['Interstore', 'IS Retail'],
    domains: ['Retail', 'HoReCa', 'Office'],
    locations: ['Showroom Chișinău', 'Depozit Chișinău'],
    socials: { facebook: 'interstore.md', instagram: 'interstore.md', linkedin: 'interstore-md', tiktok: '', youtube: 'Interstore' },
    gmaps: 'Interstore — Mobilier comercial',
  },
  {
    id: 'depomax', name: 'DepoMax', legalName: 'DEPO MAX SRL', idno: '1017600047781',
    website: 'depomax.md', phone: '+373 69 41 77 30', email: 'office@depomax.md',
    address: 'str. Petricani 21, Chișinău', city: 'Chișinău', founded: 2017, employees: 33,
    tier: 'challenger', color: '#af52de',
    brands: ['DepoMax'],
    domains: ['Depozitare', 'Logistică'],
    locations: ['Depozit Chișinău', 'Punct Comrat'],
    socials: { facebook: 'depomax.md', instagram: 'depomax.md', linkedin: '', tiktok: 'depomax', youtube: 'DepoMax' },
    gmaps: 'DepoMax — Rafturi depozit',
  },
  {
    id: 'eurorafturi', name: 'EuroRafturi', legalName: 'EURO RAFTURI SRL', idno: '1010600022190',
    website: 'eurorafturi.md', phone: '+373 22 62 08 14', email: 'info@eurorafturi.md',
    address: 'str. Vadul lui Vodă 88, Chișinău', city: 'Chișinău', founded: 2010, employees: 26,
    tier: 'niche', color: '#6e6e73',
    brands: ['EuroRafturi'],
    domains: ['Retail', 'Depozitare'],
    locations: ['Showroom Chișinău'],
    socials: { facebook: 'eurorafturi', instagram: '', linkedin: '', tiktok: '', youtube: '' },
    gmaps: 'EuroRafturi',
  },
  {
    id: 'tehnostore', name: 'TehnoStore', legalName: 'TEHNO STORE SRL', idno: '1019600054402',
    website: 'tehnostore.md', phone: '+373 78 55 21 66', email: 'contact@tehnostore.md',
    address: 'str. Mihai Viteazul 3, Orhei', city: 'Orhei', founded: 2019, employees: 18,
    tier: 'niche', color: '#ff2d55',
    brands: ['TehnoStore'],
    domains: ['Retail', 'HoReCa'],
    locations: ['Showroom Orhei'],
    socials: { facebook: 'tehnostore.md', instagram: 'tehnostore.md', linkedin: '', tiktok: 'tehnostore.md', youtube: 'TehnoStore' },
    gmaps: 'TehnoStore — Orhei',
  },
];

/* ---------- Review topic taxonomy (spec §1) ---------- */
export const TOPICS = [
  { id: 'pret',           label: 'Preț',                   icon: 'tag' },
  { id: 'calitate_prod',  label: 'Calitatea produsului',   icon: 'box' },
  { id: 'calitate_serv',  label: 'Calitatea serviciului',  icon: 'checkCircle' },
  { id: 'livrare',        label: 'Livrare',                icon: 'traffic' },
  { id: 'montaj',         label: 'Montaj',                 icon: 'settings' },
  { id: 'termene',        label: 'Termene',                icon: 'clock' },
  { id: 'comunicare',     label: 'Comunicare',             icon: 'message' },
  { id: 'personal',       label: 'Personal',               icon: 'users' },
  { id: 'service',        label: 'Service',                icon: 'refresh' },
  { id: 'garantie',       label: 'Garanție',               icon: 'shield' },
  { id: 'disponibilitate',label: 'Disponibilitate produse',icon: 'layers' },
  { id: 'profesionalism', label: 'Profesionalism',         icon: 'star' },
  { id: 'tehnic',         label: 'Probleme tehnice',       icon: 'alert' },
];
export const topicLabel = (id) => (TOPICS.find((t) => t.id === id) || { label: id }).label;

export const REVIEW_TEXT = {
  pos: {
    pret: ['Prețuri corecte pentru calitatea oferită, am comparat cu alți furnizori.', 'Raport preț-calitate foarte bun, am primit și discount la volum.'],
    calitate_prod: ['Rafturile sunt solide, metal gros, se vede că rezistă la greutate.', 'Calitatea produselor este peste așteptări, finisaje curate.'],
    calitate_serv: ['Serviciu impecabil de la ofertă până la montaj.', 'Totul organizat bine, exact cum s-a promis.'],
    livrare: ['Livrarea a fost rapidă, în aceeași săptămână.', 'Au livrat la timp și au urcat marfa la etaj fără probleme.'],
    montaj: ['Echipa de montaj a lucrat curat și rapid.', 'Montajul a fost făcut într-o zi, fără deranj pentru magazin.'],
    termene: ['Au respectat exact termenul din contract.', 'Comanda a fost gata mai devreme decât ne așteptam.'],
    comunicare: ['Comunică prompt pe WhatsApp și răspund la toate întrebările.', 'Managerul a explicat clar toate opțiunile.'],
    personal: ['Personal amabil și bine pregătit, ne-au consiliat corect.', 'Oameni serioși, se vede experiența.'],
    service: ['Au venit în garanție și au rezolvat în două zile.', 'Service prompt, au schimbat piesa fără discuții.'],
    garantie: ['Garanție reală, nu doar pe hârtie.', 'Au onorat garanția fără birocrație.'],
    disponibilitate: ['Au avut tot pe stoc, am ridicat în aceeași zi.', 'Stoc bun, nu a trebuit să aștept comandă din import.'],
    profesionalism: ['Foarte profesioniști, au făcut și măsurătorile la fața locului.', 'Abordare profesionistă, proiect 3D înainte de comandă.'],
    tehnic: ['Au reglat sistemul și acum funcționează perfect.', 'Problema tehnică a fost rezolvată din prima vizită.'],
  },
  neg: {
    pret: ['Prețul final a fost mai mare decât în ofertă, au apărut costuri suplimentare.', 'Scump față de concurență pentru același produs.'],
    calitate_prod: ['Tabla este subțire, raftul s-a îndoit sub greutate.', 'Vopseaua s-a zgâriat la prima utilizare.'],
    calitate_serv: ['Serviciu dezamăgitor, a trebuit să sun de fiecare dată eu.', 'Nu s-a respectat nimic din ce s-a discutat inițial.'],
    livrare: ['Livrarea a întârziat cu două săptămâni fără nicio explicație.', 'Marfa a ajuns incompletă, au lipsit consolele.'],
    montaj: ['Montajul a fost făcut neglijent, au rămas rafturi strâmbe.', 'Echipa de montaj a venit fără sculele necesare.'],
    termene: ['Termenul de livrare a fost depășit cu mult, ne-am întârziat deschiderea.', 'Ne-au amânat de trei ori termenul.'],
    comunicare: ['Foarte greu de contactat, nu răspund la telefon.', 'Nimeni nu a revenit cu răspuns la solicitarea de ofertă.'],
    personal: ['Personal nepoliticos în showroom.', 'Vânzătorul nu cunoștea produsele.'],
    service: ['Am solicitat service acum o lună, încă nimeni nu a venit.', 'Service inexistent după vânzare.'],
    garantie: ['Refuză garanția pe motive inventate.', 'Garanția a durat luni de zile fără soluție.'],
    disponibilitate: ['Nimic pe stoc, totul este pe comandă cu 6 săptămâni.', 'Produsele din site nu sunt disponibile în realitate.'],
    profesionalism: ['Măsurătorile au fost greșite, a trebuit refăcut proiectul.', 'Abordare neserioasă pentru o firmă cu experiență.'],
    tehnic: ['Sistemul are probleme tehnice de la instalare.', 'Elementele nu se îmbină corect, lipsesc găuri.'],
  },
  neutral: [
    'Produse ok, experiență medie. Nimic remarcabil.',
    'A fost în regulă, dar mai este loc de îmbunătățire la comunicare.',
    'Am colaborat o singură dată, impresie neutră.',
  ],
};

export const REPLY_TEXT = [
  'Vă mulțumim pentru feedback! Ne bucurăm că ați fost mulțumit de colaborare.',
  'Mulțumim pentru apreciere. Vă așteptăm cu drag și la următoarele proiecte.',
  'Ne pare rău pentru situația creată. Vă rugăm să ne contactați la office pentru a rezolva rapid.',
  'Vă mulțumim pentru semnalare. Am transmis observația echipei responsabile.',
  'Regretăm întârzierea. Am revizuit procesul intern pentru a evita repetarea.',
];

export const REVIEWERS = [
  'Andrei Munteanu','Ion Ciobanu','Maria Rusu','Elena Popescu','Victor Cebotari','Natalia Gîrlea',
  'Sergiu Balan','Cristina Lungu','Dumitru Rotaru','Vasile Ursu','Ana Chirilă','Igor Postolache',
  'Mihai Sîrbu','Olga Damian','Radu Cojocaru','Tatiana Bejan','Alexandru Guțu','Diana Zaharia',
  'Nicolae Grosu','Veronica Melnic','Pavel Sandu','Irina Cazacu','Grigore Vieru','Ludmila Braga',
  'Denis Frunză','Aliona Talmaci','Ștefan Onofrei','Corina Bivol','Valeriu Marian','Svetlana Roșca',
];

/* ---------- Projects ---------- */
export const SECTORS = ['Retail', 'HoReCa', 'Logistică', 'Depozitare', 'Office', 'Industrial', 'Residential', 'Farmacii', 'Auto'];

export const PROJECT_CLIENTS = [
  'Linella','Fourchette','Kaufland MD','Nr.1','Local Market','Fidesco','Green Hills','Metro Cash & Carry',
  'Andy\'s Pizza','La Plăcinte','Tucano Coffee','Coffee Molka','Hotel Codru','Radisson Blu',
  'Dulcinella','Farmacia Familiei','Orange Moldova','Moldcell','Darwin','Maximum','Bomba','Enter',
  'Cricova','Purcari','Bostavan','Trans-Oil','Aquatrade','Rogob','JLC','Franzeluța','Zorile','Ionel',
];
export const PROJECT_LOCATIONS = ['Chișinău','Bălți','Cahul','Orhei','Ungheni','Comrat','Soroca','Edineț','Anenii Noi','Ialoveni','Strășeni','Căușeni'];
export const PROJECT_TYPES = ['Amenajare completă','Extindere','Reamenajare','Depozit nou','Showroom','Modernizare','Deschidere magazin nou','Linie de producție'];

/* ---------- Products ---------- */
export const PRODUCT_TREE = [
  { cat: 'Rafturi metalice', subs: ['Rafturi depozit', 'Rafturi magazin', 'Rafturi arhivă', 'Rafturi cantilever', 'Mezanine'] },
  { cat: 'Mobilier comercial', subs: ['Gondole', 'Case de marcat', 'Vitrine', 'Standuri promo', 'Cărucioare & coșuri'] },
  { cat: 'Echipament frigorific', subs: ['Vitrine frigorifice', 'Lăzi congelare', 'Camere frigorifice', 'Agregate'] },
  { cat: 'Echipament HoReCa', subs: ['Bucătărie profesională', 'Spălare vase', 'Preparare', 'Mese inox', 'Bar'] },
  { cat: 'Logistică internă', subs: ['Transpalete', 'Stivuitoare manuale', 'Europaleți', 'Containere', 'Scări depozit'] },
  { cat: 'Semnalizare & POS', subs: ['Etichete preț', 'Suporturi info', 'Sisteme antifurt', 'Iluminat raft'] },
];
export const PRODUCT_BRANDS = ['Metalsistem','Tego','Storax','Mago','Costan','Arneg','Rilling','Bartscher','Hendi','Jungheinrich','Still','Kinnarps','Nordika','Genesis'];
export const PRODUCT_MODIFIERS = ['Standard','Pro','Heavy Duty','Compact','Premium','Eco','XL','Slim','Modular','Inox'];

/* ---------- Website changes ---------- */
export const WEB_CHANGES = [
  { type: 'page_new',      label: 'Pagină nouă',            imp: 2 },
  { type: 'page_removed',  label: 'Pagină eliminată',       imp: 2 },
  { type: 'product_new',   label: 'Produs nou',             imp: 3 },
  { type: 'product_gone',  label: 'Produs eliminat',        imp: 2 },
  { type: 'category_new',  label: 'Categorie nouă',         imp: 3 },
  { type: 'price_change',  label: 'Modificare de preț',     imp: 3 },
  { type: 'text_change',   label: 'Modificare text',        imp: 1 },
  { type: 'project_new',   label: 'Proiect nou publicat',   imp: 3 },
  { type: 'case_study',    label: 'Studiu de caz nou',      imp: 2 },
  { type: 'promo',         label: 'Promoție',               imp: 3 },
  { type: 'banner',        label: 'Banner nou',             imp: 1 },
  { type: 'brand_new',     label: 'Brand nou',              imp: 3 },
  { type: 'service_new',   label: 'Serviciu nou',           imp: 3 },
  { type: 'structure',     label: 'Structura site-ului',    imp: 2 },
];

/* ---------- Jobs ---------- */
export const JOB_TITLES = [
  { t: 'Manager vânzări', d: 'Vânzări' }, { t: 'Consultant vânzări showroom', d: 'Vânzări' },
  { t: 'Key Account Manager', d: 'Vânzări' }, { t: 'Reprezentant regional', d: 'Vânzări' },
  { t: 'Inginer proiectant', d: 'Tehnic' }, { t: 'Tehnician montaj', d: 'Tehnic' },
  { t: 'Șef echipă montaj', d: 'Tehnic' }, { t: 'Sudor', d: 'Producție' },
  { t: 'Operator CNC', d: 'Producție' }, { t: 'Operator depozit', d: 'Logistică' },
  { t: 'Șofer distribuție', d: 'Logistică' }, { t: 'Specialist marketing digital', d: 'Marketing' },
  { t: 'Content creator', d: 'Marketing' }, { t: 'Contabil', d: 'Financiar' },
  { t: 'Specialist achiziții', d: 'Achiziții' }, { t: 'Customer support', d: 'Suport' },
];

/* ---------- News ---------- */
export const NEWS_SOURCES = ['agora.md','bani.md','logos-press.md','mold-street.com','ziarulnational.md','realitatea.md','eco.md','infomarket.md'];
export const NEWS_TYPES = [
  { t: 'expansion', label: 'Extindere' }, { t: 'investment', label: 'Investiție' },
  { t: 'partnership', label: 'Parteneriat' }, { t: 'award', label: 'Premiu' },
  { t: 'certification', label: 'Certificare' }, { t: 'event', label: 'Expoziție' },
  { t: 'launch', label: 'Lansare' }, { t: 'interview', label: 'Interviu' },
  { t: 'opening', label: 'Inaugurare' },
];
export const NEWS_TPL = {
  expansion: ['{co} își extinde rețeaua cu un nou depozit la {loc}', '{co} deschide un punct de lucru la {loc}'],
  investment: ['{co} investește {amount} în linia de producție', '{co} anunță o investiție de {amount} în automatizare'],
  partnership: ['{co} devine partener oficial {brand} în Moldova', '{co} semnează un parteneriat cu {brand}'],
  award: ['{co} premiată la Gala Business Moldova', '{co} obține distincția „Furnizorul anului”'],
  certification: ['{co} obține certificarea ISO 9001', '{co} certificată pentru sisteme de raft conform EN 15512'],
  event: ['{co} participă la expoziția Moldagrotech', '{co} prezintă soluții noi la Food & Drinks Expo'],
  launch: ['{co} lansează o nouă linie de {cat}', '{co} aduce pe piață gama {brand}'],
  interview: ['Interviu: cum vede {co} piața de echipament comercial', 'Directorul {co} despre tendințele din retail'],
  opening: ['{co} inaugurează un showroom nou la {loc}', 'Deschidere: {co} își mută sediul la {loc}'],
};

/* ---------- YouTube ---------- */
export const VIDEO_TPL = [
  'Proiect nou: {client} — amenajare {sector}',
  'Cum alegi rafturile pentru {sector}',
  'Montaj rafturi depozit — timelapse {loc}',
  'Prezentare produs: {product}',
  'Vizită la depozitul {client}',
  'TOP 5 greșeli la amenajarea unui {sector}',
  'Noutăți în gama {brand}',
  'Livrare și montaj în {loc} — behind the scenes',
  'Echipamente {sector}: ce s-a schimbat în 2026',
  'Studiu de caz: {client} — de la proiect la livrare',
];
export const SHORTS_TPL = [
  '60 de secunde în depozitul nostru',
  'Raft montat în 40 de secunde',
  'Un truc pentru organizarea depozitului',
  'Produs nou pe stoc',
  'Cum arată un proiect finalizat',
];

/* ---------- Ads ---------- */
export const AD_PLATFORMS = ['Meta Ads', 'Google Ads', 'TikTok Ads', 'YouTube Ads'];
export const AD_MESSAGES = [
  'Rafturi depozit — livrare în 5 zile',
  'Reducere 15% la gondole de magazin',
  'Amenajăm magazinul tău la cheie',
  'Stoc permanent — rafturi metalice',
  'Proiect 3D gratuit pentru depozit',
  'Echipament HoReCa profesional',
  'Vitrine frigorifice — ofertă de sezon',
  'Consultanță gratuită pentru depozite',
];

/* ---------- SEO ---------- */
export const KEYWORDS = [
  { kw: 'rafturi metalice Moldova', vol: 1300 },
  { kw: 'rafturi depozit', vol: 2400 },
  { kw: 'rafturi magazin', vol: 1900 },
  { kw: 'echipamente horeca', vol: 880 },
  { kw: 'gondole magazin', vol: 720 },
  { kw: 'vitrine frigorifice', vol: 1600 },
  { kw: 'mobilier comercial Chișinău', vol: 590 },
  { kw: 'rafturi arhivă', vol: 320 },
  { kw: 'transpalete preț', vol: 480 },
  { kw: 'amenajare magazin', vol: 640 },
  { kw: 'stelaje metalice', vol: 1100 },
  { kw: 'rafturi cantilever', vol: 210 },
  { kw: 'echipament depozit', vol: 860 },
  { kw: 'camere frigorifice Moldova', vol: 390 },
  { kw: 'mese inox bucătărie profesională', vol: 260 },
];

/* ---------- Tenders ---------- */
export const INSTITUTIONS = [
  'Primăria mun. Chișinău','Agenția Rezerve Materiale','Spitalul Clinic Republican','CFM',
  'Ministerul Sănătății','Universitatea Tehnică a Moldovei','Poșta Moldovei','Serviciul Vamal',
  'Primăria mun. Bălți','Agenția Națională pentru Siguranța Alimentelor',
];

/* ---------- Users (admin demo) ---------- */
export const USERS_SEED = [
  { first: 'Sergiu', last: 'Cebotari', email: 'sergiu022@gmail.com', company: 'Carepack', role: 'SUPER_ADMIN', status: 'ACTIVE', title: 'Founder' },
  { first: 'Elena',  last: 'Braga',    email: 'elena.braga@carepack.md', company: 'Carepack', role: 'ADMIN', status: 'ACTIVE', title: 'Head of Marketing' },
  { first: 'Victor', last: 'Rusu',     email: 'victor.rusu@carepack.md', company: 'Carepack', role: 'ANALYST', status: 'ACTIVE', title: 'Market Analyst' },
  { first: 'Ana',    last: 'Chirilă',  email: 'ana.chirila@carepack.md', company: 'Carepack', role: 'ANALYST', status: 'ACTIVE', title: 'Sales Analyst' },
  { first: 'Dumitru',last: 'Rotaru',   email: 'd.rotaru@carepack.md',    company: 'Carepack', role: 'VIEWER', status: 'ACTIVE', title: 'Sales Manager' },
  { first: 'Cristina',last:'Lungu',    email: 'c.lungu@partener.md',     company: 'Partener Consulting', role: 'VIEWER', status: 'PENDING', title: 'Consultant' },
  { first: 'Igor',   last: 'Postolache',email:'igor@retailgroup.md',     company: 'Retail Group', role: 'ANALYST', status: 'PENDING', title: 'Retail Director' },
  { first: 'Natalia',last: 'Gîrlea',   email: 'natalia@freelance.com',   company: '—', role: 'VIEWER', status: 'REJECTED', title: '' },
  { first: 'Pavel',  last: 'Sandu',    email: 'p.sandu@carepack.md',     company: 'Carepack', role: 'VIEWER', status: 'BLOCKED', title: 'Ex-angajat' },
  { first: 'Olga',   last: 'Damian',   email: 'olga.damian@carepack.md', company: 'Carepack', role: 'ANALYST', status: 'ACTIVE', title: 'Procurement' },
  { first: 'Radu',   last: 'Cojocaru', email: 'radu@logisticpartner.md', company: 'Logistic Partner', role: 'VIEWER', status: 'INVITED', title: 'Operations' },
  { first: 'Mihai',  last: 'Sîrbu',    email: 'mihai.sirbu@carepack.md', company: 'Carepack', role: 'VIEWER', status: 'ACTIVE', title: 'Regional Sales' },
];

export const TRUSTED_DOMAINS = [
  { domain: 'carepack.md', autoApprove: true,  addedBy: 'Sergiu Cebotari' },
  { domain: 'partener.md', autoApprove: false, addedBy: 'Sergiu Cebotari' },
];

export const WHITELIST = [
  { email: 'consultant@retailgroup.md', addedBy: 'Elena Braga', note: 'Consultant extern, proiect Q3' },
  { email: 'audit@kpmg.md', addedBy: 'Sergiu Cebotari', note: 'Audit anual' },
];
