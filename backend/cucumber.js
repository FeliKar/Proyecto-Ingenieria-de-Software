module.exports = {
  default: {
    requireModule: ["tsx/cjs"],
    require: ["features/step-definitions/**/*.ts"],
    paths: ["features/**/*.feature"],
    format: ["progress"],
  },
};
