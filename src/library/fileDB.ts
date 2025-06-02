import { MongoClient, Filter } from "mongodb"
import { FILE_DB_URL, S3_BUCKET_NAME } from "./env"
import { FileInformation } from "../service/file/models"

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
        .findOneAndUpdate({ _id: id }, { events }, { returnDocument: "after" })
}

export async function findFileInformations<T>(filters: Filter<FileInformation<T>>): Promise<FileInformation<T>[]> {
    const db = await dbConnect()
    // Todo: check pagination or streaming to avoid a RAM overflow on empty filters
    return db.collection<FileInformation<T>>(S3_BUCKET_NAME).find(filters).toArray()
  }