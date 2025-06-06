export type MessageStatus = 'sending' | 'sent' | 'delivered' | 'read';
export type MediaType = 'image' | 'video' | 'audio' | 'document';

export interface MessageMedia {
    id: number;
    type: MediaType;
    link: string;
    name_file: string;
    mime_type: string;
    size: number;
    path?: string; // Опциональное поле, так как при отправке файла путь еще не известен
}

export interface ChatMessage {
    id: number;
    content: string;
    sender: {
        id: number;
        name: string;
        avatar?: string;
    };
    sent_at: string;
    status: MessageStatus;
    delivered_at?: string;
    read_at?: string;
    media?: MessageMedia[];
    preview?: string;
    hasMedia?: boolean;
    mediaType?: MediaType;
}

export type ChatRole = 'creator' | 'owner' | 'admin' | 'member';

export interface ChatParticipant {
    id: number;
    name: string;
    avatar?: string;
    role: ChatRole;
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

export interface UpdateGroupChatParticipantsData {
    chatId: number;
    participantIds: number[];
}

export interface RemoveGroupChatParticipantData {
    chatId: number;
    participantId: number;
}

export interface UpdateParticipantRoleData {
    chatId: number;
    participantId: number;
    role: ChatRole;
}

export interface CreatePrivateChatData {
    userId: number;
}

export interface MessagesResponse {
    messages: ChatMessage[];
    hasMore: boolean;
    nextCursor?: string;
}

export interface GetMessagesParams {
    limit?: number;
    cursor?: string;
    search?: string;
}

export interface SearchMessagesResponse {
    messages: ChatMessage[];
    totalCount: number;
    chat?: {
        id: number;
        name: string;
        type: 'private' | 'group';
    };
}

export interface SearchMessageParams {
    query: string;
    chatId?: number;
    limit?: number;
    offset?: number;
}
