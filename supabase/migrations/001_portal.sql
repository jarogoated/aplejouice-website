-- Apply in Supabase SQL Editor as the project owner. No service-role key is used by the website.
begin;
create schema if not exists private;
revoke all on schema private from public, anon, authenticated;

-- Discord provider_id is verified by Supabase OAuth, never read from user-editable metadata.
create or replace function public.portal_is_owner() returns boolean
language sql stable security definer set search_path = '' as $$
 select exists(select 1 from auth.identities i where i.user_id=auth.uid()
  and i.provider='discord' and i.provider_id='928019899211743305');
$$;
revoke all on function public.portal_is_owner() from public, anon;
grant execute on function public.portal_is_owner() to authenticated;
create or replace function public.portal_is_admin() returns boolean
language sql stable security definer set search_path = '' as $$
 select public.portal_is_owner() and coalesce(auth.jwt()->>'aal','')='aal2';
$$;
revoke all on function public.portal_is_admin() from public, anon;
grant execute on function public.portal_is_admin() to authenticated;

create table if not exists public.portal_reports (
 id uuid primary key default gen_random_uuid(),
 user_id uuid not null references auth.users(id) on delete cascade default auth.uid(),
 kind text not null check(kind in ('bug','feedback')),
 title text not null check(char_length(trim(title)) between 5 and 120),
 description text not null check(char_length(trim(description)) between 20 and 6000),
 mod_version text not null default '' check(char_length(mod_version)<=40),
 status text not null default 'open' check(status in ('open','reviewing','resolved')),
 reply text not null default '' check(char_length(reply)<=2000),
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now()
);
create index if not exists portal_reports_owner_time on public.portal_reports(user_id,created_at desc);
alter table public.portal_reports enable row level security;
revoke all on public.portal_reports from anon,authenticated;
grant select on public.portal_reports to authenticated;
grant insert(kind,title,description,mod_version) on public.portal_reports to authenticated;
grant update(status,reply) on public.portal_reports to authenticated;
create policy reports_read on public.portal_reports for select to authenticated
 using(user_id=(select auth.uid()) or (select public.portal_is_admin()));
create policy reports_create on public.portal_reports for insert to authenticated
 with check(user_id=(select auth.uid()) and status='open' and reply='');
create policy reports_moderate on public.portal_reports for update to authenticated
 using((select public.portal_is_admin())) with check((select public.portal_is_admin()));

create table if not exists private.portal_audit(
 id bigint generated always as identity primary key,
 actor uuid, report_id uuid, old_status text,new_status text, changed_at timestamptz default now()
);
alter table private.portal_audit enable row level security;
revoke all on private.portal_audit from public,anon,authenticated;
create or replace function private.protect_report() returns trigger
language plpgsql security definer set search_path='' as $$
begin
 if TG_OP='INSERT' then
  if auth.uid() is null then raise exception 'Authentication required'; end if;
  perform pg_advisory_xact_lock(hashtextextended(auth.uid()::text,0));
  if (select count(*) from public.portal_reports where user_id=auth.uid() and created_at>now()-interval '1 hour')>=5 then
   raise exception 'Report limit reached' using errcode='P0001';
  end if;
  NEW.user_id=auth.uid(); NEW.created_at=now(); NEW.updated_at=now(); NEW.status='open'; NEW.reply='';
 else
  if not public.portal_is_admin() then raise exception 'Admin access required'; end if;
  if NEW.user_id<>OLD.user_id or NEW.id<>OLD.id or NEW.title<>OLD.title or NEW.description<>OLD.description or NEW.kind<>OLD.kind or NEW.mod_version<>OLD.mod_version or NEW.created_at<>OLD.created_at then
   raise exception 'Immutable report fields';
  end if;
  NEW.updated_at=now();
  insert into private.portal_audit(actor,report_id,old_status,new_status) values(auth.uid(),OLD.id,OLD.status,NEW.status);
 end if;
 return NEW;
end $$;
revoke all on function private.protect_report() from public,anon,authenticated;
create trigger protect_report before insert or update on public.portal_reports for each row execute function private.protect_report();

create table if not exists public.portal_profiles (
 user_id uuid primary key references auth.users(id) on delete cascade default auth.uid(),
 minecraft_name text not null default '' check(minecraft_name='' or minecraft_name ~ '^[A-Za-z0-9_]{3,16}$'),
 minecraft_uuid text not null default '' check(minecraft_uuid='' or minecraft_uuid ~ '^[a-f0-9]{32}$')
);
alter table public.portal_profiles enable row level security;
revoke all on public.portal_profiles from anon,authenticated;
grant select on public.portal_profiles to authenticated;
grant insert(minecraft_name,minecraft_uuid) on public.portal_profiles to authenticated;
grant update(minecraft_name,minecraft_uuid) on public.portal_profiles to authenticated;
create policy profile_read on public.portal_profiles for select to authenticated using(user_id=(select auth.uid()));
create policy profile_create on public.portal_profiles for insert to authenticated with check(user_id=(select auth.uid()));
create policy profile_update on public.portal_profiles for update to authenticated using(user_id=(select auth.uid())) with check(user_id=(select auth.uid()));
commit;
