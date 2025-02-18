import { notSupported, missingValue } from "../library/error";
import { v4 as uuid } from "uuid";
import { getFileByName, getFileNames, saveFile } from "../library/fileRepository";
import { pdfToMarkdown } from "../library/pdf";
import { logger } from "../library/logger";
import { mardownToPlainText } from "../library/markdown";

const FILE_MAX_SIZE = {
  size: 10000000,
  readSize: "10Mo",
} as const;

if (process.env.S3_BUCKET_NAME_RAW == null)
  throw missingValue("process.env.S3_BUCKET_NAME_RAW", new Error());
if (process.env.S3_BUCKET_NAME_NORMALIZED == null)
  throw missingValue("process.env.S3_BUCKET_NAME_NORMALIZED", new Error());
const { S3_BUCKET_NAME_RAW, S3_BUCKET_NAME_NORMALIZED } = process.env;

type CphFile = {
  mimetype: string;
  size: number;
  buffer: Buffer;
};

function checkSupportedFile({ mimetype, size }: CphFile) {
  if (mimetype !== "application/pdf")
    throw notSupported(
      "file.mimetype",
      mimetype,
      new Error("Decision file should be a PDF file")
    );
  if (size >= FILE_MAX_SIZE.size)
    throw notSupported(
      "file.size",
      size,
      new Error(`Decision file max size is ${FILE_MAX_SIZE.readSize}`)
    );
}

export function saveRawCph(cphFile: CphFile) {
  checkSupportedFile(cphFile);
  const name = `${uuid()}-${new Date().toISOString()}.pdf`;
  return saveFile(S3_BUCKET_NAME_RAW, name, cphFile.buffer, "application/pdf");
}

async function normalizeRawCphFile(fileName: string, cphFile: Buffer) {
  try {
    const markdown = await pdfToMarkdown(fileName, cphFile)
    const decisionContent = await mardownToPlainText(markdown)
    
    return true
  } catch(err) {
    logger.error(err, `${err}`)
    return false
  }
}

export async function normalizeRawCphFiles() {
  const fileNames = await getFileNames(S3_BUCKET_NAME_RAW)
  return fileNames.map(async fileName => {
    const file = await getFileByName(S3_BUCKET_NAME_RAW, fileName)
    return normalizeRawCphFile(fileName, Buffer.from(file.buffer))
  })
}
