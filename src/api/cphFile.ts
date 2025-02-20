import { Router, json } from "express";
import multer from "multer";
import { missingValue } from "../library/error";
import { saveRawCph } from "../service/cph/handler";
import { isPseudoCustomRules } from "../service/cph/models";
import { logger } from "../library/logger";

export const FILE_FIELD = "fichierDecisionIntegre";
export const PSEUDO_CUSTOM_RULES_FIELD = "occultationsComplementaires";

const app = Router();
const upload = multer();

app.post("/decision", upload.single(FILE_FIELD), async (req, res, next) => {
  if (!req.file)
    return next(
      missingValue(
        FILE_FIELD,
        new Error(
          `Decision file is missing on request form-data key: ${FILE_FIELD}`
        )
      )
    );

  if (!req.body?.[PSEUDO_CUSTOM_RULES_FIELD]) {
    return next(
      missingValue(
        FILE_FIELD,
        new Error(`${PSEUDO_CUSTOM_RULES_FIELD} is missing on request body`)
      )
    );
  }

  try {
    await saveRawCph(req.file, req.body[PSEUDO_CUSTOM_RULES_FIELD]);
    res.setHeader("Content-Type", "text/plain");
    res.send({ message: "Your file has been saved." });
  } catch (err: unknown) {
    req.log.error(err);
    next(err);
  }
});

export default app;
