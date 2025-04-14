import React, { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/Components/ui/card";
import { Loader2, Users } from "lucide-react";
import { Company, User } from "@/types/company";
import { CompanyApi } from "@/services/api";
import { toast } from "sonner";

interface CompanyDetailsProps {
    companyId: number;
}

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
                            className={`px-3 py-1 rounded-full text-sm ${
                                user.role === "owner"
                                    ? "bg-blue-100 text-blue-700"
                                    : "bg-gray-100 text-gray-700"
                            }`}
                        >
                            {user.role === "owner" ? "Владелец" : "Участник"}
                        </span>
                    </div>
                ))}
            </div>
        </div>
    );
};

const CompanyDetails: React.FC<CompanyDetailsProps> = ({ companyId }) => {
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
                                    className={`px-3 py-1 rounded-full text-sm ${
                                        currentUserRole === "owner"
                                            ? "bg-blue-100 text-blue-700"
                                            : "bg-gray-100 text-gray-700"
                                    }`}
                                >
                                    {currentUserRole === "owner" ? "Владелец" : "Участник"}
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
                </div>
            </CardContent>
        </Card>
    );
};

export default CompanyDetails;