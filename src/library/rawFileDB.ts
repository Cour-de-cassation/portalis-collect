import { MongoClient, Filter, FindCursor, WithId, ObjectId } from "mongodb"
import { FILE_DB_URL, S3_BUCKET_NAME } from "./env"
import { FileInformation } from "../service/rawDecision/models"

const client = new MongoClient(FILE_DB_URL)

async function dbConnect() {
    const db = client.db()
    await client.connect()
    return db
}

export async function createFileInformation<T>(
    file: Omit<FileInformation<T>, '_id'>,
): Promise<FileInformation<T>> {
    const db = await dbConnect()
    const { insertedId } = await db
        .collection(S3_BUCKET_NAME)
        .insertOne(file)
    return { _id: insertedId, ...file }
}

export async function updateFileInformation<T>(
    id: FileInformation<T>["_id"],
    events: FileInformation<T>["events"],
): Promise<FileInformation<T> | null> {
    const db = await dbConnect()
    return db
        .collection<FileInformation<T>>(S3_BUCKET_NAME)
        .findOneAndUpdate({ _id: id }, { $set: { events } }, { returnDocument: "after" })
}

export async function countFileInformations<T>(filters: Filter<FileInformation<T>>): Promise<number> {
    const db = await dbConnect()
    return db.collection<FileInformation<T>>(S3_BUCKET_NAME).countDocuments(filters)
}

export async function findFileInformations<T>(filters: Filter<FileInformation<T>>): Promise<FindCursor<FileInformation<T>>> {
    const db = await dbConnect()
    return db.collection<FileInformation<T>>(S3_BUCKET_NAME).find(filters)
}

export async function findFileInformationsList<T>(
    filters: Filter<FileInformation<T>>,
    cursor: string | undefined,
    limit = 100
): Promise<FileInformation<T>[]> {
    const db = await dbConnect()
    const filtersWithPagination = cursor ? { _id: { $gt: new ObjectId(cursor) }, ...filters } : filters

    return db.collection<FileInformation<T>>(S3_BUCKET_NAME)
        .find(filtersWithPagination)
        .sort({ _id: 1 })
        .limit(limit)
        .toArray()
}

export async function disconnect() {
    await dbConnect()
    return client.close()
}