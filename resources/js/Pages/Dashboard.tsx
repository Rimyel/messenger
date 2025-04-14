import React, { useState } from "react";
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
import { usePage } from "@inertiajs/react";
import { useAuthStore } from "@/stores/useAuthStore";
import { useEffect } from "react";
import { Toaster } from "@/Components/ui/sonner";

const Dashboard: React.FC = () => {
    const { token, setToken, clearToken } = useAuthStore();

    const { apiToken } = usePage().props as {
        apiToken?: string;
    };

    useEffect(() => {
        if (apiToken) {
            setToken(apiToken);
        }
    }, []);

    const [currentContent, setCurrentContent] = useState<string>("dashboard");
    const [isCreatingCompany, setIsCreatingCompany] = useState(false);

    const renderMainContent = () => {
        switch (currentContent) {
            case "company":
                return isCreatingCompany ? (
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
                ) : (
                    <SearchCompany
                        onCreateClick={() => setIsCreatingCompany(true)}
                    />
                );
            default:
                return <h1>Dashboard Page</h1>;
        }
        console.log(currentContent);
    };

    return (
        <SidebarProvider>
            <div className="flex h-screen w-full">
                {/* Боковая панель */}
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

                        <SidebarSeparator />

                        <SidebarGroup>
                            <SidebarGroupLabel>Управление</SidebarGroupLabel>
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
                            <SidebarGroupLabel>Коммуникации</SidebarGroupLabel>
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

                        <SidebarSeparator />

                        <SidebarGroup>
                            <SidebarGroupContent>
                                <Button
                                    variant="ghost"
                                    className="w-full justify-start gap-2 group-data-[collapsible=icon]:justify-center"
                                >
                                    <UserCircle className="h-4 w-4" />
                                    <span className="group-data-[collapsible=icon]:hidden">
                                        Личный кабинет
                                    </span>
                                </Button>
                                <Button
                                    variant="ghost"
                                    className="w-full justify-start gap-2 text-red-600 hover:text-red-600 group-data-[collapsible=icon]:justify-center"
                                >
                                    <LogOut className="h-4 w-4" />
                                    <span className="group-data-[collapsible=icon]:hidden">
                                        Выйти из компании
                                    </span>
                                </Button>
                            </SidebarGroupContent>
                        </SidebarGroup>
                    </SidebarContent>
                </Sidebar>

                <div className="flex-1 flex flex-col w-full">
                    {/* Верхняя панель навигации */}
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
                    <main className="flex-1 w-full">{renderMainContent()}</main>
                    <Toaster />
                </div>
            </div>
            <CommandPalette />
        </SidebarProvider>
    );
};

export default Dashboard;
