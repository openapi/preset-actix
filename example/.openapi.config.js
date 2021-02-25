module.exports = {
  file: 'https://raw.githubusercontent.com/accesso-app/backend/master/api-internal/openapi.yaml',
  // file:
  //   'https://raw.githubusercontent.com/OAI/OpenAPI-Specification/master/examples/v3.0/petstore.yaml',
  // file:
  //   'https://raw.githubusercontent.com/github/rest-api-description/main/descriptions/api.github.com/api.github.com.json',
  presets: [[require.resolve('../'), {}]],
  outputDir: `${__dirname}/api`,
};
