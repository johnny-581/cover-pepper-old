import axios from "@/lib/axios";
import type { Letter } from "@/features/letters/types";

export async function listLetters(): Promise<Letter[]> {
    const { data } = await axios.get("/api/letters",);
    return data;
}

export async function getLetter(id: string): Promise<Letter> {
    const { data } = await axios.get(`/api/letters/${id}`);
    return data
}

export async function uploadLetter(contentLatex: string): Promise<Letter> {
    const { data } = await axios.post("/api/letters/upload", { contentLatex });
    return data;
}

export async function updateLetter(id: string, meta: object): Promise<Letter> {
    const { data } = await axios.put(`/api/letters/${id}`, meta);
    return data;
}

export async function deleteLetter(id: string): Promise<void> {
    await axios.delete(`/api/letters/${id}`);
}

export async function generateLetter(jobDescription: string, templateLatex: string): Promise<Letter> {
    const currDate = new Date().toDateString();
    const { data } = await axios.post("/api/letters/generate", {
        jobDescription,
        templateLatex,
        currDate,
    });
    return data;
}

export async function compileLetter(id: string): Promise<Blob> {
    const { data } = await axios.post(`/api/letters/${id}/compile`, null, {
        responseType: "blob",
    });
    return data as Blob;
}