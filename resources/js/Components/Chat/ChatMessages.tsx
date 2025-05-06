import React, { useState } from "react";
import type { ChatMessage, Chat, ChatParticipant, MessageStatus } from "@/types/chat";
import { cn } from "@/lib/utils";
import { Users, Clock, Check } from "lucide-react";
import { useEffect } from "react";
import { chatService } from "@/services/chat";

const MessageStatusIcon = ({ status, isOwn }: { status: MessageStatus; isOwn: boolean }) => {
    const textColor = isOwn ? "text-primary-foreground/80" : "text-gray-400";
    const textColorRead = isOwn ? "text-primary-foreground" : "text-blue-500";

    if (!status) return null;

    switch (status) {
        case 'sending':
            return <Clock className={cn("h-3 w-3 animate-pulse", textColor)} />;
        case 'sent':
            return <Check className={cn("h-3 w-3", textColor)} />;
        case 'delivered':
            return (
                <div className="relative inline-flex">
                    <Check className={cn("h-3 w-3", textColor)} />
                    <Check className={cn("h-3 w-3 -ml-[3px]", textColor)} />
                </div>
            );
        case 'read':
            return (
                <div className="relative inline-flex">
                    <Check className={cn("h-3 w-3", textColorRead)} />
                    <Check className={cn("h-3 w-3 -ml-[3px]", textColorRead)} />
                </div>
            );
        default:
            return null;
    }
};

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
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [error, setError] = useState<string | null>(null);

    // Handle initial messages
    useEffect(() => {
        if (initialMessages?.length) {
            setMessages(initialMessages);
        }
    }, [initialMessages]);

    // Message observer for read status
    useEffect(() => {
        if (!currentUser) return;

        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        const messageId = parseInt(entry.target.getAttribute('data-message-id') || '0');
                        const message = messages.find(m => m.id === messageId);
                        
                        if (message && message.sender.id !== currentUser.id) {
                            if (message.status === 'delivered') {
                                chatService.markMessageRead(chat.id, message.id);
                            } else if (message.status === 'sent') {
                                chatService.markMessageDelivered(chat.id, message.id)
                                    .then(() => chatService.markMessageRead(chat.id, message.id));
                            }
                        }
                    }
                });
            },
            {
                root: null,
                threshold: 0.5,
            }
        );

        // Observe all message elements
        const messageElements = document.querySelectorAll('[data-message-id]');
        messageElements.forEach((element) => observer.observe(element));

        return () => {
            observer.disconnect();
        };
    }, [chat.id, currentUser, messages]);

    useEffect(() => {
        if (!chat.id) return;
        console.log("Подписка от канала:", `chat.${chat.id}`);

        try {
            chatService.subscribeToChat(
                chat.id,
                (message: ChatMessage) => {
                    setMessages(prev => [...prev, message]);
                },
                (messageId: number, status: MessageStatus, timestamp: string) => {
                    setMessages(prev => prev.map(msg => 
                        msg.id === messageId 
                            ? { ...msg, status, delivered_at: status === 'delivered' ? timestamp : msg.delivered_at, read_at: status === 'read' ? timestamp : msg.read_at }
                            : msg
                    ));
                }
            );

            // Mark messages as delivered when viewing
            initialMessages.forEach(message => {
                if (message.sender.id !== currentUser?.id) {
                    if (message.status === 'sent') {
                        chatService.markMessageDelivered(chat.id, message.id)
                            .then(() => chatService.markMessageRead(chat.id, message.id));
                    } else if (message.status === 'delivered') {
                        chatService.markMessageRead(chat.id, message.id);
                    }
                }
            });

            setError(null);
        } catch (err) {
            console.error('Chat setup error:', err);
            setError('Failed to connect to chat');
        }

        return () => {
            console.log("Отписка от канала:", `chat.${chat.id}`);
            chatService.unsubscribeFromChat(chat.id);
        };
    }, [chat.id, currentUser, initialMessages]);

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
                            data-message-id={message.id}
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
                                        "text-xs mt-1 flex items-center gap-1",
                                        isOwn
                                            ? "text-primary-foreground/80"
                                            : "text-muted-foreground"
                                    )}
                                >
                                    <span>
                                        {new Date(message.sent_at).toLocaleString(
                                            "ru-RU",
                                            {
                                                hour: "2-digit",
                                                minute: "2-digit",
                                            }
                                        )}
                                    </span>
                                    {isOwn && (
                                        <span className="flex items-center ml-1.5 min-w-[20px]">
                                            <MessageStatusIcon status={message.status} isOwn={isOwn} />
                                        </span>
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
