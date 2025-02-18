import FormData from "form-data"
import axios from "axios"
import { missingValue } from "./error";

if (process.env.NLP_PSEUDONYMISATION_API == null)
  throw missingValue("process.env.NLP_PSEUDONYMISATION_API", new Error());

const { NLP_PSEUDONYMISATION_API } = process.env
const ROUTE_URL = `${NLP_PSEUDONYMISATION_API}/pdf-to-text`

export async function pdfToMarkdown(fileContent: Buffer) {
    const form = new FormData();
    form.append("pdf_file", fileContent, { filename: "test.pdf", contentType: "application/pdf" })

    const res = await axios.postForm(ROUTE_URL, form, { headers: form.getHeaders() })
    console.log(res.data)
    return res
}

