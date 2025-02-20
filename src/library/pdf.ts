import FormData from "form-data";
import axios from "axios";
import {
  PDFDocument,
  PDFName,
  PDFDict,
  PDFArray,
  PDFHexString,
  PDFString,
  PDFRawStream,
  PDFStream,
  decodePDFRawStream,
} from "pdf-lib";
import { missingValue } from "./error";

if (process.env.NLP_PSEUDONYMISATION_API == null)
  throw missingValue("process.env.NLP_PSEUDONYMISATION_API", new Error());

const { NLP_PSEUDONYMISATION_API } = process.env;
const ROUTE_URL = `${NLP_PSEUDONYMISATION_API}/pdf-to-text`;

type PdfToMarkDownAnswer = {
  markdownText: string;
  images: { [key: string]: string };
};

export async function pdfToMarkdown(
  fileName: string,
  fileContent: Buffer
): Promise<string> {
  const form = new FormData();
  form.append("pdf_file", fileContent, {
    filename: fileName,
    contentType: "application/pdf",
  });

  const res = await axios.postForm<PdfToMarkDownAnswer>(ROUTE_URL, form, {
    headers: form.getHeaders(),
  });
  return res.data.markdownText;
}

function extractAttachmentsFromPdfLib(pdfDoc: PDFDocument) {
  // Warn: Code coming from https://github.com/Hopding/pdf-lib/issues/534
  // It should be easier in future: https://github.com/cantoo-scribe/pdf-lib/pull/80
  if (!pdfDoc.catalog.has(PDFName.of("Names"))) return [];
  const Names = pdfDoc.catalog.lookup(PDFName.of("Names"), PDFDict);
  if (!Names.has(PDFName.of("EmbeddedFiles"))) return [];
  const EmbeddedFiles = Names.lookup(PDFName.of("EmbeddedFiles"), PDFDict);
  if (!EmbeddedFiles.has(PDFName.of("Names"))) return [];
  const EFNames = EmbeddedFiles.lookup(PDFName.of("Names"), PDFArray);

  const rawAttachments = [];
  for (let idx = 0, len = EFNames.size(); idx < len; idx += 2) {
    const fileName = EFNames.lookup(idx) as PDFHexString | PDFString;
    const fileSpec = EFNames.lookup(idx + 1, PDFDict);
    rawAttachments.push({ fileName, fileSpec });
  }

  return rawAttachments.map(({ fileName, fileSpec }) => {
    const stream = fileSpec
      .lookup(PDFName.of("EF"), PDFDict)
      .lookup(PDFName.of("F"), PDFStream) as PDFRawStream;
    return {
      name: fileName.decodeText(),
      data: Buffer.from(decodePDFRawStream(stream).decode().buffer),
    };
  });
}

export async function extractAttachments(
  fileContent: Buffer
): Promise<{ name: string; data: Buffer }[]> {
  const pdfDoc = await PDFDocument.load(fileContent);
  return extractAttachmentsFromPdfLib(pdfDoc);
}
