import zod from "zod";
import { NotSupported, toNotSupported } from "./error";
import { Id } from "../connectors/dbRawFile";

export type FilePortalis = {
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

const schemaPortalisMetadatas = zod.object({
  audiences_dossier: zod
    .object({
      audience_dossier: zod.array(
        zod.object({
          formation: zod.string().optional(),
          chronologie: zod.string().optional()
        })
      )
    })
    .optional(),
  decision: zod.object({
    date: zod.string().regex(/\d{8}/),
    codes_decision: zod.object({
      code_decision: zod
        .array(
          zod.object({
            code: zod.string(),
            libelle: zod.string()
          })
        ).min(1)
    })
  }),
  dossier: zod.object({
    nature_affaire_civile: zod.object({
      code: zod.string(),
      libelle: zod.string()
    })
  }),
  evenement_porteur: zod.object({
    caracteristiques: zod.object({
      caracteristique: zod.array(
        zod.object({
          mnemo: zod.string(),
          libelle: zod.string(),
          valeur: zod.unknown()
        })
      )
    }),
    srj_code_evt: zod.string()
  }),
  juridiction: zod.object({
    libelle_court: zod.string(),
    libelle_long: zod.string(),
    code_srj: zod.string()
  })
})
const pdfMetadata = zod.object({
  root: zod.object({ document: schemaPortalisMetadatas })
})
export type PortalisMetadatas = zod.infer<typeof schemaPortalisMetadatas>
export function parsePortalisMetadatas(portalisMetadatas: any): { root: { document: PortalisMetadatas } } {
  const result = pdfMetadata.safeParse(portalisMetadatas)
  if (result.error) throw toNotSupported('portalisMetadatas', portalisMetadatas, result.error)
  return result.data
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

export type RawPortalis = {
  _id: Id,
  path: string,
  events: [Created, ...Event[]]
  metadatas: PublicationRules & { metadatas: PortalisMetadatas }
}

const utcDateSchema = zod.iso.date().transform((val) => new Date(val));
export const parseStatusQuery = zod.object({
  from_date: utcDateSchema,
  from_id: zod.string().optional()
}).safeParse
