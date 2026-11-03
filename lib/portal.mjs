import {createServerClient,parseCookieHeader,serializeCookieHeader} from '@supabase/ssr';
import {getLanguage} from './i18n.mjs';

export const escapeHtml=value=>String(value??'').replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
const routes=new Set(['/account','/feedback','/270211','/auth/provider','/auth/email','/auth/verify','/auth/callback','/auth/logout','/auth/mfa/enroll','/auth/mfa/verify','/portal/report','/portal/moderate','/portal/profile','/portal/me','/portal/skin']);
const statusNames={open:'Offen',reviewing:'In Prüfung',resolved:'Erledigt'};
const baseHeaders={'Cache-Control':'private, no-store, max-age=0','Vercel-CDN-Cache-Control':'no-store','Referrer-Policy':'no-referrer','X-Content-Type-Options':'nosniff','X-Frame-Options':'DENY','X-Robots-Tag':'noindex, nofollow','Content-Security-Policy':"default-src 'none'; img-src 'self' data:; style-src 'self'; form-action 'self'; base-uri 'none'; frame-ancestors 'none'; object-src 'none'"};
export function portalConfig(env=process.env){
 try{
  const url=new URL(env.SUPABASE_URL);
  if(url.protocol!=='https:' || !/^[a-z0-9-]+\.supabase\.co$/.test(url.hostname) || url.pathname!=='/' || url.username || url.password)return null;
  const key=env.SUPABASE_PUBLISHABLE_KEY;
  if(!key || key.length<20 || key.startsWith('sb_secret_'))return null;
  if(!key.startsWith('sb_publishable_')){const payload=JSON.parse(Buffer.from(key.split('.')[1]||'','base64url'));if(payload.role!=='anon')return null;}
  const providers=(env.PORTAL_PROVIDERS||'discord,email').split(',').filter(value=>['discord','google','azure','email'].includes(value));
  return {url:url.origin,key,providers,origin:'https://aplejouice.com'};
 }catch{return null;}
}
export function createPortalClient(request,config,setCookies){
 return createServerClient(config.url,config.key,{
  cookieOptions:{name:'__Host-aple_account',path:'/',httpOnly:true,secure:true,sameSite:'lax'},
  cookies:{getAll:()=>parseCookieHeader(request.headers.get('Cookie')||''),setAll:setCookies},
  global:{fetch:(url,options)=>fetch(url,{...options,signal:AbortSignal.timeout(8000)})},
 });
}
const field=(label,name,type='text',extra='')=>`<label>${label}<input name="${name}" type="${type}" ${extra} required></label>`;
const form=(action,body,button,extra='')=>`<form method="post" action="${action}" ${extra}>${body}<button class="portal-primary" type="submit">${button}</button></form>`;
function documentPage(title,body,english=false){return `<!doctype html><html lang="${english?'en':'de'}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${escapeHtml(title)} · Aplejouice Mod</title><link rel="icon" href="/assets/logo.png"><link rel="stylesheet" href="/assets/depth.css"></head><body class="aple-depth portal-page"><header><a class="portal-brand" href="/"><img src="/assets/logo.png" width="32" height="32" alt="">Aplejouice Mod</a><nav><a href="/downloads">Downloads</a><a href="/feedback">Feedback</a><a href="/account">${english?'Account':'Konto'}</a></nav></header><main><p class="eyebrow">APLEJOUICE COMMUNITY</p><h1>${escapeHtml(title)}</h1>${body}</main><footer><a href="/">${english?'Home':'Startseite'}</a><a href="/impressum">${english?'Legal notice':'Impressum'}</a><a href="/feedback">Feedback</a></footer></body></html>`;}
function login(config,english){
 const providers=[['discord','Discord'],['google','Google'],['azure','Microsoft']];
 const disabled=!config;
 return `<section class="portal-card"><h2>${english?'Your account':'Dein Konto'}</h2><p>${english?'Sign in to send reports and follow their status.':'Anmelden, Reports senden und ihren Status verfolgen.'}</p><div class="provider-grid">${providers.map(([id,label])=>form('/auth/provider',`<input type="hidden" name="provider" value="${id}">`,`${label} ↗`,disabled||!config.providers.includes(id)?'inert aria-disabled="true"':'')).join('')}</div>${disabled?`<p class="portal-notice">${english?'Account service is being set up. Sign-in and report submission are not available yet.':'Der Kontodienst wird eingerichtet. Anmeldung und Report-Versand sind noch nicht verfügbar.'}</p>`:''}</section><section class="portal-card"><h2>${english?'Sign in with email':'Mit E-Mail anmelden'}</h2><p>${english?'No password: receive a one-time code by email.':'Ohne Passwort: Du erhältst einen einmaligen Code per E-Mail.'}</p>${form('/auth/email',field('E-Mail','email','email','autocomplete="email" maxlength="254"'),english?'Send code':'Code senden',disabled||!config.providers.includes('email')?'inert aria-disabled="true"':'')}</section>`;
}
function reportCards(reports,admin=false){return reports.length?reports.map(report=>`<article class="portal-card report"><div class="report-meta"><span>${escapeHtml(report.kind==='bug'?'Bug':'Feedback')}</span><span class="report-status">${escapeHtml(statusNames[report.status]||report.status)}</span><time>${escapeHtml(new Date(report.created_at).toLocaleDateString('de-DE'))}</time></div><h3>${escapeHtml(report.title)}</h3><p class="report-body">${escapeHtml(report.description)}</p><small>${escapeHtml(report.mod_version)} · #${escapeHtml(report.id.slice(0,8))}</small>${report.reply?`<div class="report-reply"><b>Antwort</b><p>${escapeHtml(report.reply)}</p></div>`:''}${admin?form('/portal/moderate',`<input type="hidden" name="id" value="${escapeHtml(report.id)}"><label>Status<select name="status">${Object.entries(statusNames).map(([id,label])=>`<option value="${id}" ${report.status===id?'selected':''}>${label}</option>`).join('')}</select></label><label>Antwort an den Absender<textarea name="reply" maxlength="2000">${escapeHtml(report.reply)}</textarea></label>`,'Speichern'):''}</article>`).join(''):'<div class="portal-card"><p>Noch keine Reports.</p></div>';}
export function validateReport(form){
 const report={kind:form.get('kind'),title:String(form.get('title')||'').trim(),description:String(form.get('description')||'').trim(),mod_version:String(form.get('mod_version')||'').trim()};
 if(!['bug','feedback'].includes(report.kind)||report.title.length<5||report.title.length>120||report.description.length<20||report.description.length>6000||report.mod_version.length>40)return null;
 return report;
}
async function readBody(request){
 if(!/^application\/x-www-form-urlencoded(?:;|$)/i.test(request.headers.get('Content-Type')||''))throw new Error('body');
 const reader=request.body?.getReader();if(!reader)return new URLSearchParams();let length=0,chunks=[];
 for(;;){const{value,done}=await reader.read();if(done)break;length+=value.length;if(length>16000){await reader.cancel();throw new Error('body');}chunks.push(value);}
 return new URLSearchParams(Buffer.concat(chunks).toString('utf8'));
}
export function createPortalRoutes({getConfig=portalConfig,makeClient=createPortalClient,fetcher=fetch,clock=Date.now}={}){
 const attempts=new Map();
 return async request=>{
  const url=new URL(request.url),path=url.pathname;if(!routes.has(path))return null;
  const english=getLanguage(request)==='en',config=getConfig();let cookies=[];
  const finish=response=>{for(const[key,value]of Object.entries(baseHeaders))response.headers.set(key,value);for(const cookie of cookies)response.headers.append('Set-Cookie',serializeCookieHeader(cookie.name,cookie.value,{...cookie.options,httpOnly:true,secure:true,sameSite:'lax',path:'/',domain:undefined}));return response;};
  const page=(title,body,status=200)=>finish(new Response(documentPage(title,body,english),{status,headers:{'Content-Type':'text/html; charset=utf-8'}}));
  const redirect=path=>finish(new Response(null,{status:303,headers:{Location:path}}));
  const error=(message,status=400)=>page(english?'Please try again':'Bitte erneut versuchen',`<section class="portal-card"><p role="alert">${escapeHtml(message)}</p><a href="/account">${english?'Back to account':'Zurück zum Konto'}</a></section>`,status);
  if(!['GET','HEAD','POST'].includes(request.method))return finish(new Response(null,{status:405,headers:{Allow:'GET, HEAD, POST'}}));
  const mutation=request.method==='POST';
  if(mutation && request.headers.get('Origin')!==url.origin)return error('Anfrage von einer anderen Website blockiert.',403);
  const actionPath=path.startsWith('/auth/')&&path!=='/auth/callback'||['/portal/report','/portal/moderate','/portal/profile'].includes(path);
  if(actionPath&&!mutation)return error('Bitte das Formular verwenden.',405);
  if(!actionPath&&mutation)return error('Methode nicht erlaubt.',405);
  if(!config){
   if(path==='/portal/me')return finish(Response.json({signedIn:false}));
   if(path==='/portal/skin')return finish(new Response(null,{status:404}));
   if(mutation||path==='/auth/callback')return error('Der Kontodienst ist noch nicht eingerichtet. Es wurde nichts gespeichert.',503);
   return page(path==='/270211'?'Admin':path==='/feedback'?'Feedback':english?'Account':'Konto',login(null,english),503);
  }
  const client=makeClient(request,config,updates=>{cookies.push(...updates);});
  try{
   let input;
   if(mutation){
    input=await readBody(request);
    // Best-effort instance limits; Supabase enforces auth limits and SQL enforces durable report limits.
    const address=request.headers.get('x-vercel-forwarded-for')||'unknown',key=address+path,now=clock();
    for(const[k,v]of attempts)if(v.until<=now)attempts.delete(k);
    const hit=attempts.get(key)||{count:0,until:now+600000};
    if(hit.count>=30)return error('Zu viele Anfragen. Bitte später erneut versuchen.',429);
    hit.count++;if(attempts.size<5000||attempts.has(key))attempts.set(key,hit);
   }
   if(path==='/auth/provider'){
    const provider=input.get('provider');if(!config.providers.includes(provider)||provider==='email')return error('Diese Anmeldung ist noch nicht aktiviert.');
    const{data,error:failure}=await client.auth.signInWithOAuth({provider,options:{redirectTo:config.origin+'/auth/callback',scopes:provider==='azure'?'email':undefined,skipBrowserRedirect:true}});
    if(failure||!data?.url)return error('Anmeldung konnte nicht gestartet werden.',503);
    const destination=new URL(data.url);if(destination.origin!==config.url)return error('Ungültige Anmelde-Adresse.',503);
    return page('Anmeldung fortsetzen',`<section class="portal-card"><p>Du wirst beim ausgewählten Anbieter angemeldet.</p><a class="portal-oauth-continue" href="${escapeHtml(destination.href)}">Weiter zur sicheren Anmeldung ↗</a></section>`);
   }
   if(path==='/auth/callback'){
    const code=url.searchParams.get('code');if(!code||code.length>4096)return error('Der Anmeldelink ist ungültig oder abgelaufen.');
    const{error:failure}=await client.auth.exchangeCodeForSession(code);return failure?error('Anmeldung fehlgeschlagen. Bitte erneut starten.'):redirect('/account');
   }
   if(path==='/auth/email'){
    if(!config.providers.includes('email'))return error('E-Mail-Anmeldung ist noch nicht aktiviert.');
    const email=String(input.get('email')||'').trim();if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)||email.length>254)return error('Bitte eine gültige E-Mail eingeben.');
    await client.auth.signInWithOtp({email,options:{shouldCreateUser:true}});
    return page('E-Mail bestätigen',`<section class="portal-card"><p>Wenn der Versand möglich ist, erhältst du einen einmaligen Code. Prüfe auch deinen Spam-Ordner.</p>${form('/auth/verify',`<input type="hidden" name="email" value="${escapeHtml(email)}">${field('Code aus der E-Mail','token','text','inputmode="numeric" pattern="[0-9]{6,8}" autocomplete="one-time-code" maxlength="8"')}`,'Anmelden')}</section>`);
   }
   if(path==='/auth/verify'){
    const token=String(input.get('token')||''),email=String(input.get('email')||'');if(!/^\d{6,8}$/.test(token)||email.length>254)return error('Ungültiger Code.');
    const{error:failure}=await client.auth.verifyOtp({email,token,type:'email'});return failure?error('Der Code ist ungültig oder abgelaufen.'):redirect('/account');
   }
   if(path==='/auth/logout'){const{error:failure}=await client.auth.signOut({scope:'local'});return failure?error('Abmelden fehlgeschlagen. Bitte erneut versuchen.',503):redirect('/account');}
   // getUser validates against the Auth server. Cookie contents and user_metadata never authorize access.
   const{data:{user}={},error:authError}=await client.auth.getUser();
   if(authError||!user){
    if(path==='/portal/me')return finish(Response.json({signedIn:false}));
    if(path==='/portal/skin')return finish(new Response(null,{status:401}));
    return mutation?error('Bitte zuerst anmelden.',401):page(path==='/270211'?'Admin':path==='/feedback'?'Feedback':'Konto',login(config,english),path==='/270211'?401:200);
   }
   const verified=Boolean(user.email_confirmed_at);
   if(!verified)return error('Bitte zuerst deine E-Mail bestätigen.',403);
   const{data:profile}=await client.from('portal_profiles').select('minecraft_name,minecraft_uuid').maybeSingle();
   if(path==='/portal/me')return finish(Response.json({signedIn:true,displayName:profile?.minecraft_name||'Spieler',hasSkin:Boolean(profile?.minecraft_uuid)}));
   if(path==='/portal/skin'){
    const uuid=profile?.minecraft_uuid;if(!/^[a-f0-9]{32}$/.test(uuid||''))return finish(new Response(null,{status:404}));
    const details=await fetcher(`https://sessionserver.mojang.com/session/minecraft/profile/${uuid}`,{signal:AbortSignal.timeout(5000)});if(!details.ok)return finish(new Response(null,{status:404}));
    const properties=(await details.json()).properties;const encoded=properties?.find(item=>item.name==='textures')?.value;if(!encoded||encoded.length>20000)return finish(new Response(null,{status:404}));
    const skin=JSON.parse(Buffer.from(encoded,'base64').toString('utf8')).textures?.SKIN?.url;
    const target=new URL(skin);if(!['http:','https:'].includes(target.protocol)||target.hostname!=='textures.minecraft.net'||!/^\/texture\/[a-f0-9]+$/.test(target.pathname))return finish(new Response(null,{status:404}));
    target.protocol='https:';const response=await fetcher(target.href,{signal:AbortSignal.timeout(5000),redirect:'error'});
    if(!response.ok)return finish(new Response(null,{status:404}));
    const reader=response.body.getReader();let size=0,chunks=[];
    for(;;){const{value,done}=await reader.read();if(done)break;size+=value.length;if(size>262144){await reader.cancel();return finish(new Response(null,{status:404}));}chunks.push(value);}
    const bytes=Buffer.concat(chunks);if(bytes.subarray(0,8).toString('hex')!=='89504e470d0a1a0a')return finish(new Response(null,{status:404}));
    return finish(new Response(bytes,{headers:{'Content-Type':'image/png'}}));
   }
   if(path==='/portal/profile'){
    const name=String(input.get('minecraft_name')||'').trim();if(!/^[A-Za-z0-9_]{3,16}$/.test(name))return error('Minecraft-Name: 3–16 Buchstaben, Zahlen oder Unterstriche.');
    const response=await fetcher(`https://api.mojang.com/users/profiles/minecraft/${encodeURIComponent(name)}`,{signal:AbortSignal.timeout(5000)});
    if(!response.ok)return error('Minecraft-Profil wurde nicht gefunden.');
    const minecraft=await response.json();if(!/^[a-f0-9]{32}$/.test(minecraft.id)||!/^\w{3,16}$/.test(minecraft.name))return error('Ungültiges Minecraft-Profil.');
    const query=client.from('portal_profiles'),values={minecraft_name:minecraft.name,minecraft_uuid:minecraft.id};
    const{error:failure}=profile?await query.update(values).eq('user_id',user.id):await query.insert(values);
    return failure?error('Skin konnte nicht gespeichert werden.',503):redirect('/account');
   }
   const{data:owner,error:ownerError}=await client.rpc('portal_is_owner');
   if(ownerError)return error('Das Portal wird noch eingerichtet. Bitte später erneut versuchen.',503);
   if(path==='/auth/mfa/enroll'){
    if(!owner)return error('Kein Adminzugang.',403);
    const factors=await client.auth.mfa.listFactors();if(factors.error)return error('Authenticator konnte nicht geladen werden.',503);
    if(factors.data.totp.some(f=>f.status==='verified'))return redirect('/270211');
    for(const factor of factors.data.all.filter(f=>f.status==='unverified'))await client.auth.mfa.unenroll({factorId:factor.id});
    const{data,error:failure}=await client.auth.mfa.enroll({factorType:'totp',friendlyName:'Aplejouice Admin'});
    if(failure)return error('Authenticator konnte nicht eingerichtet werden.',503);
    return page('Authenticator einrichten',`<section class="portal-card"><p>Scanne diesen QR-Code mit deiner Authenticator-App. Bewahre den Einrichtungsschlüssel sicher auf.</p><img class="mfa-qr" src="${escapeHtml(data.totp.qr_code)}" alt="Authenticator QR-Code"><code class="mfa-secret">${escapeHtml(data.totp.secret)}</code>${form('/auth/mfa/verify',`<input type="hidden" name="factor" value="${escapeHtml(data.id)}">${field('Sechsstelliger Code','code','text','inputmode="numeric" pattern="[0-9]{6}" maxlength="6" autocomplete="one-time-code"')}`,'Bestätigen')}</section>`);
   }
   if(path==='/auth/mfa/verify'){
    if(!owner)return error('Kein Adminzugang.',403);
    const code=String(input.get('code')||''),factorId=String(input.get('factor')||'');if(!/^\d{6}$/.test(code)||!/^[a-f0-9-]{36}$/.test(factorId))return error('Ungültiger Code.');
    const{error:failure}=await client.auth.mfa.challengeAndVerify({factorId,code});return failure?error('Authenticator-Code ungültig.'):redirect('/270211');
   }
   if(path==='/portal/report'){
    const report=validateReport(input);if(!report)return error('Titel: 5–120 Zeichen. Beschreibung: 20–6000 Zeichen.');
    const{error:failure}=await client.from('portal_reports').insert(report);
    return failure?error('Report konnte nicht gespeichert werden. Maximal fünf Reports pro Stunde; bitte später versuchen.',429):redirect('/feedback?sent=1');
   }
   if(path==='/270211'||path==='/portal/moderate'){
    if(!owner)return error('Dieser Bereich ist nur für den Administrator.',403);
    const{data:admin,error:adminError}=await client.rpc('portal_is_admin');if(adminError)return error('Adminprüfung derzeit nicht möglich.',503);
    if(!admin){
     if(mutation)return error('Bitte zuerst den Authenticator bestätigen.',403);
     const{data:factors,error:factorError}=await client.auth.mfa.listFactors();if(factorError)return error('Authenticator derzeit nicht erreichbar.',503);
     const factor=factors.totp.find(f=>f.status==='verified');
     return page('Admin · Sicherheitsprüfung',`<section class="portal-card"><p>Für Reports ist eine zusätzliche Authenticator-Bestätigung erforderlich.</p>${factor?form('/auth/mfa/verify',`<input type="hidden" name="factor" value="${escapeHtml(factor.id)}">${field('Authenticator-Code','code','text','inputmode="numeric" pattern="[0-9]{6}" maxlength="6" autocomplete="one-time-code"')}`,'Adminbereich öffnen'):form('/auth/mfa/enroll','','Authenticator einrichten')}</section>`);
    }
    if(path==='/portal/moderate'){
     const id=String(input.get('id')||''),status=String(input.get('status')||''),reply=String(input.get('reply')||'').trim();
     if(!/^[a-f0-9-]{36}$/.test(id)||!Object.hasOwn(statusNames,status)||reply.length>2000)return error('Ungültige Report-Änderung.');
     const{data,error:failure}=await client.from('portal_reports').update({status,reply}).eq('id',id).select('id');
     return failure||!data?.length?error('Änderung konnte nicht gespeichert werden.',503):redirect('/270211');
    }
    const pageIndex=Math.min(10000,Math.max(0,Number.parseInt(url.searchParams.get('page')||'0',10)||0));
    const{data:reports,error:failure}=await client.from('portal_reports').select('*').order('created_at',{ascending:false}).range(pageIndex*25,pageIndex*25+24);
    if(failure)return error('Reports konnten nicht geladen werden.',503);
    return page('Report-Zentrale',`<p>Nur dein verifiziertes Discord-Konto mit Authenticator erhält Zugriff.</p><div class="report-feed">${reportCards(reports,true)}</div><nav class="portal-pagination">${pageIndex?`<a href="/270211?page=${pageIndex-1}">← Zurück</a>`:''}${reports.length===25?`<a href="/270211?page=${pageIndex+1}">Weitere Reports →</a>`:''}</nav>`);
   }
   if(path==='/feedback'){
    const{data:reports,error:failure}=await client.from('portal_reports').select('*').eq('user_id',user.id).order('created_at',{ascending:false}).limit(50);
    if(failure)return error('Reports konnten nicht geladen werden.',503);
    return page('Feedback & Bugs',`${url.searchParams.get('sent')==='1'?'<p class="portal-success" role="status">Dein Report wurde gespeichert.</p>':''}<section class="portal-card"><h2>Was können wir verbessern?</h2><p>Keine Passwörter, Tokens oder privaten Serverdaten eintragen. Maximal fünf Reports pro Stunde.</p>${form('/portal/report',`<label>Art<select name="kind"><option value="bug">Bug</option><option value="feedback">Feedback</option></select></label>${field('Titel','title','text','minlength="5" maxlength="120"') }<label>Beschreibung<textarea name="description" required minlength="20" maxlength="6000" rows="6" placeholder="Was ist passiert? Wie lässt sich das nachstellen?"></textarea></label><label>Mod-Version (optional)<input name="mod_version" maxlength="40" placeholder="z. B. 1.7.1"></label>`,'Report senden')}</section><h2>Deine Reports</h2>${reportCards(reports)}`);
   }
   return page(english?'Your account':'Dein Konto',`<section class="portal-card"><span class="portal-success">Angemeldet</span><h2>${escapeHtml(user.email)}</h2><p>Deine Reports sind für andere Spieler nicht sichtbar.</p><div class="portal-actions"><a href="/feedback">Feedback & Bugs →</a>${owner?'<a href="/270211">Adminbereich →</a>':''}</div>${form('/auth/logout','','Abmelden')}</section><section class="portal-card"><h2>Dein Skin in der Demo</h2><p>Wähle deinen Minecraft-Namen für die Skin-Vorschau. Das ist keine Verifizierung des Minecraft-Besitzes. Microsoft-Anmeldung allein bestätigt ebenfalls keine Minecraft-Lizenz.</p>${form('/portal/profile',field('Minecraft-Name','minecraft_name','text',`pattern="[A-Za-z0-9_]{3,16}" maxlength="16" value="${escapeHtml(profile?.minecraft_name||'')}"`),'Skin verwenden')}</section>`);
  }catch(failure){return failure.message==='body'?error('Ungültige oder zu große Anfrage.',413):error('Der Dienst ist gerade nicht erreichbar. Bitte später erneut versuchen.',503);}
 };
}
