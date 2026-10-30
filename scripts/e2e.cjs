// npm test: statik sunucuyu açar, Cypress E2E'yi (v1 regresyon + v2 parite/model) koşturur, sunucuyu kapatır.
const { spawn } = require("child_process");
const path = require("path");

const root = path.resolve(__dirname, "..");
const server = spawn(process.execPath, [path.join(root, "serve.cjs"), "8080"], { stdio: "inherit" });
const specs = "cypress/e2e/paths.cy.js,cypress/e2e/parite.cy.js,cypress/e2e/model.cy.js";
const cypress = spawn("npx", ["cypress", "run", "--browser", "electron", "--spec", specs, ...process.argv.slice(2)],
  { cwd: root, stdio: "inherit", shell: true });
cypress.on("exit", (code) => { server.kill(); process.exit(code); });
