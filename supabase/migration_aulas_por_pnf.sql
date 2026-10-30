-- Agrega el inventario de aulas a cada registro de PNF, sede y trayecto.
-- Los valores quedan NULL en registros antiguos para indicar que aún no fueron cargados.
alter table public.capacidad_academica
  add column if not exists cantidad_aulas integer,
  add column if not exists capacidad_por_aula integer;

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'capacidad_academica_cantidad_aulas_no_negativa') then
    alter table public.capacidad_academica
      add constraint capacidad_academica_cantidad_aulas_no_negativa
      check (cantidad_aulas is null or cantidad_aulas >= 0);
  end if;
  if not exists (select 1 from pg_constraint where conname = 'capacidad_academica_capacidad_por_aula_no_negativa') then
    alter table public.capacidad_academica
      add constraint capacidad_academica_capacidad_por_aula_no_negativa
      check (capacidad_por_aula is null or capacidad_por_aula >= 0);
  end if;
end $$;
