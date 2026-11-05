import test from 'node:test';
import assert from 'node:assert/strict';
import {communityPage} from '../lib/community.mjs';
import {createGate} from '../lib/access.mjs';
import {validateApplication} from '../lib/applications.mjs';
test('hub and clan route to their own bilingual pages',async()=>{
 let target;const gate=createGate({portal:async()=>null,releases:async()=>null,next:()=>new Response('static'),rewrite:url=>{target=url.pathname;return new Response('page');}});
 for(const[path,file]of [['/','/hub.html'],['/mod','/index.html'],['/clan','/clan.html'],['/clan/teams','/clan-teams.html']]){await gate(new Request('https://aplejouice.com'+path));assert.equal(target,file);}
 await gate(new Request('https://aplejouice.com/clan',{headers:{Cookie:'__Host-aple_lang=en'}}));assert.equal(target,'/clan.en.html');
});
test('clan uses supplied roster only and confines head images to local assets',()=>{
 const html=communityPage('clan',false,[{name:'RealPlayer',rank:'Leader',head:'https://attacker.invalid/image.png'},{name:'<img>',rank:'Admin'}]);
 assert.match(html,/RealPlayer/);assert.doesNotMatch(html,/attacker.invalid|<img>/);assert.match(html,/assets\/players.png/);
 assert.match(communityPage('teams',true),/Coming soon/);
 assert.match(communityPage('home'),/href="\/mod"/);
});
test('application rejects extra roles, absent fairplay and invalid names',()=>{
 const valid={minecraft:'RealPlayer',playstyle:'allround',experience:'A detailed experience longer than twenty characters.',motivation:'A detailed motivation longer than twenty characters.',fairplay:'yes',role:'admin'};
 const result=validateApplication(new URLSearchParams(valid));assert.ok(result);assert.equal(result.role,undefined);
 for(const patch of [{minecraft:'bad name'},{playstyle:'admin'},{fairplay:''},{motivation:'tiny'}])assert.equal(validateApplication(new URLSearchParams({...valid,...patch})),null);
});
