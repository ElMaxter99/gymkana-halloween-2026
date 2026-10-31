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

-- Clave fija de cada equipo (calabaza, fantasma, bruja, zombie): emblema, rutas y mapa dependen de ella,
-- así el nombre visible se puede cambiar libremente desde el panel.
alter table teams add column if not exists slug text;
create unique index if not exists teams_slug_idx on teams(slug);
alter table teams add column if not exists sort_order int not null default 0;
update teams set slug = case name_key
    when 'calabaza' then 'calabaza' when 'fantasma' then 'fantasma' when 'bruja' then 'bruja'
    when 'zombie' then 'zombie' when 'zombi' then 'zombie' end
where slug is null;
update teams set sort_order = case slug when 'calabaza' then 1 when 'fantasma' then 2 when 'bruja' then 3 when 'zombie' then 4 else sort_order end
where sort_order = 0;

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

-- Sobres abiertos por el organizador (/admin/sobres). Si un sobre no está aquí, sigue sellado en la web.
create table if not exists envelope_state (
  envelope int primary key check (envelope between 0 and 99),
  opened_at timestamptz not null default now()
);

-- Apertura automática de sobres: a partir de «open_at» el sobre cuenta como abierto aunque nadie lo abra a mano.
-- No hace falta ningún proceso programado: la web lo comprueba cada vez que alguien mira los sobres.
create table if not exists envelope_schedule (
  envelope int primary key check (envelope between 0 and 99),
  open_at timestamptz not null
);

-- ===== Marcador =====
-- Configuración (editable en /admin/puntos/config): actividades, pruebas con sus puntos y reglas de bonus.
create table if not exists score_activities (
  id text primary key,
  name text not null check (char_length(name) between 1 and 80),
  sort_order int not null default 0
);

-- Nombre corto para las columnas del marcador de la TV.
alter table score_activities add column if not exists short_name text;

create table if not exists score_tasks (
  id uuid primary key default gen_random_uuid(),
  key text unique,                                   -- identificador de los datos iniciales
  activity_id text not null references score_activities(id) on delete cascade,
  label text not null check (char_length(label) between 1 and 160),
  points int not null default 0 check (points between -100 and 100),
  group_label text,                                  -- «Fáciles», «Difíciles»…
  sort_order int not null default 0,
  counts_for_bonus boolean not null default true,    -- p. ej. el grito de guerra no cuenta para «las 8»
  qr_point_id uuid references qr_points(id) on delete set null, -- localización con QR: solo para los equipos de su ruta
  active boolean not null default true
);

-- kind: all = todas las pruebas del equipo · min = al menos «threshold» · manual = la asigna el organizador a un solo equipo
create table if not exists score_bonuses (
  id uuid primary key default gen_random_uuid(),
  key text unique,
  activity_id text not null references score_activities(id) on delete cascade,
  label text not null check (char_length(label) between 1 and 120),
  kind text not null check (kind in ('all', 'min', 'manual')),
  threshold int check (threshold is null or threshold > 0),
  points int not null default 0 check (points between -100 and 100),
  sort_order int not null default 0,
  active boolean not null default true
);

-- Estado: resultado de cada prueba por equipo (pending = QR escaneado, falta validar).
create table if not exists task_results (
  team_id uuid not null references teams(id) on delete cascade,
  task_id uuid not null references score_tasks(id) on delete cascade,
  status text not null check (status in ('pending', 'valid', 'invalid')),
  note text,
  updated_at timestamptz not null default now(),
  primary key (team_id, task_id)
);

create table if not exists bonus_awards (
  bonus_id uuid primary key references score_bonuses(id) on delete cascade, -- un solo equipo por bonus manual
  team_id uuid not null references teams(id) on delete cascade,
  awarded_at timestamptz not null default now()
);

create table if not exists score_extras (
  id bigint generated always as identity primary key,
  team_id uuid not null references teams(id) on delete cascade,
  points int not null check (points between -100 and 100 and points <> 0),
  reason text,
  created_at timestamptz not null default now()
);

