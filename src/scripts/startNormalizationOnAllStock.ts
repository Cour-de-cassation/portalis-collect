import { disconnect } from "../library/rawFileDB";
import { normalizeRawCphFiles } from "../service/cph/handler";

normalizeRawCphFiles({ events: { $not: { $elemMatch: { type: "normalized" } } } }).finally(() => disconnect())