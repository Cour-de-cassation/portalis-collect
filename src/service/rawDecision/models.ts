import { ObjectId } from 'mongodb'
import { PublicationRules } from '../cph/models'
import { z } from "zod";

export type Created = {
    type: "created",
    date: Date
}

export type Normalized = {
    type: "normalized",
    date: Date
}

export type Blocked = {
    type: "blocked",
    date: Date,
    reason: string
}

export type Event = (Created | Normalized | Blocked)

export type FileInformation<T> = {
    _id: ObjectId,
    path: string,
    events: [Event, ...Event[]]
    metadatas: T
}

export type PortalisFileInformation = FileInformation<PublicationRules>


const utcDateSchema = z.iso.date().transform((val) => new Date(val));
export const parseStatusDecisionQuery = z.object({ from_date: utcDateSchema, from_id: z.string().optional() }).safeParse
