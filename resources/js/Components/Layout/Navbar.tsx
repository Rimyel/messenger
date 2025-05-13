import React from "react";
import { SidebarTrigger } from "@/Components/ui/sidebar";
import { NotificationButton } from "./NotificationButton";

interface NavbarProps {
    currentContent: string;
}

const contentTitles: { [key: string]: string } = {
    dashboard: "Главная",
    company: "Моя компания",
    chat: "Чаты",
    profile: "Личный кабинет"
};

export const Navbar: React.FC<NavbarProps> = ({ currentContent }) => {
    return (
        <nav className="flex items-center justify-between border-b px-4 h-[57px]">
            <div className="flex items-center gap-4">
                <SidebarTrigger />
                <div className="text-sm text-muted-foreground">
                    {contentTitles[currentContent] || ""}
                </div>
            </div>
            <div className="flex items-center gap-2">
                <NotificationButton />
            </div>
        </nav>
    );
};

export default Navbar;