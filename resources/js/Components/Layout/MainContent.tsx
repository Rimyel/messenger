import React, { Suspense, lazy } from "react";
import type { Company } from "@/types/company";
import { Button } from "@/Components/ui/button";
import { ArrowLeft } from "lucide-react";
import { ChatConversation } from "@/types/chat";

// Lazy load components
const CreateCompanyForm = lazy(
    () => import("@/Components/Company/CreateCompanyForm")
);
const SearchCompany = lazy(() => import("@/Components/Company/SearchCompany"));
const CompanyDetails = lazy(
    () => import("@/Components/Company/CompanyDetails")
);
const ProfileContent = lazy(
    () => import("@/Components/Profile/ProfileContent")
);
const Chat = lazy(() => import("@/Components/Chat/Chat"));

interface MainContentProps {
    currentContent: string;
    currentCompany: Company | null;
    isCreatingCompany: boolean;
    setIsCreatingCompany: (value: boolean) => void;
    isLoading: boolean;
    status?: string;
    chats?: ChatConversation[];
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
}) => {
    const renderContent = () => {
        if (isLoading) {
            return <LoadingSpinner />;
        }

        switch (currentContent) {
            case "company":
                if (currentCompany) {
                    return (
                        <Suspense fallback={<LoadingSpinner />}>
                            <CompanyDetails companyId={currentCompany.id} />
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
                        <ProfileContent status={status} />
                    </Suspense>
                );
            case "chat":
                return (
                    <Suspense fallback={<LoadingSpinner />}>
                        <Chat chats={chats} />
                    </Suspense>
                );
            default:
                return <h1>Dashboard Page</h1>;
        }
    };

    return (
        <main className="flex-1 w-full overflow-auto p-6">
            {renderContent()}
        </main>
    );
};

export default MainContent;