-- Historial de cambios. Su último id es la «versión» del marcador (lo usan el tiempo real y la caché).
create table if not exists score_log (
  id bigint generated always as identity primary key,
  at timestamptz not null default now(),
  actor text not null default 'organizador',
  action text not null check (action in ('task', 'award', 'extra', 'undo', 'reset', 'config', 'qr')),
  team_id uuid references teams(id) on delete set null,
  target text,
  before jsonb,
  after jsonb,
  summary text not null,
  undone boolean not null default false
);

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
      'raw_scans', coalesce((select jsonb_agg(to_jsonb(s)) from scan_events s), '[]'::jsonb),
      'raw_task_results', coalesce((select jsonb_agg(to_jsonb(r)) from task_results r), '[]'::jsonb),
      'raw_bonus_awards', coalesce((select jsonb_agg(to_jsonb(b)) from bonus_awards b), '[]'::jsonb),
      'raw_score_extras', coalesce((select jsonb_agg(to_jsonb(e)) from score_extras e), '[]'::jsonb)
    )
  returning id into v_id;

  -- «where true»: Supabase puede bloquear DELETE sin WHERE.
  delete from scan_events where true;
  delete from players where true;
  delete from envelope_state where true; -- la partida nueva empieza con todos los sobres sellados
  delete from envelope_schedule where open_at <= now(); -- se conservan solo las aperturas programadas futuras
  delete from task_results where true;
  delete from bonus_awards where true;
  delete from score_extras where true;
  insert into score_log (action, summary) values ('reset', 'Nueva partida: marcador a cero');
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

  insert into task_results (team_id, task_id, status, note, updated_at)
  select r.team_id, r.task_id, r.status, r.note, r.updated_at
  from jsonb_to_recordset(coalesce(v_data -> 'raw_task_results', '[]'::jsonb))
    as r(team_id uuid, task_id uuid, status text, note text, updated_at timestamptz)
  where exists (select 1 from teams t where t.id = r.team_id)
    and exists (select 1 from score_tasks k where k.id = r.task_id);

  insert into bonus_awards (bonus_id, team_id, awarded_at)
  select r.bonus_id, r.team_id, r.awarded_at
  from jsonb_to_recordset(coalesce(v_data -> 'raw_bonus_awards', '[]'::jsonb))
    as r(bonus_id uuid, team_id uuid, awarded_at timestamptz)
  where exists (select 1 from teams t where t.id = r.team_id)
    and exists (select 1 from score_bonuses b where b.id = r.bonus_id);

  insert into score_extras (id, team_id, points, reason, created_at)
  overriding system value
  select r.id, r.team_id, r.points, r.reason, r.created_at
  from jsonb_to_recordset(coalesce(v_data -> 'raw_score_extras', '[]'::jsonb))
    as r(id bigint, team_id uuid, points int, reason text, created_at timestamptz)
  where exists (select 1 from teams t where t.id = r.team_id);
  perform setval(pg_get_serial_sequence('public.score_extras', 'id'), coalesce((select max(id) from score_extras), 0) + 1, false);

  insert into score_log (action, summary) values ('reset', 'Partida restaurada: «' || v_label || '»');
end $$;

-- ===== Funciones del marcador =====
-- Cada cambio es una transacción: modifica el estado y escribe el historial a la vez.
-- Devuelven el id del historial, que es la nueva versión del marcador.

create or replace function score_set_task(p_team uuid, p_task uuid, p_status text, p_note text, p_actor text, p_summary text)
returns bigint
language plpgsql
set search_path = public
as $$
declare
  v_before jsonb;
  v_after jsonb;
  v_id bigint;
begin
  select to_jsonb(r) into v_before from task_results r where r.team_id = p_team and r.task_id = p_task for update;
  if p_status is null then
    delete from task_results where team_id = p_team and task_id = p_task;
  else
    insert into task_results (team_id, task_id, status, note, updated_at)
    values (p_team, p_task, p_status, nullif(btrim(coalesce(p_note, '')), ''), now())
    on conflict (team_id, task_id) do update set status = excluded.status, note = excluded.note, updated_at = now();
  end if;
  select to_jsonb(r) into v_after from task_results r where r.team_id = p_team and r.task_id = p_task;
  insert into score_log (actor, action, team_id, target, before, after, summary)
  values (coalesce(nullif(p_actor, ''), 'organizador'), 'task', p_team, p_task::text, v_before, v_after, p_summary)
  returning id into v_id;
  return v_id;
end $$;

