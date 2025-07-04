import zod from "zod";
import { NotSupported, toNotSupported } from "../../library/error";
import {
  UnIdentifiedDecisionCph,
  LabelStatus,
  PublishStatus,
  SuiviOccultation,
  CodeNac,
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
    return toNotSupported(
      "publicationRules",
      maybePublicationRules,
      result.error
    );
  return result.data;
}

const schemaCphMetadatas = zod.object({
  audiences_dossier: zod.object({
    audience_dossier: zod.array(
      zod.object({
        formation: zod.string(),
        chronologie: zod.string(),
        composition: zod.object({
          membre_composition: zod.array(
            zod.object({
              role: zod.string(),
              nom: zod.string(),
              prenom: zod.string(),
              college: zod.string(),
            })
          ),
        }),
      })
    ),
  }),
  decision: zod.object({
    date: zod.string().regex(/\d{8}/),
    codes_decision: zod.object({
      code_decision: zod
        .array(
          zod.object({
            code: zod.string(),
            libelle: zod.string(),
          })
        )
        .min(1),
    }),
  }),
  dossier: zod.object({
    nature_affaire_civile: zod.object({
      code: zod.string(),
      libelle: zod.string(),
    }),
  }),
  evenement_porteur: zod.object({
    caracteristiques: zod.object({
      caracteristique: zod.array(
        zod.object({
          mnemo: zod.string(),
          libelle: zod.string(),
          valeur: zod.unknown(),
        })
      ),
    }),
    srj_code_evt: zod.string(),
  }),
  juridiction: zod.object({
    code_srj: zod.string(),
  }),
});
const pdfMetadata = zod.object({
  root: zod.object({ document: schemaCphMetadatas }),
});
export const cphMetadatasArray = [
  // WARN: Convention about array are confused: xml parser parse like QueryString do, xml list is wrote as HTML list.
  // We precise wich field is an array even if there are only one object inside - based on xml parser detection of array
  "audiences_dossier.audience_dossier",
  "decision.codes_decision.code_decision",
  "evenement_porteur.caracteristiques.caracteristique",
];
export type CphMetadatas = zod.infer<typeof schemaCphMetadatas>;
export function parseCphMetadatas(
  cphMetadatas: any
): { root: { document: CphMetadatas } } | NotSupported {
  const result = pdfMetadata.safeParse(cphMetadatas);
  if (result.error)
    return toNotSupported("cphMetadatas", cphMetadatas, result.error);
  return result.data;
}

function computeAdditionalTerms(
  pseudoRules: PublicationRules["occultationsComplementaires"]
): string {
  return pseudoRules.elementsAOcculter.map((_) => `+${_}`).join("|");
}

export function mapCphDecision(
  metadatas: CphMetadatas,
  content: string,
  publicationRules: PublicationRules,
  codeNac: CodeNac,
  filenameSource: string
): UnIdentifiedDecisionCph {
  const recommandationOccultation = publicationRules.occultationsComplementaires
    .suiviRecommandationOccultation
    ? SuiviOccultation.CONFORME
    : SuiviOccultation.AUCUNE;

  return {
    sourceId: 0,// publicationRules.identifiantDecision, TODO: will be a string
    sourceName: "portalis-cph",
    originalText: content,
    labelStatus: LabelStatus.TOBETREATED,
    publishStatus: PublishStatus.TOBEPUBLISHED,
    dateCreation: new Date().toISOString(),
    dateDecision: new Date(
      parseInt(metadatas.decision.date.slice(0, 4)),
      parseInt(metadatas.decision.date.slice(4, 6)) - 1,
      parseInt(metadatas.decision.date.slice(6, 8))
    ).toISOString(),
    NACCode: metadatas.dossier.nature_affaire_civile.code,
    // NACLibelle: metadatas.dossier.nature_affaire_civile.libelle, // TODO: which value ? - low
    endCaseCode: (
      metadatas.decision.codes_decision
        .code_decision[0] as CphMetadatas["decision"]["codes_decision"]["code_decision"][number]
    ).code, // index[0] is safe due zod schema
    // libelleEndCaseCode: endCaseCode: (
    //   metadatas.decision.codes_decision
    //     .code_decision[0] as CphMetadatas["decision"]["codes_decision"]["code_decision"][number]
    // ).libelle, // TODO: which value ? - low
    jurisdictionCode: "", // TODO: which value ? - high
    jurisdictionId: "", // TODO: which value ? - high
    jurisdictionName: "", // TODO: which value ? - high
    selection: publicationRules.interetParticulier,
    sommaire: publicationRules.sommaireInteretParticulier,
    blocOccultation: codeNac.blocOccultationCA,
    occultation: {
      additionalTerms: computeAdditionalTerms(
        publicationRules.occultationsComplementaires
      ),
      categoriesToOmit: codeNac.categoriesToOmitCA[recommandationOccultation],
      motivationOccultation: false,
    },
    recommandationOccultation,
    formation: metadatas.audiences_dossier.audience_dossier.find(
      (_) => _.chronologie === "COURANTE"
    )?.formation,
    parties: [], // TODO: which value ? - low
    composition: [], // TODO: which value ? - low
    tiers: [], // TODO: which value ? - low
    public:
      (metadatas.evenement_porteur.caracteristiques.caracteristique.find(
        (_) => _.mnemo === "PUBD"
      )?.valeur ?? "audience publique") === "audience publique",
    debatPublic: (metadatas.evenement_porteur.caracteristiques.caracteristique.find(
      (_) => _.mnemo === "PUB"
    )?.valeur ?? "") === "", // TODO: which value ? - high
    pourvoiCourDeCassation: false, // TODO: which value ? - high
    pourvoiLocal: false, // TODO: which value ? - high
    filenameSource,
  };
}
