-- Gymkana Halloween 2026 — esquema de base de datos
-- Ejecutar completo en Supabase → SQL Editor.
-- Todas las tablas tienen RLS activado y SIN políticas: solo el servidor
-- (con la service role key) puede leer o escribir.

create extension if not exists pgcrypto;

create table if not exists teams (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 2 and 40),
  name_key text generated always as (lower(btrim(name))) stored unique,
  -- Hash del código para unirse. null = se entra sin código. Lo define el organizador en /admin/equipos.
  join_code_hash text,
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

-- Código legible para que el organizador pueda verlo en /admin/equipos (la comprobación usa el hash).
-- Solo lo lee el servidor: RLS sin políticas y sin permisos para la clave pública.
alter table teams add column if not exists join_code text;

-- Rutas: equipos que tienen cada QR en su recorrido (solo informativo, para el panel del organizador).
-- null o vacío = sin asignar. Se marca en /admin/qr; no se guarda en el repositorio para no desvelar las rutas.
alter table qr_points add column if not exists assigned_team_ids uuid[];

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

-- Copias de partidas anteriores («Nueva partida» en /admin/partidas).
create table if not exists game_archives (
  id bigint generated always as identity primary key,
  label text not null,
  archived_at timestamptz not null default now(),
  players_count int not null,
  scans_count int not null,
  data jsonb not null
);

-- Guarda jugadores y escaneos en game_archives y deja la partida vacía, todo en una transacción.
-- Las copias no se borran desde la web.
-- Conserva equipos (con sus códigos) y puntos QR. Solo la ejecuta el servidor (service_role).
create or replace function archive_game(p_label text) returns bigint
language plpgsql
set search_path = public
as $$
declare
  v_id bigint;
begin
  insert into game_archives (label, players_count, scans_count, data)
  select
    coalesce(nullif(btrim(p_label), ''), 'Partida ' || to_char(now() at time zone 'Europe/Madrid', 'DD/MM/YYYY HH24:MI')),
    (select count(*) from players),
    (select count(*) from scan_events),
    jsonb_build_object(
      'players', coalesce((
        select jsonb_agg(jsonb_build_object('name', p.display_name, 'team', t.name, 'created_at', p.created_at, 'active', p.active) order by p.created_at)
        from players p join teams t on t.id = p.team_id), '[]'::jsonb),
      'scans', coalesce((
        select jsonb_agg(jsonb_build_object('scanned_at', s.scanned_at, 'player', p.display_name, 'team', t.name, 'point', q.title) order by s.scanned_at)
        from scan_events s
        join players p on p.id = s.player_id
        join teams t on t.id = s.team_id
        join qr_points q on q.id = s.qr_point_id), '[]'::jsonb),
      -- Filas originales, para poder restaurar la partida con los mismos móviles identificados.
      'raw_players', coalesce((select jsonb_agg(to_jsonb(p)) from players p), '[]'::jsonb),
      'raw_scans', coalesce((select jsonb_agg(to_jsonb(s)) from scan_events s), '[]'::jsonb)
    )
  returning id into v_id;

  -- «where true»: Supabase puede bloquear DELETE sin WHERE.
  delete from scan_events where true;
  delete from players where true;
  update teams set failed_join_attempts = 0, locked_until = null where true;
  return v_id;
end $$;

-- Vuelve a poner en juego una copia. Si la partida actual tiene datos, antes se guarda en otra copia,
-- así que restaurar nunca pierde nada. Los jugadores recuperan su identidad (sus móviles siguen valiendo).
create or replace function restore_game(p_id bigint) returns void
language plpgsql
set search_path = public
as $$
declare
  v_label text;
  v_data jsonb;
