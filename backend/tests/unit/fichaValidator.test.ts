import { describe, it, mock, afterEach } from "node:test";
import assert from "node:assert/strict";
import fichas from "../../src/data/fichas.json";
import catalogo from "../../src/data/catalogo.json";
import type { FichaTramite } from "../../src/types/ficha";
import {
  cargarCatalogo,
  cargarFichasValidas,
  esEnlaceOficialValido,
  motivoFichaInvalida,
} from "../../src/services/fichaValidator";

function fichaCompleta(cambios: Partial<FichaTramite> = {}): Partial<FichaTramite> {
  return {
    id: "tramite-prueba",
    tramite: "Trámite de prueba",
    requisitos: ["Cédula de identidad"],
    pasos: ["Ir al municipio"],
    vigencia: "1 año",
    alias: ["tramite prueba"],
    enlace_oficial: "https://tramites.penalolen.cl/prueba",
    ...cambios,
  };
}

describe("esEnlaceOficialValido", () => {
  it("acepta un enlace https", () => {
    assert.equal(esEnlaceOficialValido("https://x.cl"), true);
  });

  it("rechaza un enlace http", () => {
    assert.equal(esEnlaceOficialValido("http://x.cl"), false);
  });

  it("rechaza texto vacío o solo espacios", () => {
    assert.equal(esEnlaceOficialValido(""), false);
    assert.equal(esEnlaceOficialValido("   "), false);
  });

  it("rechaza valores que no son texto", () => {
    assert.equal(esEnlaceOficialValido(null), false);
    assert.equal(esEnlaceOficialValido(undefined), false);
    assert.equal(esEnlaceOficialValido(123), false);
  });

  it("rechaza un enlace con espacio inicial (startsWith no hace trim)", () => {
    assert.equal(esEnlaceOficialValido("  https://x.cl"), false);
  });
});

describe("motivoFichaInvalida", () => {
  it("devuelve null para una ficha completa", () => {
    assert.equal(motivoFichaInvalida(fichaCompleta()), null);
  });

  const casos: Array<[string, Partial<FichaTramite>, string]> = [
    ["id vacío", { id: "  " }, "id vacío"],
    ["trámite ausente", { tramite: undefined }, "trámite vacío"],
    ["requisitos vacíos", { requisitos: [] }, "requisitos vacíos"],
    ["pasos vacíos", { pasos: [] }, "pasos vacíos"],
    ["vigencia vacía", { vigencia: "" }, "vigencia vacía"],
    ["alias vacíos", { alias: [] }, "alias vacíos"],
    [
      "enlace http",
      { enlace_oficial: "http://x.cl" },
      "enlace_oficial ausente o inválido (debe comenzar con https://)",
    ],
  ];
  for (const [nombre, cambios, esperado] of casos) {
    it(`rechaza: ${nombre}`, () => {
      assert.equal(motivoFichaInvalida(fichaCompleta(cambios)), esperado);
    });
  }

  it("informa primero el id cuando faltan id y enlace", () => {
    assert.equal(
      motivoFichaInvalida(fichaCompleta({ id: "", enlace_oficial: "" })),
      "id vacío"
    );
  });
});

describe("cargarFichasValidas", () => {
  afterEach(() => mock.restoreAll());

  it("devuelve las 6 fichas reales de fichas.json", () => {
    mock.method(console, "warn", () => {});
    assert.equal(cargarFichasValidas(fichas as FichaTramite[]).length, 6);
  });

  it("no modifica el enlace oficial de las fichas válidas", () => {
    const ficha = fichaCompleta();
    const [resultado] = cargarFichasValidas([ficha]);
    assert.equal(resultado.enlace_oficial, "https://tramites.penalolen.cl/prueba");
  });

  it("descarta las inválidas y mantiene el orden de las válidas", () => {
    const warn = mock.method(console, "warn", () => {});
    const resultado = cargarFichasValidas([
      fichaCompleta({ id: "a" }),
      fichaCompleta({ id: "x", pasos: [] }),
      fichaCompleta({ id: "b" }),
      fichaCompleta({ id: "y", enlace_oficial: "http://x.cl" }),
    ]);
    assert.deepEqual(resultado.map((f) => f.id), ["a", "b"]);
    assert.equal(warn.mock.callCount(), 2);
  });

  it("devuelve una lista vacía si todas las fichas son inválidas", () => {
    mock.method(console, "warn", () => {});
    assert.deepEqual(
      cargarFichasValidas([fichaCompleta({ id: "" }), fichaCompleta({ alias: [] })]),
      []
    );
  });

  it("devuelve una lista vacía si recibe una lista vacía", () => {
    assert.deepEqual(cargarFichasValidas([]), []);
  });
});

describe("cargarCatalogo", () => {
  afterEach(() => mock.restoreAll());

  const existentes = [fichaCompleta()] as FichaTramite[];
  const valida = {
    tramite: "Trámite válido",
    enlace_oficial: "https://tramites.penalolen.cl/valido",
  };

  it("carga los 152 trámites reales solo con nombre y enlace (sin inventar datos)", () => {
    mock.method(console, "warn", () => {});
    const completas = cargarFichasValidas(fichas as FichaTramite[]);
    const resultado = cargarCatalogo(catalogo, completas);
    assert.equal(resultado.length, 152);
    for (const f of resultado) {
      assert.equal(f.solo_enlace, true);
      assert.deepEqual(f.requisitos, []);
      assert.deepEqual(f.pasos, []);
      assert.equal(f.vigencia, "");
      assert.ok(f.enlace_oficial.startsWith("https://"), f.tramite);
    }
  });

  it("descarta una entrada sin nombre", () => {
    const warn = mock.method(console, "warn", () => {});
    const resultado = cargarCatalogo(
      [{ tramite: "  ", enlace_oficial: "https://tramites.penalolen.cl/otro" }, valida],
      existentes
    );
    assert.deepEqual(resultado.map((f) => f.tramite), ["Trámite válido"]);
    assert.equal(warn.mock.callCount(), 1);
  });

  it("descarta una entrada con enlace http", () => {
    const warn = mock.method(console, "warn", () => {});
    const resultado = cargarCatalogo(
      [{ tramite: "Trámite inseguro", enlace_oficial: "http://tramites.penalolen.cl/otro" }, valida],
      existentes
    );
    assert.deepEqual(resultado.map((f) => f.tramite), ["Trámite válido"]);
    assert.equal(warn.mock.callCount(), 1);
  });

  it("descarta una entrada cuyo enlace ya tiene una ficha completa", () => {
    const warn = mock.method(console, "warn", () => {});
    const resultado = cargarCatalogo(
      [{ tramite: "Duplicado", enlace_oficial: "https://tramites.penalolen.cl/prueba" }, valida],
      existentes
    );
    assert.deepEqual(resultado.map((f) => f.tramite), ["Trámite válido"]);
    assert.equal(warn.mock.callCount(), 1);
  });
});
