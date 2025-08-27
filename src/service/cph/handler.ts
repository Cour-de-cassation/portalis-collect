import { NotFound, UnexpectedError } from "../../library/error";
import {
  getFileByName,
} from "../../library/fileRepository";
import { extractAttachments, pdfToHtml } from "../../library/pdf";
import { logger } from "../../library/logger";
import {
  CphMetadatas,
  mapCphDecision,
  parseCphMetadatas,
} from "./models";
import { getCodeNac, sendToSder } from "../../library/decisionDB";
import { blockRawDecision, normalizeRawDecision, getRawDecisionNotNormalized } from "../rawDecision/handler";
import { PortalisFileInformation } from "../rawDecision/models";
import { parseXml } from "../../library/xml";
import { htmlToPlainText } from "../../library/html";

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
  const html = await pdfToHtml(fileNamePdf, cphFile);
  logger.info({ message: "Text successfully extracted" })
  return htmlToPlainText(html);
}

async function normalizeRawCphFile(fileInformation: PortalisFileInformation, cphFile: Buffer) {
  const cphMetadatas = await getCphMetadatas(cphFile);
  const cphPseudoCustomRules = fileInformation.metadatas;
  const codeNac = await getCodeNac(cphMetadatas.dossier.nature_affaire_civile.code)
  const cphContent = await getCphContent(fileInformation.path, cphFile);

  if (!codeNac) throw new NotFound("codeNac", `codeNac ${cphMetadatas.dossier.nature_affaire_civile.code} not found`)

  const cphDecision = mapCphDecision(
    cphMetadatas,
    cphContent,
    cphPseudoCustomRules,
    codeNac,
    fileInformation.path
  );

  await sendToSder(cphDecision);

  return normalizeRawDecision(fileInformation);
}

async function onRawCph(cursorRawCph: { next: () => Promise<PortalisFileInformation | null> }): Promise<void> {
  const rawCph = await cursorRawCph.next()
  if (!rawCph) return Promise.resolve()

    try {
    logger.info({
      operationName: "normalizeRawCphFiles",
      msg: `normalize ${rawCph._id} - ${rawCph.path}`,
    });
    const file = await getFileByName(rawCph.path);
    await normalizeRawCphFile(rawCph, file);
    logger.info({ operationName: "normalizeRawCphFiles", msg: `${rawCph._id} normalized with success` })
  } catch (err) {
    const error = err instanceof Error ? err : new UnexpectedError(`Unexpected error: ${err}`)
    await blockRawDecision(rawCph, error)
    logger.error({ msg: error.message })
  } finally {
    await onRawCph(cursorRawCph)
  }
}

export async function normalizeRawCphFiles(): Promise<unknown> {
  const rawCphList = await getRawDecisionNotNormalized<PortalisFileInformation["metadatas"]>()
  return onRawCph(rawCphList)
}
