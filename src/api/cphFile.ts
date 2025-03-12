import { RequestHandler, Router, json } from "express";
import multer from "multer";
import { missingValue, notSupported } from "../library/error";
import { saveRawCph } from "../service/cph/handler";
import { parsePseudoRules } from "../service/cph/models";

export const FILE_FIELD = "fichierDecisionIntegre";
export const BODY_FIELD = "occultationsComplementaires";

const FILE_MAX_SIZE = {
  size: 10000000,
  readSize: "10Mo",
} as const;

const app = Router();
const upload = multer();

function parseFile(file: Express.Multer.File | undefined) {
  if (!file)
    throw missingValue(
      FILE_FIELD,
      new Error(
        `Decision file is missing on request form-data key: ${FILE_FIELD}`
      )
    );
  if (file.mimetype !== "application/pdf")
    throw notSupported(
      "file.mimetype",
      file.mimetype,
      new Error("Decision file should be a PDF file")
    );
  if (file.size >= FILE_MAX_SIZE.size)
    throw notSupported(
      "file.size",
      file.size,
      new Error(`Decision file max size is ${FILE_MAX_SIZE.readSize}`)
    );

  return file
}

function parseBody(body: string | undefined) {
  if (!body)
    throw missingValue(
      FILE_FIELD,
      new Error(`${BODY_FIELD} is missing on request body`)
    )
  const maybeBody = JSON.parse(body)
  if (typeof maybeBody.identifiantDecision !== "string")
    throw notSupported(
      `${BODY_FIELD}.identifiantDecision`,
      maybeBody.identifiantDecision,
      new Error(`${BODY_FIELD}.identifiantDecision should be a string`)
    )
  const maybePseudoRules = parsePseudoRules(maybeBody.occultationsComplementaires)
  if (maybePseudoRules instanceof Error) 
    throw notSupported(
      `${BODY_FIELD}.occultationComplementaires`,
      maybeBody.occultationsComplementaires,
      maybePseudoRules
    )

  return { 
    id: maybeBody.identifiantDecision as string, // typescript can not infer typeof
    pseudoRules: maybePseudoRules
  }
}

app.post("/decision", upload.single(FILE_FIELD), async (req, res, next) => {
  try {
    const file = parseFile(req.file)
    const body = parseBody(req.body[BODY_FIELD])
    await saveRawCph(file, body);
    res.setHeader("Content-Type", "text/plain");
    res.send({ message: "Your file has been saved." });
  } catch (err: unknown) {
    req.log.error(err);
    next(err);
  }
});

export default app;
