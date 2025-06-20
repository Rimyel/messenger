import React, { useState, useEffect, lazy, Suspense } from "react";
import { SidebarProvider } from "@/Components/ui/sidebar";
import { usePage, router } from "@inertiajs/react";
import { Inertia } from "@inertiajs/inertia";
import { useAuthStore } from "@/stores/useAuthStore";
import { Toaster } from "@/Components/ui/sonner";
import { toast } from "sonner";
import { AuthService } from "@/services/auth";
import { CompanyApi } from "@/services/api";
import { CompanyUserApi } from "@/services/company-user";
import type { Company } from "@/types/company";
import { Chat } from "@/types/chat";

// Lazy load components
const Sidebar = lazy(() => import("@/Components/Layout/Sidebar"));
const Navbar = lazy(() => import("@/Components/Layout/Navbar"));
const MainContent = lazy(() => import("@/Components/Layout/MainContent"));
const CommandPalette = lazy(() => import("@/Components/CommandPalette"));

interface Props {
    userId?: number;
    apiToken?: string;
    status?: string;
    chats?: Chat[];
}

const LoadingSpinner = () => (
    <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900" />
    </div>
);

const CompanyPage: React.FC = () => {
    const { token, setToken, clearAuth, user } = useAuthStore();
    const [currentCompany, setCurrentCompany] = useState<Company | null>(null);
    const [currentContent, setCurrentContent] = useState<string>("company");
    const [isCreatingCompany, setIsCreatingCompany] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedChat, setSelectedChat] = useState<Chat | undefined>();
    const [chatSidebarOpen, setChatSidebarOpen] = useState(false);

    const { apiToken, userId, status, chats } = usePage().props as Props;

    const currentUser = user ? {
        id: user.id,
        name: user.name,
        avatar: user.avatar,
        role: 'member'
    } : null;

    useEffect(() => {
        if (apiToken) {
            setToken(apiToken);
            setCurrentCompany(null);
            checkUserCompany();
        }
        const currentToken = AuthService.getCurrentToken();
        console.log("Current authentication status:", {
            isAuthenticated: AuthService.isAuthenticated(),
            token: currentToken,
            tokenLength: currentToken?.length,
        });
    }, []);

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

    useEffect(() => {
        if (currentContent === "company") {
            checkUserCompany();
        }
    }, [currentContent, token]);

    const handleLeaveCompany = async () => {
        if (!currentCompany) return;

        try {
            await CompanyUserApi.leave(currentCompany.id);
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

    const handleLogout = async () => {
        try {
            await Inertia.post(
                route("logout"),
                {},
                {
                    preserveScroll: true,
                    only: [],
                }
            );

            useAuthStore.getState().clearAuth();

        } catch (error) {
            console.error("Ошибка при выходе:", error);
            toast.error("Произошла ошибка при выходе из системы");
        }
    };

    const triggerSearch = () => {
        const event = new KeyboardEvent("keydown", {
            key: "k",
            ctrlKey: true,
        });
        document.dispatchEvent(event);
    };

    return (
        <SidebarProvider>
            <div className="flex h-screen w-full">
                <Suspense fallback={<LoadingSpinner />}>
                    <Sidebar
                        currentCompany={currentCompany}
                        setCurrentContent={setCurrentContent}
                        setIsCreatingCompany={setIsCreatingCompany}
                    />
                </Suspense>

                <div className="flex-1 flex flex-col w-full">
                    <Suspense fallback={<LoadingSpinner />}>
                        <Navbar
                            currentContent={currentContent}
                            selectedChat={selectedChat}
                            onSelectChat={setSelectedChat}
                            chatSidebarOpen={chatSidebarOpen}
                            onChatSidebarOpenChange={setChatSidebarOpen}
                            chats={chats}
                            setCurrentContent={setCurrentContent}
                        />
                    </Suspense>

                    <Suspense fallback={<LoadingSpinner />}>
                        <MainContent
                            currentContent={currentContent}
                            currentCompany={currentCompany}
                            isCreatingCompany={isCreatingCompany}
                            setIsCreatingCompany={setIsCreatingCompany}
                            isLoading={isLoading}
                            status={status}
                            chats={chats}
                            selectedChat={selectedChat}
                            onSelectChat={setSelectedChat}
                            chatSidebarOpen={chatSidebarOpen}
                            onChatSidebarOpenChange={setChatSidebarOpen}
                            handleLogout={handleLogout}
                            handleLeaveCompany={handleLeaveCompany}
                        />
                    </Suspense>
                    <Toaster />
                </div>
            </div>
            <Suspense fallback={null}>
                <CommandPalette />
            </Suspense>
        </SidebarProvider>
    );
};

export default CompanyPage;