-- p_team null = quitar el bonus. Un bonus manual solo puede tenerlo un equipo.
create or replace function score_set_award(p_bonus uuid, p_team uuid, p_actor text, p_summary text)
returns bigint
language plpgsql
set search_path = public
as $$
declare
  v_before jsonb;
  v_after jsonb;
  v_id bigint;
begin
  select to_jsonb(b) into v_before from bonus_awards b where b.bonus_id = p_bonus for update;
  if p_team is null then
    delete from bonus_awards where bonus_id = p_bonus;
  else
    insert into bonus_awards (bonus_id, team_id) values (p_bonus, p_team)
    on conflict (bonus_id) do update set team_id = excluded.team_id, awarded_at = now();
  end if;
  select to_jsonb(b) into v_after from bonus_awards b where b.bonus_id = p_bonus;
  insert into score_log (actor, action, team_id, target, before, after, summary)
  values (coalesce(nullif(p_actor, ''), 'organizador'), 'award', coalesce(p_team, (v_before ->> 'team_id')::uuid),
          p_bonus::text, v_before, v_after, p_summary)
  returning id into v_id;
  return v_id;
end $$;

create or replace function score_add_extra(p_team uuid, p_points int, p_reason text, p_actor text, p_summary text)
returns bigint
language plpgsql
set search_path = public
as $$
declare
  v_extra score_extras;
  v_id bigint;
begin
  insert into score_extras (team_id, points, reason) values (p_team, p_points, nullif(btrim(coalesce(p_reason, '')), ''))
  returning * into v_extra;
  insert into score_log (actor, action, team_id, target, after, summary)
  values (coalesce(nullif(p_actor, ''), 'organizador'), 'extra', p_team, v_extra.id::text, to_jsonb(v_extra), p_summary)
  returning id into v_id;
  return v_id;
end $$;

-- Deshace una acción concreta (prueba, bonus o extra) si no hay cambios posteriores sobre lo mismo.
create or replace function score_undo(p_log_id bigint, p_actor text)
returns bigint
language plpgsql
set search_path = public
as $$
declare
  l score_log;
  v_id bigint;
begin
  select * into l from score_log where id = p_log_id for update;
  if l.id is null or l.undone or l.action not in ('task', 'award', 'extra') then
    raise exception 'Esa acción no se puede deshacer';
  end if;
  if exists (select 1 from score_log where id > l.id and action = 'reset') then
    raise exception 'El marcador se ha reiniciado después de esa acción';
  end if;
  if l.action <> 'extra' and exists (
    select 1 from score_log
    where id > l.id and not undone and action = l.action and target = l.target
      and (l.action <> 'task' or team_id = l.team_id)
  ) then
    raise exception 'Hay un cambio posterior sobre lo mismo: deshaz primero ese';
  end if;

  if l.action = 'task' then
    delete from task_results where team_id = l.team_id and task_id = l.target::uuid;
    if l.before is not null then
      insert into task_results select * from jsonb_populate_record(null::task_results, l.before);
    end if;
  elsif l.action = 'award' then
    delete from bonus_awards where bonus_id = l.target::uuid;
    if l.before is not null then
      insert into bonus_awards select * from jsonb_populate_record(null::bonus_awards, l.before);
    end if;
  else
    delete from score_extras where id = l.target::bigint;
  end if;

  update score_log set undone = true where id = l.id;
  insert into score_log (actor, action, team_id, target, summary)
  values (coalesce(nullif(p_actor, ''), 'organizador'), 'undo', l.team_id, l.id::text, 'Deshecho: ' || l.summary)
  returning id into v_id;
  return v_id;
end $$;

create or replace function score_undo_last(p_actor text)
returns bigint
language plpgsql
set search_path = public
as $$
declare
  v_last bigint;
begin
  select id into v_last from score_log
  where action in ('task', 'award', 'extra') and not undone
    and id > coalesce((select max(id) from score_log where action = 'reset'), 0)
  order by id desc limit 1;
  if v_last is null then
    raise exception 'No hay nada que deshacer';
  end if;
  return score_undo(v_last, p_actor);
end $$;

