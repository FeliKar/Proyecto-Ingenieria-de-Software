import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { TramiteService } from "../../src/services/tramiteService";
import {
  ABSTENCION_MENSAJE,
  CANAL_DERIVACION,
} from "../../src/constants/abstention";

const servicio = TramiteService.desdeDatos();

describe("TramiteService.consultar", () => {
  it("entrega la ficha cuando la consulta es clara", () => {
    const r = servicio.consultar("quiero sacar mi primera licencia clase B");
    assert.equal(r.encontrado, true);
    if (r.encontrado) assert.equal(r.ficha.tramite, "Primera licencia clase B");
  });

  it("se abstiene y deriva al canal oficial si no hay trámite", () => {
    const r = servicio.consultar("lisencia de perro");
    assert.equal(r.encontrado, false);
    if (!r.encontrado) {
      assert.equal(r.abstencion, true);
      assert.equal(r.mensaje, ABSTENCION_MENSAJE);
      assert.deepEqual(r.canal_derivacion, CANAL_DERIVACION);
      assert.equal("ficha" in r, false);
    }
  });

  it("pide elegir cuando la consulta es ambigua", () => {
    const r = servicio.consultar("licencia B");
    assert.equal(r.encontrado, false);
    if (!r.encontrado) {
      assert.equal(r.motivo, "ambiguo");
      assert.ok(Array.isArray(r.opciones) && r.opciones.length > 1);
    }
  });
});

describe("TramiteService.buscarPorId", () => {
  it("devuelve null para un id inexistente (no inventa una ficha)", () => {
    assert.equal(servicio.buscarPorId("no-existe"), null);
  });

  it("devuelve la ficha cuando el id existe", () => {
    const r = servicio.consultar("licencia B");
    const id = !r.encontrado && r.opciones ? r.opciones[0].id : "";
    assert.ok(servicio.buscarPorId(id));
  });
});
