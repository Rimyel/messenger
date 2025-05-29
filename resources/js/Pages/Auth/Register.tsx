import { Head, Link, useForm } from '@inertiajs/react';
import { FormEventHandler, useState } from 'react';
import { motion } from "framer-motion";
import GuestLayout from '@/Layouts/GuestLayout';
import { AuthService } from '@/services/auth';

export default function Register() {
    const [validationErrors, setValidationErrors] = useState<{
        name?: string;
        email?: string;
        password?: string;
        password_confirmation?: string;
    }>({});

    const { data, setData, post, processing, errors, reset } = useForm({
        name: '',
        email: '',
        password: '',
        password_confirmation: '',
    });

    const validateForm = () => {
        const newErrors: typeof validationErrors = {};
        
        if (!data.name) {
            newErrors.name = "Имя обязательно";
        } else if (data.name.length < 3) {
            newErrors.name = "Имя должно быть не менее 3 символов";
        }

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

        if (!data.password_confirmation) {
            newErrors.password_confirmation = "Подтверждение пароля обязательно";
        } else if (data.password !== data.password_confirmation) {
            newErrors.password_confirmation = "Пароли не совпадают";
        }

        setValidationErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const submit: FormEventHandler = (e) => {
        e.preventDefault();

        if (!validateForm()) {
            return;
        }

        post(route('register'), {
            onError: (errors: any) => {
                // Обновляем стейт с валидационными ошибками
                setValidationErrors({
                    name: errors.name,
                    email: errors.email,
                    password: errors.password,
                    password_confirmation: errors.password_confirmation
                });
            },
            onSuccess: async () => {
                try {
                    // После успешной регистрации получаем API токен
                    const response = await fetch('/api/auth/login', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'Accept': 'application/json',
                        },
                        body: JSON.stringify({
                            email: data.email,
                            password: data.password,
                        }),
                    });

                    const result = await response.json();
                    
                    if (result.token) {
                        // Сохраняем токен в хранилище
                        await AuthService.login({
                            email: data.email,
                            password: data.password,
                        });
                        console.log('Successfully registered and logged in, token:', result.token);
                    }
                } catch (error) {
                    console.error('API auth error after registration:', error);
                }
            },
            onFinish: () => reset('password', 'password_confirmation'),
        });
    };

    return (
        <GuestLayout>
            <Head title="Регистрация" />

            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5 }}
            >
                <form onSubmit={submit} className="space-y-6 text-white">
                    <div>
                        <label htmlFor="name" className="block text-sm font-medium text-white">
                            Имя
                        </label>
                        <input
                            id="name"
                            name="name"
                            type="text"
                            value={data.name}
                            className="mt-1 block w-full rounded-md bg-white/10 border border-white/20 px-3 py-2 text-white placeholder:text-gray-400 focus:border-blue-500 focus:ring-blue-500"
                            autoComplete="name"
                            autoFocus
                            onChange={(e) => setData('name', e.target.value)}
                            required
                        />
                        {(errors.name || validationErrors.name) && (
                            <p className="mt-2 text-sm text-red-500 font-medium">
                                {errors.name || validationErrors.name}
                            </p>
                        )}
                    </div>

                    <div>
                        <label htmlFor="email" className="block text-sm font-medium text-white">
                            Email
                        </label>
                        <input
                            id="email"
                            type="email"
                            name="email"
                            value={data.email}
                            className="mt-1 block w-full rounded-md bg-white/10 border border-white/20 px-3 py-2 text-white placeholder:text-gray-400 focus:border-blue-500 focus:ring-blue-500"
                            autoComplete="username"
                            onChange={(e) => setData('email', e.target.value)}
                            required
                        />
                        {(errors.email || validationErrors.email) && (
                            <p className="mt-2 text-sm text-red-500 font-medium">
                                {errors.email || validationErrors.email}
                            </p>
                        )}
                    </div>

                    <div>
                        <label htmlFor="password" className="block text-sm font-medium text-white">
                            Пароль
                        </label>
                        <input
                            id="password"
                            type="password"
                            name="password"
                            value={data.password}
                            className="mt-1 block w-full rounded-md bg-white/10 border border-white/20 px-3 py-2 text-white placeholder:text-gray-400 focus:border-blue-500 focus:ring-blue-500"
                            autoComplete="new-password"
                            onChange={(e) => setData('password', e.target.value)}
                            required
                        />
                        {(errors.password || validationErrors.password) && (
                            <p className="mt-2 text-sm text-red-500 font-medium">
                                {errors.password || validationErrors.password}
                            </p>
                        )}
                    </div>

                    <div>
                        <label htmlFor="password_confirmation" className="block text-sm font-medium text-white">
                            Подтверждение пароля
                        </label>
                        <input
                            id="password_confirmation"
                            type="password"
                            name="password_confirmation"
                            value={data.password_confirmation}
                            className="mt-1 block w-full rounded-md bg-white/10 border border-white/20 px-3 py-2 text-white placeholder:text-gray-400 focus:border-blue-500 focus:ring-blue-500"
                            autoComplete="new-password"
                            onChange={(e) => setData('password_confirmation', e.target.value)}
                            required
                        />
                        {(errors.password_confirmation || validationErrors.password_confirmation) && (
                            <p className="mt-2 text-sm text-red-500 font-medium">
                                {errors.password_confirmation || validationErrors.password_confirmation}
                            </p>
                        )}
                    </div>

                    <div className="flex items-center justify-end gap-4">
                        <Link
                            href={route('login')}
                            className="text-sm text-blue-400 hover:text-blue-300 transition-colors"
                        >
                            Уже есть аккаунт?
                        </Link>

                        <button
                            type="submit"
                            disabled={processing}
                            className="inline-flex justify-center rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            Зарегистрироваться
                        </button>
                    </div>
                </form>
            </motion.div>
        </GuestLayout>
    );
}
