import {createPortalRoutes} from './portal.mjs';
import {createReleaseRoutes,releaseAdminPage} from './releases.mjs';
import {getLanguage,languageResponse,localizeResponse} from './i18n.mjs';

// Public presentation; accounts and reports enforce their own authentication.
export function createGate({next,rewrite=()=>next(),releases=createReleaseRoutes(),portal=createPortalRoutes()}) {
 return async request=>{
  const url=new URL(request.url);
  const preference=languageResponse(request);if(preference)return preference;
  const language=getLanguage(request);
  const account=await portal(request);if(account)return account;
  const release=await releases(request);if(release)return release;
  if(url.pathname.startsWith('/_access/'))return new Response(null,{status:303,headers:{Location:'/', 'Set-Cookie':'__Host-aple_access=; Path=/; Max-Age=0; Secure; HttpOnly; SameSite=Strict','Cache-Control':'no-store'}});
  if(url.pathname==='/release-admin')return localizeResponse(releaseAdminPage(),language,'/release-admin');
  const document={'/impressum':'/impressum.html','/datenschutz':'/datenschutz.html'}[url.pathname];
  const response=document&&['GET','HEAD'].includes(request.method)?rewrite(new URL(document,request.url)):
   language==='en'&&['/','/index.html'].includes(url.pathname)?rewrite(new URL('/index.en.html',request.url)):next();
  response.headers.set('Content-Language',language);
  response.headers.set('X-Content-Type-Options','nosniff');
  response.headers.set('Referrer-Policy','same-origin');
  response.headers.set('Cache-Control','private, no-store');
  response.headers.set('Vary','Cookie');
  return response;
 };
}
