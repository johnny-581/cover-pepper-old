import Button from "@/components/Button";
import { useUI } from "@/store";
import { useAuth } from "@/features/auth/useAuth";
import ConfirmDialog from "@/components/ConfirmDialog";

export default function AccountMenu() {
    const { logout } = useAuth();
    const { isLogoutConfirmOpen, setLogoutConfirmOpen } = useUI();

    return (
        <>
            <div className="flex p-3 items-center justify-between border-t-[1px] border-theme-medium-gray">
                <Button variant="ghost" onClick={() => setLogoutConfirmOpen(true)}>
                    Logout
                </Button>
            </div>

            <ConfirmDialog
                open={isLogoutConfirmOpen}
                message="Sure you want to logout?"
                onConfirm={() => {
                    logout();
                    setLogoutConfirmOpen(false);
                }}
                onCancel={() => setLogoutConfirmOpen(false)}>
            </ConfirmDialog>
        </>
    )
}