import { NotFound, UnexpectedError } from "../../library/error";
import {
  getFileByName,
} from "../../library/fileRepository";
import { extractAttachments, pdfToHtml } from "../../library/pdf";
import {
  CphMetadatas,
  mapCphDecision,
  NormalizationResult,
  parseCphMetadatas,
} from "./models";
import { getCodeNac, sendToSder } from "../../library/decisionDB";
import { addBlockToRawDecision, addNormalizeToRawDecision, getRawDecisionNotNormalized } from "../rawDecision/handler";
import { PortalisFileInformation } from "../rawDecision/models";
import { parseXml } from "../../library/xml";
import { htmlToPlainText } from "../../library/html";
import { 
  logAttachmentError, 
  logExtractionEnd, 
  logExtractionStart, 
  logNormalisationError, 
  logNormalisationIdentification, 
  logNormalisationSuccess, 
  logNormalizationInputs, 
  logNormalizationResults 
} from "./logger";

function searchXml(
  attachments: { name: string; data: Buffer; }[]
): unknown {
  const attachment = attachments.reduce<CphMetadatas | undefined>((acc, attachment, index) => {
    try {
      const xml = parseXml(attachment)
      return acc ?? xml
    } catch (err) {
      const error = err instanceof Error ? err : new UnexpectedError(`${err}`)
      logAttachmentError(index + 1, error)
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
  logExtractionStart()
  const html = await pdfToHtml(fileNamePdf, cphFile);
  logExtractionEnd()
  return htmlToPlainText(html);
}

async function normalizeRawCph(rawCph: PortalisFileInformation): Promise<unknown> {
  const cphFile = await getFileByName(rawCph.path);
  const cphMetadatas = await getCphMetadatas(cphFile);
  const cphPseudoCustomRules = rawCph.metadatas;
  const codeNac = await getCodeNac(cphMetadatas.dossier.nature_affaire_civile.code)
  const cphContent = await getCphContent(rawCph.path, cphFile);

  if (!codeNac) throw new NotFound("codeNac", `codeNac ${cphMetadatas.dossier.nature_affaire_civile.code} not found`)

  const cphDecision = mapCphDecision(
    cphMetadatas,
    cphContent,
    cphPseudoCustomRules,
    codeNac,
    rawCph.path
  );

  return sendToSder(cphDecision);
}

async function traverseRawCph(
  cursorRawCph: { next: () => Promise<PortalisFileInformation | null> },
  normalizeCph: (rawCph: PortalisFileInformation) => Promise<unknown>
): Promise<NormalizationResult[]> {
  const rawCph = await cursorRawCph.next()
  if (!rawCph) return Promise.resolve([])
  logNormalisationIdentification(rawCph)

  try {
    await normalizeCph(rawCph);
    logNormalisationSuccess(rawCph)
    return [{ rawCph, status: "success" }, ...(await traverseRawCph(cursorRawCph, normalizeCph))]
  } catch (err) {
    const error = err instanceof Error ? err : new UnexpectedError(`Unexpected error: ${err}`)
    logNormalisationError(rawCph, error)
    return [{ rawCph, status: "error", error }, ...(await traverseRawCph(cursorRawCph, normalizeCph))]
  }
}

async function updateRawDecisionsStatus(result: NormalizationResult) {
  try {
    if (result.status === "success") return addNormalizeToRawDecision(result.rawCph)
    return addBlockToRawDecision(result.rawCph, result.error)
  } catch (err) {

  }
}

export async function normalizeRawCphFiles(
  defaultFilter?: Parameters<typeof getRawDecisionNotNormalized<PortalisFileInformation["metadatas"]>>[0]
) {
  const rawCphList = await getRawDecisionNotNormalized<PortalisFileInformation["metadatas"]>(defaultFilter)
  logNormalizationInputs(rawCphList.length())

  const results = await traverseRawCph(rawCphList, normalizeRawCph)
  await Promise.all(results.map(updateRawDecisionsStatus))

  logNormalizationResults(
    results.filter(({ status }) => status === "success").length,
    results.filter(({ status }) => status === "error").length
  )
}
