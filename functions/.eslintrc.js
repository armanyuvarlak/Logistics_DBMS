module.exports = {
  root: true,
  env: {
    es6: true,
    node: true,
  },
  parserOptions: {
    ecmaVersion: 2018,
  },
  extends: [
    "eslint:recommended",
  ],
  rules: {
    "no-unused-vars": "warn",
    "no-trailing-spaces": "off",
    "object-curly-spacing": "off",
    "quotes": "off",
    "comma-dangle": "off",
    "indent": "off",
    "max-len": "off",
    "valid-jsdoc": "off",
    "padded-blocks": "off"
  },
  overrides: [
    {
      files: ["**/*.spec.*"],
      env: {
        mocha: true,
      },
      rules: {},
    },
  ],
  globals: {},
};
