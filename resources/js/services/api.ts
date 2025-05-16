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

// Объединенный перехватчик для добавления всех необходимых заголовков
api.interceptors.request.use(
    function (config) {
        // Добавляем CSRF токен
        const csrfToken = document
            .querySelector('meta[name="csrf-token"]')
            ?.getAttribute("content");
        if (csrfToken) {
            config.headers["X-CSRF-TOKEN"] = csrfToken;
        }

        // Добавляем авторизационный токен
        const { token } = useAuthStore.getState();
        if (token) {
            config.headers["Authorization"] = `Bearer ${token}`;
        }

        // Для FormData запросов удаляем Content-Type
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
};

export default api;
