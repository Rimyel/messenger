import React, { useEffect, useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/Components/ui/card";
import { Button } from "@/Components/ui/button";
import { Input } from "@/Components/ui/input";
import { Textarea } from "@/Components/ui/textarea";
import { Loader2, Pencil, Save, X, LogOut, Upload, Camera } from "lucide-react";
import { Company, CompanyUser } from "@/types/company";
import { CompanyApi } from "@/services/api";
import { CompanyUserApi } from "@/services/company-user";
import { useAuthStore } from "@/stores/useAuthStore";
import { toast } from "sonner";

interface CompanyDetailsProps {
    companyId: number;
    handleLeaveCompany: () => void;
}

const CompanyDetails: React.FC<CompanyDetailsProps> = ({
    companyId,
    handleLeaveCompany,
}) => {
    const [company, setCompany] = useState<Company | null>(null);
    const [companyUsers, setCompanyUsers] = useState<CompanyUser[]>([]);
    const [loading, setLoading] = useState(true);
    const [isEditing, setIsEditing] = useState(false);
    const [editForm, setEditForm] = useState({
        name: "",
        description: "",
    });
    const [newLogo, setNewLogo] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);

    const handleLogoChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            setNewLogo(file);
            const url = URL.createObjectURL(file);
            setPreviewUrl(url);
        }
    };

    // Получаем текущего пользователя из store и определяем его роль
    const authUser = useAuthStore(state => state.user);
    const currentUser = companyUsers.find(user => user.id === authUser?.id);
    const currentUserRole = currentUser?.role;
    const canEditCompany = ["owner", "admin"].includes(currentUserRole || "");
    const canLeaveCompany = currentUserRole !== "owner";

    console.log('Auth user:', authUser);
    console.log('Company users:', companyUsers);
    console.log('Current user:', currentUser);
    console.log('Current user role:', currentUserRole);

    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);
                const [companyData, usersData] = await Promise.all([
                    CompanyApi.get(companyId),
                    CompanyUserApi.getUsers(companyId)
                ]);
                
                console.log('Company Data:', companyData);
                console.log('Users Data:', usersData);
                console.log('Raw users data:', JSON.stringify(usersData, null, 2));
                
                setCompany(companyData);
                setCompanyUsers(usersData);
                setEditForm({
                    name: companyData.name,
                    description: companyData.description,
                });
            } catch (error: any) {
                toast.error("Не удалось загрузить информацию о компании");
                console.error("Ошибка при загрузке данных:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [companyId]);

    const handleSubmit = async () => {
        if (!company) return;

        try {
            const formData = new FormData();
            formData.append("name", editForm.name);
            formData.append("description", editForm.description);
            formData.append("_method", "PUT");
            
            if (newLogo) {
                formData.append("logo", newLogo);
            }

            await CompanyApi.update(companyId, formData);
            setCompany({
                ...company,
                name: editForm.name,
                description: editForm.description,
                logo_url: company.logo_url
            });
            setIsEditing(false);
            toast.success("Информация о компании обновлена");
        } catch (error) {
            toast.error("Не удалось обновить информацию о компании");
            console.error("Ошибка при обновлении компании:", error);
        }
    };

    const handleCancel = () => {
        setEditForm({
            name: company?.name || "",
            description: company?.description || "",
        });
        setIsEditing(false);
        setNewLogo(null);
        setPreviewUrl(null);
    };

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


    return (
        <Card className="w-full max-w-4xl mx-auto">
            <CardHeader>
                <div className="flex items-center space-x-4">
                    <div className="relative group">
                        <div className={`relative ${isEditing ? 'ring-2 ring-blue-500 ring-offset-2' : ''} rounded-lg`}>
                            {(previewUrl || company.logo_url) ? (
                                <img
                                    src={previewUrl || company.logo_url || ''}
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
                            {canEditCompany && isEditing && (
                                <label
                                    className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-0 hover:bg-opacity-50 transition-all rounded-lg cursor-pointer group"
                                >
                                    <input
                                        type="file"
                                        className="hidden"
                                        accept="image/*"
                                        onChange={handleLogoChange}
                                    />
                                    <Camera className="h-8 w-8 text-white opacity-0 group-hover:opacity-100 transition-opacity"/>
                                </label>
                            )}
                        </div>
                    </div>
                    <div className="flex-1">
                        <div className="flex items-center justify-between">
                            {isEditing ? (
                                <Input
                                    value={editForm.name}
                                    onChange={(e) =>
                                        setEditForm((prev) => ({
                                            ...prev,
                                            name: e.target.value,
                                        }))
                                    }
                                    className="text-2xl font-bold"
                                    placeholder="Название компании"
                                />
                            ) : (
                                <CardTitle className="text-2xl font-bold mb-2 group">
                                    {company.name}
                                </CardTitle>
                            )}
                            {canEditCompany && !isEditing && (
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => setIsEditing(true)}
                                    className="opacity-0 group-hover:opacity-100 transition-opacity"
                                >
                                    <Pencil className="h-4 w-4" />
                                </Button>
                            )}
                        </div>
                        <p className="text-sm text-gray-500">
                            Дата создания:{" "}
                            {new Date(company.created_at).toLocaleDateString(
                                "ru-RU"
                            )}
                        </p>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="p-6">
                <div className="space-y-6">
                    <div>
                        <h3 className="text-lg font-semibold mb-2">
                            О компании
                        </h3>
                        {isEditing ? (
                            <Textarea
                                value={editForm.description}
                                onChange={(e) =>
                                    setEditForm((prev) => ({
                                        ...prev,
                                        description: e.target.value,
                                    }))
                                }
                                className="min-h-[100px]"
                                placeholder="Описание компании"
                            />
                        ) : (
                            <div className="flex items-start justify-between gap-2 p-3 rounded-lg bg-gray-50">
                                <p className="text-gray-700 whitespace-pre-wrap flex-1">
                                    {company.description || "Описание отсутствует"}
                                </p>
                                {canEditCompany && !isEditing && (
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => setIsEditing(true)}
                                        className="h-8 w-8 hover:bg-gray-200 shrink-0"
                                    >
                                        <Pencil className="h-4 w-4 text-gray-500" />
                                    </Button>
                                )}
                            </div>
                        )}
                    </div>

                    {isEditing && (
                        <div className="flex justify-end gap-2">
                            <Button variant="outline" onClick={handleCancel}>
                                <X className="h-4 w-4 mr-2" />
                                Отмена
                            </Button>
                            <Button onClick={handleSubmit}>
                                <Save className="h-4 w-4 mr-2" />
                                Сохранить
                            </Button>
                        </div>
                    )}

                    {canLeaveCompany && !isEditing && (
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
