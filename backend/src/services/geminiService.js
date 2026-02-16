import { GoogleGenAI, Type } from "@google/genai";
import { ENV } from "../config/env.js";

const ai = new GoogleGenAI({ apiKey: ENV.GEMINI_API_KEY });

export async function generateCoverLetterLatex(
  jobDestription,
  templateLatex,
  currDate
) {
  try {
    const prompt = `# Task
You are a cover letter customization assistant. Your task is to update an existing LaTeX cover letter based on a provided job description.

# Critical Output Requirement
**OUTPUT ONLY THE LATEX CODE. DO NOT include any explanations, comments, or markdown formatting.**

# Required Field Updates
Update the following fields if relevant to the template:

1. **Company name** - Extract from job description
   - When you mention company name inside the letter body, use abbreviations if provided in the job description.
2. **Company address** - Extract from job description
3. **Position title** - Use concise versions when appropriate
   - Example: "Cloud Innovation Centre" or "CIC" instead of "S26 Cloud Innovation Centre (CIC) Developer"
4. **Hiring manager name** - Use "Hiring Manager" if not confidently found in job description
5. **Date** - Update to: ${currDate}
   - Important: Maintain the same format as the original date

**Note:** Ensure ALL relevant occurrences of these fields are replaced throughout the entire letter, including the body text.

# Content Tailoring Guidelines
- Make SUBTLE tailoring adjustments to align with the job description
- Emphasize aspects of the cover letter most relevant to the position
- Keep edits SMALL and maintain the original tone
- DO NOT invent or fabricate any information not already present in the cover letter
- Only make changes when appropriate

# Input Data

## Job Description:
---
${jobDestription}
---

## Current Cover Letter (LaTeX):
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
    const prompt = `# Task
Extract metadata from the provided LaTeX cover letter and generate structured information.

# Required Fields

1. **title** - Application title combining company and position
   - Format: "[Company] [Position]"
   - Example: "Apple Junior Software Developer Co-Op"
   - Use common abbreviations when possible:
     - Position: SWE, QA, DevOps, etc.
     - Company: Use shortened/abbreviated forms when appropriate
   - Remove unnecessary identifiers (e.g., "F25", job codes like "171853B")

2. **company** - Company name as stated in the letter

3. **position** - Clean position title
   - Remove prefixes like "F25", "S26", etc.
   - Remove job codes and identifiers
   - Example: "Junior Software Developer" instead of "F25 Junior Software Developer Co-Op 171853B"

4. **date** - Date in the exact format shown in the letter

# Handling Missing Data
If any field cannot be confidently determined from the cover letter, set its value to null.

# Input

## Cover Letter (LaTeX):
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
