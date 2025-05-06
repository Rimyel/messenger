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
        try {
            const newChat = await chatService.createPrivateChat({ userId });
            setChats(prev => [...prev, newChat]);
            setSelectedChat(newChat);
        } catch (error) {
            console.error("Error creating private chat:", error);
        }
    };

    const handleCreateGroupChat = async (
        name: string,
        participantIds: number[]
    ) => {
        try {
            const newChat = await chatService.createGroupChat({
                name,
                participantIds,
            });
            setChats(prev => [...prev, newChat]);
            setSelectedChat(newChat);
        } catch (error) {
            console.error("Error creating group chat:", error);
        }
    };

    const currentUser: ChatParticipant = {
        id: user?.id || 0,
        name: user?.name || '',
        avatar: user?.avatar || '',
    };

    return (
        <div className="flex h-full">
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
