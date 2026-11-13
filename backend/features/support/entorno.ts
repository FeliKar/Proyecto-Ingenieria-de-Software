/**
 * Aísla los tests de la red: aunque exista backend/.env o el entorno tenga una
 * API key, la suite siempre se ejecuta contra los JSON de `src/data`.
 *
 * Este módulo debe cargarse antes que los step definitions (ver cucumber.js).
 */
process.env.PRAXSUITE_DISABLED = "1";
