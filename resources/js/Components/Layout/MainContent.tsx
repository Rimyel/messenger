import React, { Suspense, lazy } from "react";
import { useIsMobile } from "@/hooks/use-mobile";
import type { Company } from "@/types/company";
import { Button } from "@/Components/ui/button";
import { ArrowLeft } from "lucide-react";
import type { Chat as ChatType } from "@/types/chat";

// Lazy load components
const CreateCompanyForm = lazy(
    () => import("@/Components/Company/CreateCompanyForm")
);
const UserManagement = lazy(
    () => import("@/Components/Company/UserManagement")
);
const SearchCompany = lazy(() => import("@/Components/Company/SearchCompany"));
const CompanyDetails = lazy(
    () => import("@/Components/Company/CompanyDetails")
);
const ProfileContent = lazy(
    () => import("@/Components/Profile/ProfileContent")
);
const ChatComponent = lazy(() => import("@/Components/Chat/Chat"));
const AdminTasksPage = lazy(() => import("@/Components/Tasks/AdminTasksPage"));
const UserTasksPage = lazy(() => import("@/Components/Tasks/UserTasksPage"));

interface MainContentProps {
    currentContent: string;
    currentCompany: Company | null;
    isCreatingCompany: boolean;
    setIsCreatingCompany: (value: boolean) => void;
    isLoading: boolean;
    status?: string;
    chats?: ChatType[];
    selectedChat?: ChatType;
    onSelectChat?: (chat: ChatType) => void;
    chatSidebarOpen?: boolean;
    onChatSidebarOpenChange?: (open: boolean) => void;
    handleLogout: () => void;
    handleLeaveCompany: () => void;
}

const LoadingSpinner = () => (
    <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900" />
    </div>
);

export const MainContent: React.FC<MainContentProps> = ({
    currentContent,
    currentCompany,
    isCreatingCompany,
    setIsCreatingCompany,
    isLoading,
    status,
    chats,
    selectedChat,
    onSelectChat,
    chatSidebarOpen,
    onChatSidebarOpenChange,
    handleLogout,
    handleLeaveCompany,
}) => {
    const renderContent = () => {
        if (isLoading) {
            return <LoadingSpinner />;
        }

        switch (currentContent) {
            case "users":
                if (currentCompany) {
                    return (
                        <Suspense fallback={<LoadingSpinner />}>
                            <UserManagement company={currentCompany} />
                        </Suspense>
                    );
                }

                return (
                    <h1>
                        Для управления пользователями необходимо выбрать
                        компанию
                    </h1>
                );
            case "company":
                if (currentCompany) {
                    return (
                        <Suspense fallback={<LoadingSpinner />}>
                            <CompanyDetails
                                companyId={currentCompany.id}
                                handleLeaveCompany={handleLeaveCompany}
                            />
                        </Suspense>
                    );
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
                            <Suspense fallback={<LoadingSpinner />}>
                                <CreateCompanyForm />
                            </Suspense>
                        </div>
                    );
                }

                return (
                    <Suspense fallback={<LoadingSpinner />}>
                        <SearchCompany
                            onCreateClick={() => setIsCreatingCompany(true)}
                        />
                    </Suspense>
                );
            case "profile":
                return (
                    <Suspense fallback={<LoadingSpinner />}>
                        <ProfileContent
                            status={status}
                            handleLogout={handleLogout}
                        />
                    </Suspense>
                );
            case "chat":
                return (
                    <Suspense fallback={<LoadingSpinner />}>
                        <ChatComponent
                            initialChats={chats}
                            selectedChat={selectedChat}
                            onSelectChat={onSelectChat}
                            sidebarOpen={chatSidebarOpen}
                            onSidebarOpenChange={onChatSidebarOpenChange}
                        />
                    </Suspense>
                );
            case "admin-tasks":
                if (currentCompany) {
                    return (
                        <Suspense fallback={<LoadingSpinner />}>
                            <AdminTasksPage />
                        </Suspense>
                    );
                }
                return (
                    <h1>
                        Для управления заданиями необходимо выбрать компанию
                    </h1>
                );
            case "user-tasks":
                if (currentCompany) {
                    return (
                        <Suspense fallback={<LoadingSpinner />}>
                            <UserTasksPage />
                        </Suspense>
                    );
                }
                return (
                    <h1>Для просмотра заданий необходимо выбрать компанию</h1>
                );
            default:
                return <h1>Dashboard Page</h1>;
        }
    };

    const isMobile = useIsMobile();

    return (
        <main className={`flex-1 w-full overflow-auto ${isMobile ? '' : 'p-6'}`}>
            {renderContent()}
        </main>
    );
};

export default MainContent;
