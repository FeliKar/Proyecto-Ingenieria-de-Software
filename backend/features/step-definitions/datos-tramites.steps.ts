import { Given, Then } from "@cucumber/cucumber";
import assert from "node:assert";
import fs from "node:fs";
import path from "node:path";

type Ficha = {
  id: string;
  tramite: string;
  requisitos: string[];
  pasos: string[];
  vigencia: string;
  alias: string[];
  enlace_oficial: string;
  clase?: string;
};

let fichas: Ficha[] = [];
let fichaActual: Ficha | undefined;

Given("que el sistema carga las fichas desde el archivo de datos", function () {
  const dataPath = path.join(__dirname, "../../src/data/fichas.json");
  const contenido = fs.readFileSync(dataPath, "utf-8");
  fichas = JSON.parse(contenido) as Ficha[];
  assert.ok(Array.isArray(fichas) && fichas.length > 0);
});

Given("la ficha {string}", function (id: string) {
  fichaActual = fichas.find((f) => f.id === id);
  assert.ok(fichaActual, `No se encontró la ficha con id '${id}'`);
});

Then("debe tener el campo trámite no vacío", function () {
  assert.ok(fichaActual);
  assert.ok(typeof fichaActual.tramite === "string" && fichaActual.tramite.trim().length > 0);
});

Then("debe tener el campo requisitos como lista no vacía", function () {
  assert.ok(fichaActual);
  assert.ok(Array.isArray(fichaActual.requisitos) && fichaActual.requisitos.length > 0);
});

Then("debe tener el campo pasos como lista no vacía", function () {
  assert.ok(fichaActual);
  assert.ok(Array.isArray(fichaActual.pasos) && fichaActual.pasos.length > 0);
});

Then("debe tener el campo vigencia no vacío", function () {
  assert.ok(fichaActual);
  assert.ok(typeof fichaActual.vigencia === "string" && fichaActual.vigencia.trim().length > 0);
});

Then("debe tener el campo alias como lista no vacía", function () {
  assert.ok(fichaActual);
  assert.ok(Array.isArray(fichaActual.alias) && fichaActual.alias.length > 0);
});

Then("debe tener el campo enlace_oficial no vacío", function () {
  assert.ok(fichaActual);
  assert.ok(typeof fichaActual.enlace_oficial === "string" && fichaActual.enlace_oficial.trim().length > 0);
});

Then("el enlace_oficial debe comenzar con {string}", function (prefijo: string) {
  assert.ok(fichaActual);
  assert.ok(fichaActual.enlace_oficial.startsWith(prefijo));
});

Then("el trámite debe ser {string}", function (tramite: string) {
  assert.ok(fichaActual);
  assert.strictEqual(fichaActual.tramite, tramite);
});

Then("debe corresponder a la clase {string}", function (clase: string) {
  assert.ok(fichaActual);
  if (fichaActual.clase !== undefined) {
    assert.ok(fichaActual.clase.includes(clase));
  } else {
    const tramiteLower = fichaActual.tramite.toLowerCase();
    assert.ok(tramiteLower.includes(`clase ${clase.toLowerCase()}`) || tramiteLower.includes(`clase ${clase}`));
  }
});

Then("debe tener al menos un alias relacionado con {string} y {string}", function (a: string, b: string) {
  assert.ok(fichaActual);
  const hayA = fichaActual.alias.some((al) => al.toLowerCase().includes(a.toLowerCase()));
  const hayB = fichaActual.alias.some((al) => al.toLowerCase().includes(b.toLowerCase()));
  assert.ok(hayA && hayB);
});

Then("debe incluir las clases {string}", function (clases: string) {
  assert.ok(fichaActual);
  if (fichaActual.clase !== undefined) {
    assert.strictEqual(fichaActual.clase, clases);
  } else {
    const tramiteLower = fichaActual.tramite.toLowerCase();
    assert.ok(tramiteLower.includes(clases.toLowerCase()));
  }
});

Then("debe tener aliases que incluyan {string}", function (palabra: string) {
  assert.ok(fichaActual);
  const hay = fichaActual.alias.some((al) => al.toLowerCase().includes(palabra.toLowerCase()));
  assert.ok(hay);
});

Then("debe tener requisitos que incluyan revisión técnica, SOAP y padrón\\/factura", function () {
  assert.ok(fichaActual);
  const req = fichaActual.requisitos.join(" ").toLowerCase();
  assert.ok(req.includes("revisión técnica") || req.includes("revision tecnica"));
  assert.ok(req.includes("soap"));
  assert.ok(req.includes("padrón") || req.includes("padron") || req.includes("factura"));
});

Then("debe tener vigencia {string}", function (vigencia: string) {
  assert.ok(fichaActual);
  assert.strictEqual(fichaActual.vigencia, vigencia);
});

Then("debe tener requisitos que incluyan permiso anterior, revisión técnica y SOAP", function () {
  assert.ok(fichaActual);
  const req = fichaActual.requisitos.join(" ").toLowerCase();
  assert.ok(req.includes("permiso anterior") || req.includes("permiso de circulación anterior"));
  assert.ok(req.includes("revisión técnica") || req.includes("revision tecnica"));
  assert.ok(req.includes("soap"));
});

Given("el conjunto de fichas cargado", function () {
  if (fichas.length === 0) {
    const dataPath = path.join(__dirname, "../../src/data/fichas.json");
    const contenido = fs.readFileSync(dataPath, "utf-8");
    fichas = JSON.parse(contenido) as Ficha[];
  }
  assert.ok(Array.isArray(fichas) && fichas.length > 0);
});

Then("todos los ids deben ser únicos", function () {
  const ids = fichas.map((f) => f.id);
  const unicos = new Set(ids);
  assert.strictEqual(ids.length, unicos.size);
});

Then("todos los nombres de trámite deben ser únicos", function () {
  const tramites = fichas.map((f) => f.tramite);
  const unicos = new Set(tramites);
  assert.strictEqual(tramites.length, unicos.size);
});

Then("cada alias debe tener al menos un carácter no vacío", function () {
  for (const f of fichas) {
    for (const al of f.alias) {
      assert.ok(typeof al === "string" && al.trim().length > 0);
    }
  }
});

Then("ningún requisito ni paso puede estar vacío", function () {
  for (const f of fichas) {
    for (const r of f.requisitos) {
      assert.ok(typeof r === "string" && r.trim().length > 0);
    }
    for (const p of f.pasos) {
      assert.ok(typeof p === "string" && p.trim().length > 0);
    }
  }
});
