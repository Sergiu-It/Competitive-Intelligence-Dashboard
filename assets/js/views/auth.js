/* ============================================================
   Authentication — passwordless: email → OTP / Magic Link / SSO
   with administrator approval gate (spec §31)
   ============================================================ */
import { state, login, addUserRequest, logAudit, persist } from '../data/store.js';
import { icon } from '../ui/icons.js';
import { esc, maskEmail, uid } from '../util.js';
import { toast } from '../ui/components.js';

let ctx = { screen: 'welcome', email: '', code: '', user: null, method: 'Email OTP', attempts: 0, sentAt: 0 };
let onDone = null;
let root = null;

const genCode = () => String(Math.floor(100000 + Math.random() * 900000));

const ASIDE = `
  <aside class="auth__aside">
    <div class="auth__brandline">
      <span class="auth__logo" style="margin:0;width:40px;height:40px;border-radius:12px">${icon('radar', 18)}</span>
      <div><strong style="font-size:1.0625rem">Carepack</strong>
        <div style="font-size:.75rem;color:var(--text-3)">Competitive Intelligence Platform</div></div>
    </div>
    <div class="auth__pitch">
      <h2>Vezi ce face concurența.<br>Înainte să te întrebi.</h2>
      <p>Google Maps, recenzii, proiecte, produse, prețuri, social media, YouTube, joburi, SEO și știri —
         monitorizate continuu, cu istoric, comparații și interpretare AI.</p>
      <div class="auth__flow">
        <span>Observe</span><span>Store history</span><span>Compare</span>
        <span>Detect changes</span><span>Interpret</span><span>Alert</span>
      </div>
    </div>
    <div style="position:relative;z-index:1;display:flex;gap:24px;flex-wrap:wrap">
      <div><div style="font-size:1.625rem;font-weight:660">30+</div><div style="font-size:.75rem;color:var(--text-3)">module de monitorizare</div></div>
      <div><div style="font-size:1.625rem;font-weight:660">12</div><div style="font-size:.75rem;color:var(--text-3)">companii urmărite</div></div>
      <div><div style="font-size:1.625rem;font-weight:660">365d</div><div style="font-size:.75rem;color:var(--text-3)">istoric păstrat</div></div>
    </div>
  </aside>`;

function shell(inner) {
  return `<div class="auth">${ASIDE}<div class="auth__panel"><div class="auth__card">${inner}</div></div></div>`;
}

/* ---------- screens ---------- */
function welcome() {
  return shell(`
    <span class="auth__logo">${icon('radar', 24)}</span>
    <h1 class="auth__title">Welcome to Carepack</h1>
    <p class="auth__sub">Autentificare fără parolă. Introdu adresa de email de serviciu.</p>
    <form class="stack" data-form="email">
      <div class="field">
        <label class="field__label" for="email">Work email</label>
        <input class="input" id="email" name="email" type="email" inputmode="email" autocomplete="email"
          placeholder="nume@companie.md" required value="${esc(ctx.email)}">
      </div>
      <button class="btn btn--primary btn--lg btn--block" type="submit">CONTINUE</button>
    </form>
    <div class="divider">sau</div>
    <div class="sso">
      <button class="sso__btn" data-sso="Google">${googleMark()} Continue with Google</button>
      <button class="sso__btn" data-sso="Microsoft">${msMark()} Continue with Microsoft</button>
    </div>
    <p class="auth__sub">Nu ai încă acces? <a href="#" data-goto="register">Solicită acces</a></p>
    <div class="demo-note">
      <strong>Demo</strong>
      <span>Conturi de test: <code>sergiu022@gmail.com</code> (Super Admin) ·
      <code>victor.rusu@carepack.md</code> (Analyst) · <code>igor@retailgroup.md</code> (în așteptare).
      Codul OTP este afișat pe ecran în acest demo.</span>
    </div>`);
}

