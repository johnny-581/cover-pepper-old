import { createPortal } from "react-dom";
import ThemeContainer from "./ThemeContainer";
import Button from "./Button";
import { useHotkeys } from "react-hotkeys-hook";

type Props = {
    open: boolean;
    message: string;
    onConfirm: () => void;
    onCancel: () => void;
};

export default function ConfirmDialog({ open, message, onConfirm, onCancel }: Props) {
    useHotkeys("esc", (e) => {
        e.preventDefault();
        if (open) onCancel();
    }, [open, onCancel]);

    useHotkeys("enter", (e) => {
        e.preventDefault();
        if (open) onConfirm();
    }, [open, onConfirm])

    if (!open) return null;
    const root = document.getElementById("portal-root")!;

    return (createPortal(
        <div className="fixed inset-0 bg-black/20 backdrop-blur-xs flex items-center justify-center font-sans text-almost-black p-10">
            <ThemeContainer
                autoHeightAndWidth
                className="bg-almost-white p-5 w-[300px] h-[180px] max-w-full max-h-full overflow-auto theme-shadow flex flex-col"
            >
                <div className="flex flex-1 items-center justify-center text-center">{message}</div>

                <div className="flex items-center justify-end gap-2">
                    <Button variant="ghost" onClick={onCancel}>Cancel</Button>
                    <Button onClick={onConfirm}>Yes</Button>
                </div>
            </ThemeContainer>
        </div>,
        root
    ));
}