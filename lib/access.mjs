import { createHmac, randomBytes, scryptSync, timingSafeEqual } from 'node:crypto';

const COOKIE = '__Host-aple_access';
const MAX_AGE = 8 * 60 * 60;
const WINDOW = 15 * 60 * 1000;
const sharedHeaders = {
  'Cache-Control': 'private, no-store, max-age=0',
  'Vercel-CDN-Cache-Control': 'no-store',
  'X-Robots-Tag': 'noindex, nofollow',
  'X-Content-Type-Options': 'nosniff',
  'Referrer-Policy': 'no-referrer',
  Vary: 'Cookie',
};

function validConfig(value) {
  try {
    const config = JSON.parse(value || 'null');
    return config && /^[a-f0-9]{32}$/.test(config.salt) && /^[a-f0-9]{64}$/.test(config.hash) && /^[a-f0-9]{64}$/.test(config.key) ? config : null;
  } catch { return null; }
}

function signature(payload, key) { return createHmac('sha256', key).update(payload).digest('base64url'); }
function equal(a, b) {
  const first = Buffer.from(a), second = Buffer.from(b);
  return first.length === second.length && timingSafeEqual(first, second);
}

function sessionValid(request, config, now) {
  const cookie = (request.headers.get('cookie') || '').split(';').map(part => part.trim()).find(part => part.startsWith(`${COOKIE}=`));
  if (!cookie || cookie.length > 1024) return false;
  const [payload, mac, extra] = cookie.slice(COOKIE.length + 1).split('.');
  if (!payload || !mac || extra || !equal(signature(payload, config.key), mac)) return false;
  try {
    const session = JSON.parse(Buffer.from(payload, 'base64url').toString());
    return session.host === new URL(request.url).host && Number.isSafeInteger(session.exp) && session.exp > now && session.exp <= now + MAX_AGE * 1000;
  } catch { return false; }
}

export function landing(message = '') {
  return `<!doctype html><html lang="de"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex,nofollow"><meta name="theme-color" content="#0c0d10"><title>Aplejouice Mod — In Bearbeitung · Beta</title><style>*{box-sizing:border-box}body{margin:0;min-height:100svh;background:#0c0d10;color:#f2f3f5;font:15px/1.7 system-ui,-apple-system,"Segoe UI",sans-serif;display:flex;flex-direction:column}header,footer{width:min(1080px,calc(100% - 48px));margin:auto}header{padding:28px 0;border-bottom:1px solid #24262d;display:flex;align-items:center;gap:10px;font-weight:650}header img{image-rendering:pixelated}main{width:min(440px,calc(100% - 48px));margin:auto;padding:65px 0 75px}.status{display:inline-block;font-size:11px;color:#efad78;border:1px solid #61442d;background:#241c16;border-radius:4px;padding:3px 9px;margin-bottom:20px}h1{font-size:38px;line-height:1.15;letter-spacing:-1.2px;margin:0 0 20px}p{color:#9a9eaa;margin:0 0 30px}label{display:block;font-size:13px;margin-bottom:8px}input,button{width:100%;font:inherit;border-radius:5px}input{background:#15171d;color:#fff;padding:12px 14px;border:1px solid #3c404b;letter-spacing:5px}input:focus{outline:2px solid #ed9b5e;outline-offset:3px}button{margin-top:12px;padding:11px 14px;border:0;background:#d77630;color:#fff;font-weight:650;cursor:pointer}button:hover{background:#e68b48}.hint{font-size:11px;margin:15px 0 0;color:#737987}.error{color:#f0a58e;font-size:12px;margin:0 0 14px;min-height:20px}footer{border-top:1px solid #24262d;padding:22px 0;display:flex;justify-content:space-between;gap:20px;color:#737987;font-size:12px}a{color:#d8a179;text-decoration:none}a:hover{text-decoration:underline}@media(max-width:500px){h1{font-size:33px}footer{flex-direction:column;gap:5px}}</style></head><body><header><img src="/assets/logo.png" width="32" height="32" alt="">Aplejouice Mod</header><main><span class="status">In Bearbeitung · Beta</span><h1>Hier wird noch<br>gearbeitet.</h1><p>Die Website wird gerade überarbeitet. Die Vorschau ist vorerst nur mit Passcode zugänglich.</p><form method="post" action="/_access/login"><label for="passcode">Passcode</label><div class="error" role="alert">${message}</div><input id="passcode" name="passcode" type="password" inputmode="numeric" autocomplete="current-password" maxlength="64" required aria-label="Passcode"><button type="submit">Vorschau öffnen</button></form><p class="hint">Die Mod findest du weiterhin auf Modrinth.</p></main><footer><span>Aplejouice Mod · Beta</span><a href="https://modrinth.com/mod/aplejouice-mod" target="_blank" rel="noopener noreferrer">Zur Mod auf Modrinth ↗</a></footer></body></html>`;
}

