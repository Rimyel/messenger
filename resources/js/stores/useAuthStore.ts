import { create } from "zustand";
import { persist } from "zustand/middleware";

interface AuthUser {
    id: number;
    name: string;
    email: string;
    avatar?: string;
    company_id?: number;
}

interface AuthState {
    token: string | null;
    user: AuthUser | null;
    setToken: (token: string) => void;
    setUser: (user: AuthUser) => void;
    clearAuth: () => void;
}

export const useAuthStore = create<AuthState>()(
    persist(
        (set) => ({
            token: null,
            user: null,
            setToken: (token: string) => set({ token }),
            setUser: (user: AuthUser) => set({ user }),
            clearAuth: () => set({ token: null, user: null }),
        }),
        {
            name: "auth-storage",
        }
    )
);
