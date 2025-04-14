import axios from "axios";
import { useAuthStore } from "@/stores/useAuthStore";

const { token } = useAuthStore.getState();

// Создаем экземпляр axios с базовой конфигурацией
const api = axios.create({
    baseURL: "/api", // Laravel API будет доступен по этому базовому URL
    headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        "X-Requested-With": "XMLHttpRequest", // Важно для Laravel для определения AJAX запросов
        Authorization: `Bearer ${token}`,
    
    },
    withCredentials: true, // Важно для работы с Laravel Sanctum
});

// Перехватчик для обработки ошибок
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            // Здесь можно добавить логику для перенаправления на страницу входа
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
};

export default api;
