import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { Letter } from "@/features/letters/types";
import {
    listLetters,
    getLetter,
    uploadLetter,
    updateLetter,
    deleteLetter,
    generateLetter,
    compileLetter
} from "@/features/letters/api";

export function useLetters() {
    return useQuery({ queryKey: ["letters"], queryFn: listLetters });
}

export function useLetter(id?: string) {
    return useQuery({
        queryKey: ["letter", id],
        queryFn: () => getLetter(id!),
        enabled: !!id
    });
}

export function useUploadMutation() {
    const qc = useQueryClient(); // access the cache
    return useMutation({
        mutationFn: uploadLetter,
        onSuccess: (created: Letter) => {
            qc.invalidateQueries({ queryKey: ["letters"] }); // refreshes letter list
            qc.setQueryData(["letter", created.id], created); // qureyKey, newData - cache new letter
        }
    });
}

export function useUpdateMutation(id: string) {
    const qc = useQueryClient();

    return useMutation({
        mutationFn: (meta: object) => updateLetter(id, meta),
        // optimistic update
        onMutate: async (meta) => {
            await qc.cancelQueries({ queryKey: ["letter", id] });
            const prev = qc.getQueryData(["letter", id]);

            if (prev) {
                // shallow-merge meta into cached letter
                const next = { ...prev, ...(meta as object), updatedAt: new Date().toISOString() };
                qc.setQueryData(["letter", id], next);
            }
            return { prev };
        },

        // rollback on error
        onError: (_err, _meta, ctx) => {
            if (ctx?.prev) qc.setQueryData(["letter", id], ctx.prev);
        },

        // always refetch to reconcile with server truth
        onSettled: () => {
            qc.invalidateQueries({ queryKey: ["letters"] });
            qc.invalidateQueries({ queryKey: ["letter", id] });
        }
    });
}

export function useDeleteMutation() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: deleteLetter,
        onSuccess: () => qc.invalidateQueries({ queryKey: ["letters"] })
    });
}

export function useGenerateMutation() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: ({ jobDescription, templateLatex }: { jobDescription: string; templateLatex: string }) =>
            generateLetter(jobDescription, templateLatex),
        onSuccess: (created: Letter) => {
            qc.invalidateQueries({ queryKey: ["letters"] });
            qc.setQueryData(["letter", created.id], created);
        }
    });
}

export function useCompileMutation() {
    return useMutation({
        mutationFn: (id: string) => compileLetter(id)
    });
}