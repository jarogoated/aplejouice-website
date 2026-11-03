import test from 'node:test';
import assert from 'node:assert/strict';
import { selectRelease, createReleaseRoutes } from '../lib/releases.mjs';
import { createGate } from '../lib/access.mjs';

const fixture=(version='1.7.0',extra={}) => ({tag_name:`v${version}`,draft:false,prerelease:false,published_at:'2026-11-03T12:00:00Z',
  assets:[{name:`Aplejouice-Mod-${version}-mc1.21.11.jar`,state:'uploaded',size:12345,digest:`sha256:${'a'.repeat(64)}`,
    browser_download_url:`https://github.com/jarogoated/aplejouice-mod/releases/download/v${version}/Aplejouice-Mod-${version}-mc1.21.11.jar`}],...extra});
const req=(path,method='GET') => new Request(`https://aplejouice.com${path}`,{method});
const route=options => createReleaseRoutes({fetcher:async()=>Response.json([fixture()]),...options});

test('chooses highest stable compatible version with an uploaded matching JAR',()=>{
  const selected=selectRelease([fixture('1.9.0'),fixture('1.10.0'),fixture('2.0.0',{draft:true}),fixture('3.0.0',{prerelease:true}),fixture('4.0.0',{assets:[]})]);
  assert.equal(selected.version,'1.10.0');assert.equal(selected.minecraft,'1.21.11');assert.equal(selected.sha256,'a'.repeat(64));
});
test('does not redirect downloads to foreign URLs or offer mismatched versions',()=>{
  const release=fixture();release.assets[0].browser_download_url='https://example.com/file.jar';assert.equal(selectRelease([release]),null);
  const wrong=fixture();wrong.assets[0].name='Aplejouice-Mod-1.7.0-mc1.22.0.jar';assert.equal(selectRelease([wrong]),null);
  assert.equal(selectRelease(null),null);
});
test('exact public routes work without opening private pages or the release administration',async()=>{
  const gate=createGate({next:()=>new Response('PRIVATE'),getConfig:()=>'',releases:route()});
  assert.equal((await gate(req('/downloads'))).status,200);
  assert.equal((await gate(req('/api/mod/latest?minecraft=1.21.11'))).status,200);
  for(const path of ['/','/release-admin','/app.js','/assets/menu.png','/downloads/private','/api/mod/latest/private'])
    assert.equal((await gate(req(path))).status,503);
});
test('JSON metadata, HEAD, compatibility errors and read-only methods',async()=>{
  const handler=route();const response=await handler(req('/api/mod/latest?minecraft=1.21.11'));
  assert.match(response.headers.get('Content-Type'),/application\/json/);
  assert.equal((await response.json()).downloadUrl,'https://aplejouice.com/downloads');
  assert.equal((await handler(req('/api/mod/latest?minecraft=1.22.0'))).status,404);
  assert.equal(await (await handler(req('/downloads','HEAD'))).text(),'');
  assert.equal((await handler(req('/downloads','POST'))).status,405);
});
test('caches upstream results and refreshes after five minutes',async()=>{
  let now=0,calls=0;const handler=route({clock:()=>now,fetcher:async()=>{calls++;return Response.json([fixture()]);}});
  await Promise.all([handler(req('/downloads')),handler(req('/api/mod/latest'))]);assert.equal(calls,1);
  now=300001;await handler(req('/downloads'));assert.equal(calls,2);
});
test('unavailable upstream yields no invented version and a usable download fallback',async()=>{
  const handler=route({fetcher:async()=>{throw new Error('offline');}});
  assert.equal((await handler(req('/api/mod/latest'))).status,503);
  const page=await handler(req('/downloads'));assert.equal(page.status,200);assert.match(await page.text(),/Zu den Releases/);
});
