-- Ejecutar en Supabase SQL Editor. Requiere RLS habilitado en las tres tablas.
-- Solo usuarios autenticados pueden leer o modificar datos.
grant select, insert, update, delete on public.nucleos to authenticated;
grant select, insert, update, delete on public.extensiones to authenticated;
grant select, insert, update, delete on public.capacidad_academica to authenticated;
grant usage, select on all sequences in schema public to authenticated;

drop policy if exists "auth users manage nucleos" on public.nucleos;
create policy "auth users manage nucleos" on public.nucleos for all to authenticated using (true) with check (true);

drop policy if exists "auth users manage extensiones" on public.extensiones;
create policy "auth users manage extensiones" on public.extensiones for all to authenticated using (true) with check (true);

drop policy if exists "auth users manage capacidad" on public.capacidad_academica;
create policy "auth users manage capacidad" on public.capacidad_academica for all to authenticated using (true) with check (true);