begin
  select label, data into v_label, v_data from game_archives where id = p_id;
  if v_data is null then
    raise exception 'No existe la copia %', p_id;
  end if;

  if exists (select 1 from players) or exists (select 1 from scan_events) then
    perform archive_game('Copia automática antes de restaurar «' || v_label || '»');
  end if;

  -- Se omiten filas cuyo equipo o punto QR ya no exista.
  insert into players (id, display_name, team_id, device_token_hash, active, created_at)
  select r.id, r.display_name, r.team_id, r.device_token_hash, r.active, r.created_at
  from jsonb_to_recordset(coalesce(v_data -> 'raw_players', '[]'::jsonb))
    as r(id uuid, display_name text, team_id uuid, device_token_hash text, active boolean, created_at timestamptz)
  where exists (select 1 from teams t where t.id = r.team_id);

  insert into scan_events (id, player_id, team_id, qr_point_id, scanned_at, user_agent)
  overriding system value
  select r.id, r.player_id, r.team_id, r.qr_point_id, r.scanned_at, r.user_agent
  from jsonb_to_recordset(coalesce(v_data -> 'raw_scans', '[]'::jsonb))
    as r(id bigint, player_id uuid, team_id uuid, qr_point_id uuid, scanned_at timestamptz, user_agent text)
  where exists (select 1 from players p where p.id = r.player_id)
    and exists (select 1 from qr_points q where q.id = r.qr_point_id);

  perform setval(pg_get_serial_sequence('public.scan_events', 'id'), coalesce((select max(id) from scan_events), 0) + 1, false);
end $$;

revoke all on function archive_game(text) from public;
revoke all on function restore_game(bigint) from public;
do $$
begin
  if exists (select 1 from pg_roles where rolname = 'service_role') then
    grant execute on function archive_game(text) to service_role;
    grant execute on function restore_game(bigint) to service_role;
  end if;
end $$;

-- Migración para bases creadas con versiones anteriores del script (el código era obligatorio).
alter table teams alter column join_code_hash drop not null;

alter table teams enable row level security;
alter table players enable row level security;
alter table qr_points enable row level security;
alter table scan_events enable row level security;
alter table game_archives enable row level security;

-- Defensa en profundidad: además de RLS sin políticas, se retiran los permisos
-- que Supabase concede por defecto a los roles públicos (anon/authenticated).
do $$
declare r text;
begin
  foreach r in array array['anon', 'authenticated'] loop
    if exists (select 1 from pg_roles where rolname = r) then
      execute format('revoke all on teams, players, qr_points, scan_events, game_archives from %I', r);
      execute format('revoke all on function archive_game(text), restore_game(bigint) from %I', r);
      execute format('revoke all on sequence scan_events_id_seq, game_archives_id_seq from %I', r);
    end if;
  end loop;
end $$;

-- Equipos fijos de la gymkana. Los jugadores eligen uno; no pueden crear equipos nuevos.
insert into teams (name) values ('Calabaza'), ('Fantasma'), ('Bruja'), ('Zombie')
on conflict (name_key) do nothing;

-- Ubicaciones con QR. Cada equipo tiene que encontrar 2 (QR_PER_TEAM).
-- La URL lleva un sufijo aleatorio generado aquí, distinto en cada base de datos: así no aparece en el
-- repositorio y nadie puede «escanear» un QR sin encontrarlo. Las URLs reales se ven en /admin/qr.
-- Textos de serie de cada prueba; se pueden cambiar en /admin/qr (volver a ejecutar el script no los pisa).
insert into qr_points (slug, title, instructions, sort_order)
select v.prefix || '-' || substr(md5(gen_random_uuid()::text), 1, 10), v.title, v.instructions, v.sort_order
from (values
  ('parkour', 'Parkour maldito', 'Todo el equipo debe participar en un vídeo donde se realice parte del circuito de parkour.', 1),
  ('rocodromo', 'Rocódromo', 'Vídeo de un integrante del equipo completándolo o aguantando arriba 10 segundos.', 2),
  ('zigzag', 'Zigzag', 'Recorred el zigzag en fila como una procesión de zombis: cada uno agarrado a los hombros del de delante, arrastrando los pies y sin soltaros. Grabad un vídeo de todo el recorrido.', 3),
  ('anfiteatro', 'El Anfiteatro', 'Recread una escena de una película de terror.', 4)
) as v(prefix, title, instructions, sort_order)
where not exists (select 1 from qr_points q where q.title = v.title);

-- Una versión anterior del script usaba URLs fijas publicadas en el repositorio: se cambian por aleatorias.
update qr_points
set slug = split_part(slug, '-', 1) || '-' || substr(md5(gen_random_uuid()::text), 1, 10)
where slug in ('parkour-7qk2mz', 'rocodromo-x4b9tw', 'zigzag-m3v8pd', 'anfiteatro-h6r2kc');

-- Elimina los QR de ejemplo de versiones anteriores del script (y sus escaneos de prueba).
delete from qr_points where slug in ('calabaza-x7k9mq', 'cripta-b4n2vz', 'bruja-k8w3rt');
