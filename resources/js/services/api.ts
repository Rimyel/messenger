import axios from "axios";
import { useAuthStore } from "@/stores/useAuthStore";

// Создаем экземпляр axios с базовой конфигурацией
const api = axios.create({
    baseURL: "/api",
    headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        "X-Requested-With": "XMLHttpRequest",
    },
    withCredentials: true,
});

// Get CSRF token before each request
api.interceptors.request.use(
    function (config) {
        const token = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content');
        if (token) {
            config.headers["X-CSRF-TOKEN"] = token;
        }
        return config;
    },
    function (error) {
        return Promise.reject(error);
    }
);

// Перехватчик запроса для добавления авторизационного токена
api.interceptors.request.use(
    function (config) {
        const { token } = useAuthStore.getState();
        if (token) {
            config.headers["Authorization"] = `Bearer ${token}`;
        }

        // For FormData requests, remove Content-Type header to let the browser set it
        if (config.data instanceof FormData) {
            delete config.headers["Content-Type"];
        }
        
        return config;
    },
    function (error) {
        return Promise.reject(error);
    }
);

// Перехватчик для обработки ошибок
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            // Если ошибка авторизации, можно добавить логику для перенаправления
            window.location.href = "/login";
        }
        return Promise.reject(error);
    }
);
export const CompanyApi = {
    // Получение списка компаний с поиском и пагинацией
    search: async (params: {
        query?: string;
        page?: number;
        per_page?: number;
    }) => {
        const response = await api.get("/companies", {
            params,
        });
        return response.data;
    },

    // Создание новой компании
    create: async (formData: FormData) => {
        const response = await api.post("/companies", formData, {
            headers: {
                "Content-Type": "multipart/form-data", // Важно для загрузки файлов
            },
        });
        return response.data;
    },

    // Получение информации о компании
    get: async (id: number) => {
        const response = await api.get(`/companies/${id}`);
        return response.data;
    },

    // Обновление компании
    update: async (id: number, formData: FormData) => {
        const response = await api.post(`/companies/${id}`, formData, {
            headers: {
                "Content-Type": "multipart/form-data",
            },
        });
        return response.data;
    },

    // Удаление компании
    delete: async (id: number) => {
        await api.delete(`/companies/${id}`);
    },

    // Присоединение к компании
    join: async (id: number) => {
        const response = await api.post(`/companies/${id}/join`);
        return response.data;
    },

    // Выход из компании
    leave: async (id: number) => {
        const response = await api.post(`/companies/${id}/leave`);
        return response.data;
    },
};

export default api;
