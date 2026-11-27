import test from "node:test";
import assert from "node:assert/strict";
import {
  puedeAdministrarUsuarios,
  puedeEditarTramites,
  puedeEliminarTramite,
} from "../src/services/permisos";

test("cualquier funcionario crea y edita trámites", () => {
  assert.equal(puedeEditarTramites("funcionario"), true);
  assert.equal(puedeEditarTramites("admin"), true);
  assert.equal(puedeEditarTramites(undefined), false);
});

test("solo admin elimina trámites y administra usuarios (ADR-05)", () => {
  assert.equal(puedeEliminarTramite("admin"), true);
  assert.equal(puedeEliminarTramite("funcionario"), false);
  assert.equal(puedeAdministrarUsuarios("admin"), true);
  assert.equal(puedeAdministrarUsuarios("funcionario"), false);
  assert.equal(puedeEliminarTramite(undefined), false);
  assert.equal(puedeAdministrarUsuarios(undefined), false);
});
