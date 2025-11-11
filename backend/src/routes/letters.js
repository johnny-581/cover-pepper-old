import { Router } from "express";
import prisma from "../config/prisma.js";
import { requireAuth } from "../middleware/auth.js";
import { generateCoverLetterLatex, generateCoverLetterMeta } from "../services/geminiService.js";
import { compileLatexToPdf } from "../services/latexCompilerService.js";

const router = Router();

router.use(requireAuth);

// list cover letters for an authenticated user
router.get("/", async (req, res, next) => {
    try {
        // console.log('cookie header:', req.headers.cookie);
        // console.log('user:', req.user);
        const userId = req.user.id;
        const letters = await prisma.coverLetter.findMany({
            where: { userId },
            orderBy: { date: "desc" },
        });
        res.json(letters);
    } catch (err) {
        next(err);
    }
});

// get specific letter with id and user
router.get("/:id", async (req, res, next) => {
    try {
        const userId = req.user.id;
        const { id } = req.params;

        console.log(id)

        const letter = await prisma.coverLetter.findFirst({ where: { id, userId } });
        if (!letter) return res.status(404).json({ error: "Not found!" });
        res.json(letter);
    } catch (err) {
        next(err);
    }
});

// create a letter from upload
router.post("/upload", async (req, res, next) => {
    try {
        const userId = req.user.id;
        const { contentLatex } = req.body;

        const generatedMeta = await generateCoverLetterMeta(contentLatex);
        const { title, company, position, date } = generatedMeta;

        const created = await prisma.coverLetter.create({
            data: {
                title,
                company,
                position,
                date,
                contentLatex,
                userId,
            }
        });
        res.status(201).json(created);
    } catch (err) {
        next(err);
    }
});

// update a letter
router.put("/:id", async (req, res, next) => {
    try {
        const userId = req.user.id;
        const { id } = req.params;
        const { title, company, position, date, contentLatex } = req.body;

        const existing = await prisma.coverLetter.findFirst({ where: { id, userId } });
        if (!existing) return res.status(404).json({ error: "Not found" });

        const updated = await prisma.coverLetter.update({
            where: { id },
            data: {
                title: title ?? existing.title,
                company: company ?? existing.company,
                position: position ?? existing.position,
                date: date ?? existing.date,
                contentLatex: contentLatex ?? existing.contentLatex
            }
        });
        res.json(updated);
    } catch (err) {
        next(err)
    }
});

// delete a letter
router.delete("/:id", async (req, res, next) => {
    try {
        const userId = req.user.id;
        const { id } = req.params;

        const existing = await prisma.coverLetter.findFirst({ where: { id, userId } });
        if (!existing) return res.status(404).json({ error: "Not found" });

        await prisma.coverLetter.delete({ where: { id } });
        res.status(204).send();
    } catch (err) {
        next(err);
    }
});

// generate a letter from a job description and another letter as template
router.post("/generate", async (req, res, next) => {
    try {
        // console.log(`Request to backend:\n ${JSON.stringify(req.body)}`);
        const userId = req.user.id;
        const { jobDescription, templateLatex, currDate } = req.body;

        if (!jobDescription || !templateLatex)
            return res.status(400).json({ error: "Missing jobDescription or template!" });

        const generatedLatex = await generateCoverLetterLatex(jobDescription, templateLatex, currDate);
        const generatedMeta = await generateCoverLetterMeta(generatedLatex);
        const { title, company, position, date } = generatedMeta;

        const created = await prisma.coverLetter.create({
            data: {
                title,
                company,
                position,
                date,
                contentLatex: generatedLatex,
                userId
            }
        });

        res.status(201).json(created);
    } catch (err) {
        next(err);
    }
});

router.post("/:id/compile", async (req, res, next) => {
    try {
        const userId = req.user.id;
        const { id } = req.params;

        const letter = await prisma.coverLetter.findFirst({ where: { id, userId } });
        if (!letter) return res.status(404).json({ error: "Letter not in database when trying to compile!" });

        const pdfBuffer = await compileLatexToPdf(letter.contentLatex);

        res.setHeader("Content-Type", "application/pdf");
        res.setHeader("Content-Disposition", `attachment; filename="${letter.title}"`);
        res.send(pdfBuffer);
    } catch (err) {
        next(err);
    }
})

export default router;