function register() {
  return shell(`
    <span class="auth__logo">${icon('user', 24)}</span>
    <h1 class="auth__title">Solicită acces</h1>
    <p class="auth__sub">Contul devine activ după verificarea email-ului și aprobarea administratorului.</p>
    <form class="stack" data-form="register">
      <div class="grid grid--2" style="gap:12px">
        <div class="field"><label class="field__label" for="first">Nume</label>
          <input class="input" id="first" name="first" required placeholder="Ion"></div>
        <div class="field"><label class="field__label" for="last">Prenume</label>
          <input class="input" id="last" name="last" required placeholder="Popescu"></div>
      </div>
      <div class="field"><label class="field__label" for="company">Compania</label>
        <input class="input" id="company" name="company" required placeholder="Compania SRL"></div>
      <div class="field"><label class="field__label" for="remail">Email de serviciu</label>
        <input class="input" id="remail" name="email" type="email" required placeholder="nume@companie.md" value="${esc(ctx.email)}"></div>
      <div class="grid grid--2" style="gap:12px">
        <div class="field"><label class="field__label" for="title">Funcția <span style="font-weight:400;color:var(--text-3)">(opțional)</span></label>
          <input class="input" id="title" name="title" placeholder="Director comercial"></div>
        <div class="field"><label class="field__label" for="phone">Telefon <span style="font-weight:400;color:var(--text-3)">(opțional)</span></label>
          <input class="input" id="phone" name="phone" type="tel" placeholder="+373 ..."></div>
      </div>
      <button class="btn btn--primary btn--lg btn--block" type="submit">TRIMITE CEREREA</button>
    </form>
    <p class="auth__sub"><a href="#" data-goto="welcome">← Înapoi la autentificare</a></p>`);
}

function otp() {
  return shell(`
    <span class="auth__logo">${icon('mail', 24)}</span>
    <h1 class="auth__title">Check your email</h1>
    <p class="auth__sub">Am trimis un cod de 6 cifre la<br><strong>${esc(maskEmail(ctx.email))}</strong></p>
    <form class="stack" data-form="otp">
      <div class="otp">
        ${Array.from({ length: 6 }, (_, i) => `<input class="otp__box" inputmode="numeric" maxlength="1"
          aria-label="Cifra ${i + 1}" data-otp="${i}" ${i === 0 ? 'autofocus' : ''}>`).join('')}
      </div>
      <p class="field__error" data-otp-error hidden></p>
      <button class="btn btn--primary btn--lg btn--block" type="submit">VERIFY</button>
    </form>
    <div class="hstack" style="justify-content:center;gap:16px">
      <button class="btn btn--ghost btn--sm" data-resend>Resend code</button>
      <button class="btn btn--ghost btn--sm" data-magic>${icon('link', 14)} Open email login link</button>
    </div>
    <div class="demo-note">
      <strong>Email simulat</strong>
      <span>Codul tău este <code style="font-size:1rem;letter-spacing:.18em">${ctx.code}</code> —
      valabil 5 minute, o singură utilizare. Sau apasă „Open email login link”.</span>
    </div>
    <p class="auth__sub"><a href="#" data-goto="welcome">← Folosește alt email</a></p>`);
}

function pending() {
  return shell(`
    <div class="status-badge-lg">
      <span class="status-badge-lg__ring" style="background:var(--warn-soft);color:var(--warn)">${icon('clock', 28)}</span>
      <h1 class="auth__title">Access requested</h1>
      <p class="auth__sub">Email-ul <strong>${esc(ctx.email)}</strong> a fost verificat.<br>
        Contul Carepack așteaptă aprobarea administratorului.</p>
      <p class="source">${icon('info', 12)} Vei primi un email „Your Carepack account has been approved”.</p>
    </div>
    <div class="card card--pad stack stack--sm">
      <span class="section-title">Ce urmează</span>
      <div class="hstack"><span class="badge badge--pos">1</span><span>Verificare email — finalizată</span></div>
      <div class="hstack"><span class="badge badge--warn">2</span><span>Aprobare administrator — în curs</span></div>
      <div class="hstack"><span class="badge">3</span><span>Acces la platformă</span></div>
    </div>
    <p class="auth__sub"><a href="#" data-goto="welcome">← Înapoi</a></p>`);
}