function page(message, status = 401, extra = {}) {
  return new Response(landing(message), { status, headers: { ...sharedHeaders, 'Content-Type': 'text/html; charset=utf-8', 'Content-Security-Policy': "default-src 'none'; img-src 'self'; style-src 'unsafe-inline'; form-action 'self'; base-uri 'none'; frame-ancestors 'none'", ...extra } });
}

export function createGate({ next, getConfig = () => process.env.SITE_ACCESS_CONFIG, getIp = () => 'unknown', clock = Date.now }) {
  // Best-effort per-instance throttling, supplemented by the hosting firewall.
  const attempts = new Map();
  return async function gate(request) {
    const url = new URL(request.url);
    if (url.pathname === '/assets/logo.png' && ['GET', 'HEAD'].includes(request.method)) return next();
    const config = validConfig(getConfig());
    if (!config) return page('Der geschützte Zugang wird gerade eingerichtet.', 503);
    const now = clock();
    if (url.pathname === '/_access/login' || url.pathname === '/_access/logout') {
      if (request.method !== 'POST') return page('', 405, { Allow: 'POST' });
      if (request.headers.get('origin') !== url.origin) return page('Bitte öffne das Formular direkt auf dieser Website.', 403);
      if (url.pathname === '/_access/logout') return new Response(null, { status: 303, headers: { ...sharedHeaders, Location: '/', 'Set-Cookie': `${COOKIE}=; Path=/; Max-Age=0; Secure; HttpOnly; SameSite=Strict` } });
      const ip = getIp(request) || 'unknown';
      for (const [key, entry] of attempts) if (entry.until <= now) attempts.delete(key);
      const entry = attempts.get(ip) || { count: 0, until: now + WINDOW };
      if (entry.count >= 8) return page('Zu viele Versuche. Bitte warte 15 Minuten.', 429, { 'Retry-After': String(Math.ceil((entry.until - now) / 1000)) });
      if (!request.headers.get('content-type')?.startsWith('application/x-www-form-urlencoded')) return page('Ungültige Anfrage.', 415);
      if (Number(request.headers.get('content-length')) > 1024) return page('Ungültige Anfrage.', 413);
      let body = '';
      if (request.body) {
        const reader = request.body.getReader();
        let bytes = 0;
        const chunks = [];
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          bytes += value.length;
          if (bytes > 1024) { await reader.cancel(); return page('Ungültige Anfrage.', 413); }
          chunks.push(Buffer.from(value));
        }
        body = Buffer.concat(chunks).toString();
      }
      const passcode = new URLSearchParams(body).get('passcode') || '';
      const hash = scryptSync(passcode.slice(0, 64), config.salt, 32).toString('hex');
      if (!passcode || passcode.length > 64 || !equal(hash, config.hash)) {
        entry.count++;
        if (attempts.size < 10000 || attempts.has(ip)) attempts.set(ip, entry);
        return page('Der Passcode stimmt nicht.');
      }
      attempts.delete(ip);
      const payload = Buffer.from(JSON.stringify({ exp: now + MAX_AGE * 1000, host: url.host, nonce: randomBytes(16).toString('hex') })).toString('base64url');
      return new Response(null, { status: 303, headers: { ...sharedHeaders, Location: '/', 'Set-Cookie': `${COOKIE}=${payload}.${signature(payload, config.key)}; Path=/; Max-Age=${MAX_AGE}; Secure; HttpOnly; SameSite=Strict` } });
    }
    if (!sessionValid(request, config, now)) return page('');
    const response = next();
    for (const [key, value] of Object.entries(sharedHeaders)) response.headers.set(key, value);
    return response;
  };
}
