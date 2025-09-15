import express, { Express } from "express";
import helmet from "helmet";

import { logger, loggerHttp } from "./library/logger";
import cphFileRoute from "./api/rawCph";
import { errorHandler } from "./api/error";
import authRoute from "./api/authentication";
import { PORT } from "./library/env";

const app: Express = express();

app
  .use(helmet())
  .use(loggerHttp)

  .use((req, _, next) => {
    req.log.info({
      path: "src/server.ts",
      operations: ["other", `${req.method} ${req.path}`],
      message: "Request received"
    })
    next()
  })

  .use(authRoute)
  .use(cphFileRoute)
  .use(errorHandler)

  .use((req, res) => {
    res.log.info({
      path: "src/server.ts",
      operations: ["other", `${req.method} ${req.path}`],
      message: `Done with statusCode: ${res.statusCode}`
    })
  });

app.listen(PORT, () => {
  logger.info({
    path: "src/server.ts",
    operations: ["other", "startServer"],
    message: `PORTALIS-COLLECT running on port ${PORT}`
  });
});
