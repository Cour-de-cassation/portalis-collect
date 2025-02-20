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
  isCphMetadatas,
  CphMetadatas,
  isFileSupported,
  PseudoCustomRules,
  isPseudoCustomRules,
  mapCphDecision,
} from "./models";
import { sendToDb } from "../../library/decisionDB";

const xmlParser = new XMLParser();

if (process.env.S3_BUCKET_NAME_RAW == null)
  throw missingValue("process.env.S3_BUCKET_NAME_RAW", new Error());
if (process.env.S3_BUCKET_NAME_NORMALIZED == null)
  throw missingValue("process.env.S3_BUCKET_NAME_NORMALIZED", new Error());
const { S3_BUCKET_NAME_RAW, S3_BUCKET_NAME_NORMALIZED } = process.env;

type CphFile = {
  mimetype: string;
  size: number;
  buffer: Buffer;
};

export function saveRawCph(
  cphFile: CphFile,
  pseudoCustomRules: PseudoCustomRules
): Promise<unknown> {
  isFileSupported(cphFile);
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
      Buffer.from(JSON.stringify(pseudoCustomRules)),
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
  const customRules = xmlParser.parse(xmlFile.data);
  isCphMetadatas(customRules);
  return customRules;
}

async function getCphContent(
  fileNamePdf: string,
  cphFile: Buffer
): Promise<string> {
  const markdown = await pdfToMarkdown(fileNamePdf, cphFile);
  return mardownToPlainText(markdown);
}

async function getCphPseudoCustomRules(
  fileNamePdf: string
): Promise<PseudoCustomRules> {
  const pseudoCustomRulesBuffer = await getFileByName(
    S3_BUCKET_NAME_RAW,
    fileNamePdf.replace(".pdf", ".json")
  );
  const pseudoCustomRules = JSON.parse(
    pseudoCustomRulesBuffer.toString("utf8")
  );
  isPseudoCustomRules(pseudoCustomRules);
  return pseudoCustomRules;
}

async function normalizeRawCphFile(fileNamePdf: string, cphFile: Buffer) {
  const cphMetadatas = await getCphMetadatas(fileNamePdf, cphFile);
  const cphContent = await getCphContent(fileNamePdf, cphFile);
  const cphPseudoCustomRules = await getCphPseudoCustomRules(fileNamePdf);

  const cphDecision = mapCphDecision(
    cphMetadatas,
    cphContent,
    cphPseudoCustomRules
  );

  await sendToDb(cphDecision);

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
