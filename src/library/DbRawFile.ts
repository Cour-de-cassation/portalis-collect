import { 
    Document,
    MongoClient, 
    Filter, 
    WithId, 
    ObjectId, 
    OptionalUnlessRequiredId, 
    InferIdType, 
} from "mongodb"
import { FILE_DB_URL, S3_BUCKET_NAME } from "./env"

const client = new MongoClient(FILE_DB_URL)

async function dbConnect() {
    const db = client.db()
    await client.connect()
    return db
}

export async function createFileInformation<T extends Document>(
    file: OptionalUnlessRequiredId<T>,
): Promise<{ _id: InferIdType<T> } & typeof file> {
    const db = await dbConnect()
    const { insertedId } = await db
        .collection<T>(S3_BUCKET_NAME)
        .insertOne(file)
    return { _id: insertedId, ...file }
}

export async function findFileInformationsList<T extends Document>(
    filters: Filter<T>,
    cursor: string | undefined,
    limit = 100
): Promise<WithId<T>[]> {
    const db = await dbConnect()
    const filtersWithPagination = cursor ? { _id: { $gt: new ObjectId(cursor) }, ...filters } : filters

    return db.collection<T>(S3_BUCKET_NAME)
        .find(filtersWithPagination)
        .sort({ _id: 1 })
        .limit(limit)
        .toArray()
}

export type Id = ObjectId