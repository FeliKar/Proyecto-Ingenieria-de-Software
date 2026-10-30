module.exports = {
  default: {
    requireModule: ["tsx/cjs"],
    require: ["features/step-definitions/**/*.ts"],
    paths: ["features/**/*.feature"],
    // @pendiente: comportamiento esperado documentado que aún no se implementa.
    tags: "not @pendiente",
    format: ["progress"],
  },
};
