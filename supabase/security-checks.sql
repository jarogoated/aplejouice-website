-- Run only in the newly configured staging Supabase project, as SQL owner.
-- Everything rolls back. This checks the actual database policies, not browser UI.
begin;
create temporary table fixtures(owner_id uuid);
insert into auth.users(id,aud,role,email,email_confirmed_at) values
 ('00000000-1111-4111-8111-000000000001','authenticated','authenticated','rls-a@example.invalid',now()),
 ('00000000-1111-4111-8111-000000000002','authenticated','authenticated','rls-b@example.invalid',now());
-- Use the real owner if already present; otherwise a temporary OAuth identity for this transaction.
insert into fixtures select user_id from auth.identities where provider='discord' and provider_id='928019899211743305';
do $$ begin
 if not exists(select 1 from fixtures) then
  insert into auth.users(id,aud,role,email,email_confirmed_at) values('00000000-1111-4111-8111-000000000003','authenticated','authenticated','rls-owner@example.invalid',now());
  insert into auth.identities(id,user_id,provider,provider_id,identity_data) values(gen_random_uuid(),'00000000-1111-4111-8111-000000000003','discord','928019899211743305','{"sub":"928019899211743305"}');
  insert into fixtures values('00000000-1111-4111-8111-000000000003');
 end if;
end $$;
grant select on fixtures to authenticated;
create function pg_temp.assert_true(value boolean,message text) returns void language plpgsql as $$begin if value is not true then raise exception '%',message;end if;end$$;
set local role authenticated;
select set_config('request.jwt.claims','{"sub":"00000000-1111-4111-8111-000000000001","role":"authenticated","aal":"aal1"}',true);
insert into public.portal_reports(kind,title,description) values('bug','RLS test report','A reproducible test report for authorization.');
select pg_temp.assert_true((select count(*)=1 from public.portal_reports),'Owner must see own report');
select set_config('request.jwt.claims','{"sub":"00000000-1111-4111-8111-000000000002","role":"authenticated","aal":"aal2","user_metadata":{"role":"admin","provider_id":"928019899211743305"}}',true);
select pg_temp.assert_true(not public.portal_is_owner(),'Metadata must not grant owner');
select pg_temp.assert_true((select count(*)=0 from public.portal_reports),'Another user must not read reports');
select set_config('request.jwt.claims',json_build_object('sub',(select owner_id from fixtures),'role','authenticated','aal','aal1')::text,true);
select pg_temp.assert_true(public.portal_is_owner(),'Discord identity must identify owner');
select pg_temp.assert_true(not public.portal_is_admin(),'Owner must still need MFA');
select pg_temp.assert_true((select count(*)=0 from public.portal_reports),'AAL1 owner must not read other reports');
select set_config('request.jwt.claims',json_build_object('sub',(select owner_id from fixtures),'role','authenticated','aal','aal2')::text,true);
select pg_temp.assert_true(public.portal_is_admin(),'Owner with MFA must be admin');
update public.portal_reports set status='reviewing' where title='RLS test report';
select pg_temp.assert_true((select count(*)=1 from public.portal_reports where status='reviewing' and title='RLS test report'),'Admin must moderate');
reset role;
rollback;
