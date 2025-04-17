import { FC } from 'react';
import { usePage } from '@inertiajs/react';
import DeleteUserForm from '@/Pages/Profile/Partials/DeleteUserForm';
import UpdatePasswordForm from '@/Pages/Profile/Partials/UpdatePasswordForm';
import UpdateProfileInformationForm from '@/Pages/Profile/Partials/UpdateProfileInformationForm';
import { PageProps } from '@/types/app';

interface Props {
    status?: string;
}

const ProfileContent: FC<Props> = ({ status }) => {
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
            </div>
        </div>
    );
};

export default ProfileContent;