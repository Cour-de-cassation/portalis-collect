import express, { Express } from "express";
import helmet from "helmet"

import { loggerHttp } from "./library/logger";
import cphFile from "./api/cphFile";
import { errorHandler } from "./api/error";

const PORT = process.env.PORT;

const app: Express = express();

app
    // .use(helmet()) // @TODO: To add with Authentication
    .use(loggerHttp)
    .use(cphFile)
    .use(errorHandler);

app.listen(PORT);
