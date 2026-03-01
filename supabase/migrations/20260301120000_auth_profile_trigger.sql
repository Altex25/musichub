-- 1) Fonction trigger : crée une ligne dans public.profiles
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
_username text;
begin
  _username := nullif(trim(new.raw_user_meta_data->>'username'), '');

  if _username is null then
    _username := 'user_' || substr(new.id::text, 1, 8);
end if;

insert into public.profiles (user_id, username)
values (new.id, _username);

return new;
end;
$$;

-- 2) Trigger sur auth.users
drop trigger if exists on_auth_user_created on auth.users;

create trigger on_auth_user_created
    after insert on auth.users
    for each row execute function public.handle_new_user();