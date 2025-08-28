import { logger } from "../../library/logger";
import { PortalisFileInformation } from "../rawDecision/models";

export function logAttachmentError(attachmentId: number, error: Error) {
    logger.error({
            operationName: "searchMetadatas",
            msg: `Error on attachment ${attachmentId}:\n${error}`
          })
}

export function logExtractionStart() {
    logger.info({
        operationName: "getCphContent",
        msg: "Waiting for text extraction"
    })
}

export function logExtractionEnd() {
    logger.info({
        operationName: "getCphContent",
        msg: "Text successfully extracted"
    })
}

export function logNormalisationIdentification(rawCph: PortalisFileInformation): void {
    logger.info({
        operationName: "normalizeRawCphFiles",
        msg: `normalize ${rawCph._id} - ${rawCph.path}`,
    });
}

export function logNormalisationSuccess(rawCph: PortalisFileInformation): void {
    logger.info({
        operationName: "normalizeRawCphFiles",
        msg: `${rawCph._id} normalized with success`
    })
}

export function logNormalisationError(rawCph: PortalisFileInformation, error: Error): void {
    logger.error({
        operationName: "normalizeRawCphFiles",
        msg: `${rawCph._id} failed to normalize due ${error.message}`,
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
