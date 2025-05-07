import { FC, useState, useEffect } from "react";
import { chatService } from "@/services/chat";
import ChatSidebar from "./ChatSidebar";
import ChatMessages from "./ChatMessages";
import ChatInput from "./ChatInput";
import type { ChatMessage, Chat, ChatParticipant } from "@/types/chat";
import { useAuthStore } from "@/stores/useAuthStore";
import { AuthService } from "@/services/auth";
import { router } from "@inertiajs/core";
import { useIsMobile } from "@/hooks/use-mobile";
import { Sheet, SheetContent, SheetTrigger } from "@/Components/ui/sheet";
import { Button } from "@/Components/ui/button";
import { Menu } from "lucide-react";

interface Props {
    initialChats?: Chat[];
}

const ChatComponent: FC<Props> = ({ initialChats }) => {
    const [selectedChat, setSelectedChat] = useState<Chat | undefined>();
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [chats, setChats] = useState<Chat[]>(initialChats ?? []);
    const [isLoading, setIsLoading] = useState(false);
    const { user, token } = useAuthStore((state) => state);
    const isMobile = useIsMobile();
    const [sidebarOpen, setSidebarOpen] = useState(!isMobile);

    useEffect(() => {
        if (!isMobile) {
            setSidebarOpen(true);
        }
    }, [isMobile]);

    useEffect(() => {
        if (!AuthService.isAuthenticated()) {
            router.visit("/login");
            return;
        }
    }, []);

    useEffect(() => {
        if (user) {
            loadChats();
        }
    }, [user]);

    useEffect(() => {
        if (selectedChat?.id) {
            const initializeChat = async () => {
                try {
                    await loadMessages(selectedChat.id);
                    
                    chatService.subscribeToChat(
                        selectedChat.id,
                        handleNewMessage,
                        (messageId, status, timestamp) => {
                            setMessages(prev => prev.map(msg =>
                                msg.id === messageId
                                    ? { ...msg, status, delivered_at: status === 'delivered' ? timestamp : msg.delivered_at, read_at: status === 'read' ? timestamp : msg.read_at }
                                    : msg
                            ));
                        }
                    );

                    if (isMobile) {
                        setSidebarOpen(false);
                    }
                } catch (error) {
                    console.error("Error initializing chat:", error);
                }
            };

            initializeChat();
        }

        return () => {
            if (selectedChat?.id) {
                chatService.unsubscribeFromChat(selectedChat.id);
            }
            setMessages([]);
        };
    }, [selectedChat?.id, isMobile]);

    const loadChats = async () => {
        try {
            const data = await chatService.getChats();
            if (Array.isArray(data)) {
                setChats(data);
            }
        } catch (error) {
            console.error("Error loading chats:", error);
        }
    };

    const loadMessages = async (chatId: number) => {
        try {
            const data = await chatService.getMessages(chatId);
            if (Array.isArray(data)) {
                setMessages(data);
            } else {
                console.error("Invalid message data format:", data);
                setMessages([]);
            }
        } catch (error) {
            console.error("Error loading messages:", error);
            setMessages([]);
        }
    };

    const handleNewMessage = (message: ChatMessage) => {
        if (!message) return;

        setMessages(prev => {
            // Find temporary message with matching content and sender
            const tempMessage = prev.find(m =>
                m.status === 'sending' &&
                m.content === message.content &&
                m.sender.id === message.sender.id &&
                (!m.media?.length && !message.media?.length ||
                 m.media?.length === message.media?.length)
            );

            if (tempMessage) {
                // Replace the temporary message with the server message
                return prev.map(m => m === tempMessage ? {
                    ...message,
                    media: message.media?.map(media => ({
                        ...media,
                        link: media.link.startsWith('blob:') ? tempMessage.media?.find(
                            m => m.name_file === media.name_file
                        )?.link || media.link : media.link
                    }))
                } : m);
            }

            // If it's a new message from another sender
            return [...prev, message];
        });

        // Update chat list with latest message
        setChats(prevChats =>
            prevChats.map(chat =>
                chat?.id === selectedChat?.id
                    ? { ...chat, lastMessage: message }
                    : chat
            )
        );
};

    const handleSendMessage = async (content: string, files?: File[]) => {
        if (!selectedChat?.id || (!content.trim() && (!files || files.length === 0))) return;

        // Create temporary message with sending status
        const tempMessage: ChatMessage = {
            id: Date.now(), // Temporary ID
            content: content,
            sender: currentUser,
            sent_at: new Date().toISOString(),
            status: 'sending',
            delivered_at: undefined,
            read_at: undefined,
            media: files?.map(file => ({
                id: Date.now(),
                type: file.type.startsWith('image/') ? 'image' : 'document',
                link: URL.createObjectURL(file),
                name_file: file.name,
                mime_type: file.type,
                size: file.size
            }))
        };

        // Add message to UI immediately
        setMessages(prev => [...prev, tempMessage]);

        try {
            await chatService.sendMessage(selectedChat.id, content, files);
        } catch (error) {
            // Remove temporary message on error
            setMessages(prev => prev.filter(msg => msg.id !== tempMessage.id));
            console.error("Error sending message:", error);
        }
    };

    const handleCreatePrivateChat = async (userId: number) => {
        if (!userId) return;

        setIsLoading(true);
        try {
            const newChat = await chatService.createPrivateChat({ userId });
            
            setChats(prev => {
                const existingChatIndex = prev.findIndex(c => c?.id === newChat?.id);
                if (existingChatIndex !== -1) {
                    const updatedChats = [...prev];
                    updatedChats[existingChatIndex] = newChat;
                    return updatedChats;
                } else {
                    return [newChat, ...prev];
                }
            });
            
            setSelectedChat(newChat);
        } catch (error: any) {
            console.error("Error creating private chat:", error);
            alert(error.response?.data?.error || "Failed to create private chat");
        } finally {
            setIsLoading(false);
        }
    };

    const handleCreateGroupChat = async (name: string, participantIds: number[]) => {
        if (!name || !participantIds.length) return;

        setIsLoading(true);
        try {
            const newChat = await chatService.createGroupChat({
                name,
                participantIds,
            });
            setChats(prev => [newChat, ...prev]);
            setSelectedChat(newChat);
        } catch (error: any) {
            console.error("Error creating group chat:", error);
            alert(error.response?.data?.error || "Failed to create group chat");
        } finally {
            setIsLoading(false);
        }
    };

    const currentUser: ChatParticipant = {
        id: user?.id || 0,
        name: user?.name || '',
        avatar: user?.avatar || '',
    };

    const chatSidebar = (
        <ChatSidebar
            chats={chats}
            selectedChat={selectedChat}
            onSelectChat={setSelectedChat}
            onCreatePrivateChat={handleCreatePrivateChat}
            onCreateGroupChat={handleCreateGroupChat}
            currentUser={currentUser}
        />
    );

    return (
        <div className="flex h-full bg-background relative">
            {isLoading && (
                <div className="absolute inset-0 bg-background/50 flex items-center justify-center z-50 backdrop-blur-sm">
                    <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full"></div>
                </div>
            )}
            
            {isMobile ? (
                <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
                    <SheetTrigger asChild>
                        <Button 
                            variant="ghost" 
                            size="icon"
                            className="absolute left-4 top-4 z-30 md:hidden"
                        >
                            <Menu className="h-5 w-5" />
                            <span className="sr-only">Toggle Sidebar</span>
                        </Button>
                    </SheetTrigger>
                    <SheetContent side="left" className="p-0 w-[320px]">
                        {chatSidebar}
                    </SheetContent>
                </Sheet>
            ) : (
                chatSidebar
            )}

            {selectedChat ? (
                <div className="flex-1 flex flex-col h-full">
                    <ChatMessages
                        messages={messages}
                        currentUser={currentUser}
                        chat={selectedChat}
                    />
                    <ChatInput onSendMessage={handleSendMessage} />
                </div>
            ) : (
                <div className="flex-1 flex items-center justify-center text-muted-foreground">
                    <div className="max-w-[420px] text-center space-y-2">
                        <h2 className="text-xl font-semibold">Выберите чат</h2>
                        <p className="text-sm">
                            Выберите существующий чат или создайте новый, чтобы начать общение
                        </p>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ChatComponent;
