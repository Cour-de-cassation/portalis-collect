import { Router } from "express";
import multer from "multer";
import { MissingValue, NotSupported, toNotSupported } from "../library/error";
import { parsePublicationRules, parseStatusQuery } from "../service/cph/models";
import { createRawCph, getRawCphStatus } from "../service/cph/handler";

export const FILE_FIELD = "fichierDecisionIntegre";
export const BODY_FIELD = "openDataProperties";

const FILE_MAX_SIZE = {
  size: 10000000,
  readSize: "10Mo",
} as const;

const app = Router();
const upload = multer();

function parseFile(file: Express.Multer.File | undefined) {
  if (!file)
    throw new MissingValue(
      FILE_FIELD,
      `Decision file is missing on request form-data key: ${FILE_FIELD}`
    );
  if (file.mimetype !== "application/pdf")
    throw new NotSupported(
      "file.mimetype",
      file.mimetype,
      "Decision file should be a PDF file"
    );
  if (file.size >= FILE_MAX_SIZE.size)
    throw new NotSupported(
      "file.size",
      file.size,
      `Decision file max size is ${FILE_MAX_SIZE.readSize}`
    );

  return file;
}

function parseBody(body: string | undefined) {
  if (!body)
    throw new MissingValue(
      FILE_FIELD,
      `${BODY_FIELD} is missing on request body`
    );
  const maybeBody = JSON.parse(body);
  const maybePublicationRules = parsePublicationRules(maybeBody);

  if (maybePublicationRules instanceof Error) throw maybePublicationRules;

  return maybePublicationRules;
}

app.post("/decision", upload.single(FILE_FIELD), async (req, res, next) => {
  try {
    req.logSafe.info({ 
      path: "src/api/rawCph.ts", 
      operations: ["collect", `${req.method} ${req.path}`], 
      message: "Collecting decision" 
    })
    const file = parseFile(req.file);
    const body = parseBody(req.body[BODY_FIELD]);
    const { _id } = await createRawCph(file, body);

    req.logSafe.info({ 
      path: "src/api/rawCph.ts", 
      operations: ["collect", `${req.method} ${req.path}`],
      message: `Request succeed for collect ${_id}` 
    })
    res.send({ id: _id, message: `Your file has been saved at id ${_id}.` });
  } catch (err: unknown) {
    next(err);
  }
});

app.get("/decisions/status", async (req, res, next) => {
  try {
    req.logSafe.info({ 
      path: "src/api/rawCph.ts", 
      operations: ["collect", `${req.method} ${req.path}`],
      message: "Looking for status" 
    })
    const maybeQuery = parseStatusQuery(req.query)
    if (maybeQuery.error) throw toNotSupported("req.query", req.query, maybeQuery.error)

    const { from_date: fromDate, from_id: fromId } = maybeQuery.data
    const decisionsStatus = await getRawCphStatus(fromDate, fromId)

    req.logSafe.info({ 
      path: "src/api/rawCph.ts", 
      operations: ["collect", `${req.method} ${req.path}`],
      message: `Request succeed for status ${JSON.stringify(req.query)}` 
    })
    res.send(decisionsStatus)
  } catch (err: unknown) {
    next(err);
  }
})

export default app;
