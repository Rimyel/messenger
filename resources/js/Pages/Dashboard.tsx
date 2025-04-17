import React, { useState, useEffect } from "react";
import {
    Sidebar,
    SidebarProvider,
    SidebarContent,
    SidebarHeader,
    SidebarGroup,
    SidebarGroupLabel,
    SidebarGroupContent,
    SidebarSeparator,
    SidebarTrigger,
} from "@/Components/ui/sidebar";
import {
    Menubar,
    MenubarMenu,
    MenubarTrigger,
    MenubarContent,
    MenubarItem,
    MenubarSeparator,
} from "@/Components/ui/menubar";
import CreateCompanyForm from "@/Components/Company/CreateCompanyForm";
import SearchCompany from "@/Components/Company/SearchCompany";
import CompanyDetails from "@/Components/Company/CompanyDetails";
import ProfileContent from "@/Components/Profile/ProfileContent";
import { Button } from "@/Components/ui/button";
import { CommandPalette } from "@/Components/CommandPalette";
import {
    Home,
    Building2,
    Users,
    ShieldCheck,
    Group,
    ClipboardList,
    MessageSquare,
    Phone,
    UserCircle,
    LogOut,
    Bell,
    Search,
    ArrowLeft,
} from "lucide-react";
import { usePage, router } from "@inertiajs/react";
import { useAuthStore } from "@/stores/useAuthStore";
import { Toaster } from "@/Components/ui/sonner";
import { toast } from "sonner";
import { CompanyApi } from "@/services/api";
import type { Company } from "@/types/company";

interface Props {
    userId?: number;
    apiToken?: string;
    status?: string;
}

