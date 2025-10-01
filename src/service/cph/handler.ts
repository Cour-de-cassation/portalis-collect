import { v4 as uuid } from "uuid";

import { toUnexpectedError, UnexpectedError } from "../../library/error";
import {
  Event,
  FileCph,
  RawCph,
} from "./models";
import { createFileInformation, findFileInformationsList } from "../../library/DbRawFile";
import { saveFile } from "../../library/bucket";

export async function createRawCph(
  file: FileCph,
  metadatas: RawCph["metadatas"]
): Promise<RawCph> {
  const date = new Date()
  const path = `${uuid()}-${date.toISOString()}.pdf`;

  try {
    await saveFile(
      path,
      file.buffer,
      "application/pdf"
    )

    return createFileInformation({
      path,
      metadatas,
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
