import { Head, Link, useForm } from "@inertiajs/react";
import { FormEventHandler, useState } from "react";
import { motion } from "framer-motion";
import GuestLayout from "@/Layouts/GuestLayout";
import { AuthService } from "@/services/auth";
import { useAuthStore } from "@/stores/useAuthStore";

export default function Login({
    status,
    canResetPassword,
}: {
    status?: string;
    canResetPassword: boolean;
}) {
    const [validationErrors, setValidationErrors] = useState<{
        email?: string;
        password?: string;
    }>({});

    const { data, setData, post, processing, errors, reset } = useForm<{
        email: string;
        password: string;
        remember: boolean;
    }>({
        email: "",
        password: "",
        remember: false,
    });

    const validateForm = () => {
        const newErrors: typeof validationErrors = {};
        
        if (!data.email) {
            newErrors.email = "Email обязателен";
        } else if (!/^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i.test(data.email)) {
            newErrors.email = "Некорректный email адрес";
        }

        if (!data.password) {
            newErrors.password = "Пароль обязателен";
        } else if (data.password.length < 8) {
            newErrors.password = "Пароль должен быть не менее 8 символов";
        }

        setValidationErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        
        if (!validateForm()) {
            return;
        }

        post(route("login"), {
            onSuccess: (response: any) => {
                console.log(response?.props);

                // Сохраняем токен и пользователя в Zustand
                useAuthStore.getState().setToken(response?.props?.auth?.token);
                useAuthStore.getState().setUser(response?.props?.auth?.user);

                console.log("Successfully logged in, data saved to store");

                // Перенаправляем на dashboard
                // window.location.href = "/dashboard";
            },
            onError: (errors: any) => {
                // Обновляем стейт с валидационными ошибками
                setValidationErrors({
                    email: errors.email,
                    password: errors.password,
                });
            },
            onFinish: () => reset("password"),
        });
    };

    return (
        <GuestLayout>
            <Head title="Вход в систему" />

            {status && (
                <div className="mb-4 text-sm font-medium text-green-400">
                    {status}
                </div>
            )}

            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5 }}
            >
                <form onSubmit={submit} className="space-y-6 text-white">
                    <div>
                        <label
                            htmlFor="email"
                            className="block text-sm font-medium text-white"
                        >
                            Email
                        </label>
                        <input
                            id="email"
                            type="email"
                            name="email"
                            value={data.email}
                            className="mt-1 block w-full rounded-md bg-white/10 border border-white/20 px-3 py-2 text-white placeholder:text-gray-400 focus:border-blue-500 focus:ring-blue-500"
                            autoComplete="username"
                            autoFocus
                            onChange={(e) => setData("email", e.target.value)}
                        />
                        {(errors.email || validationErrors.email) && (
                            <p className="mt-2 text-sm text-red-500 font-medium">
                                {errors.email || validationErrors.email}
                            </p>
                        )}
                    </div>

                    <div>
                        <label
                            htmlFor="password"
                            className="block text-sm font-medium text-white"
                        >
                            Пароль
                        </label>
                        <input
                            id="password"
                            type="password"
                            name="password"
                            value={data.password}
                            className="mt-1 block w-full rounded-md bg-white/10 border border-white/20 px-3 py-2 text-white placeholder:text-gray-400 focus:border-blue-500 focus:ring-blue-500"
                            autoComplete="current-password"
                            onChange={(e) =>
                                setData("password", e.target.value)
                            }
                        />
                        {(errors.password || validationErrors.password) && (
                            <p className="mt-2 text-sm text-red-500 font-medium">
                                {errors.password || validationErrors.password}
                            </p>
                        )}
                    </div>


                    <div className="flex items-center justify-end gap-4">
                        <Link
                            href={route("register")}
                            className="text-sm text-blue-400 hover:text-blue-300 transition-colors"
                        >
                            Нет аккаунта?
                        </Link>

                        <button
                            type="submit"
                            disabled={processing}
                            className="inline-flex justify-center rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            Войти
                        </button>
                    </div>
                </form>
            </motion.div>
        </GuestLayout>
    );
}
