import { FC } from 'react';
import { usePage } from '@inertiajs/react';
import DeleteUserForm from '@/Pages/Profile/Partials/DeleteUserForm';
import UpdatePasswordForm from '@/Pages/Profile/Partials/UpdatePasswordForm';
import UpdateProfileInformationForm from '@/Pages/Profile/Partials/UpdateProfileInformationForm';
import { Button } from "@/Components/ui/button";
import { LogOut } from "lucide-react";
import { PageProps } from '@/types/app';

interface Props {
    status?: string;
    handleLogout: () => void;
}

const ProfileContent: FC<Props> = ({ status, handleLogout }) => {
    const auth = usePage<PageProps>().props.auth;
    const user = {
        name: auth.user.name,
        email: auth.user.email,
    };
    
    return (
        <div className="w-full">
            <div className="mb-6">
                <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">
                    Личный кабинет
                </h2>
                <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                    Управляйте настройками вашего профиля и безопасностью аккаунта
                </p>
            </div>

            <div className="space-y-6">
                <div className="bg-white/50 backdrop-blur-lg p-6 shadow-lg rounded-lg border border-gray-200/50">
                    <UpdateProfileInformationForm
                        status={status}
                        className="max-w-xl"
                        user={user}
                    />
                </div>

                <div className="bg-white/50 backdrop-blur-lg p-6 shadow-lg rounded-lg border border-gray-200/50">
                    <UpdatePasswordForm className="max-w-xl" />
                </div>

                <div className="bg-white/50 backdrop-blur-lg p-6 shadow-lg rounded-lg border border-gray-200/50">
                    <DeleteUserForm className="max-w-xl" />
                </div>

                <div className="bg-white/50 backdrop-blur-lg p-6 shadow-lg rounded-lg border border-gray-200/50">
                    <div className="max-w-xl">
                        <h2 className="text-lg font-medium text-gray-900 mb-4">
                            Выход из системы
                        </h2>
                        <Button
                            variant="ghost"
                            className=" justify-center gap-2 text-red-600 hover:text-red-600 hover:bg-red-50"
                            onClick={handleLogout}
                        >
                            <LogOut className="h-4 w-4" />
                            <span>Выйти из аккаунта</span>
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ProfileContent;