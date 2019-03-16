module.export = {
  extends: ["eslint:recommended", "plugin:prettier/recommended"],
  plugins: ["googleappsscript"],
  env: {
    "googleappsscript/googleappsscript": true
  }
};
