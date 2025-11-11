import { useLetters } from "@/features/letters/hooks";
import LetterList from "@/features/letters/components/LetterList";
import { useUI } from "@/store";
import Button from "@/components/Button";
import AccountMenu from "../features/settings/AccountMenu";
import logo from "@/assets/logo.png";
import { SquarePen, Upload } from "lucide-react"

export default function Sidebar() {
    const { data } = useLetters();
    const { setGenerateOpen, setUploadOpen } = useUI();

    return (
        <aside className="min-w-[300px] w-[300px] theme-border-right bg-theme-light-gray flex flex-col">
            <div className="flex items-center p-5">
                <img src={logo} alt="logo" className="h-9 pr-1" />
                <div className="font-bold pl-2">Cover Pepper</div>
            </div>

            <div className="p-2">
                <Button variant="ghost" contentLeft icon={<SquarePen color="var(--color-theme-black)" />} className="w-full" onClick={() => setGenerateOpen(true)} disabled={data?.length === 0}>
                    Generate New Letter
                </Button>
                <Button variant="ghost" contentLeft icon={<Upload color="var(--color-theme-black)" />} className="w-full" onClick={() => setUploadOpen(true)}>
                    Upload .tex
                </Button>
            </div>


            <div className="flex-1 min-h-0 overflow-auto">
                <LetterList letters={data ?? []} />
            </div>

            <AccountMenu />
        </aside>
    );
}