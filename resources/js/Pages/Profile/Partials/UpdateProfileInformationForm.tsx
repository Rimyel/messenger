import { useForm } from '@inertiajs/react';
import { FormEventHandler } from 'react';
import { Input } from "@/Components/ui/input";
import { Button } from "@/Components/ui/button";
import { Label } from "@/Components/ui/label";
import { toast } from "sonner";
import { User } from '@/types/app';

interface Props {
    className?: string;
    status?: string;
    user: Pick<User, 'name' | 'email'>;
}

export default function UpdateProfileInformation({
    className = '',
    status,
    user
}: Props) {
    const { data, setData, patch, processing, errors } = useForm({
        name: user.name,
        email: user.email,
    });

    const submit: FormEventHandler = (e) => {
        e.preventDefault();

        patch(route('profile.update'), {
            preserveScroll: true,
            onSuccess: () => {
                toast.success('Профиль успешно обновлен');
            },
            onError: (errors) => {
                if (errors.email) {
                    toast.error(errors.email);
                }
                if (errors.name) {
                    toast.error(errors.name);
                }
            }
        });
    };

    return (
        <section className={className}>
            <header>
                <h2 className="text-lg font-medium text-gray-900 dark:text-white">
                    Информация профиля
                </h2>

                <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                    Обновите информацию вашего профиля и email адрес.
                </p>
            </header>

            <form onSubmit={submit} className="mt-6 space-y-6">
                <div>
                    <Label htmlFor="name">Имя</Label>
                    <Input
                        id="name"
                        className="mt-1"
                        value={data.name}
                        onChange={(e) => setData('name', e.target.value)}
                        required
                        autoFocus
                        autoComplete="name"
                    />
                    {errors.name && (
                        <p className="mt-2 text-sm text-red-400">{errors.name}</p>
                    )}
                </div>

                <div>
                    <Label htmlFor="email">Email</Label>
                    <Input
                        id="email"
                        type="email"
                        className="mt-1"
                        value={data.email}
                        onChange={(e) => setData('email', e.target.value)}
                        required
                        autoComplete="username"
                    />
                    {errors.email && (
                        <p className="mt-2 text-sm text-red-400">{errors.email}</p>
                    )}
                </div>

                <div className="flex items-center gap-4">
                    <Button type="submit" disabled={processing}>
                        Сохранить
                    </Button>

                    {status && (
                        <p className="text-sm text-green-500">
                            Сохранено.
                        </p>
                    )}
                </div>
            </form>
        </section>
    );
}
