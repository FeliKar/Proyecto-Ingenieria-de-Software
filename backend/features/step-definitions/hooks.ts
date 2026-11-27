import { writeFileSync } from "node:fs";
import { After, Before } from "@cucumber/cucumber";
import { reiniciarIntentos } from "../../src/auth/intentos";
import { invalidarCache } from "../../src/services/tramitesRepository";
import { respaldos } from "../support/entorno";

/**
 * Hooks de la suite (US-05).
 *
 * - Antes de cada escenario se limpian los intentos de login: el límite es
 *   por ventana de tiempo y no debe arrastrarse entre escenarios.
 * - Después de cada escenario se restauran fichas.json, catalogo.json y
 *   usuarios.json (copiados a un temporal en `entorno.ts`) y se borra la
 *   caché de trámites, para que un escenario no arrastre cambios al siguiente.
 */

Before(() => {
  reiniciarIntentos();
});

After(() => {
  for (const [ruta, contenido] of respaldos) {
    writeFileSync(ruta, contenido, "utf8");
  }
  invalidarCache();
});
