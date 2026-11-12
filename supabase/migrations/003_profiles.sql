-- ============================================================
-- DINAPROS — Perfiles y Función de Listado de Usuarios
-- ============================================================
-- Ejecutar en: Supabase Dashboard → SQL Editor
-- ============================================================

-- Tabla de perfiles (espejo de auth.users accesible vía RLS)
create table if not exists profiles (
  id         uuid primary key references auth.users(id) on delete cascade,
  email      text,
  full_name  text,
  created_at timestamptz not null default now()
);

-- Trigger: crear perfil automáticamente al registrarse
create or replace function fn_create_profile()
returns trigger as $$
begin
  insert into profiles (id, email) values (new.id, new.email)
  on conflict do nothing;
  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_create_profile on auth.users;
create trigger trg_create_profile
  after insert on auth.users
  for each row execute function fn_create_profile();

-- RLS para profiles
alter table profiles enable row level security;

create policy "profiles_read_own" on profiles
  for select to authenticated using (id = auth.uid());

create policy "profiles_read_admin" on profiles
  for select to authenticated using (is_admin());

create policy "profiles_update_own" on profiles
  for update to authenticated using (id = auth.uid()) with check (id = auth.uid());

-- Función: listar todos los usuarios con su rol (solo admin)
create or replace function get_users_with_roles()
returns table (
  user_id    uuid,
  email      text,
  full_name  text,
  role       text,
  created_at timestamptz
) as $$
begin
  if not is_admin() then
    raise exception 'No autorizado: se requiere rol admin';
  end if;

  return query
    select
      ur.user_id,
      p.email,
      p.full_name,
      ur.role,
      ur.created_at
    from user_roles ur
    left join profiles p on p.id = ur.user_id
    order by p.email;
end;
$$ language plpgsql security definer;
