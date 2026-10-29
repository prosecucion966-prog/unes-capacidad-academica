-- Control de acceso por núcleo y administrador general.
-- No elimina ni modifica registros académicos existentes.
create table if not exists public.perfiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  nucleo_id text not null,
  creado_en timestamptz not null default now()
);
alter table public.perfiles enable row level security;

create or replace function public.es_admin_unes()
returns boolean language sql stable security definer
set search_path = public
as $$
  select lower(coalesce(auth.jwt() ->> 'email','')) = 'bancodepreguntasunes@gmail.com';
$$;

create or replace function public.mi_nucleo_unes()
returns text language sql stable security definer
set search_path = public
as $$
  select nucleo_id from public.perfiles where user_id = auth.uid();
$$;

create or replace function public.crear_perfil_responsable()
returns trigger language plpgsql security definer
set search_path = public
as $$
begin
  if lower(coalesce(new.email,'')) <> 'bancodepreguntasunes@gmail.com'
     and coalesce(new.raw_user_meta_data ->> 'nucleo_id','') <> '' then
    insert into public.perfiles(user_id,nucleo_id)
    values(new.id, new.raw_user_meta_data ->> 'nucleo_id')
    on conflict(user_id) do nothing;
  end if;
  return new;
end;
$$;

drop trigger if exists crear_perfil_responsable_al_registrar on auth.users;
create trigger crear_perfil_responsable_al_registrar
after insert on auth.users
for each row execute procedure public.crear_perfil_responsable();

grant select on public.nucleos to anon, authenticated;
grant select on public.perfiles to authenticated;
grant insert, select on public.perfiles to authenticated;
grant select on public.extensiones to authenticated;
grant select, insert, update, delete on public.extensiones to authenticated;
grant select, insert, update, delete on public.capacidad_academica to authenticated;

drop policy if exists "auth users manage nucleos" on public.nucleos;
drop policy if exists "public read active nuclei" on public.nucleos;
create policy "public read active nuclei" on public.nucleos
for select to anon, authenticated using (true);

drop policy if exists "auth users manage extensiones" on public.extensiones;
drop policy if exists "users read own nucleus extensions" on public.extensiones;
drop policy if exists "admin manage extensions" on public.extensiones;
create policy "users read own nucleus extensions" on public.extensiones
for select to authenticated
using (public.es_admin_unes() or nucleo_id::text = public.mi_nucleo_unes());
create policy "admin manage extensions" on public.extensiones
for all to authenticated
using (public.es_admin_unes()) with check (public.es_admin_unes());

drop policy if exists "auth users manage capacidad" on public.capacidad_academica;
drop policy if exists "users read own nucleus capacity" on public.capacidad_academica;
drop policy if exists "users add own nucleus capacity" on public.capacidad_academica;
drop policy if exists "admin manage all capacity" on public.capacidad_academica;
create policy "users read own nucleus capacity" on public.capacidad_academica
for select to authenticated
using (public.es_admin_unes() or nucleo_id::text = public.mi_nucleo_unes());
create policy "users add own nucleus capacity" on public.capacidad_academica
for insert to authenticated
with check (public.es_admin_unes() or nucleo_id::text = public.mi_nucleo_unes());
create policy "admin manage all capacity" on public.capacidad_academica
for update to authenticated
using (public.es_admin_unes()) with check (public.es_admin_unes());
create policy "admin delete all capacity" on public.capacidad_academica
for delete to authenticated using (public.es_admin_unes());

drop policy if exists "profiles read own" on public.perfiles;
drop policy if exists "profiles insert own" on public.perfiles;
drop policy if exists "admin read profiles" on public.perfiles;
create policy "profiles read own" on public.perfiles
for select to authenticated using (user_id = auth.uid() or public.es_admin_unes());
create policy "profiles insert own" on public.perfiles
for insert to authenticated with check (user_id = auth.uid());
