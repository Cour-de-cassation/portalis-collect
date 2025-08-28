import { disconnect } from "../library/rawFileDB";
import { normalizeRawCphFiles } from "../service/cph/handler";


normalizeRawCphFiles().finally(() => disconnect())