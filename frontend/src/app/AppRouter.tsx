import { Route, Routes, Navigate } from "react-router-dom";
import AppLayout from "@/app/AppLayout";


export default function AppRouter() {
    return (
        <Routes>
            <Route path="/app/letters/:id?" element={<AppLayout />} />
            <Route path="*" element={<Navigate to="/app/letters" replace />} />
        </Routes>
    );
}