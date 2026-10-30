import test from "node:test";
import assert from "node:assert/strict";
import {
  textoFicha,
  textoAbstencion,
  textoConfirmacion,
  avisoEntornoVoz,
  diagnosticarEntornoVoz,
  mensajeErrorVoz,
} from "../src/services/voz";
import type { FichaTramite } from "../src/types/tramite";

const ficha: FichaTramite = {
  id: "licencia-b-primera",
  tramite: "Primera licencia clase B",
  requisitos: ["Ser mayor de 18 años.", "Certificado de aprendizaje."],
  pasos: ["Inscribirse en la Dirección de Tránsito Municipal."],
  vigencia: "6 años desde su emisión.",
  enlace_oficial:
    "https://tramites.penalolen.cl/Tramites/ver/solicitud-de-primera-licencia",
};

test("lee el nombre del trámite, requisitos, pasos y vigencia", () => {
  const texto = textoFicha(ficha);
  assert.match(texto, /Primera licencia clase B/);
  assert.match(texto, /Requisitos/);
  assert.match(texto, /Ser mayor de 18 años/);
  assert.match(texto, /Certificado de aprendizaje/);
  assert.match(texto, /Pasos a seguir/);
  assert.match(texto, /Dirección de Tránsito Municipal/);
  assert.match(texto, /6 años desde su emisión/);
});

test("avisa que el enlace oficial está en pantalla en vez de leer la URL", () => {
  const texto = textoFicha(ficha);
  assert.match(texto, /enlace oficial en la pantalla/);
  assert.doesNotMatch(texto, /https:\/\//);
});

test("una ficha sin enlace no anuncia enlace", () => {
  const texto = textoFicha({ ...ficha, enlace_oficial: "" });
  assert.doesNotMatch(texto, /enlace oficial/);
});

test("la abstención invita a tocar las opciones en pantalla", () => {
  const opciones = [
    { id: "obtencion", tramite: "Obtención de permiso de circulación" },
    { id: "renovacion", tramite: "Renovación de permiso de circulación" },
  ];
  const texto = textoAbstencion("No estoy seguro de qué trámite necesitas.", opciones);
  assert.match(texto, /No estoy seguro/);
  assert.match(texto, /tocar una de estas opciones/);
  assert.match(texto, /Obtención de permiso de circulación/);
  assert.match(texto, /Renovación de permiso de circulación/);
});

test("la abstención sin opciones deriva al canal oficial", () => {
  const texto = textoAbstencion("No tengo esa información.", []);
  assert.match(texto, /canal oficial/);
});

test("la confirmación repite lo escuchado y ofrece actuar", () => {
  const texto = textoConfirmacion("primera licencia clase B");
  assert.match(texto, /primera licencia clase B/);
  assert.match(texto, /¿Es correcto\?/);
  assert.match(texto, /habla otra vez/);
});

// --- Diagnóstico del entorno y mensajes de error -------------------------

const entornoSeguro = {
  reconocimientoSoportado: true,
  contextoSeguro: true,
  esLocalhost: true,
};

test("sin ventana (pruebas) el entorno es neutro y no muestra avisos", () => {
  const entorno = diagnosticarEntornoVoz();
  assert.equal(entorno.contextoSeguro, true);
  assert.equal(entorno.esLocalhost, true);
});

test("con soporte y contexto seguro no hay aviso de entorno", () => {
  assert.equal(avisoEntornoVoz(entornoSeguro), null);
});

test("sin soporte de voz se sugiere Chrome o Edge y el texto", () => {
  const aviso = avisoEntornoVoz({
    reconocimientoSoportado: false,
    contextoSeguro: true,
    esLocalhost: true,
  });
  assert.match(aviso!, /Chrome o Microsoft Edge/);
  assert.match(aviso!, /escribe tu consulta/);
});

test("página sin https avisa que el navegador bloquea el micrófono", () => {
  const aviso = avisoEntornoVoz({
    reconocimientoSoportado: true,
    contextoSeguro: false,
    esLocalhost: false,
  });
  assert.match(aviso!, /https/);
  assert.match(aviso!, /bloquea el micrófono/);
});

test("error de red: explica causas reales y sugiere Edge o escribir", () => {
  const mensaje = mensajeErrorVoz("network", entornoSeguro);
  assert.doesNotMatch(mensaje!, /problema con internet/);
  assert.match(mensaje!, /bloqueador de anuncios|conexión|red/);
  assert.match(mensaje!, /Microsoft Edge/);
  assert.match(mensaje!, /escribe tu consulta/);
});

test("error de red en página sin https se explica como bloqueo por seguridad", () => {
  const mensaje = mensajeErrorVoz("network", {
    reconocimientoSoportado: true,
    contextoSeguro: false,
    esLocalhost: false,
  });
  assert.match(mensaje!, /https/);
});

test("permiso denegado pide permitir el micrófono", () => {
  const mensaje = mensajeErrorVoz("not-allowed", entornoSeguro);
  assert.match(mensaje!, /Permite el micrófono/);
});

test("sin error no hay mensaje", () => {
  assert.equal(mensajeErrorVoz(null, entornoSeguro), null);
});
