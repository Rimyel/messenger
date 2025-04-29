import api from "./api";
import { useAuthStore } from "@/stores/useAuthStore";

interface LoginCredentials {
    email: string;
    password: string;
}

interface AuthResponse {
    token: string;
    user: any;
    message: string;
}

export const AuthService = {
    // Аутентификация пользователя
    async login(credentials: LoginCredentials) {
        try {
            const response = await api.post<AuthResponse>(
                "/auth/login",
                credentials
            );
            const { token, user } = response.data;

            // Сохраняем токен в хранилище
            console.log(token);

            useAuthStore.getState().setToken(token);
            useAuthStore.getState().setUser(user);

            return { user, token };
        } catch (error) {
            console.error("Login error:", error);
            throw error;
        }
    },

    // Выход пользователя
    async logout() {
        try {
            await api.post("/auth/logout");
            // Очищаем токен из хранилища
            // useAuthStore.getState().clearToken();
        } catch (error) {
            console.error("Logout error:", error);
            throw error;
        }
    },

    // Получение информации о текущем пользователе
    async getCurrentUser() {
        try {
            const response = await api.get("/auth/me");
            return response.data.user;
        } catch (error) {
            console.error("Get current user error:", error);
            throw error;
        }
    },

    // Проверка авторизации
    isAuthenticated(): boolean {
        return !!useAuthStore.getState().token;
    },

    // Получить текущий токен
    getCurrentToken(): string | null {
        return useAuthStore.getState().token;
    },
};
