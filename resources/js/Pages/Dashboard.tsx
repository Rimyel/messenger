import React, { useState, useEffect, lazy, Suspense } from "react";
import { SidebarProvider } from "@/Components/ui/sidebar";
import { usePage, router } from "@inertiajs/react";
import { useAuthStore } from "@/stores/useAuthStore";
import { Toaster } from "@/Components/ui/sonner";
import { toast } from "sonner";
import { AuthService } from "@/services/auth";
import { CompanyApi } from "@/services/api";
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

const Dashboard: React.FC = () => {
    const { token, setToken, clearAuth } = useAuthStore();
    const [currentCompany, setCurrentCompany] = useState<Company | null>(null);
    const [currentContent, setCurrentContent] = useState<string>("dashboard");
    const [isCreatingCompany, setIsCreatingCompany] = useState(false);
    const [isLoading, setIsLoading] = useState(true);    

    const { apiToken, userId, status, chats } = usePage().props as Props;

    useEffect(() => {
        const currentToken = AuthService.getCurrentToken();
        // console.log('Current authentication status:', {
        //     isAuthenticated: AuthService.isAuthenticated(),
        //     token: currentToken,
        //     tokenLength: currentToken?.length
        // });

        if (apiToken) {
            setToken(apiToken);
            setCurrentCompany(null);
            checkUserCompany();
        }
    }, [apiToken]);

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

    const handleLogout = () => {
        if (window.confirm("Вы действительно хотите выйти?")) {
            router.post(
                "/logout",
                {},
                {
                    onSuccess: () => {
                        clearAuth();
                        toast.success("Вы успешно вышли из системы");
                    },
                    onError: () => {
                        toast.error("Произошла ошибка при выходе из системы");
                    },
                }
            );
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
                        handleLeaveCompany={handleLeaveCompany}
                        handleLogout={handleLogout}
                        setIsCreatingCompany={setIsCreatingCompany}
                    />
                </Suspense>

                <div className="flex-1 flex flex-col w-full">
                    <Suspense fallback={<LoadingSpinner />}>
                        <Navbar triggerSearch={triggerSearch} />
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

export default Dashboard;
