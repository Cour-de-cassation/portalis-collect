import { logger } from "../../library/logger";
import { NormalizationResult, RawCph } from "./models";



export function logNormalisationIdentification(rawCph: RawCph): void {
    logger.info({
        operationName: "normalizeRawCphFiles",
        msg: `normalize ${rawCph._id} - ${rawCph.path}`,
    });
}

export function logNormalisationSuccess(rawCph: RawCph): void {
    logger.info({
        operationName: "normalizeRawCphFiles",
        msg: `${rawCph._id} normalized with success`
    })
}

export function logNormalisationError(rawCph: RawCph, error: Error): void {
    logger.error({
        operationName: "normalizeRawCphFiles",
        msg: `${rawCph._id} failed to normalize due ${error.message}`,
    })
}

export function logRawCpNotSaved(result: NormalizationResult, err: Error) {
    logger.error({
        operationName: "updateRawCphStatus",
        msg: `${result.rawCph._id} has been treated with a status: ${result.status} but has not be saved in rawFiles due: ${err} `,
    })
}

export function logNormalizationInputs(decisionsToNormalize: number): void {
    logger.info({
        operationName: "normalizeRawCphFiles",
        msg: `Find ${decisionsToNormalize} raw decisions to normalize`,
    });
}

export function logNormalizationResults(success: number, skipped: number): void {
    logger.info({
        operationName: "normalizeRawCphFiles",
        msg: `Decisions successfully normalized: ${success}`,
    });
    logger.info({
        operationName: "normalizeRawCphFiles",
        msg: `Decisions skipped: ${skipped}`,
    });
}
