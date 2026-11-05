import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {PGlite} from '@electric-sql/pglite';

test('PostgreSQL enforces report isolation, owner MFA, immutable fields and durable rate limits',async()=>{
 const db=new PGlite();
 try{
  // Minimal Supabase Auth schema/functions. The real migration and RLS execute unchanged.
  await db.exec(`
   create role anon; create role authenticated;
   create schema auth;
   create table auth.users(id uuid primary key,aud text,role text,email text,email_confirmed_at timestamptz);
   create table auth.identities(id uuid primary key,user_id uuid references auth.users(id),provider text,provider_id text,identity_data jsonb);
   create function auth.jwt() returns jsonb language sql stable as $$select coalesce(nullif(current_setting('request.jwt.claims',true),''),'{}')::jsonb$$;
   create function auth.uid() returns uuid language sql stable as $$select (auth.jwt()->>'sub')::uuid$$;
   grant usage on schema auth,public to anon,authenticated;
  `);
  const migration=(await readFile(new URL('../supabase/migrations/001_portal.sql',import.meta.url),'utf8')).replace(/^\uFEFF/,'');
  await db.exec(migration);
  await db.exec((await readFile(new URL('../supabase/migrations/002_profiles.sql',import.meta.url),'utf8')).replace(/^\uFEFF/,''));
  const checks=(await readFile(new URL('../supabase/security-checks.sql',import.meta.url),'utf8')).replace(/^\uFEFF/,'');
  await db.exec(checks);
  await db.exec(`insert into auth.users(id) values('00000000-2222-4222-8222-000000000001');
   set role authenticated;
   set request.jwt.claims='{"sub":"00000000-2222-4222-8222-000000000001","role":"authenticated","aal":"aal1"}';`);
  for(let i=0;i<5;i++)await db.query("insert into public.portal_reports(kind,title,description) values('bug',$1,'A long enough test description.')",['Rate test '+i]);
  await assert.rejects(db.query("insert into public.portal_reports(kind,title,description) values('bug','Sixth report','A long enough test description.')"),/Report limit reached/);
  await assert.rejects(db.query("insert into public.portal_reports(user_id,kind,title,description) values('00000000-2222-4222-8222-000000000001','bug','Forged owner','A long enough test description.')"),/permission denied/);
  const update=await db.query("update public.portal_reports set status='resolved' returning id");
  assert.equal(update.rows.length,0);
  await db.query("insert into public.portal_profiles(username,bio,avatar_source) values('MyPlayer','Hello','initials')");
  await assert.rejects(db.query("update public.portal_profiles set username='Admin'"),/profile_username_valid/);
  await db.exec(`reset role;
   insert into auth.users(id) values('00000000-2222-4222-8222-000000000002');
   set role authenticated;
   set request.jwt.claims='{"sub":"00000000-2222-4222-8222-000000000002","role":"authenticated","aal":"aal1"}';`);
  const hiddenProfile=await db.query('select * from public.portal_profiles');assert.equal(hiddenProfile.rows.length,0);
  const changedProfile=await db.query("update public.portal_profiles set bio='Hacked' returning user_id");assert.equal(changedProfile.rows.length,0);
  await assert.rejects(db.query("insert into public.portal_profiles(username) values('myplayer')"),/portal_username_unique/);
  await db.query("insert into public.portal_profiles(username) values('AnotherPlayer')");
  await db.exec('reset role; set role anon;');
  await assert.rejects(db.query('select * from public.portal_reports'),/permission denied/);
 }finally{await db.close();}
});