function blocked(kind) {
  const isBlocked = kind === 'BLOCKED';
  return shell(`
    <div class="status-badge-lg">
      <span class="status-badge-lg__ring" style="background:var(--neg-soft);color:var(--neg)">${icon('lock', 28)}</span>
      <h1 class="auth__title">${isBlocked ? 'Cont blocat' : 'Acces respins'}</h1>
      <p class="auth__sub">${isBlocked
        ? 'Accesul acestui cont a fost revocat de administrator. Toate sesiunile active au fost închise.'
        : 'Cererea de acces pentru acest email a fost respinsă.'}<br>
        Contactează administratorul platformei.</p>
    </div>
    <p class="auth__sub"><a href="#" data-goto="welcome">← Înapoi</a></p>`);
}

function googleMark() {
  return `<svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true"><path fill="#EA4335" d="M24 9.5c3.5 0 6.6 1.2 9 3.6l6.7-6.7C35.6 2.6 30.2 0 24 0 14.6 0 6.5 5.4 2.5 13.2l7.8 6.1C12.2 13.2 17.6 9.5 24 9.5z"/><path fill="#4285F4" d="M46.1 24.5c0-1.6-.1-3.1-.4-4.5H24v9h12.4c-.5 2.9-2.2 5.3-4.6 7l7.1 5.5c4.2-3.9 6.6-9.6 6.6-17z"/><path fill="#FBBC05" d="M10.3 28.7a14.5 14.5 0 0 1 0-9.4l-7.8-6.1a24 24 0 0 0 0 21.6l7.8-6.1z"/><path fill="#34A853" d="M24 48c6.5 0 11.9-2.1 15.9-5.9l-7.1-5.5c-2 1.3-4.5 2.1-8.8 2.1-6.4 0-11.8-3.7-13.7-9.9l-7.8 6.1C6.5 42.6 14.6 48 24 48z"/></svg>`;
}
function msMark() {
  return `<svg width="18" height="18" viewBox="0 0 23 23" aria-hidden="true"><path fill="#f25022" d="M1 1h10v10H1z"/><path fill="#7fba00" d="M12 1h10v10H12z"/><path fill="#00a4ef" d="M1 12h10v10H1z"/><path fill="#ffb900" d="M12 12h10v10H12z"/></svg>`;
}

/* ---------- flow ---------- */
function findUser(email) {
  return state.users.find((u) => u.email.toLowerCase() === email.trim().toLowerCase());
}

function proceedAfterVerify() {
  const email = ctx.email.trim().toLowerCase();
  let user = findUser(email);
  if (!user) {
    // verified identity but never requested access → create a pending request
    const domain = email.split('@')[1];
    const trusted = state.domains.find((d) => d.domain === domain && d.autoApprove);
    user = addUserRequest({
      first: email.split('@')[0].split(/[._]/)[0].replace(/^./, (c) => c.toUpperCase()),
      last: '', email, company: trusted ? domain : '—',
    });
  }
  if (user.status === 'ACTIVE') {
    login(user, ctx.method);
    toast(`Bine ai venit, ${user.first}!`, 'ok');
    onDone();
    return;
  }
  if (user.status === 'BLOCKED' || user.status === 'REJECTED') { go(user.status === 'BLOCKED' ? 'blocked' : 'rejected'); return; }
  if (user.status === 'INVITED') { user.status = 'ACTIVE'; user.approvedBy = 'Invitație'; persist(); login(user, ctx.method); onDone(); return; }
  logAudit('a verificat email-ul', email, 'auth');
  go('pending');
}

function go(screen) {
  ctx.screen = screen;
  render();
}

function render() {
  const map = { welcome, register, otp, pending, blocked: () => blocked('BLOCKED'), rejected: () => blocked('REJECTED') };
  root.innerHTML = (map[ctx.screen] || welcome)();
  wire();
}

