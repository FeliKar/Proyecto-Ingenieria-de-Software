import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  CANAL_DERIVACION,
  mensajeAmbiguoClase,
} from "../../src/constants/abstention";

describe("mensajeAmbiguoClase", () => {
  it("menciona la clase en mayúscula", () => {
    assert.match(mensajeAmbiguoClase("b"), /licencia clase B\./);
  });

  it("no valida la clase: una clase inexistente se muestra tal cual", () => {
    assert.match(mensajeAmbiguoClase("z"), /licencia clase Z\./);
  });

  it("no valida la clase: una clase vacía deja el mensaje sin letra", () => {
    assert.match(mensajeAmbiguoClase(""), /licencia clase \./);
  });

  it("no recorta espacios de la clase", () => {
    assert.match(mensajeAmbiguoClase(" b "), /licencia clase  B \./);
  });
});

describe("CANAL_DERIVACION", () => {
  it("apunta a un sitio oficial https", () => {
    assert.ok(CANAL_DERIVACION.url.startsWith("https://"));
  });
});
