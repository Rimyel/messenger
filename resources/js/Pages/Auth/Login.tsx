import { Head, Link, useForm } from '@inertiajs/react';
import { FormEventHandler } from 'react';
import { motion } from "framer-motion";
import GuestLayout from '@/Layouts/GuestLayout';
import { AuthService } from '@/services/auth';

export default function Login({
    status,
    canResetPassword,
}: {
    status?: string;
    canResetPassword: boolean;
}) {
    const { data, setData, post, processing, errors, reset } = useForm<{
        email: string;
        password: string;
        remember: boolean;
    }>({
        email: '',
        password: '',
        remember: false,
    });

    const submit: FormEventHandler = (e) => {
        e.preventDefault();

        // Используем стандартную веб-авторизацию через Inertia
        post(route('login'), {
            onSuccess: async () => {
                try {
                    // После успешной веб-авторизации получаем API токен
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
                        AuthService.login({
                            email: data.email,
                            password: data.password,
                        });
                        console.log('Successfully logged in, token:', result.token);
                    }
                } catch (error) {
                    console.error('API auth error:', error);
                }
            },
            onFinish: () => reset('password'),
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
                            autoFocus
                            onChange={(e) => setData('email', e.target.value)}
                        />
                        {errors.email && (
                            <p className="mt-2 text-sm text-red-400">{errors.email}</p>
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
                            autoComplete="current-password"
                            onChange={(e) => setData('password', e.target.value)}
                        />
                        {errors.password && (
                            <p className="mt-2 text-sm text-red-400">{errors.password}</p>
                        )}
                    </div>

                    <div className="flex items-center justify-between">
                        <label className="flex items-center">
                            <input
                                type="checkbox"
                                name="remember"
                                checked={data.remember}
                                onChange={(e) => setData('remember', e.target.checked)}
                                className="rounded border-white/20 bg-white/10 text-blue-500 focus:ring-blue-500"
                            />
                            <span className="ml-2 text-sm text-white">
                                Запомнить меня
                            </span>
                        </label>

                        {canResetPassword && (
                            <Link
                                href={route('password.request')}
                                className="text-sm text-blue-400 hover:text-blue-300 transition-colors"
                            >
                                Забыли пароль?
                            </Link>
                        )}
                    </div>

                    <div className="flex items-center justify-end gap-4">
                        <Link
                            href={route('register')}
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
