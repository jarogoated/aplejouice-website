begin;
alter table public.portal_profiles
 add column if not exists username text not null default '',
 add column if not exists bio text not null default '',
 add column if not exists avatar_source text not null default 'discord',
 add column if not exists avatar_png text;
alter table public.portal_profiles add constraint profile_username_valid
 check(username='' or (username ~ '^[A-Za-z0-9_]{3,20}$' and lower(username) not in ('admin','administrator','support','moderator','system','aplejouice')));
alter table public.portal_profiles add constraint profile_bio_size check(char_length(bio)<=180);
alter table public.portal_profiles add constraint profile_avatar_source check(avatar_source in ('discord','minecraft','initials','upload'));
alter table public.portal_profiles add constraint profile_avatar_size check(avatar_png is null or (char_length(avatar_png)<=120000 and avatar_png like 'data:image/png;base64,%'));
create unique index portal_username_unique on public.portal_profiles(lower(username)) where username<>'';
grant insert(username,bio,avatar_source,avatar_png),update(username,bio,avatar_source,avatar_png) on public.portal_profiles to authenticated;
comment on column public.portal_profiles.username is 'Display identity only. Never used for authorization.';
commit;
