import { ObjectId } from 'mongodb'
import { PublicationRules } from '../cph/models'

type Created = {
    type: "created",
    date: Date
}

type Normalized = {
    type: "normalized",
    date: Date
}

type Blocked = {
    type: "blocked",
    date: Date,
    reason: Error
}

export type FileInformation<T> = {
    _id: ObjectId,
    path: string,
    events: (Created | Normalized | Blocked)[]
    metadatas: T
}

export type PortalisFileInformation = FileInformation<PublicationRules>