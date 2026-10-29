import test from "node:test";
import assert from "node:assert/strict";
import { renderToStaticMarkup } from "react-dom/server";
import ConsultaForm from "../src/components/ConsultaForm";
import ConfirmacionVoz from "../src/components/ConfirmacionVoz";

const base = {
  onSubmit: () => {},
  onMicrofono: () => {},
  conVoz: true,
};

test("muestra el botón de micrófono con nombre accesible", () => {
  const html = renderToStaticMarkup(
    <ConsultaForm
      {...base}
      vozSoportada={true}
      estadoVoz="inactivo"
      transcripcionVoz=""
      errorVoz={null}
    />
  );
  assert.match(html, /aria-label="Hablar para buscar un trámite"/);
  assert.match(html, /Toca y háblame/);
});

test("al escuchar cambia el botón y anuncia el estado", () => {
  const html = renderToStaticMarkup(
    <ConsultaForm
      {...base}
      vozSoportada={true}
      estadoVoz="escuchando"
      transcripcionVoz="licencia"
      errorVoz={null}
    />
  );
  assert.match(html, /aria-label="Dejar de escuchar"/);
  assert.match(html, /Te escucho/);
  assert.match(html, /licencia/);
});

test("sin soporte de voz deshabilita el micrófono y ofrece alternativa", () => {
  const html = renderToStaticMarkup(
    <ConsultaForm
      {...base}
      vozSoportada={false}
      estadoVoz="inactivo"
      transcripcionVoz=""
      errorVoz={null}
    />
  );
  assert.match(html, /<button[^>]*disabled/);
  assert.match(html, /Chrome o Microsoft Edge/);
  assert.match(html, /escribe tu consulta/);
});

test("muestra el error de micrófono en lenguaje simple", () => {
  const html = renderToStaticMarkup(
    <ConsultaForm
      {...base}
      vozSoportada={true}
      estadoVoz="inactivo"
      transcripcionVoz=""
      errorVoz="No te escuché. Toca el micrófono y habla más cerca de él."
    />
  );
  assert.match(html, /No te escuché/);
});

test("al fallar la voz se resalta el campo de texto como salida", () => {
  const html = renderToStaticMarkup(
    <ConsultaForm
      {...base}
      vozSoportada={true}
      estadoVoz="inactivo"
      transcripcionVoz=""
      errorVoz="No pude contactar el servicio de reconocimiento de voz."
    />
  );
  assert.match(html, /consulta-form__input--alerta/);
});

test("sin error de voz el campo de texto no se resalta", () => {
  const html = renderToStaticMarkup(
    <ConsultaForm
      {...base}
      vozSoportada={true}
      estadoVoz="inactivo"
      transcripcionVoz=""
      errorVoz={null}
    />
  );
  assert.doesNotMatch(html, /consulta-form__input--alerta/);
});

// --- Modo accesibilidad apagado: la página opera normal ------------------

test("sin modo accesibilidad no se muestra el micrófono", () => {
  const html = renderToStaticMarkup(
    <ConsultaForm
      {...base}
      conVoz={false}
      vozSoportada={true}
      estadoVoz="inactivo"
      transcripcionVoz=""
      errorVoz={null}
    />
  );
  assert.doesNotMatch(html, /Hablar para buscar un trámite/);
  assert.doesNotMatch(html, /Toca y háblame/);
});

test("sin modo accesibilidad no se muestran avisos ni errores de voz", () => {
  const html = renderToStaticMarkup(
    <ConsultaForm
      {...base}
      conVoz={false}
      vozSoportada={false}
      estadoVoz="inactivo"
      transcripcionVoz=""
      errorVoz="No pude contactar el servicio de reconocimiento de voz."
    />
  );
  assert.doesNotMatch(html, /No pude contactar/);
  assert.doesNotMatch(html, /Chrome o Microsoft Edge/);
  assert.doesNotMatch(html, /consulta-form__input--alerta/);
});

test("sin modo accesibilidad el placeholder invita solo a escribir", () => {
  const html = renderToStaticMarkup(
    <ConsultaForm
      {...base}
      conVoz={false}
      vozSoportada={true}
      estadoVoz="inactivo"
      transcripcionVoz=""
      errorVoz={null}
    />
  );
  assert.match(html, /¿Qué necesito para sacar licencia clase B\?/);
});

test("la confirmación ofrece buscar, repetir y escuchar de nuevo", () => {
  const html = renderToStaticMarkup(
    <ConfirmacionVoz
      transcripcion="primera licencia clase B"
      onBuscar={() => {}}
      onHablarOtraVez={() => {}}
      onEscucharDeNuevo={() => {}}
    />
  );
  assert.match(html, /primera licencia clase B/);
  assert.match(html, /Buscar este trámite/);
  assert.match(html, /Hablar otra vez/);
  assert.match(html, /Escuchar de nuevo/);
});
