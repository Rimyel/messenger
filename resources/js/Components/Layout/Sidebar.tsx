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
    setIsCreatingCompany: (value: boolean) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
    currentCompany,
    setCurrentContent,
    setIsCreatingCompany,
}) => {
    return (
        <UISidebar collapsible="icon">
            <SidebarHeader>
                <h2 className="px-4 text-lg font-semibold group-data-[collapsible=icon]:hidden">
                    Панель управления
                </h2>
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
                                    onClick={() => setCurrentContent("users")}
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
                                    onClick={() => setCurrentContent("chat")}
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
                    </SidebarGroupContent>
                </SidebarGroup>
            </SidebarContent>
        </UISidebar>
    );
};

export default Sidebar;