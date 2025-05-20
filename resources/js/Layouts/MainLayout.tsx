import { Sidebar } from "@/Components/Layout/Sidebar";
import { Navbar } from "@/Components/Layout/Navbar";
import { PropsWithChildren, useState } from "react";
import { useAuthStore } from "@/stores/useAuthStore";
import type { Company } from "@/types/company";

interface MainLayoutProps extends PropsWithChildren {
    className?: string;
    initialCompany?: Company | null;
}

export default function MainLayout({ children, className, initialCompany }: MainLayoutProps) {
    const [currentContent, setCurrentContent] = useState("dashboard");
    const [isCreatingCompany, setIsCreatingCompany] = useState(false);
    const [currentCompany, setCurrentCompany] = useState<Company | null>(initialCompany || null);

    return (
        <div className="min-h-screen flex">
            <Sidebar 
                currentCompany={currentCompany} 
                setCurrentContent={setCurrentContent}
                setIsCreatingCompany={setIsCreatingCompany}
            />
            <div className="flex-1 flex flex-col min-h-screen">
                <Navbar currentContent={currentContent} />
                <main className={`flex-1 w-full overflow-auto p-6 ${className}`}>
                    {children}
                </main>
            </div>
        </div>
    );
}