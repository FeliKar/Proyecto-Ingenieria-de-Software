import test from "node:test";
import assert from "node:assert/strict";
import { renderToStaticMarkup } from "react-dom/server";
import TramiteResult from "../src/components/TramiteResult";
import type { FichaTramite } from "../src/types/tramite";

const ficha: FichaTramite = {
  id: "licencia-b-primera",
  tramite: "Primera licencia clase B",
  requisitos: ["Ser mayor de 18 años."],
  pasos: ["Inscribirse en la Dirección de Tránsito Municipal."],
  vigencia: "6 años desde su emisión.",
  enlace_oficial:
    "https://tramites.penalolen.cl/Tramites/ver/solicitud-de-primera-licencia-no-profesional-clase-b-para-mayores-de-18-anos",
};

test("US-06: muestra el enlace oficial como un ancla clicable", () => {
  const html = renderToStaticMarkup(<TramiteResult ficha={ficha} />);
  assert.match(html, /<a[^>]*href="https:\/\/tramites\.penalolen\.cl\//);
  assert.match(html, /Ver información oficial/);
});

test("US-06: abre el enlace oficial en pestaña nueva de forma segura", () => {
  const html = renderToStaticMarkup(<TramiteResult ficha={ficha} />);
  assert.match(html, /target="_blank"/);
  assert.match(html, /rel="noopener noreferrer"/);
});

test("T18: sin enlace oficial no se renderiza un enlace alternativo", () => {
  const html = renderToStaticMarkup(
    <TramiteResult ficha={{ ...ficha, enlace_oficial: "" }} />
  );
  assert.doesNotMatch(html, /<a[^>]*href=/);
  assert.doesNotMatch(html, /Ver información oficial/);
});

const fichaCatalogo: FichaTramite = {
  id: "inscripcion-a-taller-de-guitarra",
  tramite: "Inscripción a Taller de Guitarra",
  requisitos: [],
  pasos: [],
  vigencia: "",
  enlace_oficial:
    "https://tramites.penalolen.cl/Tramites/ver/inscripcion-a-taller-de-guitarra",
  solo_enlace: true,
};

test("Catálogo: una ficha de solo enlace no muestra listas ni datos vacíos", () => {
  const html = renderToStaticMarkup(<TramiteResult ficha={fichaCatalogo} />);
  assert.match(html, /Inscripción a Taller de Guitarra/);
  assert.match(html, /sitio oficial del municipio/);
  assert.doesNotMatch(html, /<h3>Requisitos<\/h3>/);
  assert.doesNotMatch(html, /<h3>Pasos<\/h3>/);
  assert.doesNotMatch(html, /<h3>Vigencia<\/h3>/);
});

test("Catálogo: la ficha de solo enlace mantiene el enlace oficial clicable", () => {
  const html = renderToStaticMarkup(<TramiteResult ficha={fichaCatalogo} />);
  assert.match(
    html,
    /<a[^>]*href="https:\/\/tramites\.penalolen\.cl\/Tramites\/ver\/inscripcion-a-taller-de-guitarra"/
  );
  assert.match(html, /Ver información oficial/);
});

test("Catálogo: una ficha de solo enlace nunca muestra secciones de requisitos", () => {
  const html = renderToStaticMarkup(<TramiteResult ficha={fichaCatalogo} />);
  assert.doesNotMatch(html, /<ul>/);
  assert.doesNotMatch(html, /<ol>/);
});
