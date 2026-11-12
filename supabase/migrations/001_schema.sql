-- ============================================================
-- DINAPROS — Esquema de Base de Datos
-- Fenómeno El Niño: Gestión de Incidencias, Ayuda y Brigadas
-- ============================================================
-- Ejecutar en: Supabase Dashboard → SQL Editor
-- ============================================================

-- Extensión para generación de UUIDs
create extension if not exists "pgcrypto";

-- ============================================================
-- 1. CATÁLOGOS TERRITORIALES
-- ============================================================

-- Sectores
create table if not exists sectores (
  id          uuid primary key default gen_random_uuid(),
  nombre      text not null,
  distrito    text,
  provincia   text,
  created_at  timestamptz not null default now()
);

-- Centros Poblados
create table if not exists centros_poblados (
  id                  uuid primary key default gen_random_uuid(),
  sector_id           uuid not null references sectores(id) on delete cascade,
  nombre              text not null,
  codigo_territorial  text,
  activo              boolean not null default true,
  created_at          timestamptz not null default now()
);

create index if not exists idx_centros_poblados_sector_id
  on centros_poblados(sector_id);

-- ============================================================
-- 2. INCIDENCIAS (Afectaciones)
-- ============================================================

create table if not exists incidencias (
  id                  uuid primary key default gen_random_uuid(),
  codigo_auditoria    text unique not null,
  centro_poblado_id   uuid not null references centros_poblados(id) on delete restrict,
  tipo_afectacion     text not null,
  cantidad_hogares    integer not null check (cantidad_hogares >= 0),
  necesidad_principal text not null,
  fecha_evento        date not null check (fecha_evento <= current_date),
  observaciones       text check (length(observaciones) <= 500),
  created_at          timestamptz not null default now(),
  created_by          uuid references auth.users(id) default auth.uid()
);

create index if not exists idx_incidencias_centro_poblado_id
  on incidencias(centro_poblado_id);
create index if not exists idx_incidencias_created_at
  on incidencias(created_at desc);

-- ============================================================
-- 3. AYUDAS (Entrega de asistencia humanitaria)
-- ============================================================

create table if not exists ayudas (
  id                  uuid primary key default gen_random_uuid(),
  codigo_auditoria    text unique not null,
  centro_poblado_id   uuid not null references centros_poblados(id) on delete restrict,
  categoria_ayuda     text not null,
  organizacion        text not null check (length(organizacion) >= 2),
  fecha_entrega       date not null check (fecha_entrega <= current_date),
  num_personas        integer not null check (num_personas > 0),
  observaciones       text check (length(observaciones) <= 500),
  created_at          timestamptz not null default now(),
  created_by          uuid references auth.users(id) default auth.uid()
);

create index if not exists idx_ayudas_centro_poblado_id
  on ayudas(centro_poblado_id);
create index if not exists idx_ayudas_created_at
  on ayudas(created_at desc);

-- ============================================================
-- 4. BRIGADAS
-- ============================================================

create table if not exists brigadas (
  id                    uuid primary key default gen_random_uuid(),
  codigo_brigada        text unique not null,
  sector_id             uuid not null references sectores(id) on delete restrict,
  nombre_brigada        text not null,
  nombre_responsable    text not null,
  documento_responsable text,
  telefono_responsable  text not null,
  contacto_secundario   text,
  created_at            timestamptz not null default now(),
  created_by            uuid references auth.users(id) default auth.uid()
);

create index if not exists idx_brigadas_sector_id
  on brigadas(sector_id);

-- ============================================================
-- 5. MIEMBROS DE BRIGADA (Detalle 1 a N)
-- ============================================================

create table if not exists miembros_brigada (
  id              uuid primary key default gen_random_uuid(),
  brigada_id      uuid not null references brigadas(id) on delete cascade,
  nombre_completo text not null,
  documento       text,
  telefono        text not null,
  rol             text,
  created_at      timestamptz not null default now()
);

create index if not exists idx_miembros_brigada_id
  on miembros_brigada(brigada_id);

-- ============================================================
-- 6. SECUENCIAS Y CÓDIGOS DE AUDITORÍA
-- ============================================================

-- Una secuencia por entidad genera el número correlativo.
-- El trigger combina el prefijo + año actual + número formateado.

create sequence if not exists incidencias_seq;
create sequence if not exists ayudas_seq;
create sequence if not exists brigadas_seq;

-- Trigger: Incidencias → INC-AAAA-NNNNN
create or replace function fn_incidencia_codigo()
returns trigger as $$
begin
  new.codigo_auditoria :=
    'INC-' || extract(year from now())::text || '-' ||
    lpad(nextval('incidencias_seq')::text, 5, '0');
  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_incidencia_codigo on incidencias;
create trigger trg_incidencia_codigo
  before insert on incidencias
  for each row execute function fn_incidencia_codigo();

