import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "../../lib/axios";
import { useNavigate } from "react-router-dom";

type MeResponse = { user: null | { id: string; name?: string; email?: string } };

export function useAuth() {
    const query = useQuery({
        queryKey: ["auth", "me"],
        queryFn: async (): Promise<MeResponse["user"]> => {
            const res = await axios.get<MeResponse>("/api/auth/me"); // ensures the client sends cookie with the request
            return res.data.user;
        }
    });
    const navigate = useNavigate()

    const qc = useQueryClient();

    const logout = useMutation({
        mutationFn: async () => {
            await axios.post("/api/auth/logout");
        },
        onSuccess: () => {
            qc.clear();
            navigate("/");
        }
    });

    return {
        user: query.data ?? null,
        isLoading: query.isLoading,
        logout: logout.mutate
    };
}