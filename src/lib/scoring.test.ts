// Tests de la lógica de puntuación. Se ejecutan con `npm test` (test runner de Node, sin dependencias).
import { test } from "node:test";
import assert from "node:assert/strict";
import { computeScores, type ScoreInput, type ScoreTask, type TaskStatus } from "./scoring.ts";

const TEAMS = [
  { id: "cal", name: "Calabaza", slug: "calabaza", sortOrder: 1 },
  { id: "fan", name: "Fantasma", slug: "fantasma", sortOrder: 2 },
  { id: "bru", name: "Bruja", slug: "bruja", sortOrder: 3 },
  { id: "zom", name: "Zombi", slug: "zombie", sortOrder: 4 },
];

function task(id: string, activityId: string, points: number, extra: Partial<ScoreTask> = {}): ScoreTask {
  return {
    id,
    activityId,
    label: id,
    points,
    groupLabel: null,
    sortOrder: 0,
    countsForBonus: true,
    qrPointId: null,
    active: true,
    ...extra,
  };
}

/** Configuración equivalente a los datos iniciales de supabase/schema.sql. */
function baseInput(): ScoreInput {
  const tasks: ScoreTask[] = [
    ...Array.from({ length: 8 }, (_, i) => task(`tesoro-${i + 1}`, "tesoro", 3)),
    ...Array.from({ length: 6 }, (_, i) => task(`casa-${i + 1}`, "casa", 2)),
    ...[1, 1, 1, 1, 1, 3, 3, 5].map((p, i) => task(`objetos-${i + 1}`, "objetos", p)),
    task("mapa-vito-sara", "mapa", 2),
    task("mapa-vito-gorra", "mapa", 2),
    task("mapa-harley", "mapa", 2),
    task("mapa-parkour", "mapa", 2, { qrPointId: "qr-parkour" }),
    task("mapa-rocodromo", "mapa", 2, { qrPointId: "qr-rocodromo" }),
    task("mapa-zigzag", "mapa", 2, { qrPointId: "qr-zigzag" }),
    task("mapa-anfiteatro", "mapa", 2, { qrPointId: "qr-anfiteatro" }),
    ...Array.from({ length: 8 }, (_, i) => task(`ritual-${i + 1}`, "ritual", 4)),
    task("ritual-final", "ritual", 0, { countsForBonus: false }),
  ];
  return {
    teams: TEAMS,
    activities: [
      { id: "tesoro", name: "Un amigo es un tesoro", sortOrder: 1 },
      { id: "casa", name: "La casa maldita", sortOrder: 2 },
      { id: "objetos", name: "Los objetos perdidos", sortOrder: 3 },
      { id: "mapa", name: "El mapa del muerto", sortOrder: 4 },
      { id: "ritual", name: "El ritual", sortOrder: 5 },
    ],
    tasks,
    bonuses: [
      { id: "tesoro-todas", activityId: "tesoro", label: "Tesoro 8/8", kind: "all", threshold: null, points: 10, sortOrder: 1, active: true },
      { id: "casa-creativa", activityId: "casa", label: "Más creativa", kind: "manual", threshold: null, points: 5, sortOrder: 1, active: true },
      { id: "mapa-todas", activityId: "mapa", label: "Mapa 5/5", kind: "all", threshold: null, points: 10, sortOrder: 1, active: true },
      { id: "ritual-5", activityId: "ritual", label: "Ritual ≥5", kind: "min", threshold: 5, points: 5, sortOrder: 1, active: true },
      { id: "ritual-todas", activityId: "ritual", label: "Ritual 8/8", kind: "all", threshold: null, points: 15, sortOrder: 2, active: true },
    ],
    results: [],
    awards: [],
    extras: [],
    qrRoutes: {
      "qr-parkour": ["cal", "bru"],
      "qr-rocodromo": ["cal", "zom"],
      "qr-zigzag": ["fan", "bru"],
      "qr-anfiteatro": ["fan", "zom"],
    },
  };
}

function mark(input: ScoreInput, teamId: string, taskIds: string[], status: TaskStatus = "valid") {
  for (const taskId of taskIds) input.results.push({ teamId, taskId, status });
}

const range = (prefix: string, n: number) => Array.from({ length: n }, (_, i) => `${prefix}-${i + 1}`);
const team = (scores: ReturnType<typeof computeScores>, id: string) => scores.find((s) => s.teamId === id)!;
const activity = (scores: ReturnType<typeof computeScores>, teamId: string, activityId: string) =>
  team(scores, teamId).activities.find((a) => a.activityId === activityId)!;

test("sin pruebas, todos a 0 y empatados en el 1.º puesto", () => {
  const scores = computeScores(baseInput());
  assert.deepEqual(scores.map((s) => s.total), [0, 0, 0, 0]);
  assert.deepEqual(scores.map((s) => s.rank), [1, 1, 1, 1]);
  // En empate se respeta el orden de los equipos
  assert.deepEqual(scores.map((s) => s.teamId), ["cal", "fan", "bru", "zom"]);
});

test("un amigo es un tesoro: 3 por prueba y +10 solo con las 8", () => {
  const input = baseInput();
  mark(input, "cal", range("tesoro", 7));
  let a = activity(computeScores(input), "cal", "tesoro");
  assert.equal(a.points, 21);
  assert.equal(a.bonuses[0].achieved, false);
  assert.equal(a.bonuses[0].progress, "7/8");

  mark(input, "cal", ["tesoro-8"]);
  a = activity(computeScores(input), "cal", "tesoro");
  assert.equal(a.points, 24 + 10);
  assert.equal(a.bonuses[0].progress, "8/8");
});

