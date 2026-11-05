import test from 'node:test';
import assert from 'node:assert/strict';
import {createGate} from '../lib/access.mjs';
const request=path=>new Request('https://example.com'+path);
test('presentation and assets are public without a config or passcode',async()=>{
 const gate=createGate({next:()=>new Response('public'),portal:async()=>null,releases:async()=>null});
 for(const path of ['/','/index.html','/app.js','/assets/menu.png'])assert.equal(await (await gate(request(path))).text(),'public');
});
test('account and admin authorization responses take precedence',async()=>{
 const gate=createGate({next:()=>new Response('public'),portal:async req=>new URL(req.url).pathname==='/270211'?new Response('sign in',{status:401}):null,releases:async()=>null});
 assert.equal((await gate(request('/270211'))).status,401);
});
test('old passcode endpoints expire the obsolete cookie',async()=>{
 const gate=createGate({next:()=>new Response('public'),portal:async()=>null,releases:async()=>null});
 const response=await gate(request('/_access/login'));assert.equal(response.status,303);assert.equal(response.headers.get('Location'),'/');assert.match(response.headers.get('Set-Cookie'),/Max-Age=0/);
});