-- Al escanear un QR: las localizaciones de ese QR quedan «pendientes de validar» para el equipo
-- (solo si el QR está en su ruta y la prueba aún no tiene estado). Devuelve null si no cambia nada.
create or replace function score_mark_qr(p_team uuid, p_qr uuid, p_summary text)
returns bigint
language plpgsql
set search_path = public
as $$
declare
  v_count int;
  v_id bigint;
begin
  insert into task_results (team_id, task_id, status)
  select p_team, k.id, 'pending'
  from score_tasks k join qr_points q on q.id = k.qr_point_id
  where k.qr_point_id = p_qr and k.active
    and (q.assigned_team_ids is null or cardinality(q.assigned_team_ids) = 0 or p_team = any(q.assigned_team_ids))
  on conflict (team_id, task_id) do nothing;
  get diagnostics v_count = row_count;
  if v_count = 0 then
    return null;
  end if;
  insert into score_log (actor, action, team_id, target, summary)
  values ('QR', 'qr', p_team, p_qr::text, p_summary)
  returning id into v_id;
  return v_id;
end $$;

create or replace function score_reset(p_actor text)
returns bigint
language plpgsql
set search_path = public
as $$
declare
  v_id bigint;
begin
  delete from task_results where true;
  delete from bonus_awards where true;
  delete from score_extras where true;
  insert into score_log (actor, action, summary)
  values (coalesce(nullif(p_actor, ''), 'organizador'), 'reset', 'Marcador reiniciado')
  returning id into v_id;
  return v_id;
end $$;

-- Registra un cambio de configuración (puntos, nombres, pruebas) y sube la versión.
create or replace function score_log_config(p_actor text, p_summary text)
returns bigint
language sql
set search_path = public
as $$
  insert into score_log (actor, action, summary)
  values (coalesce(nullif(p_actor, ''), 'organizador'), 'config', p_summary)
  returning id;
$$;

revoke all on function score_set_task(uuid, uuid, text, text, text, text) from public;
revoke all on function score_set_award(uuid, uuid, text, text) from public;
revoke all on function score_add_extra(uuid, int, text, text, text) from public;
revoke all on function score_undo(bigint, text) from public;
revoke all on function score_undo_last(text) from public;
revoke all on function score_mark_qr(uuid, uuid, text) from public;
revoke all on function score_reset(text) from public;
revoke all on function score_log_config(text, text) from public;

revoke all on function archive_game(text) from public;
revoke all on function restore_game(bigint) from public;
do $$
begin
  if exists (select 1 from pg_roles where rolname = 'service_role') then
    grant execute on function archive_game(text) to service_role;
    grant execute on function restore_game(bigint) to service_role;
    grant execute on function score_set_task(uuid, uuid, text, text, text, text), score_set_award(uuid, uuid, text, text),
      score_add_extra(uuid, int, text, text, text), score_undo(bigint, text), score_undo_last(text),
      score_mark_qr(uuid, uuid, text), score_reset(text), score_log_config(text, text) to service_role;
  end if;
end $$;

-- Migración para bases creadas con versiones anteriores del script (el código era obligatorio).
alter table teams alter column join_code_hash drop not null;

alter table teams enable row level security;
alter table players enable row level security;
alter table qr_points enable row level security;
alter table scan_events enable row level security;
alter table game_archives enable row level security;
alter table envelope_state enable row level security;
alter table envelope_schedule enable row level security;
alter table score_activities enable row level security;
alter table score_tasks enable row level security;
alter table score_bonuses enable row level security;
alter table task_results enable row level security;
alter table bonus_awards enable row level security;
alter table score_extras enable row level security;
alter table score_log enable row level security;

-- Defensa en profundidad: además de RLS sin políticas, se retiran los permisos
-- que Supabase concede por defecto a los roles públicos (anon/authenticated).
do $$
declare r text;
begin
  foreach r in array array['anon', 'authenticated'] loop
    if exists (select 1 from pg_roles where rolname = r) then
      execute format('revoke all on teams, players, qr_points, scan_events, game_archives, envelope_state, envelope_schedule, '
        'score_activities, score_tasks, score_bonuses, task_results, bonus_awards, score_extras, score_log from %I', r);
      execute format('revoke all on function archive_game(text), restore_game(bigint), '
        'score_set_task(uuid, uuid, text, text, text, text), score_set_award(uuid, uuid, text, text), '
        'score_add_extra(uuid, int, text, text, text), score_undo(bigint, text), score_undo_last(text), '
        'score_mark_qr(uuid, uuid, text), score_reset(text), score_log_config(text, text) from %I', r);
      execute format('revoke all on sequence scan_events_id_seq, game_archives_id_seq, score_extras_id_seq, score_log_id_seq from %I', r);
    end if;
  end loop;
