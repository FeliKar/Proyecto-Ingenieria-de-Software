import { Then } from "@cucumber/cucumber";
import assert from "node:assert";
import { respuesta } from "../support/contexto";

Then(
  "el mensaje indica que no hay información suficiente para responder",
  function () {
    const mensaje = String(respuesta().body.mensaje ?? "").toLowerCase();
    assert.ok(
      mensaje.includes("información suficiente") ||
        mensaje.includes("informacion suficiente"),
      "El mensaje debe declarar que no hay información suficiente"
    );
  }
);

Then("la respuesta no incluye una ficha de trámite", function () {
  assert.strictEqual(
    respuesta().body.ficha,
    undefined,
    "Una abstención no debe incluir una ficha de trámite"
  );
});

Then(
  "la respuesta no contiene requisitos, costos ni fechas generados",
  function () {
    const body = respuesta().body;
    assert.strictEqual(
      body.ficha,
      undefined,
      "No debe existir una ficha con datos generados"
    );
    for (const campo of ["requisitos", "pasos", "costos", "fechas"]) {
      assert.strictEqual(
        body[campo],
        undefined,
        `La abstención no debe incluir el campo '${campo}'`
      );
    }
  }
);