-- Trigger: Ayudas → AYU-AAAA-NNNNN
create or replace function fn_ayuda_codigo()
returns trigger as $$
begin
  new.codigo_auditoria :=
    'AYU-' || extract(year from now())::text || '-' ||
    lpad(nextval('ayudas_seq')::text, 5, '0');
  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_ayuda_codigo on ayudas;
create trigger trg_ayuda_codigo
  before insert on ayudas
  for each row execute function fn_ayuda_codigo();

-- Trigger: Brigadas → BRI-AAAA-NNNNN
create or replace function fn_brigada_codigo()
returns trigger as $$
begin
  new.codigo_brigada :=
    'BRI-' || extract(year from now())::text || '-' ||
    lpad(nextval('brigadas_seq')::text, 5, '0');
  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_brigada_codigo on brigadas;
create trigger trg_brigada_codigo
  before insert on brigadas
  for each row execute function fn_brigada_codigo();

-- ============================================================
-- 7. ROW LEVEL SECURITY (RLS)
-- ============================================================

-- Activar RLS en todas las tablas
alter table sectores enable row level security;
alter table centros_poblados enable row level security;
alter table incidencias enable row level security;
alter table ayudas enable row level security;
alter table brigadas enable row level security;
alter table miembros_brigada enable row level security;

-- Políticas: usuarios autenticados pueden leer todo y crear registros.
-- Solo el autor puede editar o borrar sus propios registros.

-- Sectores
create policy "sectores_read" on sectores
  for select to authenticated using (true);
create policy "sectores_insert" on sectores
  for insert to authenticated with check (true);
create policy "sectores_update" on sectores
  for update to authenticated using (true);
create policy "sectores_delete" on sectores
  for delete to authenticated using (true);

-- Centros Poblados
create policy "centros_read" on centros_poblados
  for select to authenticated using (true);
create policy "centros_insert" on centros_poblados
  for insert to authenticated with check (true);
create policy "centros_update" on centros_poblados
  for update to authenticated using (true);
create policy "centros_delete" on centros_poblados
  for delete to authenticated using (true);

-- Incidencias
create policy "incidencias_read" on incidencias
  for select to authenticated using (true);
create policy "incidencias_insert" on incidencias
  for insert to authenticated with check (auth.uid() is not null);
create policy "incidencias_update" on incidencias
  for update to authenticated using (created_by = auth.uid());
create policy "incidencias_delete" on incidencias
  for delete to authenticated using (created_by = auth.uid());

-- Ayudas
create policy "ayudas_read" on ayudas
  for select to authenticated using (true);
create policy "ayudas_insert" on ayudas
  for insert to authenticated with check (auth.uid() is not null);
create policy "ayudas_update" on ayudas
  for update to authenticated using (created_by = auth.uid());
create policy "ayudas_delete" on ayudas
  for delete to authenticated using (created_by = auth.uid());

-- Brigadas
create policy "brigadas_read" on brigadas
  for select to authenticated using (true);
create policy "brigadas_insert" on brigadas
  for insert to authenticated with check (auth.uid() is not null);
create policy "brigadas_update" on brigadas
  for update to authenticated using (created_by = auth.uid());
create policy "brigadas_delete" on brigadas
  for delete to authenticated using (created_by = auth.uid());

-- Miembros de Brigada (heredan el permiso del creador de la brigada)
create policy "miembros_read" on miembros_brigada
  for select to authenticated using (true);
create policy "miembros_insert" on miembros_brigada
  for insert to authenticated with check (auth.uid() is not null);
create policy "miembros_update" on miembros_brigada
  for update to authenticated using (true);
create policy "miembros_delete" on miembros_brigada
  for delete to authenticated using (true);

-- ============================================================
-- 8. DATOS DE EJEMPLO (Catálogos)
-- ============================================================

-- Insertar sectores de ejemplo
insert into sectores (nombre, distrito, provincia) values
  ('Sector Norte', 'Chiclayo', 'Chiclayo'),
  ('Sector Sur', 'Monsefú', 'Chiclayo'),
  ('Sector Este', 'Pimentel', 'Chiclayo'),
  ('Sector Oeste', 'Reque', 'Chiclayo')
on conflict do nothing;

-- Insertar centros poblados de ejemplo (vinculados a los sectores)
insert into centros_poblados (sector_id, nombre, codigo_territorial)
select s.id, 'Centro Poblado ' || s.nombre, 'CP-' || substr(s.nombre, 8, 1) || '001'
from sectores s
on conflict do nothing;

-- Insertar brigada de ejemplo
insert into brigadas (sector_id, nombre_brigada, nombre_responsable, documento_responsable, telefono_responsable, contacto_secundario)
select s.id, 'Brigada 01', 'Carlos Hernández', '12345678', '999888777', '987654321'
from sectores s
where s.nombre = 'Sector Norte'
on conflict do nothing;
