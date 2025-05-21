import { missingValue, unexpectedError } from "../../library/error";
import { v4 as uuid } from "uuid";
import {
  changeBucket,
  getFileByName,
  getFileNames,
  saveFile,
} from "../../library/fileRepository";
import { extractAttachments, pdfToMarkdown } from "../../library/pdf";
import { logger } from "../../library/logger";
import { mardownToPlainText } from "../../library/markdown";
import { XMLParser } from "fast-xml-parser";
import {
  CphMetadatas,
  cphMetadatasArray,
  mapCphDecision,
  parseCphMetadatas,
  parsePublicationRules,
  PublicationRules,
} from "./models";
import { sendToSder } from "../../library/decisionDB";
import { S3_BUCKET_NAME_NORMALIZED, S3_BUCKET_NAME_RAW } from "../../library/env";

const xmlParser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: "",
  isArray: (_, jpath) =>
    cphMetadatasArray.includes(jpath.slice("root.document.".length)),
  transformTagName: (tagName) => tagName.toLowerCase(),
  transformAttributeName: (attributeName) => attributeName.toLowerCase(),
  parseTagValue: false,
});

type CphFile = {
  mimetype: string;
  size: number;
  buffer: Buffer;
};

export function saveRawCph(
  cphFile: CphFile,
  publicationRules: PublicationRules
): Promise<unknown> {
  const name = `${uuid()}-${new Date().toISOString()}`;

  return Promise.all([
    saveFile(
      S3_BUCKET_NAME_RAW,
      `${name}.pdf`,
      cphFile.buffer,
      "application/pdf"
    ),
    saveFile(
      S3_BUCKET_NAME_RAW,
      `${name}.json`,
      Buffer.from(JSON.stringify(publicationRules)),
      "application/json"
    ),
  ]);
}

async function getCphMetadatas(
  fileNamePdf: string,
  cphFile: Buffer
): Promise<CphMetadatas> {
  const [xmlFile = undefined] = await extractAttachments(cphFile);
  if (!xmlFile)
    throw missingValue(
      "xmlFile",
      new Error(`${fileNamePdf} has no xml attachment`)
    );
  const maybeCustomRules = parseCphMetadatas(xmlParser.parse(xmlFile.data));
  if (maybeCustomRules instanceof Error) throw maybeCustomRules;
  return maybeCustomRules.root.document;
}

async function getCphContent(
  fileNamePdf: string,
  cphFile: Buffer
): Promise<string> {
  const markdown = await pdfToMarkdown(fileNamePdf, cphFile);
  return mardownToPlainText(markdown);
}

async function getCphPublicationRules(
  fileNamePdf: string
): Promise<PublicationRules> {
  const pseudoCustomRulesBuffer = await getFileByName(
    S3_BUCKET_NAME_RAW,
    fileNamePdf.replace(".pdf", ".json")
  );
  const maybePseudoRules = parsePublicationRules(
    JSON.parse(pseudoCustomRulesBuffer.toString("utf8"))
  );
  if (maybePseudoRules instanceof Error) throw maybePseudoRules;
  return maybePseudoRules;
}

async function normalizeRawCphFile(fileNamePdf: string, cphFile: Buffer) {
  const cphMetadatas = await getCphMetadatas(fileNamePdf, cphFile);
  const cphPseudoCustomRules = await getCphPublicationRules(fileNamePdf);
  const cphContent = await getCphContent(fileNamePdf, cphFile);

  const cphDecision = mapCphDecision(
    cphMetadatas,
    cphContent,
    cphPseudoCustomRules,
    fileNamePdf
  );

  await sendToSder(cphDecision);

  return Promise.all([
    changeBucket(
      S3_BUCKET_NAME_RAW,
      S3_BUCKET_NAME_NORMALIZED,
      fileNamePdf,
      "application/pdf"
    ),
    changeBucket(
      S3_BUCKET_NAME_RAW,
      S3_BUCKET_NAME_NORMALIZED,
      fileNamePdf.replace(".pdf", ".json"),
      "application/json"
    ),
  ]);
}

export async function normalizeRawCphFiles(): Promise<Error[]> {
  const fileNames = await getFileNames(S3_BUCKET_NAME_RAW);
  const decisionNames = fileNames.filter((_) => _.endsWith(".pdf"));

  const normalizeResults = decisionNames.map(async (fileNamePdf) => {
    try {
      logger.info({
        operationName: "normalizeRawCphFiles",
        msg: `normalize ${fileNamePdf}`,
      });
      const file = await getFileByName(S3_BUCKET_NAME_RAW, fileNamePdf);
      await normalizeRawCphFile(fileNamePdf, file);
      return null;
    } catch (err) {
      if (!(err instanceof Error))
        return unexpectedError(new Error(`Unexpected error: ${err}`));
      return err;
    }
  });
  return Promise.all(normalizeResults).then((_) => _.filter((_) => _ != null));
}
