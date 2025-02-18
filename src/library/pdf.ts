import FormData from "form-data";
import axios from "axios";
import { missingValue } from "./error";

if (process.env.NLP_PSEUDONYMISATION_API == null)
  throw missingValue("process.env.NLP_PSEUDONYMISATION_API", new Error());

const { NLP_PSEUDONYMISATION_API } = process.env;
const ROUTE_URL = `${NLP_PSEUDONYMISATION_API}/pdf-to-text`;

type PdfToMarkDownAnswer = {
  markdownText: string;
  images: { [key: string]: string };
};

export async function pdfToMarkdown(fileName: string, fileContent: Buffer): Promise<string> {
  const form = new FormData();
  form.append("pdf_file", fileContent, { filename: fileName, contentType: "application/pdf" });

  const res = await axios.postForm<PdfToMarkDownAnswer>(ROUTE_URL, form, {
    headers: form.getHeaders(),
  });
  return res.data.markdownText;
}
