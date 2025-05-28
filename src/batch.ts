import { CronJob } from "cron";
import { normalizeRawCphFiles } from "./service/cph/handler";
import { logger } from "./library/logger";
import { NODE_ENV, NORMALIZATION_BATCH_SCHEDULE } from "./library/env";

const CRON_EVERY_HOUR =
  NODE_ENV === "local" ? new Date(Date.now() + 1000) : "0 * * * *";

async function startNormalization() {
  CronJob.from({
    cronTime: NORMALIZATION_BATCH_SCHEDULE ?? CRON_EVERY_HOUR,
    async onTick() {
      try {
        logger.info({
          operationName: "startNormalization",
          msg: "Normalization starting",
        });
        (await normalizeRawCphFiles()).forEach((_) =>
          logger.error({ msg: _.message, data: _ })
        );
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
