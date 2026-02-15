import { GoogleGenAI, Type } from "@google/genai";
import { ENV } from "../config/env.js";

const ai = new GoogleGenAI({ apiKey: ENV.GEMINI_API_KEY });

export async function generateCoverLetterLatex(
  jobDestription,
  templateLatex,
  currDate
) {
  try {
    const prompt = `
You are given a job description in plain text and a cover letter in latex. Update this old cover letter based on the job description.

Update the following fields (if relavent to the old template):
- Company name
- Company address
- Position title
- Name of hiring manager (use "Hiring Manager" can't be found in the job description with confidence)
- Date (change to current date: ${currDate}. Note the format of the old date, the new date should be in the same format)

Make sure to replace every relavent occurence of these fields, including in the letter body.

Also tailor the cover letter to the job description in subtle ways, but only when approprite. Emphasize aspects of the cover letter that are most relevant to the job.
Only make SMALL edits and keep the original tone. DO NOT invent any information that is not already present in the cover letter.

Job description text:
---
${jobDestription}
---

Old cover letter:
---
${templateLatex}
---
`;

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
    });

    const parsedLatex = response.text
      ?.replaceAll("```latex", "")
      .replaceAll("```", "")
      .trim();

    return parsedLatex;
  } catch (error) {
    console.error("Error generating cover letter latex: ", error);
    throw error;
  }
}

export async function generateCoverLetterMeta(coverLetter) {
  try {
    const prompt = `
You are given a cover letter in latex. Generate the following metadata for it:
- A title for the application combining company name and position title.
    Example: if the company is Apple Inc. and the position is F25 Junior Software Developer Co-Op 171853B, an appropriate title would be "Apple Junior Software Developer Co-Op".
    Use abbreviations like SWE, QA, and DevOps when possible.
    Also use abbreviation for the company name when possible.
- Company name.
- Position title ("Junior Software Developer" rather then "F25 Junior Software Developer Co-Op 171853B").
- Date (use the exact date format shown).

If any of the fields can't be determined from the provided cover letter, use null.

Cover letter:
---
${coverLetter}
---
`;

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING },
            company: { type: Type.STRING },
            position: { type: Type.STRING },
            date: { type: Type.STRING },
          },
        },
      },
    });

    console.log(
      `\nGemini generate meta response:\n ${JSON.stringify(response)}`
    );

    return JSON.parse(response.text);
  } catch (error) {
    console.error("Error generating cover letter meta: ", error);
    throw error;
  }
}