end $$;

-- Equipos fijos de la gymkana. Los jugadores eligen uno; no pueden crear equipos nuevos.
-- Se identifican por su clave fija: renombrarlos en el panel no crea duplicados al volver a ejecutar el script.
insert into teams (name, slug, sort_order)
select v.name, v.slug, v.sort_order
from (values ('Calabaza', 'calabaza', 1), ('Fantasma', 'fantasma', 2), ('Bruja', 'bruja', 3), ('Zombi', 'zombie', 4))
  as v(name, slug, sort_order)
where not exists (select 1 from teams t where t.slug = v.slug)
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

-- Rutas del mapa del muerto (qué equipos tienen cada QR). Solo se rellenan si están vacías:
-- lo que cambies en /admin/qr no se pisa al volver a ejecutar el script.
update qr_points q set assigned_team_ids = array(select id from teams where slug in ('calabaza', 'bruja'))
where q.slug like 'parkour-%' and q.assigned_team_ids is null;
update qr_points q set assigned_team_ids = array(select id from teams where slug in ('calabaza', 'zombie'))
where q.slug like 'rocodromo-%' and q.assigned_team_ids is null;
update qr_points q set assigned_team_ids = array(select id from teams where slug in ('fantasma', 'bruja'))
where q.slug like 'zigzag-%' and q.assigned_team_ids is null;
update qr_points q set assigned_team_ids = array(select id from teams where slug in ('fantasma', 'zombie'))
where q.slug like 'anfiteatro-%' and q.assigned_team_ids is null;

-- Elimina los QR de ejemplo de versiones anteriores del script (y sus escaneos de prueba).
delete from qr_points where slug in ('calabaza-x7k9mq', 'cripta-b4n2vz', 'bruja-k8w3rt');

-- ===== Datos iniciales del marcador (editables en /admin/puntos/config) =====
-- Solo se insertan si faltan: volver a ejecutar el script no pisa lo que cambies en el panel.
insert into score_activities (id, name, sort_order) values
  ('tesoro', 'Un amigo es un tesoro', 1),
  ('casa', 'La casa maldita', 2),
  ('objetos', 'Los objetos perdidos', 3),
  ('mapa', 'El mapa del muerto', 4),
  ('ritual', 'El ritual', 5)
on conflict (id) do nothing;
update score_activities set short_name = case id
    when 'tesoro' then 'Tesoro' when 'casa' then 'Casa' when 'objetos' then 'Objetos'
    when 'mapa' then 'Mapa' when 'ritual' then 'Ritual' else name end
where short_name is null;

