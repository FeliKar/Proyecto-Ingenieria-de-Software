import "./soporte/entornoPanel"; // debe ir primero: fija las rutas temporales
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  actualizarFicha,
  crearFicha,
  eliminarFicha,
  ErrorPanel,
} from "../../src/services/panelService";
import {
  leerCatalogo,
  leerFichasCompletas,
} from "../../src/services/fichasLocalStore";

async function rechazo(operacion: Promise<unknown>): Promise<ErrorPanel> {
  try {
    await operacion;
  } catch (error) {
    assert.ok(error instanceof ErrorPanel, `Error inesperado: ${error}`);
    return error;
  }
  throw new assert.AssertionError({ message: "Se esperaba un ErrorPanel" });
}

const enlace = "https://tramites.penalolen.cl/Tramites/ver/taller-de-ceramica";

describe("panelService · fichas completas", () => {
  it("crea una ficha completa y queda guardada", async () => {
    const ficha = await crearFicha({
      tramite: "Taller de cerámica",
      tipo: "completa",
      requisitos: ["Cédula de identidad vigente."],
      pasos: ["Inscribirse en la dirección de cultura."],
      vigencia: "1 año.",
      enlace_oficial: enlace,
    });

    assert.equal(ficha.id, "taller-de-ceramica");
    const guardadas = leerFichasCompletas();
    assert.ok(guardadas.some((f) => f.id === "taller-de-ceramica"));
  });

  it("rechaza una ficha sin enlace https (US-09)", async () => {
    const error = await rechazo(
      crearFicha({
        tramite: "Trámite sin enlace",
        tipo: "completa",
        requisitos: ["Cédula."],
        pasos: ["Paso."],
        vigencia: "1 año.",
        enlace_oficial: "http://ejemplo.cl/permiso",
      })
    );
    assert.equal(error.status, 400);
    assert.match(error.message, /enlace oficial/);
  });

  it("rechaza una ficha incompleta", async () => {
    const error = await rechazo(
      crearFicha({
        tramite: "A medio escribir",
        tipo: "completa",
        requisitos: [],
        pasos: [],
        vigencia: "",
        enlace_oficial: enlace,
      })
    );
    assert.equal(error.status, 400);
    assert.match(error.message, /requisitos vacíos/);
  });

  it("rechaza un id duplicado", async () => {
    const error = await rechazo(
      crearFicha({
        id: "licencia-b-primera",
        tramite: "Otra licencia",
        tipo: "completa",
        requisitos: ["Cédula."],
        pasos: ["Paso."],
        vigencia: "1 año.",
        enlace_oficial: "https://tramites.penalolen.cl/Tramites/ver/otra",
      })
    );
    assert.equal(error.status, 409);
  });

  it("edita la vigencia y elimina la ficha", async () => {
    await actualizarFicha("licencia-b-primera", {
      tramite: "Primera licencia clase B",
      tipo: "completa",
      requisitos: ["Cédula."],
      pasos: ["Paso."],
      vigencia: "12 años.",
      enlace_oficial: "https://tramites.penalolen.cl/Tramites/ver/primera-licencia-clase-b",
    });
    const editada = leerFichasCompletas().find((f) => f.id === "licencia-b-primera");
    assert.equal(editada?.vigencia, "12 años.");

    await eliminarFicha("licencia-b-primera");
    assert.ok(!leerFichasCompletas().some((f) => f.id === "licencia-b-primera"));
  });

  it("responde 404 al editar algo que no existe", async () => {
    const error = await rechazo(
      actualizarFicha("no-existe", {
        tramite: "X",
        requisitos: ["Cédula."],
        pasos: ["Paso."],
        vigencia: "1 año.",
        enlace_oficial: enlace,
      })
    );
    assert.equal(error.status, 404);
  });
});

describe("panelService · catálogo (US-09)", () => {
  it("crea un trámite de solo enlace sin requisitos", async () => {
    const ficha = await crearFicha({
      tramite: "Trámite de catálogo",
      tipo: "catalogo",
      enlace_oficial: "https://tramites.penalolen.cl/Tramites/ver/uno",
    });

    assert.equal(ficha.solo_enlace, true);
    assert.deepEqual(ficha.requisitos, []);
    assert.ok(
      leerCatalogo().some((e) => String(e.enlace_oficial).includes("uno"))
    );
    assert.ok(!leerFichasCompletas().some((f) => f.id === ficha.id));
  });

  it("no admite requisitos en el catálogo", async () => {
    const error = await rechazo(
      crearFicha({
        tramite: "Catálogo con requisitos",
        tipo: "catalogo",
        requisitos: ["Requisito inventado."],
        enlace_oficial: "https://tramites.penalolen.cl/Tramites/ver/dos",
      })
    );
    assert.equal(error.status, 400);
    assert.match(error.message, /catálogo/);
  });

  it("rechaza un enlace http en el catálogo", async () => {
    const error = await rechazo(
      crearFicha({
        tramite: "Catálogo sin https",
        tipo: "catalogo",
        enlace_oficial: "http://tramites.penalolen.cl/ver/tres",
      })
    );
    assert.equal(error.status, 400);
    assert.match(error.message, /enlace oficial/);
  });
});
