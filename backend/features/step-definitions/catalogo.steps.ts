import { Then } from "@cucumber/cucumber";
import assert from "node:assert";
import { respuesta } from "../support/contexto";

/**
 * El catálogo oficial solo aporta nombre y enlace: nunca requisitos, pasos ni
 * vigencia inventados (US-09 / ADR-01). La ficha además no debe arrastrar los
 * datos de una ficha completa distinta.
 */
Then(
  "la respuesta es un trámite de solo enlace con el enlace oficial",
  function () {
    assert.strictEqual(respuesta().status, 200);
    assert.strictEqual(respuesta().body.encontrado, true);
    const { ficha } = respuesta().body;
    assert.strictEqual(ficha.solo_enlace, true);
    assert.ok(
      typeof ficha.enlace_oficial === "string" &&
        ficha.enlace_oficial.startsWith(
          "https://tramites.penalolen.cl/Tramites/ver/"
        )
    );
    assert.ok(Array.isArray(ficha.requisitos));
    assert.strictEqual(ficha.requisitos.length, 0);
    assert.ok(Array.isArray(ficha.pasos));
    assert.strictEqual(ficha.pasos.length, 0);
    assert.strictEqual(ficha.vigencia, "");
  }
);

/**
 * Cuando dos trámites empatan, el asistente ofrece varias opciones en vez de
 * elegir uno en silencio o abstenerse sin más.
 */
Then(
  "la respuesta ofrece {int} opciones de trámite",
  function (cantidad: number) {
    assert.strictEqual(respuesta().status, 200);
    assert.strictEqual(respuesta().body.encontrado, false);
    assert.strictEqual(respuesta().body.abstencion, true);
    assert.strictEqual(respuesta().body.motivo, "empate");
    const opciones = respuesta().body.opciones as {
      id: string;
      tramite: string;
    }[];
    assert.ok(Array.isArray(opciones));
    assert.strictEqual(opciones.length, cantidad);
    for (const opcion of opciones) {
      assert.ok(opcion.id.length > 0);
      assert.ok(opcion.tramite.length > 0);
    }
  }
);
