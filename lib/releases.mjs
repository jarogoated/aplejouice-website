import { brandScene } from './presentation.mjs';
import { getLanguage, localizeResponse } from './i18n.mjs';
const REPO = 'jarogoated/aplejouice-mod';
const MC = '1.21.11';
const headers = { 'X-Content-Type-Options': 'nosniff', 'Referrer-Policy': 'same-origin' };
const escape = value => String(value).replace(/[&<>"']/g, char => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' })[char]);
const compare = (a,b) => { const x=a.split('.').map(Number),y=b.split('.').map(Number); for(let i=0;i<3;i++) if(x[i]!==y[i]) return x[i]-y[i]; return 0; };

export function selectRelease(releases) {
  if (!Array.isArray(releases)) return null;
  return releases.filter(r => !r.draft && !r.prerelease && /^v[0-9]{1,6}\.[0-9]{1,6}\.[0-9]{1,6}$/.test(r.tag_name))
    .map(release => {
      const version=release.tag_name.slice(1);
      const name=`Aplejouice-Mod-${version}-mc${MC}.jar`;
      const asset=release.assets?.find(a => a.name===name && a.state==='uploaded' && a.size>0 && a.size<100*1024*1024);
      const jarUrl=`https://github.com/${REPO}/releases/download/${release.tag_name}/${name}`;
      if (!asset || asset.browser_download_url!==jarUrl) return null;
      return { schemaVersion:1, modId:'aplejuice', minecraft:MC, version, downloadUrl:'https://aplejouice.com/downloads',
        jarUrl, notesUrl:`https://github.com/${REPO}/releases/tag/${release.tag_name}`,
        sha256:/^sha256:[a-f0-9]{64}$/.test(asset.digest || '') ? asset.digest.slice(7) : null,
        size:asset.size, publishedAt:release.published_at };
    }).filter(Boolean).sort((a,b) => compare(b.version,a.version))[0] || null;
}

const style=`*{box-sizing:border-box}html{color-scheme:dark}body{margin:0;background:#101114;color:#f1ede8;font:16px/1.65 system-ui,sans-serif}header,main,footer{width:min(100% - 40px,900px);margin:auto}header{height:90px;border-bottom:1px solid #302925;display:flex;align-items:center;gap:12px}header img{image-rendering:pixelated}header a{margin-left:auto;font-size:13px;color:#bda78f}main{padding:60px 0 70px}.eyebrow{font-size:12px;letter-spacing:2px;color:#e6a46d;text-transform:uppercase}h1{font-size:clamp(34px,6vw,54px);line-height:1.12;letter-spacing:-1.5px;margin:14px 0 18px}p{color:#afa69d;max-width:650px}.release{margin-top:36px;background:#1a1817;border:1px solid #443428;border-radius:12px;padding:28px}.row{display:flex;align-items:center;justify-content:space-between;gap:20px;flex-wrap:wrap}h2{font-size:24px;margin:0 0 6px}.badge{font-size:12px;color:#edba8a;background:#35251a;border:1px solid #654326;padding:4px 10px;border-radius:30px}.button{display:inline-block;padding:12px 20px;background:#e99446;color:#1b1009;border-radius:6px;font-weight:700;text-decoration:none}.button:hover{background:#ffb568}a{color:#e8aa70;text-underline-offset:4px}.links{display:flex;gap:22px;flex-wrap:wrap;margin-top:22px;font-size:14px}.install{margin-top:30px;font-size:14px}.hash{font-size:11px;overflow-wrap:anywhere;color:#7f7972}footer{border-top:1px solid #302925;padding:24px 0;font-size:12px;color:#827970}footer .row{gap:12px}li{margin:10px 0}code{color:#e8bc95}@media(max-width:550px){main{padding-top:35px}.release{padding:20px}.button{width:100%;text-align:center}}`;
function layout(title,body) { return `<!doctype html><html lang="de"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="theme-color" content="#101114"><title>${escape(title)} · Aplejouice Mod</title><style>${style}</style><link rel="stylesheet" href="/assets/depth.css"><body class="aple-depth download-page"><header><img src="/assets/logo.png" width="36" height="36" alt=""><strong>Aplejouice Mod</strong><a href="/">Website-Vorschau</a></header><main>${body}</main><footer><div class="row"><span>Aplejouice Mod · Community-Projekt · MIT</span><a href="/release-admin">Version veröffentlichen ↗</a></div><p>Nicht mit Mojang oder Microsoft verbunden.</p></footer></body></html>`; }
function html(body,cache='no-store') { return new Response(body,{headers:{...headers,'Content-Type':'text/html; charset=utf-8','Cache-Control':cache,
  'Content-Security-Policy':"default-src 'none'; img-src 'self'; style-src 'self' 'unsafe-inline'; base-uri 'none'; frame-ancestors 'none'"}}); }

export function releaseAdminPage() {
  return html(layout('Version veröffentlichen',`<span class="eyebrow">Veröffentlichung</span><h1>Eine Version.<br>Alle auf dem Laufenden.</h1><p>GitHub verwaltet eure Uploads und Zugriffsrechte. Diese Downloadseite übernimmt fertig veröffentlichte Versionen automatisch innerhalb von etwa fünf Minuten.</p><ol><li>Mod bauen und Version in <code>gradle.properties</code> erhöhen.</li><li>Release-Tag <code>v1.7.0</code> anlegen – mit der jeweiligen neuen Versionsnummer.</li><li>Die JAR als <code>Aplejouice-Mod-1.7.0-mc1.21.11.jar</code> hochladen. Tag und Dateiversion müssen übereinstimmen.</li><li>Als fertiges Release veröffentlichen. Entwürfe und Pre-Releases werden nicht angeboten.</li></ol><p><a class="button" href="https://github.com/${REPO}/releases/new" rel="noopener noreferrer">Version auf GitHub hochladen ↗</a></p><p>Das funktioniert nur mit einem GitHub-Konto, das Schreibzugriff auf das Projekt hat. Bereits veröffentlichte Dateien unverändert lassen; jede Änderung bekommt eine neue Version.</p><div class="links"><a href="/downloads">Downloadseite</a><a href="/api/mod/latest?minecraft=${MC}">Update-Metadaten</a></div>`));
}

export function createReleaseRoutes({fetcher=fetch,clock=Date.now}={}) {
  let cached=null,expires=0,pending;
  async function latest() {
    if(clock()<expires) return cached;
    if(pending) return pending;
    pending=(async () => {
      const response=await fetcher(`https://api.github.com/repos/${REPO}/releases?per_page=30`,{
        headers:{Accept:'application/vnd.github+json','User-Agent':'Aplejouice-Website','X-GitHub-Api-Version':'2022-11-28'},signal:AbortSignal.timeout(5000)});
      if(!response.ok) throw new Error('Release service unavailable');
      const release=selectRelease(await response.json());
      cached=release;expires=clock()+300000;return release;
    })();
    try {return await pending;} finally {pending=null;}
  }
  return async request => {
    const url=new URL(request.url);
    if(!['/downloads','/api/mod/latest'].includes(url.pathname)) return null;
    if(!['GET','HEAD'].includes(request.method)) return new Response(null,{status:405,headers:{Allow:'GET, HEAD',...headers}});
    const head=request.method==='HEAD';
    let release=null,unavailable=false;
    try {release=await latest();} catch {unavailable=true;}
    if(url.pathname==='/api/mod/latest') {
      if(url.searchParams.has('minecraft') && url.searchParams.get('minecraft')!==MC) release=null;
      return new Response(head ? null : JSON.stringify(release || {error:unavailable ? 'unavailable' : 'no_compatible_release'}),{
        status:release ? 200 : unavailable ? 503 : 404,headers:{...headers,'Content-Type':'application/json; charset=utf-8',
        'Cache-Control':release ? 'public, max-age=0, s-maxage=300' : 'no-store'}});
    }
    const card=release ? `<div class="release"><div class="row"><div><h2>Version ${escape(release.version)}</h2><span class="badge">Fabric · Minecraft ${MC} · Java 21</span></div><a class="button" href="${escape(release.jarUrl)}">Mod herunterladen ↓</a></div><p>Download der vollständigen Mod-JAR · ${(release.size/1048576).toFixed(1)} MB</p><div class="links"><a href="${escape(release.notesUrl)}">Was ist neu? ↗</a><a href="https://github.com/${REPO}/releases">Alle Versionen ↗</a><a href="https://modrinth.com/mod/aplejouice-mod">Modrinth ↗</a></div>${release.sha256 ? `<p class="hash">SHA-256: ${escape(release.sha256)}</p>` : ''}</div>`
      : `<div class="release"><h2>${unavailable ? 'Downloads gerade nicht erreichbar' : 'Die nächste Version kommt bald.'}</h2><p>${unavailable ? 'Die Versionsliste konnte nicht geladen werden. Du kannst direkt bei GitHub nachsehen.' : 'Sobald ein fertiges Release veröffentlicht ist, erscheint es automatisch hier.'}</p><a class="button" href="https://github.com/${REPO}/releases">Zu den Releases ↗</a></div>`;
    const response=html(layout('Downloads',`<section class="download-hero">${brandScene()}<span class="eyebrow">Fabric · Minecraft ${MC}</span><h1>Dein Spiel.<br><span>Mit mehr Überblick.</span></h1><p>Die aktuelle Aplejouice Mod für Minecraft Java. Laden, in deinen mods-Ordner legen und mit deiner Menütaste loslegen.</p></section>${card}<section class="download-features" aria-label="Features"><div><b>Item Track</b><p>Bis zu acht Item-Typen verfolgen: Webs, Totems, Enderperlen und Crystals. Die erfassten Nutzungen stehen direkt über dem Spieler.</p></div><div><b>Spieler</b><p>Geladene Spieler auswählen oder durch einen Angriff als Ziel setzen. Ziele lassen sich wieder abwählen. Ohne Gegner-Modus werden nahe Spieler angezeigt.</p></div><div><b>Visuals</b><p>Wasserquellen cyan hervorheben, fließendes Wasser unterscheiden und mit einer eigenen Taste ein- oder ausschalten. Die Suche bleibt auf die Nähe begrenzt.</p></div><div><b>Border</b><p>Galaxy, Colloseum oder Japan auswählen und die vermessene Border per Keybind einblenden. Eine rein visuelle Hilfe ohne Kollision.</p></div><div><b>Koordinaten</b><p>Koordinaten mit eigener Taste kopieren: XYZ, XY oder XZ, ohne Nachkommastellen. Die Bestätigung erscheint nur bei dir, nicht im Server-Chat.</p></div><div><b>Einstellungen</b><p>Tracking, Nullwerte, Reichweite und Gegner-Modus einstellen. Sprache und Einstellungen bleiben gespeichert. Hier kannst du das Tutorial erneut anzeigen und Downloads öffnen.</p></div></section><div class="install"><strong>So installierst du das Update</strong><ol><li>Minecraft schließen.</li><li>Alte Aplejouice-JAR im <code>mods</code>-Ordner durch die neue ersetzen. Einstellungen bleiben erhalten.</li><li>Mit Fabric Loader und Fabric API für Minecraft ${MC} starten.</li></ol><p>Die Mod weist beim Start auf neue Versionen hin. Es werden keine Dateien automatisch ersetzt.</p></div>`));
    const localized=await localizeResponse(response,getLanguage(request),'/downloads');
    if(head) return new Response(null,{status:localized.status,headers:localized.headers});
    return localized;
  };
}
