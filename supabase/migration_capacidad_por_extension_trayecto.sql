-- Migración segura para ampliar las cargas de capacidad académica.
-- Conserva todos los registros existentes: los campos nuevos aceptan NULL.
-- Ejecutar una sola vez en Supabase > SQL Editor.

do $$
declare
  id_type text;
begin
  select format_type(a.atttypid, a.atttypmod)
    into id_type
  from pg_attribute a
  join pg_class t on t.oid = a.attrelid
  join pg_namespace n on n.oid = t.relnamespace
  where n.nspname = 'public'
    and t.relname = 'extensiones'
    and a.attname = 'id'
    and not a.attisdropped;

  if id_type is null then
    raise exception 'No se encontró public.extensiones.id';
  end if;

  if not exists (
    select 1 from information_schema.columns
    where table_schema = 'public'
      and table_name = 'capacidad_academica'
      and column_name = 'extension_id'
  ) then
    execute format(
      'alter table public.capacidad_academica add column extension_id %s references public.extensiones(id) on delete set null',
      id_type
    );
  end if;
end $$;

alter table public.capacidad_academica
  add column if not exists trayecto text;

grant select, insert, update, delete on public.capacidad_academica to authenticated;

drop policy if exists "auth users manage capacidad" on public.capacidad_academica;
create policy "auth users manage capacidad"
  on public.capacidad_academica
  for all to authenticated
  using (true) with check (true);
