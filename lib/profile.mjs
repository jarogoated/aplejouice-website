import {inflateSync} from 'node:zlib';

export const AVATAR_SOURCES=['discord','minecraft','initials','upload'];
const reserved=new Set(['admin','administrator','support','moderator','system','aplejouice']);
export function validateProfile(form){
 const username=String(form.get('username')||'').trim();
 const bio=String(form.get('bio')||'').trim();
 const avatar_source=String(form.get('avatar_source')||'discord');
 if(!/^[A-Za-z0-9_]{3,20}$/.test(username)||reserved.has(username.toLowerCase())||bio.length>180||!AVATAR_SOURCES.includes(avatar_source))return null;
 return {username,bio,avatar_source};
}
export function displayName(profile,user){
 const values=[profile?.username,profile?.minecraft_name,user?.user_metadata?.global_name,user?.user_metadata?.user_name];
 return values.find(value=>typeof value==='string'&&value.trim())?.trim().slice(0,40)||'Spieler';
}
export function discordAvatarUrl(user){
 const identity=user?.identities?.find(item=>item.provider==='discord');
 const raw=identity?.identity_data?.avatar_url||identity?.identity_data?.picture||user?.user_metadata?.avatar_url;
 try{
  const url=new URL(raw);
  if(url.protocol!=='https:'||url.hostname!=='cdn.discordapp.com'||url.username||url.password)return null;
  const match=url.pathname.match(/^\/avatars\/(\d{17,20})\/((?:a_)?[a-f0-9]{32})\.(?:png|webp|gif)$/);
  return match?`https://cdn.discordapp.com/avatars/${match[1]}/${match[2]}.png?size=128`:null;
 }catch{return null;}
}
const crcTable=Array.from({length:256},(_,n)=>{for(let i=0;i<8;i++)n=n&1?0xedb88320^(n>>>1):n>>>1;return n>>>0;});
export function pngCrc(bytes){let crc=0xffffffff;for(const byte of bytes)crc=crcTable[(crc^byte)&255]^(crc>>>8);return (crc^0xffffffff)>>>0;}
/** Only small, non-animated 128x128 PNGs produced by the account canvas are accepted. */
export function decodeAvatar(encoded){
 if(typeof encoded!=='string'||encoded.length>120000||!/^data:image\/png;base64,[A-Za-z0-9+/]+={0,2}$/.test(encoded))return null;
 const bytes=Buffer.from(encoded.slice(22),'base64');
 if(bytes.length>90000||bytes.subarray(0,8).toString('hex')!=='89504e470d0a1a0a')return null;
 let offset=8,header=false,ended=false,endedData=false,channels=0;const chunks=[];
 try{
  while(offset<bytes.length){
   if(offset+12>bytes.length)return null;
   const length=bytes.readUInt32BE(offset),type=bytes.toString('ascii',offset+4,offset+8),end=offset+12+length;
   if(end>bytes.length||length>90000||pngCrc(bytes.subarray(offset+4,end-4))!==bytes.readUInt32BE(end-4))return null;
   const data=bytes.subarray(offset+8,end-4);
   if(!header&&type!=='IHDR')return null;
   if(type==='IHDR'){
    if(header||length!==13||data.readUInt32BE(0)!==128||data.readUInt32BE(4)!==128||data[8]!==8||![2,6].includes(data[9])||data[10]||data[11]||data[12])return null;
    channels=data[9]===6?4:3;header=true;
   }else if(type==='IDAT'){
    if(endedData)return null;chunks.push(data);
   }else if(type==='IEND'){
    if(length||!chunks.length)return null;ended=true;offset=end;break;
   }else if(!['sRGB','gAMA','pHYs'].includes(type)||length>16||chunks.length){return null;}
   if(type!=='IDAT'&&chunks.length)endedData=true;
   offset=end;
  }
  if(!ended||offset!==bytes.length)return null;
  const stride=128*channels+1,expected=stride*128;
  const pixels=inflateSync(Buffer.concat(chunks),{maxOutputLength:expected});
  if(pixels.length!==expected)return null;
  for(let row=0;row<128;row++)if(pixels[row*stride]>4)return null;
  return bytes;
 }catch{return null;}
}
