import type {
    ChatMessage,
    Chat,
    CreateGroupChatData,
    CreatePrivateChatData,
    MessageStatus,
    ChatParticipant,
    MessagesResponse,
    GetMessagesParams
} from "@/types/chat";
import { useAuthStore } from "@/stores/useAuthStore";
import api from "./api";

class ChatService {
    private channel: any;

    subscribeToChat(
        chatId: number,
        onMessageReceived: (message: ChatMessage) => void,
        onMessageStatusUpdated?: (messageId: number, status: MessageStatus, timestamp: string) => void
    ) {
        try {
            if (this.channel) {
                this.unsubscribeFromChat(chatId);
            }

            console.log(`Попытка подписки на канал: chat.${chatId}`);
            this.channel = window.Echo.private(`chat.${chatId}`);

            // Добавляем слушатели состояния канала
            this.channel.subscribed(() => {
                console.log(`Успешно подписались на канал chat.${chatId}`);
            }).error((error: any) => {
                console.error(`Ошибка подписки на канал chat.${chatId}:`, error);
            });
            
            this.channel.listen('.MessageSent', (event: any) => {
                console.log('Получено событие MessageSent:', event);
                if (event.message) {
                    onMessageReceived(event.message);
                }
            });

            this.channel.listen('.MessageStatusUpdated', (event: any) => {
                console.log('Получено событие MessageStatusUpdated:', event);
                if (event.message && onMessageStatusUpdated) {
                    onMessageStatusUpdated(
                        event.message.id,
                        event.message.status,
                        event.message.status === 'delivered' ? event.message.delivered_at : event.message.read_at
                    );
                }
            });
        } catch (error) {
            console.error('Error subscribing to chat:', error);
            throw error;
        }
    }

    unsubscribeFromChat(chatId: number) {
        try {
            if (this.channel) {
                this.channel.stopListening('.MessageSent');
                this.channel.stopListening('.MessageStatusUpdated');
            }
            if (window.Echo) {
                window.Echo.leave(`chat.${chatId}`);
            }
        } catch (error) {
            console.error('Error unsubscribing from chat:', error);
        }
    }

    async sendMessage(chatId: number, content: string, files?: File[]): Promise<ChatMessage> {
        try {
            const formData = new FormData();
            formData.append('content', content);
            
            if (files && files.length > 0) {
                files.forEach(file => {
                    formData.append('files[]', file);
                });
            }

            const response = await api.post(`/chats/${chatId}/messages`, formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });
            return response.data;
        } catch (error) {
            console.error("Error sending message:", error);
            throw error;
        }
    }

    async getChats(): Promise<Chat[]> {
        try {
            const response = await api.get("/chats");
            return response.data;
        } catch (error) {
            console.error("Error fetching chats:", error);
            throw error;
        }
    }

    async getMessages(chatId: number, params?: GetMessagesParams): Promise<MessagesResponse> {
        try {
            const queryParams = new URLSearchParams();
            if (params?.limit) {
                queryParams.append('limit', params.limit.toString());
            }
            if (params?.cursor) {
                queryParams.append('cursor', params.cursor);
            }
            if (params?.search) {
                queryParams.append('search', params.search);
            }

            const url = `/chats/${chatId}/messages${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
            const response = await api.get(url);
            return response.data;
        } catch (error) {
            console.error("Error fetching messages:", error);
            throw error;
        }
    }

    async createPrivateChat(data: CreatePrivateChatData): Promise<Chat> {
        try {
            const response = await api.post("/chats/private", data);
            return response.data;
        } catch (error) {
            console.error("Error creating private chat:", error);
            throw error;
        }
    }

    async createGroupChat(data: CreateGroupChatData): Promise<Chat> {
        try {
            const response = await api.post("/chats/group", data);
            return response.data;
        } catch (error) {
            console.error("Error creating group chat:", error);
            throw error;
        }
    }

    async markMessageRead(chatId: number, messageId: number): Promise<void> {
        try {
            await api.post(`/chats/${chatId}/messages/${messageId}/read`);
        } catch (error) {
            console.error("Error marking message as read:", error);
            throw error;
        }
    }

    async getCompanyUsers(): Promise<ChatParticipant[]> {
        try {
            const response = await api.get("/chat-users");
            return response.data;
        } catch (error) {
            console.error("Error fetching company users:", error);
            throw error;
        }
    }
}

export const chatService = new ChatService();
