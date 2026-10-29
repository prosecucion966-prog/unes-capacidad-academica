# UNES — Sistema de Capacidad Académica

Aplicación web para registrar capacidad académica por núcleo, gestionar varias extensiones y exportar reportes PDF.

## Requisitos
- Node.js LTS
- Proyecto Supabase con las tablas `nucleos`, `extensiones` y `capacidad_academica`
- Usuario autorizado creado en Supabase Authentication

## Preparación local
1. Instala Node.js LTS.
2. Descarga o clona este repositorio.
3. Ejecuta `npm install`.
4. Copia `.env.example` como `.env`.
5. Completa `VITE_SUPABASE_URL` y `VITE_SUPABASE_PUBLISHABLE_KEY` con los datos del proyecto Supabase.
6. Ejecuta `npm run dev`.

Nunca publiques claves `secret`, `service_role`, contraseñas ni el archivo `.env`.

## Permisos de Supabase
Ejecuta `supabase/policies.sql` en el SQL Editor de Supabase. Las tablas deben tener RLS habilitado. Crea las cuentas autorizadas desde Authentication > Users. La aplicación no ofrece registro público.

## Funciones
- Inicio de sesión para usuarios creados por el administrador
- Selector de núcleo
- Varias extensiones por núcleo y activación/desactivación
- Registro de período, programa, docentes, estudiantes y observaciones
- Reporte PDF con extensiones y capacidad académica

Para publicar, importa el repositorio en Vercel y configura allí `VITE_SUPABASE_URL` y `VITE_SUPABASE_PUBLISHABLE_KEY`.