test("solo puntúan las pruebas válidas (no las pendientes ni las no válidas)", () => {
  const input = baseInput();
  mark(input, "fan", ["casa-1"], "valid");
  mark(input, "fan", ["casa-2"], "invalid");
  mark(input, "fan", ["casa-3"], "pending");
  assert.equal(team(computeScores(input), "fan").total, 2);
});

test("la casa maldita: +5 a la más creativa, solo para el equipo que la tiene", () => {
  const input = baseInput();
  mark(input, "bru", ["casa-1", "casa-2"]);
  input.awards.push({ bonusId: "casa-creativa", teamId: "bru" });
  const scores = computeScores(input);
  assert.equal(activity(scores, "bru", "casa").points, 4 + 5);
  assert.equal(activity(scores, "cal", "casa").bonusPoints, 0);
});

test("los objetos perdidos: fáciles 1, difíciles 3, especial 5", () => {
  const input = baseInput();
  mark(input, "zom", ["objetos-1", "objetos-2", "objetos-6", "objetos-8"]);
  assert.equal(activity(computeScores(input), "zom", "objetos").points, 1 + 1 + 3 + 5);
});

test("mapa del muerto: cada equipo solo puntúa los QR de su ruta y el bonus pide sus 5", () => {
  const input = baseInput();
  // Calabaza: Parkour y Rocódromo; un Zigzag válido no le cuenta (no es de su ruta)
  mark(input, "cal", ["mapa-vito-sara", "mapa-vito-gorra", "mapa-harley", "mapa-parkour", "mapa-zigzag"]);
  let a = activity(computeScores(input), "cal", "mapa");
  assert.equal(a.applicable, 5);
  assert.equal(a.points, 8);
  assert.equal(a.bonuses[0].progress, "4/5");

  mark(input, "cal", ["mapa-rocodromo"]);
  a = activity(computeScores(input), "cal", "mapa");
  assert.equal(a.points, 10 + 10);
});

test("cambiar la ruta de un QR cambia a quién le cuenta", () => {
  const input = baseInput();
  mark(input, "fan", ["mapa-parkour"]);
  assert.equal(activity(computeScores(input), "fan", "mapa").points, 0);
  input.qrRoutes["qr-parkour"] = ["fan"];
  assert.equal(activity(computeScores(input), "fan", "mapa").points, 2);
});

test("el ritual: +5 con al menos 5 y +15 con las 8, acumulables; el grito no cuenta", () => {
  const input = baseInput();
  mark(input, "bru", [...range("ritual", 4), "ritual-final"]);
  let a = activity(computeScores(input), "bru", "ritual");
  assert.equal(a.points, 16);
  assert.equal(a.applicable, 8);

  mark(input, "bru", ["ritual-5"]);
  a = activity(computeScores(input), "bru", "ritual");
  assert.equal(a.points, 20 + 5);

  mark(input, "bru", ["ritual-6", "ritual-7", "ritual-8"]);
  a = activity(computeScores(input), "bru", "ritual");
  assert.equal(a.points, 32 + 5 + 15);
  assert.deepEqual(a.bonuses.map((b) => b.achieved), [true, true]);
});

test("extras de creatividad suman y restan", () => {
  const input = baseInput();
  mark(input, "zom", ["casa-1"]);
  input.extras.push({ teamId: "zom", points: 5 }, { teamId: "zom", points: -2 });
  const z = team(computeScores(input), "zom");
  assert.equal(z.extras, 3);
  assert.equal(z.total, 2 + 3);
});

test("empates: puestos 1, 1, 3, 4", () => {
  const input = baseInput();
  mark(input, "cal", ["casa-1", "casa-2"]); // 4
  mark(input, "zom", ["objetos-6", "objetos-1"]); // 4
  mark(input, "bru", ["casa-3"]); // 2
  const scores = computeScores(input);
  assert.deepEqual(scores.map((s) => [s.teamId, s.total, s.rank]), [
    ["cal", 4, 1],
    ["zom", 4, 1],
    ["bru", 2, 3],
    ["fan", 0, 4],
  ]);
});

test("recálculo: cambiar los puntos de una prueba o de un bonus cambia el total", () => {
  const input = baseInput();
  mark(input, "fan", range("tesoro", 8));
  assert.equal(team(computeScores(input), "fan").total, 34);

  input.tasks.find((t) => t.id === "tesoro-1")!.points = 10;
  assert.equal(team(computeScores(input), "fan").total, 41);

  input.bonuses.find((b) => b.id === "tesoro-todas")!.points = 20;
  assert.equal(team(computeScores(input), "fan").total, 51);
});

test("una prueba desactivada no puntúa ni cuenta para el bonus", () => {
  const input = baseInput();
  mark(input, "cal", range("tesoro", 7));
  input.tasks.find((t) => t.id === "tesoro-8")!.active = false;
  const a = activity(computeScores(input), "cal", "tesoro");
  assert.equal(a.applicable, 7);
  assert.equal(a.points, 21 + 10);
});

test("un bonus desactivado no suma", () => {
  const input = baseInput();
  mark(input, "cal", range("tesoro", 8));
  input.bonuses.find((b) => b.id === "tesoro-todas")!.active = false;
  assert.equal(team(computeScores(input), "cal").total, 24);
});

test("el total es la suma de actividades más extras", () => {
  const input = baseInput();
  mark(input, "bru", [...range("tesoro", 8), "casa-1", "objetos-8", "mapa-harley", ...range("ritual", 5)]);
  input.awards.push({ bonusId: "casa-creativa", teamId: "bru" });
  input.extras.push({ teamId: "bru", points: 1 });
  const b = team(computeScores(input), "bru");
  const sum = b.activities.reduce((s, a) => s + a.points, 0) + b.extras;
  assert.equal(b.total, sum);
  assert.equal(b.total, 34 + (2 + 5) + 5 + 2 + (20 + 5) + 1);
});
