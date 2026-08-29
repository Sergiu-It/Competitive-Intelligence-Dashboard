/* Deterministic PRNG so the demo dataset is identical on every load. */
export function hashSeed(str) {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619) >>> 0;
  }
  return h >>> 0;
}

export function makeRng(seed) {
  let s = typeof seed === 'string' ? hashSeed(seed) : seed >>> 0;
  if (s === 0) s = 0x9e3779b9;
  const next = () => {
    s ^= s << 13; s >>>= 0;
    s ^= s >>> 17;
    s ^= s << 5;  s >>>= 0;
    return s / 4294967296;
  };
  next.float = (min, max) => min + next() * (max - min);
  next.int = (min, max) => Math.floor(min + next() * (max - min + 1));
  next.pick = (arr) => arr[Math.floor(next() * arr.length)];
  next.picks = (arr, n) => {
    const copy = [...arr];
    const out = [];
    while (out.length < n && copy.length) out.push(copy.splice(Math.floor(next() * copy.length), 1)[0]);
    return out;
  };
  next.chance = (p) => next() < p;
  next.gauss = (mean = 0, sd = 1) => {
    const u = Math.max(1e-9, next()), v = next();
    return mean + sd * Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
  };
  return next;
}
