import { S3_BUCKET_NAME } from "../../library/env";
import { createFileInformation, updateFileInformation, findFileInformations } from "../../library/fileDB";
import { saveFile } from "../../library/fileRepository";
import { v4 as uuid } from "uuid";
import { FileInformation } from "./models";
import { isMissingValue, MissingValue, toUnexpectedError, UnexpectedError } from "../../library/error";

export type SupportedFile = {
    mimetype: string;
    size: number;
    buffer: Buffer;
};

export async function fileCreated<T>(
    file: SupportedFile,
    metadatas: T,
): Promise<FileInformation<T>> {
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

export async function fileNormalized<T>(file: FileInformation<T>) {
    const date = new Date()

    try {
        const updatedFileInformation = await updateFileInformation(file._id, [...file.events, { type: "normalized", date }])
        if (!updatedFileInformation) throw new MissingValue("fileInformation", `file with id ${file._id} is missing on collection ${S3_BUCKET_NAME} but normalized`)
        return updatedFileInformation
    } catch (err) {
        if (isMissingValue(err)) throw err
        throw err instanceof Error ? toUnexpectedError(err) : new UnexpectedError()
    }
}

export async function fileBlocked<T>(file: FileInformation<T>, error: Error) {
    const date = new Date()

    try {
        const updatedFileInformation = await updateFileInformation(file._id, [
          ...file.events,
          { type: "blocked", date, reason: error.stack ?? error.message },
        ]);
        if (!updatedFileInformation) throw new MissingValue("fileInformation", `file with id ${file._id} is missing on collection ${S3_BUCKET_NAME} but blocked by ${error}`)
        return updatedFileInformation
    } catch (err) {
        if (isMissingValue(err)) throw err
        throw err instanceof Error ? toUnexpectedError(err) : new UnexpectedError()
    }
}

export async function getCollectedFiles<T>(): Promise<FileInformation<T>[]> {
    return findFileInformations({ events: { $not: { $elemMatch: { type: "normalized" }}} })
}