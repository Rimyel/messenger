import { FC, useState, useEffect } from "react";
import { chatService } from "@/services/chat";
import ChatSidebar from "./ChatSidebar";
import ChatMessages from "./ChatMessages";
import ChatInput from "./ChatInput";
import type { ChatMessage, Chat, ChatParticipant } from "@/types/chat";
import { useAuthStore } from "@/stores/useAuthStore";
import { AuthService } from "@/services/auth";
import { router } from "@inertiajs/core";

// initialChats — начальные данные о чатах, переданные из Laravel (через Inertia). Если данные есть, они используются для инициализации состояния.
interface Props {
    initialChats?: Chat[];
}

const ChatComponent: FC<Props> = ({ initialChats }) => {
    const [selectedChat, setSelectedChat] = useState<Chat | undefined>();
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [chats, setChats] = useState<Chat[]>(initialChats ?? []);
    const [isLoading, setIsLoading] = useState(false);
    const { user, token } = useAuthStore((state) => state);

 // Проверяем, есть ли токен пользователя. Если нет, перенаправляем на страницу входа.
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
        if (selectedChat) {
            // Load messages and subscribe to chat
            const initializeChat = async () => {
                try {
                    // First load messages
                    await loadMessages(selectedChat.id);
                    
                    // Then subscribe to chat updates
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
                } catch (error) {
                    console.error("Error initializing chat:", error);
                }
            };

            initializeChat();
        }

        return () => {
            if (selectedChat) {
                chatService.unsubscribeFromChat(selectedChat.id);
            }
            // Clear messages when changing chats
            setMessages([]);
        };
    }, [selectedChat]);

    const loadChats = async () => {
        try {
            const data = await chatService.getChats();
            setChats(data);
        } catch (error) {
            console.error("Error loading chats:", error);
        }
    };

    const loadMessages = async (chatId: number) => {
        try {
            console.log("Loading messages for chat:", chatId);
            const data = await chatService.getMessages(chatId);
            console.log("Loaded messages:", data);
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
        console.log("handleNewMessage вызван с сообщением:", message);
        
        setMessages(prev => {
            console.log("Текущие сообщения:", prev);
            console.log("Добавляем новое сообщение:", message);
            return [...prev, message];
        });

        // обновляем последнее сообщение в списке чатов
        setChats(prevChats =>
            prevChats.map(chat =>
                chat.id === selectedChat?.id
                    ? { ...chat, lastMessage: message }
                    : chat
            )
        );
    };

    const handleSendMessage = async (content: string) => {
        if (!selectedChat) return;

        try {
            console.log("Отправка сообщения в чат:", selectedChat.id);
            const message = await chatService.sendMessage(selectedChat.id, content);
            
            console.log("Сообщение успешно отправлено:", message);
// Нет, мне нужно дождаться события 
        } catch (error) {
            console.error("Error sending message:", error);
        }
    };

    const handleCreatePrivateChat = async (userId: number) => {
        setIsLoading(true);
        try {
            const newChat = await chatService.createPrivateChat({ userId });
            
            // Add new chat or update existing chats list
            setChats(prev => {
                const existingChatIndex = prev.findIndex(c => c.id === newChat.id);
                if (existingChatIndex !== -1) {
                    // Update existing chat
                    const updatedChats = [...prev];
                    updatedChats[existingChatIndex] = newChat;
                    return updatedChats;
                } else {
                    // Add new chat to the beginning of the list
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

    const handleCreateGroupChat = async (
        name: string,
        participantIds: number[]
    ) => {
        setIsLoading(true);
        try {
            const newChat = await chatService.createGroupChat({
                name,
                participantIds,
            });
            // Add new chat to the beginning of the list
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

    return (
        <div className="flex h-full relative">
            {isLoading && (
                <div className="absolute inset-0 bg-background/50 flex items-center justify-center z-50">
                    <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full"></div>
                </div>
            )}
            <ChatSidebar
                chats={chats}
                selectedChat={selectedChat}
                onSelectChat={setSelectedChat}
                onCreatePrivateChat={handleCreatePrivateChat}
                onCreateGroupChat={handleCreateGroupChat}
                currentUser={currentUser}
            />
            {selectedChat ? (
                <div className="flex-1 flex flex-col">
                    <ChatMessages
                        messages={messages}
                        currentUser={currentUser}
                        chat={selectedChat}
                    />
                    <ChatInput onSendMessage={handleSendMessage} />
                </div>
            ) : (
                <div className="flex-1 flex items-center justify-center text-muted-foreground">
                    Выберите чат для начала общения
                </div>
            )}
        </div>
    );
};

export default ChatComponent;
