-- ============================================================
-- DINAPROS — Roles de Usuario
-- ============================================================
-- Ejecutar en: Supabase Dashboard → SQL Editor
-- ============================================================

-- Tabla de roles: un usuario tiene exactamente un rol
create table if not exists user_roles (
  user_id    uuid primary key references auth.users(id) on delete cascade,
  role       text not null check (role in ('usuario', 'admin')) default 'usuario',
  created_at timestamptz not null default now()
);

-- Trigger: asignar rol 'usuario' automáticamente al registrarse
create or replace function fn_assign_user_role()
returns trigger as $$
begin
  insert into user_roles (user_id, role) values (new.id, 'usuario')
  on conflict do nothing;
  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_assign_user_role on auth.users;
create trigger trg_assign_user_role
  after insert on auth.users
  for each row execute function fn_assign_user_role();

-- Función: obtener el rol del usuario actual
create or replace function get_user_role()
returns text as $$
declare
  r text;
begin
  select role into r from user_roles where user_id = auth.uid();
  return coalesce(r, 'usuario');
end;
$$ language plpgsql security definer;

-- Función: verificar si el usuario actual es admin
create or replace function is_admin()
returns boolean as $$
begin
  return exists (
    select 1 from user_roles
    where user_id = auth.uid() and role = 'admin'
  );
end;
$$ language plpgsql security definer;

-- Función: contar admins activos
create or replace function count_admins()
returns integer as $$
declare
  c integer;
begin
  select count(*) into c from user_roles where role = 'admin';
  return c;
end;
$$ language plpgsql security definer;

-- ============================================================
-- RLS para user_roles
-- ============================================================

alter table user_roles enable row level security;

-- Un usuario puede leer su propio rol
create policy "roles_read_own" on user_roles
  for select to authenticated using (user_id = auth.uid());

-- Un admin puede leer todos los roles
create policy "roles_read_admin" on user_roles
  for select to authenticated using (is_admin());

-- Un admin puede actualizar roles (excepto quitarse el suyo si es el último admin)
create policy "roles_update_admin" on user_roles
  for update to authenticated
  using (is_admin())
  with check (
    is_admin()
    and not (
      user_id = auth.uid()
      and role = 'usuario'
      and count_admins() <= 1
    )
  );

-- Un admin puede insertar roles
create policy "roles_insert_admin" on user_roles
  for insert to authenticated
  with check (is_admin());