insert into score_tasks (key, activity_id, label, points, group_label, sort_order, counts_for_bonus) values
  ('tesoro-1', 'tesoro', 'Figura de acrosport con todos los miembros', 3, null, 1, true),
  ('tesoro-2', 'tesoro', 'Disfraz que haga «match» con el equipo, foto juntos', 3, null, 2, true),
  ('tesoro-3', 'tesoro', 'Alguien que no está en la fiesta se toma una cerveza con el equipo', 3, null, 3, true),
  ('tesoro-4', 'tesoro', 'Persona disfrazada se hace un selfi con todo el equipo', 3, null, 4, true),
  ('tesoro-5', 'tesoro', 'Vídeo del equipo compartiendo cervezas', 3, null, 5, true),
  ('tesoro-6', 'tesoro', 'Foto con alguien que lleve algo naranja', 3, null, 6, true),
  ('tesoro-7', 'tesoro', 'Vídeo: «FELIZ HALLOWEEN, EQUIPO [nombre]»', 3, null, 7, true),
  ('tesoro-8', 'tesoro', 'Disfraz que dé más miedo que el de cualquier miembro', 3, null, 8, true),
  ('casa-1', 'casa', 'Algo que utilizaría un vampiro', 2, null, 1, true),
  ('casa-2', 'casa', 'Objeto más extraño adorado como reliquia sagrada', 2, null, 2, true),
  ('casa-3', 'casa', 'Objeto para recrear una escena de película de terror', 2, null, 3, true),
  ('casa-4', 'casa', 'Objeto fuera de lugar, foto dramática señalándolo', 2, null, 4, true),
  ('casa-5', 'casa', '«Tesoro» y foto del equipo como si acabara de robarlo', 2, null, 5, true),
  ('casa-6', 'casa', 'Objeto pequeño vendido como producto de lujo (vídeo 10 s)', 2, null, 6, true),
  ('objetos-1', 'objetos', 'Hoja seca', 1, 'Fáciles', 1, true),
  ('objetos-2', 'objetos', 'Algo verde', 1, 'Fáciles', 2, true),
  ('objetos-3', 'objetos', 'Piedra grande', 1, 'Fáciles', 3, true),
  ('objetos-4', 'objetos', 'Ceniza (fría)', 1, 'Fáciles', 4, true),
  ('objetos-5', 'objetos', 'Objeto con la inicial del equipo', 1, 'Fáciles', 5, true),
  ('objetos-6', 'objetos', 'Objeto de disfraz de alguien que NO está en la fiesta', 3, 'Difíciles', 6, true),
  ('objetos-7', 'objetos', 'Una calabaza', 3, 'Difíciles', 7, true),
  ('objetos-8', 'objetos', 'Objeto que nadie pensaba que sería posible conseguir', 5, 'Especial', 8, true),
  ('mapa-vito-sara', 'mapa', 'Vito y Sara', 2, null, 1, true),
  ('mapa-vito-gorra', 'mapa', 'Vito con gorra azul', 2, null, 2, true),
  ('mapa-harley', 'mapa', 'La Harley', 2, null, 3, true),
  ('mapa-parkour', 'mapa', 'QR Parkour', 2, 'QR', 4, true),
  ('mapa-rocodromo', 'mapa', 'QR Rocódromo', 2, 'QR', 5, true),
  ('mapa-zigzag', 'mapa', 'QR Zigzag', 2, 'QR', 6, true),
  ('mapa-anfiteatro', 'mapa', 'QR Anfiteatro', 2, 'QR', 7, true),
  ('ritual-1', 'ritual', 'Coreografía de 20 segundos', 4, null, 1, true),
  ('ritual-2', 'ritual', 'Escena de terror sin hablar', 4, null, 2, true),
  ('ritual-3', 'ritual', 'Foto con TODO el equipo en el aire', 4, null, 3, true),
  ('ritual-4', 'ritual', 'Leyenda de la casa con voz misteriosa (vídeo)', 4, null, 4, true),
  ('ritual-5', 'ritual', 'Conjuro absurdo con cinco palabras inventadas', 4, null, 5, true),
  ('ritual-6', 'ritual', 'Pócima falsa presentada como anuncio de TV', 4, null, 6, true),
  ('ritual-7', 'ritual', 'Película de terror que adivina una persona externa', 4, null, 7, true),
  ('ritual-8', 'ritual', 'Cartel de película de terror protagonizada por el equipo', 4, null, 8, true),
  ('ritual-final', 'ritual', 'Prueba final: grito de guerra en vídeo', 0, 'Prueba final', 9, false)
on conflict (key) do nothing;

-- Las localizaciones con QR se enlazan a su punto: el escaneo las deja «pendientes» y solo cuentan para su ruta.
update score_tasks k set qr_point_id = q.id
from qr_points q
where k.qr_point_id is null and k.key = 'mapa-' || split_part(q.slug, '-', 1);

insert into score_bonuses (key, activity_id, label, kind, threshold, points, sort_order) values
  ('tesoro-todas', 'tesoro', 'Bonus tesoro: las 8 pruebas', 'all', null, 10, 1),
  ('casa-creativa', 'casa', 'La prueba más creativa', 'manual', null, 5, 1),
  ('mapa-todas', 'mapa', 'Bonus mapa: las 5 localizaciones', 'all', null, 10, 1),
  ('ritual-5', 'ritual', 'Bonus ritual: al menos 5 pruebas', 'min', 5, 5, 1),
  ('ritual-todas', 'ritual', 'Bonus ritual: las 8 pruebas', 'all', null, 15, 2)
on conflict (key) do nothing;
