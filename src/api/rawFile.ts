import { Router } from "express";
import multer from "multer";
import { isCustomError, MissingValue, NotSupported, toNotSupported } from "../services/error";
import { FilePortalis, parsePortalisMetadatas, parsePublicationRules, parseStatusQuery, PortalisMetadatas } from "../services/models";
import { createRawFile, getRawFileStatus, searchXml } from "../services/handler";
import { responseLog } from "./logger";
import { extractAttachments } from "../utils/pdf";

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
  try {
    if (!body)
      throw new MissingValue(
        FILE_FIELD,
        `${BODY_FIELD} is missing on request body`
      );
    const maybeBody = JSON.parse(body);
    const maybePublicationRules = parsePublicationRules(maybeBody);

    if (maybePublicationRules instanceof Error) throw maybePublicationRules;

    return maybePublicationRules;
  } catch(err) {
    if (isCustomError(err)) throw err
    if (err instanceof Error) throw toNotSupported("body", body, err)
    throw new NotSupported("body", body, `${err}`)
  }
}

async function parseMetadatas(file: FilePortalis): Promise<PortalisMetadatas> {
  try {
    const attachments = await extractAttachments(file.buffer)
    const xml = searchXml(attachments)
    return parsePortalisMetadatas(xml).root.document
  } catch(err) {  
    if (isCustomError(err)) throw err
    if (err instanceof Error) throw toNotSupported("xmlMetadatas", "xml", err)
    throw new NotSupported("body", "xml", `${err}`)
  }
}

app.post("/decision", upload.single(FILE_FIELD), async (req, res, next) => {
  try {
    const file = parseFile(req.file);
    const body = parseBody(req.body[BODY_FIELD]);
    const metadatas = await parseMetadatas(file)
    const { _id } = await createRawFile(file, body, metadatas);

    res.send({ id: _id, message: `Your file has been saved at id ${_id}.` });
    return responseLog(req, res)
  } catch (err: unknown) {
    next(err);
  }
});

app.get("/decisions/status", async (req, res, next) => {
  try {
    const maybeQuery = parseStatusQuery(req.query)
    if (maybeQuery.error) throw toNotSupported("req.query", req.query, maybeQuery.error)

    const { from_date: fromDate, from_id: fromId } = maybeQuery.data
    const decisionsStatus = await getRawFileStatus(fromDate, fromId)

    res.send(decisionsStatus)
    return responseLog(req, res)
  } catch (err: unknown) {
    next(err);
  }
})

export default app;
