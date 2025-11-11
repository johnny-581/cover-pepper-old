import { useEffect, useState } from "react";
import Modal from "@/components/Modal";
import { useGenerateMutation } from "@/features/letters/hooks";
import { useNavigate } from "react-router-dom";
import { useUI } from "@/store";
import { getLetter } from "@/features/letters/api";
import Button from "@/components/Button";
import ThemeContainer from "@/components/ThemeContainer";
import { useHotkeys } from "react-hotkeys-hook";

type Props = { open: boolean; onClose: () => void };

export default function GenerateDialog({ open, onClose }: Props) {
    // open={isGenerateOpen} onClose={() => setGenerateOpen(false)}
    const [jobDescription, setJD] = useState("");
    const [error, setError] = useState<string | null>(null);
    const navigate = useNavigate();
    const { templateLetterId } = useUI();

    const generate = useGenerateMutation();

    useEffect(() => {
        if (!open) {
            setJD("");
            setError(null);
        }
    }, [open]);

    useHotkeys("enter", (e) => {
        e.preventDefault();
        if (open) handleSubmit();
    })

    const handleSubmit = async () => {
        if (!jobDescription.trim()) {
            setError("Empty job description!");
            return;
        }
        setError(null);

        // this dialog should only be openable when there is at least one letter
        try {
            const template = await getLetter(templateLetterId!);
            const created = await generate.mutateAsync({
                jobDescription,
                templateLatex: template.contentLatex
            });
            onClose();
            navigate(`/app/letters/${created.id}`);
        } catch (error) {
            console.error(`Errror generating letter from template: ${error}`);
            setError("Error occured while generating!")
        }
    };

    return (
        <Modal open={open} onClose={onClose} title="Generate from Template">
            <p className="mb-3">Make sure you include as much info about the position as possible - company, address, position, hiring manager... (⌘ + A)</p>
            <ThemeContainer className="">
                <textarea
                    className="h-full w-full p-5 font-serif outline-none resize-none"
                    value={jobDescription}
                    onChange={(e) => setJD(e.target.value)}
                    placeholder="Paste the job description here"
                />
            </ThemeContainer>

            <div className="flex items-center justify-between mt-5">
                {error ? <div className="text-theme-red">{error}</div> : <div></div>}

                <div className="flex items-center gap-2">
                    <Button variant="ghost" onClick={onClose}>Cancel</Button>
                    <Button
                        onClick={handleSubmit}
                        disabled={generate.isPending}
                    >
                        {generate.isPending ? "Generating…" : "Generate"}
                    </Button>
                </div>
            </div>
        </Modal>
    );
}