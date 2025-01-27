const cluster = require("cluster");
const os = require("os");
const process = require("process");
const getEnvironmentVariables = require("./src/Environment/env");
const Server = require("./src/server");
const logger = require("./src/Utils/logger");

const numCPUs = os.cpus().length;
const PORT = getEnvironmentVariables().PORT;

const app = new Server().server;
  app.listen(PORT, () => {
    logger.info(`Server is listening on port ${PORT}`,{ port: 5001 });
  });