const Dashboard: React.FC = () => {
    const { token, setToken, clearToken } = useAuthStore();
    const [currentCompany, setCurrentCompany] = useState<Company | null>(null);
    const [currentContent, setCurrentContent] = useState<string>("dashboard");
    const [isCreatingCompany, setIsCreatingCompany] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    const { apiToken, userId, status } = usePage().props as Props;

    // Обработка изменения токена
    useEffect(() => {
        if (apiToken) {
            setToken(apiToken);
            setCurrentCompany(null);
            checkUserCompany();
        }
    }, [apiToken]);

    // Проверка компании пользователя
    const checkUserCompany = async () => {
        if (!token) return;

        try {
            setIsLoading(true);
            const companies = await CompanyApi.search({});
            if (companies.data.length > 0) {
                const companyData = await CompanyApi.get(companies.data[0].id);
                setCurrentCompany(companyData);
            } else {
                setCurrentCompany(null);
            }
        } catch (error) {
            console.error("Ошибка при проверке компании пользователя:", error);
            setCurrentCompany(null);
        } finally {
            setIsLoading(false);
        }
    };

    // Проверяем компанию при смене токена или контента
    useEffect(() => {
        if (currentContent === "company") {
            checkUserCompany();
        }
    }, [currentContent, token]);

    const handleLeaveCompany = async () => {
        if (!currentCompany) return;

        try {
            await CompanyApi.leave(currentCompany.id);
            setCurrentCompany(null);
            toast.success("Вы успешно вышли из компании");
        } catch (error: any) {
            if (error.response?.status === 422) {
                toast.error(error.response.data.message);
            } else {
                toast.error("Не удалось выйти из компании");
                console.error("Ошибка при выходе из компании:", error);
            }
        }
    };

    const renderMainContent = () => {
        switch (currentContent) {
            case "company":
                if (currentCompany) {
                    return <CompanyDetails companyId={currentCompany.id} />;
                }

                if (isCreatingCompany) {
                    return (
                        <div className="relative">
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setIsCreatingCompany(false)}
                                className="absolute left-4 top-4 z-10"
                            >
                                <ArrowLeft className="h-4 w-4 mr-2" />
                                Назад к поиску
                            </Button>
                            <CreateCompanyForm />
                        </div>
                    );
                }

                return (
                    <SearchCompany
                        onCreateClick={() => setIsCreatingCompany(true)}
                    />
                );
            case "profile":
                return <ProfileContent status={status} />;
            default:
                return <h1>Dashboard Page</h1>;
        }
    };

    const handleLogout = () => {
        if (window.confirm('Вы действительно хотите выйти?')) {
            router.post('/logout', {}, {
                onSuccess: () => {
                    clearToken();
                    toast.success('Вы успешно вышли из системы');
                },
                onError: () => {
                    toast.error('Произошла ошибка при выходе из системы');
                }
            });
        }
    };

    return (
        <SidebarProvider>
            <div className="flex h-screen w-full">
                <Sidebar collapsible="icon">
                    <SidebarHeader className="flex items-center justify-between">
                        <h2 className="px-4 text-lg font-semibold group-data-[collapsible=icon]:hidden">
                            Панель управления
                        </h2>
                        <SidebarTrigger />
                    </SidebarHeader>
                    <SidebarContent>
                        <SidebarGroup>
                            <SidebarGroupLabel>Основное</SidebarGroupLabel>
                            <SidebarGroupContent>
                                <Button
                                    variant="ghost"
                                    className="w-full justify-start gap-2 group-data-[collapsible=icon]:justify-center"
                                    onClick={() =>
                                        setCurrentContent("dashboard")
                                    }
                                >
                                    <Home className="h-4 w-4" />
                                    <span className="group-data-[collapsible=icon]:hidden">
                                        Главная (Dashboard)
                                    </span>
                                </Button>
                                <Button
                                    variant="ghost"
                                    className="w-full justify-start gap-2 group-data-[collapsible=icon]:justify-center"
                                    onClick={() => {
                                        setCurrentContent("company");
                                        setIsCreatingCompany(false);
                                    }}
                                >
                                    <Building2 className="h-4 w-4" />
                                    <span className="group-data-[collapsible=icon]:hidden">
                                        Моя компания
                                    </span>
                                </Button>
                            </SidebarGroupContent>
                        </SidebarGroup>

                        {currentCompany && (
                            <>
                                <SidebarSeparator />
                                <SidebarGroup>
                                    <SidebarGroupLabel>
                                        Управление
                                    </SidebarGroupLabel>
                                    <SidebarGroupContent>
                                        <Button
                                            variant="ghost"
                                            className="w-full justify-start gap-2 group-data-[collapsible=icon]:justify-center"
                                        >
                                            <Users className="h-4 w-4" />
                                            <span className="group-data-[collapsible=icon]:hidden">
                                                Пользователи
                                            </span>
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            className="w-full justify-start gap-2 group-data-[collapsible=icon]:justify-center"
                                        >
                                            <ShieldCheck className="h-4 w-4" />
                                            <span className="group-data-[collapsible=icon]:hidden">
                                                Роли и права
                                            </span>
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            className="w-full justify-start gap-2 group-data-[collapsible=icon]:justify-center"
                                        >
                                            <Group className="h-4 w-4" />
                                            <span className="group-data-[collapsible=icon]:hidden">
                                                Группы
                                            </span>
                                        </Button>
                                    </SidebarGroupContent>
                                </SidebarGroup>

                                <SidebarSeparator />

                                <SidebarGroup>
                                    <SidebarGroupLabel>
                                        Коммуникации
                                    </SidebarGroupLabel>
                                    <SidebarGroupContent>
                                        <Button
                                            variant="ghost"
                                            className="w-full justify-start gap-2 group-data-[collapsible=icon]:justify-center"
                                        >
                                            <ClipboardList className="h-4 w-4" />
                                            <span className="group-data-[collapsible=icon]:hidden">
                                                Задания
                                            </span>
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            className="w-full justify-start gap-2 group-data-[collapsible=icon]:justify-center"
                                        >
                                            <MessageSquare className="h-4 w-4" />
                                            <span className="group-data-[collapsible=icon]:hidden">
                                                Чаты
                                            </span>
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            className="w-full justify-start gap-2 group-data-[collapsible=icon]:justify-center"
                                        >
                                            <Phone className="h-4 w-4" />
                                            <span className="group-data-[collapsible=icon]:hidden">
                                                Звонки
                                            </span>
                                        </Button>
                                    </SidebarGroupContent>
                                </SidebarGroup>
                            </>
                        )}

                        <SidebarSeparator />

                        <SidebarGroup>
                            <SidebarGroupLabel>Профиль</SidebarGroupLabel>
                            <SidebarGroupContent>
                                <Button
                                    variant="ghost"
                                    className="w-full justify-start gap-2 group-data-[collapsible=icon]:justify-center"
                                    onClick={() => setCurrentContent("profile")}
                                >
                                    <UserCircle className="h-4 w-4" />
                                    <span className="group-data-[collapsible=icon]:hidden">
                                        Личный кабинет
                                    </span>
                                </Button>
                                {currentCompany && (
                                    <Button
                                        variant="ghost"
                                        className="w-full justify-start gap-2 text-red-600 hover:text-red-600 group-data-[collapsible=icon]:justify-center"
                                        onClick={handleLeaveCompany}
                                    >
                                        <LogOut className="h-4 w-4" />
                                        <span className="group-data-[collapsible=icon]:hidden">
                                            Выйти из компании
                                        </span>
                                    </Button>
                                )}
                                <Button
                                    variant="ghost"
                                    className="w-full justify-start gap-2 text-red-600 hover:text-red-600 group-data-[collapsible=icon]:justify-center"
                                    onClick={handleLogout}
                                >
                                    <LogOut className="h-4 w-4" />
                                    <span className="group-data-[collapsible=icon]:hidden">
                                        Выйти из аккаунта
                                    </span>
                                </Button>
                            </SidebarGroupContent>
                        </SidebarGroup>
                    </SidebarContent>
                </Sidebar>

                <div className="flex-1 flex flex-col w-full">
                    <Menubar className="border-b rounded-none px-4">
                        <div className="flex items-center gap-2">
                            <Button
                                variant="ghost"
                                size="icon"
                                className="text-muted-foreground"
                                onClick={() => {
                                    const event = new KeyboardEvent("keydown", {
                                        key: "k",
                                        ctrlKey: true,
                                    });
                                    document.dispatchEvent(event);
                                }}
                            >
                                <Search className="h-4 w-4" />
                                <span className="sr-only">Поиск</span>
                            </Button>
                        </div>
                        <MenubarSeparator />
                        <MenubarMenu>
                            <MenubarTrigger>Файл</MenubarTrigger>
                            <MenubarContent>
                                <MenubarItem>Создать</MenubarItem>
                                <MenubarItem>Открыть</MenubarItem>
                                <MenubarItem>Сохранить</MenubarItem>
                            </MenubarContent>
                        </MenubarMenu>
                        <MenubarMenu>
                            <MenubarTrigger>Правка</MenubarTrigger>
                            <MenubarContent>
                                <MenubarItem>Копировать</MenubarItem>
                                <MenubarItem>Вставить</MenubarItem>
                                <MenubarItem>Вырезать</MenubarItem>
                            </MenubarContent>
                        </MenubarMenu>
                        <div className="ml-auto flex items-center">
                            <Button variant="ghost" size="icon">
                                <Bell className="h-4 w-4" />
                            </Button>
                        </div>
                    </Menubar>

                    {/* Основное содержимое страницы */}
                    <main className="flex-1 w-full overflow-auto p-6">
                        {isLoading ? (
                            <div className="flex items-center justify-center h-full">
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900" />
                            </div>
                        ) : (
                            renderMainContent()
                        )}
                    </main>
                    <Toaster />
                </div>
            </div>
            <CommandPalette />
        </SidebarProvider>
    );
};

export default Dashboard;
