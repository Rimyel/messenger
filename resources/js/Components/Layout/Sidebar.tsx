import React from "react";
import {
    Sidebar as UISidebar,
    SidebarContent,
    SidebarHeader,
    SidebarGroup,
    SidebarGroupLabel,
    SidebarGroupContent,
    SidebarSeparator,
    SidebarTrigger,
} from "@/Components/ui/sidebar";
import { Button } from "@/Components/ui/button";
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
} from "lucide-react";
import type { Company } from "@/types/company";

interface SidebarProps {
    currentCompany: Company | null;
    setCurrentContent: (content: string) => void;
    handleLeaveCompany: () => void;
    handleLogout: () => void;
    setIsCreatingCompany: (value: boolean) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
    currentCompany,
    setCurrentContent,
    handleLeaveCompany,
    handleLogout,
    setIsCreatingCompany,
}) => {
    return (
        <UISidebar collapsible="icon">
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
                            onClick={() => setCurrentContent("dashboard")}
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
        </UISidebar>
    );
};

export default Sidebar;