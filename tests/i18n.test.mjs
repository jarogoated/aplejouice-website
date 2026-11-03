import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {randomBytes,scryptSync} from 'node:crypto';
import {getLanguage,languageResponse,localizeHtml} from '../lib/i18n.mjs';
import {createGate} from '../lib/access.mjs';
import {createReleaseRoutes} from '../lib/releases.mjs';
const request=(path='/',cookie='')=>new Request(`https://aplejouice.com${path}`,{headers:{Cookie:cookie}});
const english='__Host-aple_lang=en';

test('language preference is persistent, host-only, safe and available without authentication',()=>{
  const response=languageResponse(request('/_language?lang=en&returnTo=%2Fdownloads'));
  assert.equal(response.status,303);assert.equal(response.headers.get('Location'),'/downloads');
  const cookie=response.headers.get('Set-Cookie');
  for(const attribute of ['Secure','HttpOnly','SameSite=Lax','Path=/','Max-Age=31536000']) assert.ok(cookie.includes(attribute));
  assert.equal(getLanguage(request('/',english)),'en');assert.equal(getLanguage(request('/','__Host-aple_lang=invalid')),'de');
  assert.equal(languageResponse(request('/_language?lang=en&returnTo=https://example.com')).headers.get('Location'),'/');
  assert.equal(languageResponse(request('/_language?lang=invalid')).status,400);
});
test('translation preserves structure, actions, dynamic counters and script contents',()=>{
  const source='<html lang="de"><header></header><h1>Dein Spiel.</h1><button id="reset">Runde zurücksetzen</button><span id="round">01</span><script>const label="Dein Spiel.";</script>';
  const translated=localizeHtml(source,'en','/');
  assert.match(translated,/<html lang="en"/);assert.match(translated,/Your game/);
  assert.match(translated,/<button id="reset">Reset round/);assert.match(translated,/id="round">01/);
  assert.match(translated,/const label="Dein Spiel\."/);
  assert.equal((localizeHtml(translated,'en','/').match(/language-switch:start/g)||[]).length,1);
});
test('English selection never bypasses authentication and rewrites only authenticated feature pages',async()=>{
  const salt=randomBytes(16).toString('hex'),passcode='local-test-only';
  const config=JSON.stringify({salt,hash:scryptSync(passcode,salt,32).toString('hex'),key:randomBytes(32).toString('hex')});
  let destination;
  const gate=createGate({next:()=>new Response('private'),getConfig:()=>config,rewrite:url=>{destination=url.pathname;return new Response('rewritten');}});
  const locked=await gate(request('/',english));assert.equal(locked.status,401);assert.match(await locked.text(),/Your game/);assert.equal(destination,undefined);
  assert.equal((await gate(request('/index.en.html',english))).status,401);
  const login=await gate(new Request('https://aplejouice.com/_access/login',{method:'POST',headers:{Origin:'https://aplejouice.com','Content-Type':'application/x-www-form-urlencoded',Cookie:english},body:new URLSearchParams({passcode})}));
  const session=login.headers.get('Set-Cookie').split(';')[0];
  const unlocked=await gate(request('/',`${english}; ${session}`));
  assert.equal(destination,'/index.en.html');assert.equal(unlocked.headers.get('Content-Language'),'en');
});
test('download copy switches language while machine-readable update metadata is unchanged',async()=>{
  const releases=createReleaseRoutes({fetcher:async()=>Response.json([])});
  const en=await releases(request('/downloads',english));
  assert.equal(en.headers.get('Content-Language'),'en');assert.match(await en.text(),/The next version is coming soon/);
  const de=await releases(request('/api/mod/latest'));
  const same=await releases(request('/api/mod/latest',english));assert.deepEqual(await de.json(),await same.json());
});
test('built English feature page includes translated FAQ, controls and accessible image text',async()=>{
  const page=await readFile(new URL('../dist/index.en.html',import.meta.url),'utf8');
  for(const text of ['Which Minecraft versions are supported?','Reset round','Select or attack','aria-label="Main navigation"','lang="en"']) assert.ok(page.includes(text),text);
  assert.ok(!page.includes('Welche Minecraft-Versionen werden unterstützt?'));
});
