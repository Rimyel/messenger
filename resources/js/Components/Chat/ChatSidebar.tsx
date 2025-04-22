import React from "react";
import { ScrollArea } from "@/Components/ui/scroll-area";
import { Input } from "@/Components/ui/input";
import { Search } from "lucide-react";
import type { ChatConversation } from "@/types/chat";

interface ChatSidebarProps {
    conversations: ChatConversation[];
    selectedConversation?: ChatConversation;
    onSelectConversation: (conversation: ChatConversation) => void;
}

export const ChatSidebar: React.FC<ChatSidebarProps> = ({
    conversations,
    selectedConversation,
    onSelectConversation,
}) => {
    return (
        <div className="w-[320px] border-r h-full flex flex-col">
            <div className="p-4 border-b">
                <div className="relative">
                    <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Поиск"
                        className="pl-9"
                    />
                </div>
            </div>
            <ScrollArea className="flex-1">
                <div className="flex flex-col">
                    {conversations.map((conversation) => (
                        <button
                            key={conversation.id}
                            onClick={() => onSelectConversation(conversation)}
                            className={`flex items-center p-4 gap-3 hover:bg-accent transition-colors ${
                                selectedConversation?.id === conversation.id
                                    ? "bg-accent"
                                    : ""
                            }`}
                        >
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
                            <div className="flex-1 text-left">
                                <div className="flex justify-between items-start">
                                    <span className="font-medium">
                                        {conversation.participantName}
                                    </span>
                                    <span className="text-xs text-muted-foreground">
                                        {new Date(
                                            conversation.updatedAt
                                        ).toLocaleTimeString([], {
                                            hour: "2-digit",
                                            minute: "2-digit",
                                        })}
                                    </span>
                                </div>
                                {conversation.lastMessage && (
                                    <p className="text-sm text-muted-foreground truncate">
                                        {conversation.lastMessage.content}
                                    </p>
                                )}
                            </div>
                            {conversation.unreadCount > 0 && (
                                <div className="w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                                    <span className="text-xs text-primary-foreground">
                                        {conversation.unreadCount}
                                    </span>
                                </div>
                            )}
                        </button>
                    ))}
                </div>
            </ScrollArea>
        </div>
    );
};

export default ChatSidebar;