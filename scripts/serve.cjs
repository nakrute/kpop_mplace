const path = require("node:path");
const { createApp } = require("../server/app.cjs");

const port = Number(process.env.PORT) || 4173;
const host = process.env.HOST || "127.0.0.1";
const root = path.resolve(__dirname, "..");
const dataFile = process.env.DATA_FILE || path.join(root, "data", "store.json");
const server = createApp({ root, dataFile });

server.listen(port, host, () => {
  console.log(`K-Card Market is running at http://${host}:${port}`);
  console.log(`API health check: http://${host}:${port}/api/v1/health`);
});
