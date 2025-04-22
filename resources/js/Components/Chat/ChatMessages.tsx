import React from "react";
import type { ChatMessage, ChatConversation } from "@/types/chat";
import { cn } from "@/lib/utils";

interface ChatMessagesProps {
    messages: ChatMessage[];
    currentUserId: number;
    conversation: ChatConversation;
}

export const ChatMessages: React.FC<ChatMessagesProps> = ({
    messages,
    currentUserId,
    conversation,
}) => {
    return (
        <div className="flex-1 flex flex-col">
            {/* Chat header */}
            <div className="border-b p-4 flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                    {conversation.participantAvatar ? (
                        <img
                            src={conversation.participantAvatar}
                            alt={conversation.participantName}
                            className="w-full h-full rounded-full object-cover"
                        />
                    ) : (
                        <span className="text-primary text-sm">
                            {conversation.participantName
                                .split(" ")
                                .map((n) => n[0])
                                .join("")}
                        </span>
                    )}
                </div>
                <div>
                    <h3 className="font-medium">{conversation.participantName}</h3>
                    <span className="text-sm text-muted-foreground">
                        онлайн
                    </span>
                </div>
            </div>

            {/* Messages area */}
            <div className="flex-1 p-4 space-y-4 overflow-y-auto">
                {messages.map((message) => {
                    const isOwn = message.senderId === currentUserId;

                    return (
                        <div
                            key={message.id}
                            className={cn("flex", isOwn ? "justify-end" : "justify-start")}
                        >
                            <div
                                className={cn(
                                    "max-w-[70%] rounded-lg p-3",
                                    isOwn
                                        ? "bg-primary text-primary-foreground"
                                        : "bg-muted"
                                )}
                            >
                                <p className="text-sm">{message.content}</p>
                                <div
                                    className={cn(
                                        "text-xs mt-1",
                                        isOwn
                                            ? "text-primary-foreground/80"
                                            : "text-muted-foreground"
                                    )}
                                >
                                    {new Date(message.createdAt).toLocaleTimeString(
                                        [],
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