import { create } from "zustand";

type UIState = {
    selectedLetterId: string | null;
    setSelectedLetterId: (id: string | null) => void;

    templateLetterId: string | null;
    setTemplateLetterId: (id: string) => void;

    isGenerateOpen: boolean;
    setGenerateOpen: (v: boolean) => void;

    isUploadOpen: boolean;
    setUploadOpen: (v: boolean) => void;

    isLogoutConfirmOpen: boolean;
    setLogoutConfirmOpen: (v: boolean) => void;

    isDeleteConfirmOpen: boolean;
    setDeleteConfirmOpen: (v: boolean) => void;

    isLoginOpen: boolean;
    setLoginOpen: (v: boolean) => void;
};

const LOCAL_KEY = "coverpepper_template_id";

export const useUI = create<UIState>((set) => ({
    selectedLetterId: null,
    setSelectedLetterId: (id) => set({ selectedLetterId: id }),

    templateLetterId: localStorage.getItem(LOCAL_KEY),
    setTemplateLetterId: (id) => {
        localStorage.setItem(LOCAL_KEY, id);
        set({ templateLetterId: id });
    },

    isGenerateOpen: false,
    setGenerateOpen: (v) => set({ isGenerateOpen: v }),

    isUploadOpen: false,
    setUploadOpen: (v) => set({ isUploadOpen: v }),

    isLogoutConfirmOpen: false,
    setLogoutConfirmOpen: (v: boolean) => set({ isLogoutConfirmOpen: v }),

    isDeleteConfirmOpen: false,
    setDeleteConfirmOpen: (v: boolean) => (set({ isDeleteConfirmOpen: v })),

    isLoginOpen: false,
    setLoginOpen: (v: boolean) => (set({ isLoginOpen: v })),
}));