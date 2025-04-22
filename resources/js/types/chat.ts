export interface ChatMessage {
    id: number;
    content: string;
    senderId: number;
    receiverId: number;
    createdAt: string;
    read: boolean;
}

export interface ChatConversation {
    id: number;
    participantId: number;
    participantName: string;
    participantAvatar?: string;
    lastMessage?: ChatMessage;
    unreadCount: number;
    updatedAt: string;
}
