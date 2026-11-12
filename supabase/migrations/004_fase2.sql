-- ============================================================
-- DINAPROS — Fase 2: Cambios de esquema
-- ============================================================
-- Ejecutar en: Supabase Dashboard → SQL Editor
-- ============================================================

-- 1. Incidencias: añadir campos territoriales
alter table incidencias add column if not exists departamento text;
alter table incidencias add column if not exists provincia text;
alter table incidencias add column if not exists distrito text;
alter table incidencias alter column centro_poblado_id drop not null;

-- 2. Ayudas: añadir campos territoriales
alter table ayudas add column if not exists departamento text;
alter table ayudas add column if not exists provincia text;
alter table ayudas add column if not exists distrito text;
alter table ayudas alter column centro_poblado_id drop not null;

-- 3. Brigadas: reemplazar sector por departamento + región eclesiástica
alter table brigadas add column if not exists departamento text;
alter table brigadas add column if not exists region_eclesiastica text;
alter table brigadas alter column sector_id drop not null;

-- 4. Índices para los nuevos campos
create index if not exists idx_incidencias_departamento on incidencias(departamento);
create index if not exists idx_ayudas_departamento on ayudas(departamento);
create index if not exists idx_brigadas_departamento on brigadas(departamento);
create index if not exists idx_brigadas_region on brigadas(region_eclesiastica);
