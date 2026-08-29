/* Tiny hash router: #/segment/segment?query */
const routes = [];
let notFound = null;
let current = null;

export function route(pattern, handler) {
  const parts = pattern.split('/').filter(Boolean);
  routes.push({ pattern, parts, handler });
}
export function setNotFound(fn) { notFound = fn; }

export function parseHash() {
  const raw = (location.hash || '#/').replace(/^#/, '');
  const [path, qs] = raw.split('?');
  const parts = path.split('/').filter(Boolean);
  const query = Object.fromEntries(new URLSearchParams(qs || ''));
  return { path: `/${parts.join('/')}`, parts, query, raw };
}

export function match(parts) {
  for (const r of routes) {
    if (r.parts.length < parts.length && !r.parts.some((p) => p === '*')) continue;
    const params = {};
    let ok = true;
    for (let i = 0; i < r.parts.length; i++) {
      const rp = r.parts[i], up = parts[i];
      if (rp.startsWith(':')) {
        const optional = rp.endsWith('?');
        if (up === undefined) { if (!optional) { ok = false; break; } continue; }
        params[rp.replace(/^:|\?$/g, '')] = decodeURIComponent(up);
      } else if (rp === '*') {
        break;
      } else if (rp !== up) { ok = false; break; }
    }
    if (ok && parts.length <= r.parts.length) return { handler: r.handler, params, pattern: r.pattern };
  }
  return notFound ? { handler: notFound, params: {}, pattern: '404' } : null;
}

export function navigate(to, replace = false) {
  const url = to.startsWith('#') ? to : `#${to}`;
  if (replace) location.replace(url); else location.hash = url;
}

export function start(onRoute) {
  const run = () => {
    const ctx = parseHash();
    const m = match(ctx.parts);
    current = { ...ctx, ...m };
    onRoute(current);
  };
  window.addEventListener('hashchange', run);
  run();
}
export const currentRoute = () => current;
