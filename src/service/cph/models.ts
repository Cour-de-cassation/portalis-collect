import zod from "zod";
import { NotSupported, toNotSupported } from "../../library/error";
import { Id } from "../../library/DbRawFile";

export type FileCph = {
    mimetype: string;
    size: number;
    buffer: Buffer;
};

const schemaPublicationRules = zod.object({
  identifiantDecision: zod.string().trim().min(1),
  recommandationOccultation: zod.object({
    suiviRecommandationOccultation: zod.boolean(),
    elementsAOcculter: zod.array(zod.string()),
  }),
  interetParticulier: zod.boolean(),
  sommaireInteretParticulier: zod.string().optional(),
});
export type PublicationRules = zod.infer<typeof schemaPublicationRules>;
export function parsePublicationRules(
  maybePublicationRules: any
): PublicationRules | NotSupported {
  const result = schemaPublicationRules.safeParse(maybePublicationRules);
  if (result.error)
    return toNotSupported(
      "publicationRules",
      maybePublicationRules,
      result.error
    );
  return result.data;
}

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

export type RawCph = {
    _id: Id,
    path: string,
    events: [Created, ...Event[]]
    metadatas: PublicationRules
}

const utcDateSchema = zod.iso.date().transform((val) => new Date(val));
export const parseStatusQuery = zod.object({ 
  from_date: utcDateSchema, 
  from_id: zod.string().optional() 
}).safeParse
