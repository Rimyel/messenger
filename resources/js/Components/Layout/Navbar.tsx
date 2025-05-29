import React from "react";
import { SidebarTrigger } from "@/Components/ui/sidebar";
import { NotificationButton } from "./NotificationButton";
import { Sheet, SheetContent, SheetTrigger } from "@/Components/ui/sheet";
import { Button } from "@/Components/ui/button";
import { useIsMobile } from "@/hooks/use-mobile";
import { MessageSquare } from "lucide-react";
import ChatSidebar from "@/Components/Chat/ChatSidebar";
import type { Chat, ChatParticipant } from "@/types/chat";
import { useAuthStore } from "@/stores/useAuthStore";

interface NavbarProps {
    currentContent: string;
    selectedChat?: Chat;
    onSelectChat?: (chat: Chat) => void;
    chatSidebarOpen?: boolean;
    onChatSidebarOpenChange?: (open: boolean) => void;
    chats?: Chat[];
    setCurrentContent: (content: string) => void;
}

const contentTitles: { [key: string]: string } = {
    dashboard: "Главная",
    company: "Моя компания",
    chat: "Чаты",
    profile: "Личный кабинет"
};

export const Navbar: React.FC<NavbarProps> = ({
    currentContent,
    selectedChat,
    onSelectChat,
    chatSidebarOpen,
    onChatSidebarOpenChange,
    chats = [],
    setCurrentContent
}) => {
    const isMobile = useIsMobile();
    const { user } = useAuthStore();

    const currentUser: ChatParticipant = user ? {
        id: user.id,
        name: user.name,
        avatar: user.avatar,
        role: 'member'
    } : {
        id: 0,
        name: '',
        avatar: '',
        role: 'member'
    };

    const handleCreatePrivateChat = async (userId: number) => {
        // Заглушка для создания приватного чата
        console.log('Create private chat with user:', userId);
    };

    const handleCreateGroupChat = async (name: string, participantIds: number[]) => {
        // Заглушка для создания группового чата
        console.log('Create group chat:', name, participantIds);
    };
    return (
        <nav className="flex items-center justify-between border-b px-4 h-[57px]">
            <div className="flex items-center gap-4">
                <SidebarTrigger />
                <div className="text-sm text-muted-foreground">
                    {contentTitles[currentContent] || ""}
                </div>
            </div>
            <div className="flex items-center gap-2">
                {isMobile && (
                    <Sheet open={chatSidebarOpen} onOpenChange={onChatSidebarOpenChange}>
                        <SheetTrigger asChild>
                            <Button variant="ghost" size="icon">
                                <MessageSquare className="h-5 w-5" />
                            </Button>
                        </SheetTrigger>
                        <SheetContent side="left" className="p-0 w-[320px]">
                            <ChatSidebar
                                chats={chats}
                                selectedChat={selectedChat}
                                onSelectChat={(chat) => {
                                    if (onSelectChat) {
                                        onSelectChat(chat);
                                        setCurrentContent("chat");
                                    }
                                }}
                                onCreatePrivateChat={handleCreatePrivateChat}
                                onCreateGroupChat={handleCreateGroupChat}
                                currentUser={currentUser}
                            />
                        </SheetContent>
                    </Sheet>
                )}
               
            </div>
        </nav>
    );
};

export default Navbar;