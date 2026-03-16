import { v4 as uuid } from "uuid";

import { NotFound, toUnexpectedError, UnexpectedError } from "../error";
import {
  CphMetadatas,
  Event,
  FileCph,
  parseCphMetadatas,
  PublicationRules,
  RawCph,
} from "./models";
import { createFileInformation, findFileInformationsList } from "../../connectors/dbRawFile";
import { saveFile } from "../../connectors/bucket";
import { parseXml } from "../../utils/xml";
import { logger } from "../../config/logger";
import { extractAttachments } from "../../utils/pdf";

function searchXml(attachments: { name: string; data: Buffer }[]): unknown {
  const attachment = attachments.reduce<unknown>((acc, attachment, index) => {
    try {
      const xml = parseXml(attachment)
      return acc ?? xml
    } catch (err) {
      const error = err instanceof Error ? err : new UnexpectedError(`${err}`)
      logger.error({
        path: 'src/service/cph/normalization.ts',
        operations: ['normalization', 'searchXml'],
        message: `Error on attachment ${index + 1}`,
        stack: error.stack
      })
      return acc
    }
  }, undefined)

  if (!attachment)
    throw new NotFound('attachement', 'Xml metadatas attachement not found or bad formatted')
  return attachment
}

async function getCphMetadatas(cphFile: Buffer): Promise<CphMetadatas> {
  const attachments = await extractAttachments(cphFile)
  const xml = searchXml(attachments)
  return parseCphMetadatas(xml).root.document
}

export async function createRawCph(
  file: FileCph,
  publicationRules: PublicationRules
): Promise<RawCph> {
  const date = new Date()
  const path = `${uuid()}-${date.toISOString()}.pdf`;

  try {
    const metadatas = await getCphMetadatas(file.buffer)

    await saveFile(
      path,
      file.buffer,
      "application/pdf"
    )

    return createFileInformation({
      path,
      metadatas: { ...publicationRules, metadatas },
      events: [{ type: "created", date }]
    })
  } catch (err) {
    throw err instanceof Error ? toUnexpectedError(err) : new UnexpectedError()
  }
}

export async function getRawCphStatus(fromDate: Date, fromId?: string) {
  const BATCH_SIZE = 100

  const filter = { events: { $elemMatch: { type: "created", date: { $gte: fromDate } } } }
  const files = await findFileInformationsList<RawCph>(filter, fromId, BATCH_SIZE + 1)
  const cphStatus = files.slice(0, BATCH_SIZE).map(_ => ({
    id: _._id,
    originalId: _.metadatas.identifiantDecision,
    created: _.events.find(_ => _.type === "created")?.date.toISOString(), // type safe due "created" cannot undefined
    status: _.events.reverse()[0] as Event // type safe due to _events cannot empty
  }
  ))

  return {
    cphList: cphStatus,
    nextBatchId: files.length > BATCH_SIZE ? cphStatus[cphStatus.length - 1]?.id : null
  }
}
