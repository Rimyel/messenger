import { FC } from "react";
import React, { useState, useEffect } from "react";
import { chatService } from "@/services/chat";
import ChatSidebar from "./ChatSidebar";
import ChatMessages from "./ChatMessages";
import ChatInput from "./ChatInput";
import type { ChatMessage, ChatConversation } from "@/types/chat";

// Temporary mock data - will be replaced with real data
// const mockConversations: ChatConversation[] = [
//     {
//         id: 1,
//         participantId: 2,
//         participantName: "John Doe",
//         unreadCount: 3,
//         updatedAt: new Date().toISOString(),
//         lastMessage: {
//             id: 1,
//             content: "Привет, как дела?",
//             senderId: 2,
//             receiverId: 1,
//             createdAt: new Date().toISOString(),
//             read: false,
//         },
//     },
//     {
//         id: 2,
//         participantId: 2,
//         participantName: "John Doe",
//         unreadCount: 3,
//         updatedAt: new Date().toISOString(),
//         lastMessage: {
//             id: 1,
//             content: "Привет, как дела12312312?",
//             senderId: 2,
//             receiverId: 1,
//             createdAt: new Date().toISOString(),
//             read: false,
//         },
//     },
// ];

const mockMessages: ChatMessage[] = [
    {
        id: 1,
        content: "Привет, как дела?",
        senderId: 2,
        receiverId: 1,
        created_at: new Date().toISOString(),
        read: false,
    },
];

interface Props {
    chats?: ChatConversation[];
}

const Chat: FC<Props> = ({ chats }) => {
    const [selectedConversation, setSelectedConversation] = useState<
        ChatConversation | undefined
    >();
    const currentUserId = 1;

    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [conversations, setConversations] = useState<ChatConversation[]>(
        chats ?? []
    );

    useEffect(() => {
        loadConversations();
    }, []);

    useEffect(() => {
        if (selectedConversation) {
            loadMessages(selectedConversation.id);
            try {
                chatService.subscribeToChat(
                    selectedConversation.id,
                    handleNewMessage
                );
            } catch (error) {
                console.error("Error subscribing to chat:", error);
            }
        }

        return () => {
            if (selectedConversation) {
                chatService.unsubscribeFromChat(selectedConversation.id);
            }
        };
    }, [selectedConversation]);

    const loadConversations = async () => {
        try {
            const data = await chatService.getConversations();
            setConversations(data);
        } catch (error) {
            console.error("Error loading conversations:", error);
        }
    };

    const loadMessages = async (conversationId: number) => {
        try {
            const data = await chatService.getMessages(conversationId);
            setMessages(data);
        } catch (error) {
            console.error("Error loading messages:", error);
        }
    };

    const handleNewMessage = (message: ChatMessage) => {
        setMessages((prev) => [...prev, message]);
    };

    const handleSendMessage = async (content: string) => {
        if (!selectedConversation) return;

        try {
            const response = await chatService.sendMessage(
                selectedConversation.id,
                content
            );
            // console.log(response);
        } catch (error) {
            console.error("Error sending message:", error);
            // Optionally show an error toast or notification to the user
            // toast.error("Failed to send message. Please try again.");
        }
    };

    return (
        <div className="flex h-full">
            <ChatSidebar
                conversations={conversations}
                selectedConversation={selectedConversation}
                onSelectConversation={setSelectedConversation}
            />
            {selectedConversation ? (
                <div className="flex-1 flex flex-col">
                    <ChatMessages
                        messages={messages}
                        currentUserId={currentUserId}
                        conversation={selectedConversation}
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

export default Chat;
