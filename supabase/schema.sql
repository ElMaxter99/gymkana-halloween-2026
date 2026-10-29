-- Gymkana Halloween 2026 — esquema de base de datos
-- Ejecutar completo en Supabase → SQL Editor.
-- Todas las tablas tienen RLS activado y SIN políticas: solo el servidor
-- (con la service role key) puede leer o escribir.

create extension if not exists pgcrypto;

create table if not exists teams (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 2 and 40),
  name_key text generated always as (lower(btrim(name))) stored unique,
  join_code_hash text not null,
  failed_join_attempts int not null default 0,
  locked_until timestamptz,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists players (
  id uuid primary key default gen_random_uuid(),
  display_name text not null check (char_length(display_name) between 1 and 40),
  team_id uuid not null references teams(id) on delete cascade,
  device_token_hash text not null unique,
  active boolean not null default true,
  created_at timestamptz not null default now()
);
create index if not exists players_team_idx on players(team_id);

create table if not exists qr_points (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9-]{3,64}$'),
  title text not null check (char_length(title) between 1 and 80),
  instructions text not null default '',
  sort_order int not null default 0,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists scan_events (
  id bigint generated always as identity primary key,
  player_id uuid not null references players(id) on delete cascade,
  team_id uuid not null references teams(id) on delete cascade,
  qr_point_id uuid not null references qr_points(id) on delete cascade,
  scanned_at timestamptz not null default now(),
  user_agent text
);
create index if not exists scan_events_scanned_at_idx on scan_events(scanned_at desc);
create index if not exists scan_events_team_point_idx on scan_events(team_id, qr_point_id);

alter table teams enable row level security;
alter table players enable row level security;
alter table qr_points enable row level security;
alter table scan_events enable row level security;

-- Puntos de ejemplo (puedes editarlos o crear más desde /admin/qr)
insert into qr_points (slug, title, instructions, sort_order) values
  ('calabaza-x7k9mq', 'La calabaza maldita', 'Habéis encontrado la calabaza maldita 🎃' || chr(10) || 'Haced una foto de todo el equipo poniendo vuestra mejor cara de miedo y mandadla por WhatsApp al coordinador.', 1),
  ('cripta-b4n2vz', 'La cripta', 'Grabad un vídeo de 10 segundos imitando a un zombi y enviadlo por WhatsApp.', 2),
  ('bruja-k8w3rt', 'El caldero de la bruja', 'Buscad algo verde y haced una foto con ello.', 3)
on conflict (slug) do nothing;
