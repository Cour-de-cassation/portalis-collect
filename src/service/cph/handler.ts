import { MissingValue, UnexpectedError } from "../../library/error";
import {
  getFileByName,
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
  PublicationRules,
} from "./models";
import { sendToSder } from "../../library/decisionDB";
import { fileBlocked, fileCreated, fileNormalized, getCollectedFiles, SupportedFile } from "../file/handler";
import { PortalisFileInformation } from "../file/models";

const xmlParser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: "",
  isArray: (_, jpath) =>
    cphMetadatasArray.includes(jpath.slice("root.document.".length)),
  transformTagName: (tagName) => tagName.toLowerCase(),
  transformAttributeName: (attributeName) => attributeName.toLowerCase(),
  parseTagValue: false,
});

export function saveRawCph(
  cphFile: SupportedFile,
  publicationRules: PublicationRules
): Promise<unknown> {
  return fileCreated(cphFile, publicationRules)
}

async function getCphMetadatas(
  fileNamePdf: string,
  cphFile: Buffer
): Promise<CphMetadatas> {
  const [xmlFile = undefined] = await extractAttachments(cphFile);
  if (!xmlFile)
    throw new MissingValue(
      "xmlFile",
      `${fileNamePdf} has no xml attachment`
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

async function normalizeRawCphFile(fileInformation: PortalisFileInformation, cphFile: Buffer) {
  const cphMetadatas = await getCphMetadatas(fileInformation.path, cphFile);
  const cphPseudoCustomRules = fileInformation.metadatas;
  const cphContent = await getCphContent(fileInformation.path, cphFile);

  const cphDecision = mapCphDecision(
    cphMetadatas,
    cphContent,
    cphPseudoCustomRules,
    fileInformation.path
  );

  await sendToSder(cphDecision);

  return fileNormalized(fileInformation);
}

export async function normalizeRawCphFiles(): Promise<unknown> {
  const filesToNormalized = await getCollectedFiles<PortalisFileInformation["metadatas"]>()

  const normalizeResults = filesToNormalized.map(async (fileToNormalized) => {
    try {
      logger.info({
        operationName: "normalizeRawCphFiles",
        msg: `normalize ${fileToNormalized._id} - ${fileToNormalized.path}`,
      });
      const file = await getFileByName(fileToNormalized.path);
      await normalizeRawCphFile(fileToNormalized, file);
      return null;
    } catch (err) {
      const error = err instanceof Error ? err : new UnexpectedError(`Unexpected error: ${err}`)
      await fileBlocked(fileToNormalized, error)
      logger.error({ msg: error.message, data: error })
      return null;
    }
  });
  return Promise.all(normalizeResults);
}
