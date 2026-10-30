import { Then } from "@cucumber/cucumber";
import assert from "node:assert";
import request from "supertest";
import app from "../../src/app";
import fichas from "../../src/data/fichas.json";
import catalogo from "../../src/data/catalogo.json";
import type { FichaTramite } from "../../src/types/ficha";
import {
  cargarCatalogo,
  cargarFichasValidas,
} from "../../src/services/fichaValidator";
import { respuesta } from "../support/contexto";

/**
 * Abstención estricta: el asistente no encontró ningún trámite. A diferencia de
 * "el asistente se abstiene de responder", no acepta respuestas con opciones
 * (ambiguo / empate), que también llegan con `abstencion: true`.
 */
Then("el asistente no encuentra el trámite", function () {
  const body = respuesta().body;
  assert.strictEqual(respuesta().status, 200);
  assert.strictEqual(body.encontrado, false);
  assert.strictEqual(body.abstencion, true);
  assert.strictEqual(
    body.motivo,
    "sin-match",
    `Se esperaba sin-match y llegó '${body.motivo}'`
  );
  assert.strictEqual(body.ficha, undefined);
  assert.ok(
    body.opciones === undefined || body.opciones.length === 0,
    "Una abstención no debe ofrecer opciones de trámite"
  );
});

Then(
  "el asistente ofrece opciones para elegir con motivo {string}",
  function (motivo: string) {
    const body = respuesta().body;
    assert.strictEqual(respuesta().status, 200);
    assert.strictEqual(body.encontrado, false);
    assert.strictEqual(body.motivo, motivo);
    assert.ok(Array.isArray(body.opciones) && body.opciones.length > 0);
  }
);

/**
 * Recorre el catálogo tal como lo carga la API (sin los duplicados de las
 * fichas completas) y consulta cada trámite por su nombre oficial.
 */
Then(
  "cada trámite del catálogo se encuentra por su nombre oficial",
  async function () {
    const fichasValidas = cargarFichasValidas(fichas as FichaTramite[]);
    const tramites = cargarCatalogo(catalogo, fichasValidas);
    assert.ok(tramites.length > 0, "El catálogo cargado está vacío");

    const fallidos: string[] = [];
    for (const tramite of tramites) {
      const res = await request(app)
        .post("/api/tramites/consultar")
        .send({ pregunta: tramite.tramite });
      if (res.body.ficha?.id !== tramite.id) {
        fallidos.push(`${tramite.tramite} → ${res.body.motivo}`);
      }
    }
    assert.deepStrictEqual(
      fallidos,
      [],
      `No se encuentran por su nombre (${fallidos.length} de ${tramites.length}):\n${fallidos.join("\n")}`
    );
  }
);
