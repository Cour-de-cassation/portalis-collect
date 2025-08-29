import { disconnect } from "../library/DbRawFile";
import { normalizeRawCphFiles } from "../service/cph/handler";


normalizeRawCphFiles().finally(() => disconnect())