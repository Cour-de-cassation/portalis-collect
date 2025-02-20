import zod from "zod";
import { notSupported } from "../../library/error";
import {
  Categories,
  DecisionDTO,
  LabelStatus,
  Sources,
} from "dbsder-api-types";

const FILE_MAX_SIZE = {
  size: 10000000,
  readSize: "10Mo",
} as const;

type CphFile = {
  mimetype: string;
  size: number;
  buffer: Buffer;
};

export function isFileSupported({ mimetype, size }: CphFile): boolean {
  if (mimetype !== "application/pdf")
    throw notSupported(
      "file.mimetype",
      mimetype,
      new Error("Decision file should be a PDF file")
    );
  if (size >= FILE_MAX_SIZE.size)
    throw notSupported(
      "file.size",
      size,
      new Error(`Decision file max size is ${FILE_MAX_SIZE.readSize}`)
    );
  return true;
}

const schemaCphMetadatas = zod.object({});
export type CphMetadatas = zod.infer<typeof schemaCphMetadatas>;
export function isCphMetadatas(
  cphMetadatas: any
): cphMetadatas is CphMetadatas {
  const result = schemaCphMetadatas.safeParse(cphMetadatas);
  if (result.error)
    throw notSupported("cphMetadatas", cphMetadatas, result.error);
  return true;
}

const schemaPseudoCustomRules = zod.object({
  personneMorale: zod.boolean(),
  personnePhysicoMoraleGeoMorale: zod.boolean(),
  adresse: zod.boolean(),
  dateCivile: zod.boolean(),
  plaqueImmatriculation: zod.boolean(),
  cadastre: zod.boolean(),
  chaineNumeroIdentifiante: zod.boolean(),
  coordonneeElectronique: zod.boolean(),
  professionnelMagistratGreffier: zod.boolean(),
  motifsDebatsChambreConseil: zod.boolean(),
  motifsSecretAffaires: zod.boolean(),
  //   conserverElement: "\#dateCivile|automobile",
  //   supprimerElement: \#magistratGreffe|120.000€"
});
export type PseudoCustomRules = zod.infer<typeof schemaPseudoCustomRules>;
export function isPseudoCustomRules(
  pseudoCustomRules: any
): pseudoCustomRules is PseudoCustomRules {
  const result = schemaPseudoCustomRules.safeParse(pseudoCustomRules);
  if (result.error)
    throw notSupported("pseudoCustomRules", pseudoCustomRules, result.error);
  return true;
}

function computeCategoriesToOmit(
  pseudoCustomRules: PseudoCustomRules
): `${Categories}`[] {
  return (Object.keys(pseudoCustomRules) as (keyof PseudoCustomRules)[]).filter(
    (k) => pseudoCustomRules[k]
  ) as `${Categories}`[];
}

export function mapCphDecision(
  metadatas: CphMetadatas,
  content: string,
  pseudoCustomRules: PseudoCustomRules
): DecisionDTO {
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
      additionalTerms: "",
      categoriesToOmit: computeCategoriesToOmit(pseudoCustomRules),
      motivationOccultation: false,
    },
    originalText: content,
    registerNumber: "",
    sourceId: 0,
    sourceName: Sources.TCOM, // Warning => CPH
    blocOccultation: 1,
  };
}
