import test from 'node:test';
import assert from 'node:assert/strict';
import {deflateSync} from 'node:zlib';
import {decodeAvatar,pngCrc,validateProfile,discordAvatarUrl,displayName} from '../lib/profile.mjs';
export function avatarFixture({width=128,height=128,type=6,extra=false}={}){
 const chunk=(name,data)=>{const tag=Buffer.from(name),length=Buffer.alloc(4),crc=Buffer.alloc(4);length.writeUInt32BE(data.length);crc.writeUInt32BE(pngCrc(Buffer.concat([tag,data])));return Buffer.concat([length,tag,data,crc]);};
 const ihdr=Buffer.alloc(13);ihdr.writeUInt32BE(width);ihdr.writeUInt32BE(height,4);ihdr[8]=8;ihdr[9]=type;
 const raw=Buffer.alloc((128*4+1)*128);
 const bytes=Buffer.concat([Buffer.from('89504e470d0a1a0a','hex'),chunk('IHDR',ihdr),...(extra?[chunk('tEXt',Buffer.from('<script>'))]:[]),chunk('IDAT',deflateSync(raw)),chunk('IEND',Buffer.alloc(0))]);
 return 'data:image/png;base64,'+bytes.toString('base64');
}
test('profile names are validated and never become permission fields',()=>{
 const values=validateProfile(new URLSearchParams({username:'Player_12',bio:'About me',avatar_source:'initials',role:'admin',user_id:'someone'}));
 assert.deepEqual(values,{username:'Player_12',bio:'About me',avatar_source:'initials'});
 for(const username of ['Admin','ab','<img>','white space','a'.repeat(21)])assert.equal(validateProfile(new URLSearchParams({username})),null);
 assert.equal(displayName(null,{user_metadata:{global_name:{role:'admin'}}}),'Spieler');
});
test('avatars accept a bounded decoded PNG, reject SVG, metadata and oversized dimensions',()=>{
 assert.ok(decodeAvatar(avatarFixture()));
 assert.equal(decodeAvatar(avatarFixture({width:99999})),null);
 assert.equal(decodeAvatar(avatarFixture({extra:true})),null);
 assert.equal(decodeAvatar('data:image/svg+xml;base64,'+Buffer.from('<svg/>').toString('base64')),null);
 const corrupted=Buffer.from(avatarFixture().slice(22),'base64');corrupted[20]^=1;
 assert.equal(decodeAvatar('data:image/png;base64,'+corrupted.toString('base64')),null);
});
test('Discord avatar proxy accepts only the canonical public CDN path',()=>{
 const user=url=>({user_metadata:{avatar_url:url}});
 const avatar='https://cdn.discordapp.com/avatars/928019899211743305/0123456789abcdef0123456789abcdef.png';
 assert.equal(discordAvatarUrl(user(avatar)),avatar+'?size=128');
 for(const url of ['http://127.0.0.1/private','https://cdn.discordapp.com.evil.example/avatars/x','https://cdn.discordapp.com/attachments/private','https://cdn.discordapp.com@evil.example/avatars/x'])assert.equal(discordAvatarUrl(user(url)),null);
});
