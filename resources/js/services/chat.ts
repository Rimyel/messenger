import type {
    ChatMessage,
    Chat,
    CreateGroupChatData,
    CreatePrivateChatData,
    MessageStatus,
    ChatParticipant,
    MessagesResponse,
    GetMessagesParams,
    ChatRole,
} from "@/types/chat";
import { useAuthStore } from "@/stores/useAuthStore";
import api from "./api";

class ChatService {
    private channel: any;

    subscribeToChat(
        chatId: number,
        onMessageReceived: (message: ChatMessage) => void,
        onMessageStatusUpdated?: (
            messageId: number,
            status: MessageStatus,
            timestamp: string
        ) => void
    ) {
        try {
            if (this.channel) {
                this.unsubscribeFromChat(chatId);
            }

            console.log(`Попытка подписки на канал: chat.${chatId}`);
            this.channel = window.Echo.private(`chat.${chatId}`);

            // Добавляем слушатели состояния канала
            this.channel
                .subscribed(() => {
                    console.log(`Успешно подписались на канал chat.${chatId}`);
                })
                .error((error: any) => {
                    console.error(
                        `Ошибка подписки на канал chat.${chatId}:`,
                        error
                    );
                });

            this.channel.listen(".MessageSent", (event: any) => {
                console.log("Получено событие MessageSent:", event);
                if (event.message) {
                    onMessageReceived(event.message);
                }
            });

            this.channel.listen(".MessageStatusUpdated", (event: any) => {
                console.log("событие MessageStatusUpdated:", event);
                console.log("sent_at из события:", event.message.sent_at);

                if (event.message && onMessageStatusUpdated) {
                    onMessageStatusUpdated(
                        event.message.id,
                        event.message.status,
                        event.message.status === "delivered"
                            ? event.message.delivered_at
                            : event.message.read_at
                    );
                }
            });
        } catch (error) {
            console.error("Error subscribing to chat:", error);
            throw error;
        }
    }

    unsubscribeFromChat(chatId: number) {
        try {
            if (this.channel) {
                this.channel.stopListening(".MessageSent");
                this.channel.stopListening(".MessageStatusUpdated");
            }
            if (window.Echo) {
                window.Echo.leave(`chat.${chatId}`);
            }
        } catch (error) {
            console.error("Error unsubscribing from chat:", error);
        }
    }

    async sendMessage(
        chatId: number,
        content: string,
        files?: File[]
    ): Promise<ChatMessage> {
        try {
            const formData = new FormData();
            formData.append("content", content);

            if (files && files.length > 0) {
                files.forEach((file) => {
                    formData.append("files[]", file);
                });
            }

            const response = await api.post(
                `/chats/${chatId}/messages`,
                formData,
                {
                    headers: {
                        "Content-Type": "multipart/form-data",
                    },
                }
            );
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

    async getMessages(
        chatId: number,
        params?: GetMessagesParams
    ): Promise<MessagesResponse> {
        try {
            const queryParams = new URLSearchParams();
            if (params?.limit) {
                queryParams.append("limit", params.limit.toString());
            }
            if (params?.cursor) {
                queryParams.append("cursor", params.cursor);
            }
            if (params?.search) {
                queryParams.append("search", params.search);
            }

            const url = `/chats/${chatId}/messages${
                queryParams.toString() ? `?${queryParams.toString()}` : ""
            }`;
            const response = await api.get(url);
            return response.data;
        } catch (error) {
            console.error("Error fetching messages:", error);
            throw error;
        }
    }

    async createPrivateChat({ userId }: CreatePrivateChatData): Promise<Chat> {
        try {
            const response = await api.post("/chats/private", { userId });
            return response.data;
        } catch (error) {
            console.error("Error creating private chat:", error);
            throw error;
        }
    }

    async createGroupChat({
        name,
        participantIds,
    }: CreateGroupChatData): Promise<Chat> {
        try {
            const response = await api.post("/chats/group", {
                name,
                participantIds,
            });
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
            const response = await api.get("/chats/users");
            return response.data;
        } catch (error) {
            console.error("Error fetching company users:", error);
            throw error;
        }
    }

    async addParticipants(chatId: number, participantIds: number[]): Promise<Chat> {
        try {
            const response = await api.post(`/chats/${chatId}/participants`, {
                participantIds
            });
            return response.data;
        } catch (error) {
            console.error("Error adding participants:", error);
            throw error;
        }
    }

    async removeParticipant(chatId: number, participantId: number): Promise<void> {
        try {
            await api.delete(`/chats/${chatId}/participants/${participantId}`);
        } catch (error) {
            console.error("Error removing participant:", error);
            throw error;
        }
    }

    async updateParticipantRole(chatId: number, participantId: number, role: ChatRole): Promise<void> {
        try {
            await api.put(`/chats/${chatId}/participants/${participantId}/role`, {
                role
            });
        } catch (error) {
            console.error("Error updating participant role:", error);
            throw error;
        }
    }
}

export const chatService = new ChatService();
