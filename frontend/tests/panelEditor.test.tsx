import test from "node:test";
import assert from "node:assert/strict";
import { renderToStaticMarkup } from "react-dom/server";
import PanelEditor from "../src/components/PanelEditor";
import type { FichaPanel } from "../src/types/panel";

const ficha: FichaPanel = {
  id: "licencia-b-primera",
  tramite: "Primera licencia clase B",
  requisitos: ["Cédula de identidad vigente."],
  pasos: ["Inscribirse en la Dirección de Tránsito."],
  vigencia: "6 años desde su emisión.",
  alias: ["sacar licencia clase b"],
  enlace_oficial: "https://tramites.penalolen.cl/Tramites/ver/primera-licencia-clase-b",
  tipo: "completa",
};

const base = {
  guardando: false,
  error: null,
  onGuardar: () => {},
  onCancelar: () => {},
};

test("un trámite nuevo abre en 'Nuevo trámite'", () => {
  const html = renderToStaticMarkup(<PanelEditor ficha={null} {...base} />);
  assert.match(html, /Nuevo trámite/);
  assert.match(html, /Guardar/);
  assert.match(html, /Cancelar/);
});

test("la edición muestra el nombre del trámite", () => {
  const html = renderToStaticMarkup(<PanelEditor ficha={ficha} {...base} />);
  assert.match(html, /Editando: Primera licencia clase B/);
  assert.match(html, /Primera licencia clase B/);
});

test("la ficha completa permite requisitos, pasos y vigencia", () => {
  const html = renderToStaticMarkup(<PanelEditor ficha={ficha} {...base} />);
  assert.match(html, /Requisitos \(uno por línea\)/);
  assert.match(html, /Pasos \(uno por línea\)/);
  assert.match(html, /Vigencia/);
  assert.match(html, /6 años desde su emisión\./);
});

test("el tipo de trámite ofrece ficha completa y catálogo", () => {
  const html = renderToStaticMarkup(<PanelEditor ficha={null} {...base} />);
  assert.match(html, /<option value="completa"/);
  assert.match(html, /<option value="catalogo"/);
});

test("una ficha de catálogo no muestra campos de requisitos (US-09)", () => {
  const catalogo: FichaPanel = {
    id: "adopcion-de-un-arbol",
    tramite: "Adopción de un árbol",
    requisitos: [],
    pasos: [],
    vigencia: "",
    alias: [],
    enlace_oficial: "https://tramites.penalolen.cl/Tramites/ver/adopcion-de-un-arbol",
    tipo: "catalogo",
  };
  const html = renderToStaticMarkup(<PanelEditor ficha={catalogo} {...base} />);
  assert.doesNotMatch(html, /Requisitos \(uno por línea\)/);
  assert.doesNotMatch(html, /Pasos \(uno por línea\)/);
  assert.match(html, /solo nombre y enlace/);
  assert.match(html, /nunca lleva requisitos, pasos ni vigencia/);
});

test("muestra el error del backend al guardar", () => {
  const html = renderToStaticMarkup(
    <PanelEditor
      ficha={ficha}
      {...base}
      error="La ficha no se puede guardar: requisitos vacíos."
    />
  );
  assert.match(html, /role="alert"/);
  assert.match(html, /requisitos vacíos/);
});

test("mientras guarda, el botón está deshabilitado", () => {
  const html = renderToStaticMarkup(
    <PanelEditor ficha={ficha} {...base} guardando={true} />
  );
  assert.match(html, /<button[^>]*disabled/);
  assert.match(html, /Guardando/);
});

test("el enlace oficial se edita con un campo https", () => {
  const html = renderToStaticMarkup(<PanelEditor ficha={ficha} {...base} />);
  assert.match(html, /type="url"/);
  assert.match(html, /https:\/\/tramites\.penalolen\.cl/);
});
