import { useForm } from '@inertiajs/react';
import { FormEventHandler } from 'react';
import { Input } from "@/Components/ui/input";
import { Button } from "@/Components/ui/button";
import { Label } from "@/Components/ui/label";
import { Transition } from '@headlessui/react';

export default function UpdatePasswordForm({ className = '' }: { className?: string }) {
    const { data, setData, errors, put, reset, processing, recentlySuccessful } = useForm({
        current_password: '',
        password: '',
        password_confirmation: '',
    });

    const updatePassword: FormEventHandler = (e) => {
        e.preventDefault();

        put(route('password.update'), {
            preserveScroll: true,
            onSuccess: () => reset(),
            onError: (errors) => {
                if (errors.password) {
                    reset('password', 'password_confirmation');
                }
                if (errors.current_password) {
                    reset('current_password');
                }
            },
        });
    };

    return (
        <section className={className}>
            <header>
                <h2 className="text-lg font-medium text-gray-900 dark:text-white">
                    Изменение пароля
                </h2>

                <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                    Убедитесь, что ваш аккаунт использует длинный, случайный пароль для обеспечения безопасности.
                </p>
            </header>

            <form onSubmit={updatePassword} className="mt-6 space-y-6">
                <div>
                    <Label htmlFor="current_password">Текущий пароль</Label>
                    <Input
                        id="current_password"
                        type="password"
                        className="mt-1"
                        value={data.current_password}
                        onChange={(e) => setData('current_password', e.target.value)}
                        autoComplete="current-password"
                    />
                    {errors.current_password && (
                        <p className="mt-2 text-sm text-red-400">{errors.current_password}</p>
                    )}
                </div>

                <div>
                    <Label htmlFor="password">Новый пароль</Label>
                    <Input
                        id="password"
                        type="password"
                        className="mt-1"
                        value={data.password}
                        onChange={(e) => setData('password', e.target.value)}
                        autoComplete="new-password"
                    />
                    {errors.password && (
                        <p className="mt-2 text-sm text-red-400">{errors.password}</p>
                    )}
                </div>

                <div>
                    <Label htmlFor="password_confirmation">Подтверждение пароля</Label>
                    <Input
                        id="password_confirmation"
                        type="password"
                        className="mt-1"
                        value={data.password_confirmation}
                        onChange={(e) => setData('password_confirmation', e.target.value)}
                        autoComplete="new-password"
                    />
                    {errors.password_confirmation && (
                        <p className="mt-2 text-sm text-red-400">{errors.password_confirmation}</p>
                    )}
                </div>

                <div className="flex items-center gap-4">
                    <Button type="submit" disabled={processing}>
                        Сохранить
                    </Button>

                    <Transition
                        show={recentlySuccessful}
                        enter="transition ease-in-out"
                        enterFrom="opacity-0"
                        leave="transition ease-in-out"
                        leaveTo="opacity-0"
                    >
                        <p className="text-sm text-green-500">
                            Сохранено.
                        </p>
                    </Transition>
                </div>
            </form>
        </section>
    );
}
