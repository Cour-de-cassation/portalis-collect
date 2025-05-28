import zod from "zod";
import { NotSupported, notSupported } from "../../library/error";
import {
  Category,
  LabelStatus,
} from "dbsder-api-types";

const schemaPublicationRules = zod.object({
  identifiantDecision: zod.string().trim().min(1),
  occultationsComplementaires: zod.object({
    suiviRecommandationOccultation: zod.boolean(),
    elementsAOcculter: zod.array(zod.string()),
  }),
  interetParticulier: zod.boolean(),
  sommaireInteretParticulier: zod.string(),
});
export type PublicationRules = zod.infer<typeof schemaPublicationRules>;
export function parsePublicationRules(
  maybePublicationRules: any
): PublicationRules | NotSupported {
  const result = schemaPublicationRules.safeParse(maybePublicationRules);
  if (result.error)
    return notSupported(
      "publicationRules",
      maybePublicationRules,
      result.error
    );
  return result.data;
}

const schemaCphMetadatas = zod.object({});
const pdfMetadata = zod.object({
  root: zod.object({ document: schemaCphMetadatas }),
});
export type CphMetadatas = zod.infer<typeof schemaCphMetadatas>;
export function parseCphMetadatas(
  cphMetadatas: any
): { root: { document: CphMetadatas } } | NotSupported {
  const result = pdfMetadata.safeParse(cphMetadatas);
  if (result.error)
    return notSupported("cphMetadatas", cphMetadatas, result.error);
  return result.data;
}

function computeCategoriesToOmit(
  pseudoRules: PublicationRules["occultationsComplementaires"]
): `${Category}`[] {
  return (
    Object.keys(
      pseudoRules
    ) as (keyof PublicationRules["occultationsComplementaires"])[]
  ).reduce<`${Category}`[]>((categories, k) => {
    switch (k) {
      default:
        return categories;
    }
  }, []);
}

function computeAdditionalTerms(
  pseudoRules: PublicationRules["occultationsComplementaires"]
): string {
  return pseudoRules.elementsAOcculter.map((_) => `+${_}`).join("|");
}

export function mapCphDecision(
  metadatas: CphMetadatas,
  content: string,
  publicationRules: PublicationRules
): any { // UnIdentifiedDecisionCph
  return {
    appeals: [],
    chamberId: "",
    chamberName: "",
    dateCreation: new Date().toISOString(),
    dateDecision: new Date().toISOString(),
    jurisdictionCode: "",
    jurisdictionId: "",
    jurisdictionName: "",
    labelStatus: LabelStatus.TOBETREATED,
    occultation: {
      additionalTerms: computeAdditionalTerms(
        publicationRules.occultationsComplementaires
      ),
      categoriesToOmit: computeCategoriesToOmit(
        publicationRules.occultationsComplementaires
      ),
      motivationOccultation: false,
    },
    originalText: content,
    registerNumber: "",
    sourceId: 0,
    sourceName: "portalis-cph",
    blocOccultation: 1,
    selection: false,
  };
}
