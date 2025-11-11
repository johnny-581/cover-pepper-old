import Sidebar from "@/components/Sidebar";
import { useUI } from "@/store";
import UploadDialog from "@/features/letters/components/UploadDialog";
import GenerateDialog from "@/features/letters/components/GenerateDialog";
import LoginDialog from "@/features/auth/LoginDialog";
import { useEffect } from "react";
import { useAuth } from "@/features/auth/useAuth";
import EditorPanel from "@/components/EditorPanel";

export default function AppLayout() {
    const { isUploadOpen, isGenerateOpen, isLoginOpen, setUploadOpen, setGenerateOpen, setLoginOpen } = useUI();
    const { user, isLoading } = useAuth()

    useEffect(() => {
        if (!isLoading) setLoginOpen(!user);
    }, [user, isLoading, setLoginOpen]);

    return (
        <div className="h-screen w-screen flex font-sans text-theme-black text-[16px]">
            <Sidebar />
            <EditorPanel />

            <UploadDialog open={isUploadOpen} onClose={() => setUploadOpen(false)} />
            <GenerateDialog open={isGenerateOpen} onClose={() => setGenerateOpen(false)} />
            <LoginDialog open={isLoginOpen} />
        </div>
    );
}