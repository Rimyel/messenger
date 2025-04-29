export interface ChatMessage {
    id: number;
    content: string;
    sender: {
        id: number;
        name: string;
        avatar?: string;
    };
    sent_at: string;
}

export interface ChatParticipant {
    id: number;
    name: string;
    avatar?: string;
}

export interface Chat {
    id: number;
    type: 'private' | 'group';
    name: string;
    lastMessage?: ChatMessage;
    participants?: ChatParticipant[];
    updatedAt: string;
}

export interface CreateGroupChatData {
    name: string;
    participantIds: number[];
}

export interface CreatePrivateChatData {
    userId: number;
}
