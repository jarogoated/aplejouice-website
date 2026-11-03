import test from 'node:test';
import assert from 'node:assert/strict';
import {createPortalRoutes,portalConfig,validateReport} from '../lib/portal.mjs';
const config={url:'https://example.supabase.co',key:'public-key-only',origin:'https://aplejouice.com',providers:['discord','email']};
const request=(path,form,origin='https://aplejouice.com')=>new Request('https://aplejouice.com'+path,form?{method:'POST',headers:{Origin:origin,'Content-Type':'application/x-www-form-urlencoded'},body:new URLSearchParams(form)}:{});
const user={id:'11111111-1111-1111-1111-111111111111',email:'test@example.com',email_confirmed_at:'2026-01-01',user_metadata:{role:'admin',provider_id:'928019899211743305'}};
function client({signedIn=true,owner=false,admin=false,reports=[]}={}){
 const calls=[];const query={select(){return this;},eq(){return this;},order(){return this;},range(){return Promise.resolve({data:reports});},limit(){return Promise.resolve({data:reports});},maybeSingle(){return Promise.resolve({data:null});},insert(value){calls.push(value);return Promise.resolve({data:null,error:null});}};
 return{calls,auth:{getUser:async()=>({data:{user:signedIn?user:null}}),mfa:{listFactors:async()=>({data:{totp:[],all:[]}})}},from:()=>query,rpc:async name=>({data:name==='portal_is_owner'?owner:admin})};
}
test('unconfigured accounts fail closed and do not save reports',async()=>{
 let touched=false;const handle=createPortalRoutes({getConfig:()=>null,makeClient:()=>{touched=true;}});
 const response=await handle(request('/270211'));assert.equal(response.status,503);assert.match(await response.text(),/noch nicht verfügbar/);assert.equal(touched,false);
 assert.equal((await handle(request('/portal/report',{title:'anything'}))).status,503);
 assert.deepEqual(await(await handle(request('/portal/me'))).json(),{signedIn:false});
 assert.equal(await handle(request('/not-portal')),null);
});
test('cross-origin requests, unsupported methods and GET mutations are rejected before auth',async()=>{
 const handle=createPortalRoutes({getConfig:()=>config,makeClient:()=>{throw new Error('must not run');}});
 assert.equal((await handle(request('/portal/moderate',{id:'x'},'https://evil.example'))).status,403);
 assert.equal((await handle(request('/auth/provider'))).status,405);
 assert.equal((await handle(new Request('https://aplejouice.com/account',{method:'DELETE'}))).status,405);
});
test('forged admin metadata never authorizes admin reads or writes',async()=>{
 const fake=client();const handle=createPortalRoutes({getConfig:()=>config,makeClient:()=>fake});
 assert.equal((await handle(request('/270211'))).status,403);
 assert.equal((await handle(request('/portal/moderate',{id:'anything',status:'resolved'}))).status,403);
 assert.equal(fake.calls.length,0);
});
test('verified owner still needs MFA before accessing reports',async()=>{
 const handle=createPortalRoutes({getConfig:()=>config,makeClient:()=>client({owner:true})});
 const response=await handle(request('/270211'));assert.equal(response.status,200);assert.match(await response.text(),/Authenticator einrichten/);
 assert.equal((await handle(request('/portal/moderate',{id:'anything',status:'resolved'}))).status,403);
});
test('admin reports escape HTML and no user session may be cached',async()=>{
 const fake=client({owner:true,admin:true,reports:[{id:'11111111-abcd-abcd-abcd-111111111111',title:'<script>alert(1)</script>',description:'<img src=x onerror=alert(1)>',kind:'bug',status:'open',mod_version:'1.7.1',reply:'',created_at:'2026-01-01'}]});
 const handle=createPortalRoutes({getConfig:()=>config,makeClient:()=>fake});const response=await handle(request('/270211'));const html=await response.text();
 assert.equal(response.status,200);assert.match(html,/&lt;script&gt;/);assert.doesNotMatch(html,/<script>/);assert.match(response.headers.get('Cache-Control'),/private, no-store/);assert.match(response.headers.get('Content-Security-Policy'),/frame-ancestors 'none'/);
});
test('report ownership and status cannot be supplied by the requester',async()=>{
 const fake=client();const handle=createPortalRoutes({getConfig:()=>config,makeClient:()=>fake});
 const response=await handle(request('/portal/report',{title:'A valid report',description:'A reproducible problem description.',kind:'bug',user_id:'another-user',status:'resolved',reply:'injected'}));
 assert.equal(response.status,303);assert.equal(fake.calls.length,1);assert.deepEqual(Object.keys(fake.calls[0]).sort(),['description','kind','mod_version','title']);
 assert.equal(validateReport(new URLSearchParams({title:'small',description:'short',kind:'bug'})),null);
});
test('sessions are serialized as secure HttpOnly cookies with no client-readable tokens',async()=>{
 const fake=client();const handle=createPortalRoutes({getConfig:()=>config,makeClient:(req,conf,set)=>{set([{name:'__Host-aple_account',value:'test',options:{maxAge:100}}]);return fake;}});
 const response=await handle(request('/account'));const cookie=response.headers.get('Set-Cookie');
 for(const value of ['HttpOnly','Secure','SameSite=Lax','Path=/'])assert.ok(cookie.includes(value));assert.doesNotMatch(cookie,/Domain=/);
});
test('only a public Supabase key is accepted; service-role and untrusted endpoints fail closed',()=>{
 const anon='x.'+Buffer.from(JSON.stringify({role:'anon'})).toString('base64url')+'.x';
 assert.ok(portalConfig({SUPABASE_URL:config.url,SUPABASE_PUBLISHABLE_KEY:anon}));
 const service='x.'+Buffer.from(JSON.stringify({role:'service_role'})).toString('base64url')+'.x';
 assert.equal(portalConfig({SUPABASE_URL:config.url,SUPABASE_PUBLISHABLE_KEY:service}),null);
 assert.equal(portalConfig({SUPABASE_URL:'https://example.com',SUPABASE_PUBLISHABLE_KEY:anon}),null);
});
test('real SDK OAuth start uses PKCE and server-only cookies',async()=>{
 const handle=createPortalRoutes({getConfig:()=>config});
 const response=await handle(request('/auth/provider',{provider:'discord'}));
 assert.equal(response.status,200);
 const body=await response.text();
 assert.match(body,/code_challenge_method=s256/);
 assert.match(body,/code_challenge=/);
 assert.match(response.headers.get('Set-Cookie'),/code-verifier/);
 assert.match(response.headers.get('Set-Cookie'),/HttpOnly/);
});
