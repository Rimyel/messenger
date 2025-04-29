import { FC, useState, useEffect } from "react";
import { chatService } from "@/services/chat";
import ChatSidebar from "./ChatSidebar";
import ChatMessages from "./ChatMessages";
import ChatInput from "./ChatInput";
import type { ChatMessage, Chat, ChatParticipant } from "@/types/chat";
import { useAuthStore } from "@/stores/useAuthStore";
import { AuthService } from "@/services/auth";
import { router } from "@inertiajs/core";

interface Props {
    initialChats?: Chat[];
}

const ChatComponent: FC<Props> = ({ initialChats }) => {
    const [selectedChat, setSelectedChat] = useState<Chat | undefined>();
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [chats, setChats] = useState<Chat[]>(initialChats ?? []);
    const { user, token } = useAuthStore((state) => state);

 
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
            loadMessages(selectedChat.id);
            try {
                chatService.subscribeToChat(selectedChat.id, handleNewMessage);
            } catch (error) {
                console.error("Error subscribing to chat:", error);
            }
        }

        return () => {
            if (selectedChat) {
                chatService.unsubscribeFromChat(selectedChat.id);
            }
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
            const data = await chatService.getMessages(chatId);
            setMessages(data);
        } catch (error) {
            console.error("Error loading messages:", error);
        }
    };

    const handleNewMessage = (message: ChatMessage) => {
        console.log("Received new message:", message);
        setMessages(prev => [...prev, message]);

        // обновляем последнее сообщение
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
            const message = await chatService.sendMessage(selectedChat.id, content);

            console.log("Message sent:", message);
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