function wire() {
  root.querySelectorAll('[data-goto]').forEach((a) => a.addEventListener('click', (e) => {
    e.preventDefault(); go(a.dataset.goto);
  }));

  const emailForm = root.querySelector('[data-form="email"]');
  if (emailForm) emailForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const email = new FormData(emailForm).get('email').toString().trim();
    if (!/^[^@\s]+@[^@\s.]+\.[^@\s]+$/.test(email)) { toast('Adresă de email invalidă', 'err'); return; }
    ctx.email = email; ctx.code = genCode(); ctx.method = 'Email OTP'; ctx.sentAt = Date.now(); ctx.attempts = 0;
    go('otp');
  });

  const regForm = root.querySelector('[data-form="register"]');
  if (regForm) regForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const f = Object.fromEntries(new FormData(regForm).entries());
    ctx.email = f.email.trim();
    addUserRequest({ first: f.first, last: f.last, email: ctx.email, company: f.company, title: f.title, phone: f.phone });
    ctx.code = genCode(); ctx.method = 'Email OTP';
    toast('Cerere trimisă. Verifică email-ul pentru cod.', 'ok');
    go('otp');
  });

  root.querySelectorAll('[data-sso]').forEach((b) => b.addEventListener('click', () => {
    const provider = b.dataset.sso;
    const email = ctx.email || (provider === 'Google' ? 'sergiu022@gmail.com' : 'elena.braga@carepack.md');
    ctx.email = email; ctx.method = provider;
    toast(`Identitate confirmată prin ${provider}`, 'info', 2200);
    proceedAfterVerify();
  }));

  const boxes = Array.from(root.querySelectorAll('[data-otp]'));
  boxes.forEach((box, i) => {
    box.addEventListener('input', () => {
      box.value = box.value.replace(/\D/g, '').slice(0, 1);
      box.dataset.filled = box.value ? '1' : '0';
      if (box.value && i < boxes.length - 1) boxes[i + 1].focus();
      if (boxes.every((b) => b.value)) root.querySelector('[data-form="otp"]')?.requestSubmit();
    });
    box.addEventListener('keydown', (e) => {
      if (e.key === 'Backspace' && !box.value && i > 0) boxes[i - 1].focus();
      if (e.key === 'ArrowLeft' && i > 0) boxes[i - 1].focus();
      if (e.key === 'ArrowRight' && i < boxes.length - 1) boxes[i + 1].focus();
    });
    box.addEventListener('paste', (e) => {
      const txt = (e.clipboardData.getData('text') || '').replace(/\D/g, '').slice(0, 6);
      if (!txt) return;
      e.preventDefault();
      txt.split('').forEach((ch, k) => { if (boxes[k]) { boxes[k].value = ch; boxes[k].dataset.filled = '1'; } });
      boxes[Math.min(txt.length, 5)].focus();
      if (txt.length === 6) root.querySelector('[data-form="otp"]')?.requestSubmit();
    });
  });

  const otpForm = root.querySelector('[data-form="otp"]');
  if (otpForm) otpForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const err = root.querySelector('[data-otp-error]');
    const val = boxes.map((b) => b.value).join('');
    const expired = Date.now() - ctx.sentAt > 5 * 60 * 1000;
    if (expired) { err.hidden = false; err.textContent = 'Codul a expirat. Solicită un cod nou.'; return; }
    if (val !== ctx.code) {
      ctx.attempts++;
      err.hidden = false;
      err.textContent = ctx.attempts >= 5
        ? 'Prea multe încercări. Solicită un cod nou.'
        : `Cod incorect. Mai ai ${5 - ctx.attempts} încercări.`;
      if (ctx.attempts >= 5) { ctx.code = ''; }
      boxes.forEach((b) => { b.value = ''; b.dataset.filled = '0'; });
      boxes[0].focus();
      return;
    }
    ctx.code = uid('used'); // single use: invalidate immediately
    proceedAfterVerify();
  });

  root.querySelector('[data-resend]')?.addEventListener('click', () => {
    ctx.code = genCode(); ctx.sentAt = Date.now(); ctx.attempts = 0;
    toast('Cod nou trimis', 'ok');
    render();
  });
  root.querySelector('[data-magic]')?.addEventListener('click', () => {
    ctx.method = 'Magic Link';
    toast('Autentificare prin Magic Link', 'info', 1800);
    proceedAfterVerify();
  });
}

export function mountAuth(el, done) {
  root = el; onDone = done;
  ctx = { screen: 'welcome', email: '', code: '', user: null, method: 'Email OTP', attempts: 0, sentAt: 0 };
  render();
}
