// Conversión de la hora del evento (Europe/Madrid) para las aperturas programadas de sobres.
import { test } from "node:test";
import assert from "node:assert/strict";
import { localToUtc, utcToLocalInput } from "./time.ts";

test("hora de Madrid → UTC, en invierno y en verano", () => {
  assert.equal(localToUtc("2026-10-31T22:30", "Europe/Madrid")!.toISOString(), "2026-10-31T21:30:00.000Z");
  assert.equal(localToUtc("2026-08-15T22:30", "Europe/Madrid")!.toISOString(), "2026-08-15T20:30:00.000Z");
});

test("alrededor del cambio de hora (25/10/2026)", () => {
  assert.equal(localToUtc("2026-10-25T01:30", "Europe/Madrid")!.toISOString(), "2026-10-24T23:30:00.000Z");
  assert.equal(localToUtc("2026-10-25T04:00", "Europe/Madrid")!.toISOString(), "2026-10-25T03:00:00.000Z");
});

test("UTC → valor del campo de fecha y hora", () => {
  assert.equal(utcToLocalInput("2026-10-31T21:30:00.000Z", "Europe/Madrid"), "2026-10-31T22:30");
  assert.equal(utcToLocalInput("2026-08-15T20:30:00Z", "Europe/Madrid"), "2026-08-15T22:30");
});

test("formato no válido", () => {
  assert.equal(localToUtc("mañana a las 10"), null);
});
