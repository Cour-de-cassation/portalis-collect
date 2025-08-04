import { NotFound, NotSupported, UnexpectedError } from "../../library/error";
import {
  getFileByName,
} from "../../library/fileRepository";
import { extractAttachments, pdfToMarkdown } from "../../library/pdf";
import { logger } from "../../library/logger";
import { mardownToPlainText } from "../../library/markdown";
import {
  CphMetadatas,
  mapCphDecision,
  parseCphMetadatas,
  PublicationRules,
} from "./models";
import { getCodeNac, sendToSder } from "../../library/decisionDB";
import { fileBlocked, fileCreated, fileNormalized, getCollectedFiles, SupportedFile } from "../file/handler";
import { PortalisFileInformation } from "../file/models";
import { parseXml } from "../../library/xml";

export function saveRawCph(
  cphFile: SupportedFile,
  publicationRules: PublicationRules
): Promise<unknown> {
  return fileCreated(cphFile, publicationRules)
}

function searchXml(
  attachments: { name: string; data: Buffer; }[]
): unknown {
  const attachment = attachments.reduce<CphMetadatas | undefined>((acc, attachment, index) => {
    try {
      const xml = parseXml(attachment)
      return acc ?? xml
    } catch (err) {
      logger.error({
        operationName: "searchMetadatas",
        msg: `Error on attachment ${index + 1}:\n` + (err instanceof Error ? err.message : (new UnexpectedError(`${err}`)).message)
      })
      return acc
    }
  }, undefined)

  if (!attachment) throw new NotFound("attachement", "Xml metadatas attachement not found or bad formatted")
  return attachment
}

async function getCphMetadatas(
  cphFile: Buffer
): Promise<CphMetadatas> {
  const attachments = await extractAttachments(cphFile);
  const xml = searchXml(attachments)
  return parseCphMetadatas(xml).root.document
}

async function getCphContent(
  fileNamePdf: string,
  cphFile: Buffer
): Promise<string> {
  logger.info({ message: "Waiting for text extraction" })
  const markdown = await pdfToMarkdown(fileNamePdf, cphFile);
  logger.info({ message: "Text successfully extracted" })
  return mardownToPlainText(markdown);
}

async function normalizeRawCphFile(fileInformation: PortalisFileInformation, cphFile: Buffer) {
  const cphMetadatas = await getCphMetadatas(cphFile);
  const cphPseudoCustomRules = fileInformation.metadatas;
  const cphContent = await getCphContent(fileInformation.path, cphFile);
  const codeNac = await getCodeNac(cphMetadatas.dossier.nature_affaire_civile.code)

  if (!codeNac) throw new NotFound("codeNac", `codeNac ${cphMetadatas.dossier.nature_affaire_civile.code} not found`)

  const cphDecision = mapCphDecision(
    cphMetadatas,
    cphContent,
    cphPseudoCustomRules,
    codeNac,
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
      logger.error({ msg: error instanceof NotSupported && error.explain ? error.explain : error.message })
      return null;
    }
  });
  return Promise.all(normalizeResults);
}
