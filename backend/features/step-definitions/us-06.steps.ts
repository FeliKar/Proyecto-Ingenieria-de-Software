import { Given, Then } from "@cucumber/cucumber";
import assert from "node:assert";
import fs from "node:fs";
import path from "node:path";
import type { FichaTramite } from "../../src/types/ficha";
import {
  cargarFichasValidas,
  esEnlaceOficialValido,
  motivoFichaInvalida,
} from "../../src/services/fichaValidator";
import { respuesta } from "../support/contexto";

function leerFichas(): FichaTramite[] {
  const dataPath = path.join(__dirname, "../../src/data/fichas.json");
  return JSON.parse(fs.readFileSync(dataPath, "utf-8")) as FichaTramite[];
}

Then("el enlace_oficial de la respuesta no está vacío", function () {
  const enlace = respuesta().body.ficha?.enlace_oficial;
  assert.strictEqual(typeof enlace, "string");
  assert.ok(enlace.trim().length > 0);
});

Then(
  "el enlace_oficial de la respuesta comienza con {string}",
  function (prefijo: string) {
    assert.ok(
      String(respuesta().body.ficha?.enlace_oficial).startsWith(prefijo),
      `El enlace oficial debería comenzar con '${prefijo}'`
    );
  }
);

Then(
  "el enlace_oficial de la respuesta apunta a tramites.penalolen.cl",
  function () {
    assert.ok(
      String(respuesta().body.ficha?.enlace_oficial).includes(
        "tramites.penalolen.cl"
      )
    );
  }
);

Then(
  "el enlace_oficial de la respuesta coincide con el de la ficha {string}",
  function (idFicha: string) {
    const esperada = leerFichas().find((f) => f.id === idFicha);
    assert.ok(esperada, `No existe la ficha '${idFicha}' en los datos`);
    assert.strictEqual(
      respuesta().body.ficha?.enlace_oficial,
      esperada!.enlace_oficial,
      `El enlace de la respuesta no coincide con el de la ficha '${idFicha}'`
    );
  }
);

Then("la respuesta no incluye enlace_oficial", function () {
  const body = respuesta().body;
  assert.ok(
    body.ficha === undefined || body.ficha.enlace_oficial === undefined,
    "La abstención no debe incluir el enlace_oficial de una ficha"
  );
});

// --- Caso "match válido sin enlace": la ficha se rechaza en validación ---

let fichaSinEnlace: Partial<FichaTramite>;

Given("una ficha sin el campo enlace_oficial", function () {
  fichaSinEnlace = {
    id: "ficha-prueba-sin-enlace",
    tramite: "Trámite de prueba sin enlace",
    requisitos: ["Requisito de prueba."],
    pasos: ["Paso de prueba."],
    vigencia: "1 año.",
    alias: ["trámite de prueba"],
  };
});

Then("la validación rechaza la ficha", function () {
  assert.strictEqual(
    esEnlaceOficialValido(fichaSinEnlace.enlace_oficial),
    false
  );
  const motivo = motivoFichaInvalida(fichaSinEnlace);
  assert.ok(motivo, "La ficha sin enlace_oficial debe ser rechazada");
  assert.match(motivo!, /enlace_oficial/i);
});

Then("no se sustituye por un enlace construido", function () {
  assert.strictEqual(fichaSinEnlace.enlace_oficial, undefined);
});

Then("la ficha no queda disponible para responder consultas", function () {
  const validas = cargarFichasValidas([fichaSinEnlace]);
  assert.strictEqual(validas.length, 0);
});
