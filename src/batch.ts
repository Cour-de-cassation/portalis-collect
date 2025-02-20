import { CronJob } from "cron";
import { normalizeRawCphFiles } from "./service/cph/handler";
import { logger } from "./library/logger";
import { missingValue } from "./library/error";

if (process.env.NODE_ENV == null)
  throw missingValue("process.env.NODE_ENV", new Error());

const { NODE_ENV } = process.env;

const CRON_EVERY_HOUR =
  NODE_ENV === "local" ? new Date(Date.now() + 1000) : "0 * * * *";

async function startNormalization() {
  CronJob.from({
    cronTime: process.env.NORMALIZATION_BATCH_SCHEDULE || CRON_EVERY_HOUR,
    async onTick() {
      try {
        logger.info({
          operationName: "startNormalization",
          msg: "Normalization starting",
        });
        await normalizeRawCphFiles();
      } catch (error: any) {
        logger.error({
          msg: error instanceof Error ? error.message : "Unknown error format",
          data: error,
        });
      }
    },
    waitForCompletion: true, // onTick cannot be retry if an instance of it is running
    timeZone: "Europe/Paris",
    runOnInit: true, // This attribute is set to launch the normalization batch once at the start of the cronjob
    start: true, // This attribute starts the cron job after its instantiation (equivalent to cron.start())
  });
}

startNormalization();
