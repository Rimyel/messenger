import React, { useState } from "react";
import { SidebarTrigger } from "@/Components/ui/sidebar";
import { NotificationButton } from "./NotificationButton";
import { Sheet, SheetContent, SheetTrigger } from "@/Components/ui/sheet";
import { Button } from "@/Components/ui/button";
import { useIsMobile } from "@/hooks/use-mobile";
import { MessageSquare } from "lucide-react";
import ChatSidebar from "@/Components/Chat/ChatSidebar";
import type { Chat, ChatParticipant } from "@/types/chat";
import { useAuthStore } from "@/stores/useAuthStore";
import { chatService } from "@/services/chat";

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
    profile: "Личный кабинет",
};

export const Navbar: React.FC<NavbarProps> = ({
    currentContent,
    selectedChat,
    onSelectChat,
    chatSidebarOpen,
    onChatSidebarOpenChange,
    chats = [],
    setCurrentContent,
}) => {
    const isMobile = useIsMobile();
    const { user } = useAuthStore();

    const currentUser: ChatParticipant = user
        ? {
              id: user.id,
              name: user.name,
              avatar: user.avatar,
              role: "member",
          }
        : {
              id: 0,
              name: "",
              avatar: "",
              role: "member",
          };

    const [isLoading, setIsLoading] = useState(false);

    const handleCreatePrivateChat = async (userId: number) => {
        if (!userId) return;

        setIsLoading(true);
        try {
            const newChat = await chatService.createPrivateChat({ userId });
            if (onSelectChat) {
                onSelectChat(newChat);
                setCurrentContent("chat");
            }
            if (onChatSidebarOpenChange) {
                onChatSidebarOpenChange(false);
            }
        } catch (error: any) {
            console.error("Error creating private chat:", error);
            alert(
                error.response?.data?.error || "Failed to create private chat"
            );
        } finally {
            setIsLoading(false);
        }
    };

    const handleCreateGroupChat = async (
        name: string,
        participantIds: number[]
    ) => {
        if (!name || !participantIds.length) return;

        setIsLoading(true);
        try {
            const newChat = await chatService.createGroupChat({
                name,
                participantIds,
            });
            if (onSelectChat) {
                onSelectChat(newChat);
                setCurrentContent("chat");
            }
            if (onChatSidebarOpenChange) {
                onChatSidebarOpenChange(false);
            }
        } catch (error: any) {
            console.error("Error creating group chat:", error);
            alert(error.response?.data?.error || "Failed to create group chat");
        } finally {
            setIsLoading(false);
        }
    };
    return isLoading ? (
        <nav className="flex items-center justify-between border-b px-4 h-[57px] relative">
            <div className="absolute inset-0 bg-background/50 flex items-center justify-center z-50 backdrop-blur-sm">
                <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full"></div>
            </div>
        </nav>
    ) : (
        <nav className="flex items-center justify-between border-b px-4 h-[57px]">
            <div className="flex items-center gap-4">
                <SidebarTrigger />
                <div className="text-sm text-muted-foreground">
                    {contentTitles[currentContent] || ""}
                </div>
            </div>
            <div className="flex items-center gap-2">
                {isMobile && (
                    <Sheet
                        open={chatSidebarOpen}
                        onOpenChange={onChatSidebarOpenChange}
                    >
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
