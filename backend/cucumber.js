module.exports = {
  default: {
    requireModule: ["tsx/cjs"],
    // El soporte se carga primero: fija PRAXSUITE_DISABLED=1 antes de importar
    // la app, para que los tests usen siempre el respaldo local.
    require: [
      "features/support/**/*.ts",
      "features/step-definitions/**/*.ts",
    ],
    paths: ["features/**/*.feature"],
    // @pendiente: comportamiento esperado documentado que aún no se implementa.
    tags: "not @pendiente",
    format: ["progress"],
  },
};
