import { disconnect } from "../library/DbRawFile";
import { normalizeRawCphFiles } from "../service/cph/handler";

normalizeRawCphFiles({ events: { $not: { $elemMatch: { type: "normalized" } } } }).finally(() => disconnect())