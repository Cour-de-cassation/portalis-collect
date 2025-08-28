import { S3_BUCKET_NAME as MongoCollection } from "../../library/env";
import { createFileInformation, updateFileInformation, findFileInformations, findFileInformationsList, countFileInformations } from "../../library/rawFileDB";
import { saveFile } from "../../library/fileRepository";
import { v4 as uuid } from "uuid";
import { FileInformation, Event, Created } from "./models";
import { isMissingValue, MissingValue, toUnexpectedError, UnexpectedError } from "../../library/error";

export type SupportedRawDecision = {
    mimetype: string;
    size: number;
    buffer: Buffer;
};

export async function createRawDecision<T>(
    rawDecision: SupportedRawDecision,
    metadatas: T,
): Promise<FileInformation<T>> {
    const date = new Date()
    const path = `${uuid()}-${date.toISOString()}.pdf`;

    try {
        await saveFile(
            path,
            rawDecision.buffer,
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

async function updateEventRawDecision<T>(file: FileInformation<T>, event: Exclude<Event, Created>) {
    try {
        const updatedFileInformation = await updateFileInformation<T>(file._id, [...file.events, event])
        if (!updatedFileInformation) throw new MissingValue("fileInformation", `file with id ${file._id} is missing on collection ${MongoCollection} but normalized`)
        return updatedFileInformation
    } catch (err) {
        if (isMissingValue(err)) throw err
        throw err instanceof Error ? toUnexpectedError(err) : new UnexpectedError()
    }
}

export async function addNormalizeToRawDecision<T>(file: FileInformation<T>): Promise<FileInformation<T>> {
    const date = new Date()
    return updateEventRawDecision(file, { type: "normalized", date })
}

export async function addBlockToRawDecision<T>(file: FileInformation<T>, error: Error): Promise<FileInformation<T>> {
    const date = new Date()
    return updateEventRawDecision(file, { type: "blocked", date, reason: `${error}` })
}

export async function getRawDecisionNotNormalized<T>(
    defaultFilter?: Parameters<typeof findFileInformations<T>>[0]
): Promise<{ length: () => number, next: () => Promise<FileInformation<T> | null> }> {
    const filter = defaultFilter ?? { 
        events: { $not: { $elemMatch: { type: "normalized" } } },
        $expr: { $not: { $eq: [
            3,
            { $size: { $filter: {
                input: { $slice: ["$events", -3] },
                as: "e",
                cond: { $eq: ["$$e.type", "blocked"] }
            }}}
        ]}}
    }
    const cursor = await findFileInformations<T>(filter)
    const count = await countFileInformations(filter)
    return Object.assign(cursor, { length: () => count })
}

export async function getRawDecisionStatus<T>(fromDate: Date, fromId?: string) {
    const BATCH_SIZE = 100

    const filter = { events: { $elemMatch: { type: "created", date: { $gte: fromDate } } } }
    const files = await findFileInformationsList<T>(filter, fromId, BATCH_SIZE + 1)
    const decisionStatus = files.slice(0, BATCH_SIZE).map(_ => ({ 
        id: _._id, 
        metadatas: _.metadatas,
        status: _.events.reverse()[0] as Event }
    )) // type safe due to _events type

    return {
        decisions: decisionStatus,
        nextBatchId: files.length > BATCH_SIZE ? decisionStatus[decisionStatus.length - 1]?.id : null
    }
}
