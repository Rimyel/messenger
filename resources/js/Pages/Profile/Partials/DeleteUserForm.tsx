import { useRef, useState, FormEventHandler } from 'react';
import { useForm } from '@inertiajs/react';
import { Button } from "@/Components/ui/button";
import { Input } from "@/Components/ui/input";
import { Label } from "@/Components/ui/label";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/Components/ui/dialog";

export default function DeleteUserForm({ className = '' }: { className?: string }) {
    const [confirmingUserDeletion, setConfirmingUserDeletion] = useState(false);
    const passwordInput = useRef<HTMLInputElement | null>(null);

    const {
        data,
        setData,
        delete: destroy,
        processing,
        reset,
        errors,
    } = useForm({
        password: '',
    });

    const confirmUserDeletion = () => {
        setConfirmingUserDeletion(true);
    };

    const deleteUser: FormEventHandler = (e) => {
        e.preventDefault();

        destroy(route('profile.destroy'), {
            preserveScroll: true,
            onSuccess: () => closeModal(),
            onError: () => {
                if (passwordInput.current) {
                    passwordInput.current.focus();
                }
            },
            onFinish: () => reset(),
        });
    };

    const closeModal = () => {
        setConfirmingUserDeletion(false);
        reset();
    };

    return (
        <section className={`space-y-6 ${className}`}>
            <header>
                <h2 className="text-lg font-medium text-gray-900 dark:text-white">
                    Удаление аккаунта
                </h2>

                <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                    После удаления вашего аккаунта все его ресурсы и данные будут безвозвратно удалены.
                    Перед удалением аккаунта, пожалуйста, загрузите все данные и информацию, которые вы хотите сохранить.
                </p>
            </header>

            <Button
                variant="destructive"
                onClick={confirmUserDeletion}
            >
                Удалить аккаунт
            </Button>

            <Dialog open={confirmingUserDeletion} onOpenChange={setConfirmingUserDeletion}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>
                            Вы уверены, что хотите удалить свой аккаунт?
                        </DialogTitle>
                        <DialogDescription>
                            После удаления вашего аккаунта все его ресурсы и данные будут безвозвратно удалены.
                            Пожалуйста, введите ваш пароль для подтверждения удаления аккаунта.
                        </DialogDescription>
                    </DialogHeader>

                    <form onSubmit={deleteUser}>
                        <div className="mt-6">
                            <Label htmlFor="password" className="sr-only">Пароль</Label>

                            <Input
                                id="password"
                                type="password"
                                name="password"
                                ref={passwordInput}
                                value={data.password}
                                onChange={(e) => setData('password', e.target.value)}
                                className="mt-1"
                                placeholder="Пароль"
                            />

                            {errors.password && (
                                <p className="mt-2 text-sm text-red-400">{errors.password}</p>
                            )}
                        </div>

                        <DialogFooter className="mt-6">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={closeModal}
                            >
                                Отмена
                            </Button>

                            <Button
                                type="submit"
                                variant="destructive"
                                disabled={processing}
                            >
                                Удалить аккаунт
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </section>
    );
}
