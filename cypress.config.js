const { defineConfig } = require("cypress");

module.exports = defineConfig({
  e2e: {
    baseUrl: "http://localhost:8080",
    supportFile: false,
    viewportWidth: 390,
    viewportHeight: 844,
  },
  video: true,
  videoCompression: false,
});
