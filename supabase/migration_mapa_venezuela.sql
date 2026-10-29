-- Mapa de Venezuela: asignación de estado a cada núcleo.
-- Esta migración agrega una columna nullable; no borra ni modifica registros existentes.
ALTER TABLE public.nucleos
  ADD COLUMN IF NOT EXISTS estado text;

ALTER TABLE public.nucleos
  DROP CONSTRAINT IF EXISTS nucleos_estado_venezuela_check;

ALTER TABLE public.nucleos
  ADD CONSTRAINT nucleos_estado_venezuela_check
  CHECK (
    estado IS NULL OR estado IN (
      'Amazonas','Anzoátegui','Apure','Aragua','Barinas','Bolívar',
      'Carabobo','Cojedes','Delta Amacuro','Distrito Capital','Falcón',
      'Guárico','La Guaira','Lara','Mérida','Miranda','Monagas',
      'Nueva Esparta','Portuguesa','Sucre','Táchira','Trujillo',
      'Yaracuy','Zulia'
    )
  );

ALTER TABLE public.nucleos ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admin UNES puede actualizar nucleos" ON public.nucleos;
CREATE POLICY "Admin UNES puede actualizar nucleos"
  ON public.nucleos
  FOR UPDATE
  TO authenticated
  USING (public.es_admin_unes())
  WITH CHECK (public.es_admin_unes());

GRANT UPDATE ON public.nucleos TO authenticated;
