import React, { useState } from "react";
import type { ChatMessage, Chat, ChatParticipant } from "@/types/chat";
import { cn } from "@/lib/utils";
import { Users } from "lucide-react";
import { useEffect } from "react";

interface ChatMessagesProps {
    messages: ChatMessage[];
    currentUser?: ChatParticipant;
    chat: Chat;
}

export const ChatMessages: React.FC<ChatMessagesProps> = ({
    messages: initialMessages,
    currentUser,
    chat,
}) => {
    const [messages, setMessages] = useState<ChatMessage[]>(initialMessages);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        setMessages(initialMessages);
    }, [initialMessages]);

    useEffect(() => {
        if (!chat.id) return;

        let channel: any;

        try {
            channel = window.Echo.private(`chat.${chat.id}`);
            
            channel.listen('.MessageSent', (event: any) => {
                console.log("Received message event:", event);
                if (event.message) {
                    setMessages(prev => [...prev, event.message]);
                }
            });

            setError(null);
        } catch (err) {
            console.error('Chat setup error:', err);
            setError('Failed to connect to chat');
        }

        return () => {
            if (channel) {
                try {
                    channel.stopListening('.MessageSent');
                    if (window.Echo) {
                        window.Echo.leave(`chat.${chat.id}`);
                    }
                } catch (err) {
                    console.error('Error cleaning up chat:', err);
                }
            }
        };
    }, [chat.id]);

    const getChatDisplayName = (): string => {
        if (chat.type === "private") {
            const otherParticipant = chat.participants?.find(
                (p) => p.id !== currentUser?.id
            );
            return otherParticipant?.name || "Неизвестный пользователь";
        }
        return chat.name;
    };

    const getChatAvatar = (): string | undefined => {
        if (chat.type === "private") {
            const otherParticipant = chat.participants?.find(
                (p) => p.id !== currentUser?.id
            );
            return otherParticipant?.avatar;
        }
        return undefined;
    };

    return (
        <div className="flex-1 flex flex-col">
            {/* Chat header */}
            <div className="border-b p-4 flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                    {chat.type === "group" ? (
                        <Users className="h-5 w-5 text-primary" />
                    ) : getChatAvatar() ? (
                        <img
                            src={getChatAvatar()}
                            alt={getChatDisplayName()}
                            className="w-full h-full rounded-full object-cover"
                        />
                    ) : (
                        <span className="text-primary text-sm">
                            {getChatDisplayName()
                                .split(" ")
                                .map((n) => n[0])
                                .join("")}
                        </span>
                    )}
                </div>
                <div>
                    <h3 className="font-medium">{getChatDisplayName()}</h3>
                    {chat.type === "group" && chat.participants && (
                        <span className="text-sm text-muted-foreground">
                            {chat.participants.length} участников
                        </span>
                    )}
                </div>
            </div>

            {/* Error message if any */}
            {error && (
                <div className="p-4 bg-red-50 text-red-600 text-sm">
                    {error}
                </div>
            )}

            {/* Messages area */}
            <div className="flex-1 p-4 space-y-4 overflow-y-auto">
                {messages.map((message) => {
                    const isOwn = message.sender.id === currentUser?.id;

                    return (
                        <div
                            key={message.id}
                            className={cn(
                                "flex",
                                isOwn ? "justify-end" : "justify-start"
                            )}
                        >
                            <div
                                className={cn(
                                    "max-w-[70%] rounded-lg p-3",
                                    isOwn
                                        ? "bg-primary text-primary-foreground"
                                        : "bg-muted"
                                )}
                            >
                                {chat.type === "group" && !isOwn && (
                                    <p className="text-xs font-medium mb-1">
                                        {message.sender.name}
                                    </p>
                                )}
                                <p className="text-sm">{message.content}</p>
                                <div
                                    className={cn(
                                        "text-xs mt-1",
                                        isOwn
                                            ? "text-primary-foreground/80"
                                            : "text-muted-foreground"
                                    )}
                                >
                                    {new Date(message.sent_at).toLocaleString(
                                        "ru-RU",
                                        {
                                            hour: "2-digit",
                                            minute: "2-digit",
                                        }
                                    )}
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default ChatMessages;
