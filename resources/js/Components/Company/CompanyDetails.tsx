import React, { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/Components/ui/card";
import { Button } from "@/Components/ui/button";
import { Loader2, Users, LogOut } from "lucide-react";
import { Company, User } from "@/types/company";
import { CompanyApi } from "@/services/api";
import { toast } from "sonner";

interface CompanyDetailsProps {
    companyId: number;
    handleLeaveCompany: () => void;
}

const getRoleBadgeStyles = (role: string) => {
    switch(role) {
        case 'owner':
            return 'bg-blue-100 text-blue-700';
        case 'admin':
            return 'bg-green-100 text-green-700';
        default:
            return 'bg-gray-100 text-gray-700';
    }
};

const getRoleDisplayName = (role: string) => {
    switch(role) {
        case 'owner':
            return 'Владелец';
        case 'admin':
            return 'Администратор';
        default:
            return 'Участник';
    }
};

const MembersList: React.FC<{ users: User[] }> = ({ users }) => {
    return (
        <div className="mt-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center">
                <Users className="w-5 h-5 mr-2" />
                Участники компании
            </h3>
            <div className="space-y-4">
                {users.map((user) => (
                    <div
                        key={user.id}
                        className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                    >
                        <div>
                            <p className="font-medium">{user.name}</p>
                            <p className="text-sm text-gray-500">{user.email}</p>
                        </div>
                        <span
                            className={`px-3 py-1 rounded-full text-sm ${getRoleBadgeStyles(user.role)}`}
                        >
                            {getRoleDisplayName(user.role)}
                        </span>
                    </div>
                ))}
            </div>
        </div>
    );
};

const CompanyDetails: React.FC<CompanyDetailsProps> = ({ companyId, handleLeaveCompany }) => {
    const [company, setCompany] = useState<Company | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchCompany = async () => {
            try {
                setLoading(true);
                const data = await CompanyApi.get(companyId);
                setCompany(data);
            } catch (error: any) {
                toast.error("Не удалось загрузить информацию о компании");
                console.error("Ошибка при загрузке компании:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchCompany();
    }, [companyId]);

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[200px]">
                <Loader2 className="h-8 w-8 animate-spin" />
            </div>
        );
    }

    if (!company) {
        return (
            <Card>
                <CardContent className="p-6">
                    <p className="text-center text-gray-500">
                        Информация о компании не найдена
                    </p>
                </CardContent>
            </Card>
        );
    }

    const currentUserRole = company.users?.find(user => user.id === parseInt(localStorage.getItem('userId') || '0'))?.role;
    const canLeaveCompany = currentUserRole !== 'owner'; // Владелец не может покинуть компанию

    return (
        <Card className="w-full max-w-4xl mx-auto">
            <CardHeader>
                <div className="flex items-center space-x-4">
                    {company.logo_url ? (
                        <img
                            src={company.logo_url}
                            alt={company.name}
                            className="w-24 h-24 rounded-lg object-cover"
                        />
                    ) : (
                        <div className="w-24 h-24 rounded-lg bg-gray-200 flex items-center justify-center">
                            <span className="text-4xl font-semibold text-gray-500">
                                {company.name.charAt(0).toUpperCase()}
                            </span>
                        </div>
                    )}
                    <div className="flex-1">
                        <div className="flex items-center justify-between">
                            <CardTitle className="text-2xl font-bold mb-2">
                                {company.name}
                            </CardTitle>
                            {currentUserRole && (
                                <span
                                    className={`px-3 py-1 rounded-full text-sm ${getRoleBadgeStyles(currentUserRole)}`}
                                >
                                    {getRoleDisplayName(currentUserRole)}
                                </span>
                            )}
                        </div>
                        <p className="text-sm text-gray-500">
                            Дата создания:{" "}
                            {new Date(company.created_at).toLocaleDateString("ru-RU")}
                        </p>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="p-6">
                <div className="space-y-6">
                    <div>
                        <h3 className="text-lg font-semibold mb-2">О компании</h3>
                        <p className="text-gray-700 whitespace-pre-wrap">
                            {company.description}
                        </p>
                    </div>
                    
                    {company.users && company.users.length > 0 && (
                        <MembersList users={company.users} />
                    )}

                    {canLeaveCompany && (
                        <div className="mt-8">
                            <Button
                                variant="ghost"
                                className="w-full justify-center gap-2 text-red-600 hover:text-red-600 hover:bg-red-50"
                                onClick={handleLeaveCompany}
                            >
                                <LogOut className="h-4 w-4" />
                                <span>Выйти из компании</span>
                            </Button>
                        </div>
                    )}
                </div>
            </CardContent>
        </Card>
    );
};

export default CompanyDetails;