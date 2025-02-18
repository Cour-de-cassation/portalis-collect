import { Router } from "express";
import multer from "multer";
import { missingValue } from "../library/error";
import { saveRawCph } from "../service/cph";

export const FILE_FIELD = "fichierDecisionIntegre";

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

  try {
    await saveRawCph(req.file);
    res.setHeader("Content-Type", "text/plain");
    res.send({ message: "Your file has been saved."});
  } catch (err: unknown) {
    console.error(err);
    next(err);
  }
});

export default app;
