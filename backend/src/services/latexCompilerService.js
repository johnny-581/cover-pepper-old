import axios from "axios";
import { ENV } from "../config/env.js";

const api = axios.create({ baseURL: ENV.LATEX_COMPILER_API_URL });

export async function compileLatexToPdf(latexSource) {
    const response = await api.post("/latex-compiler", { latex_source: latexSource });

    if (response.data.statusCode == 500) {
        console.error(response.data.body);
        throw new Error(`Error occured while generating PDF (!!): ${response.data.body}`)
    }

    const base64 = response.data.body;

    // console.log(`\nCompiled PDF:\n ${JSON.stringify(response)}`);

    return Buffer.from(base64, "base64");
}