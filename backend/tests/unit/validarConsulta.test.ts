import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  validarConsulta,
  LARGO_MAXIMO_PREGUNTA,
} from "../../src/middleware/validarConsulta";

// Respuesta falsa que registra el estado y el cuerpo enviados.
function ejecutar(body: unknown) {
  const res: any = { codigo: 0, cuerpo: undefined };
  res.status = (c: number) => ((res.codigo = c), res);
  res.json = (b: unknown) => ((res.cuerpo = b), res);
  let siguio = false;
  validarConsulta({ body } as any, res, () => {
    siguio = true;
  });
  return { codigo: res.codigo, siguio };
}

describe("validarConsulta", () => {
  it("deja pasar una pregunta normal", () => {
    assert.deepEqual(ejecutar({ pregunta: "licencia B" }), { codigo: 0, siguio: true });
  });

  it("deja pasar una pregunta del largo máximo exacto", () => {
    const r = ejecutar({ pregunta: "a".repeat(LARGO_MAXIMO_PREGUNTA) });
    assert.equal(r.siguio, true);
  });

  it("responde 413 si la pregunta supera el largo máximo", () => {
    const r = ejecutar({ pregunta: "a".repeat(LARGO_MAXIMO_PREGUNTA + 1) });
    assert.deepEqual(r, { codigo: 413, siguio: false });
  });

  it("responde 400 si la pregunta está vacía o no es texto", () => {
    assert.equal(ejecutar({ pregunta: "   " }).codigo, 400);
    assert.equal(ejecutar({ pregunta: 42 }).codigo, 400);
    assert.equal(ejecutar(undefined).codigo, 400);
  });

  it("deja pasar una elección por id aunque no traiga pregunta", () => {
    assert.equal(ejecutar({ tramiteId: "primera-licencia-b" }).siguio, true);
  });
});
