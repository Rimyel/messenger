import type { ChatMessage, Chat, CreateGroupChatData, CreatePrivateChatData } from "@/types/chat";
import { useAuthStore } from "@/stores/useAuthStore";
import api from "./api";

class ChatService {
    private channel: any;

    subscribeToChat(chatId: number, onMessageReceived: (message: ChatMessage) => void) {
        try {
            if (this.channel) {
                this.unsubscribeFromChat(chatId);
            }

            this.channel = window.Echo.private(`chat.${chatId}`);
            
            this.channel.listen('.MessageSent', (event: any) => {
                console.log('Received message in service:', event);
                if (event.message) {
                    onMessageReceived(event.message);
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
            }
            if (window.Echo) {
                window.Echo.leave(`chat.${chatId}`);
            }
        } catch (error) {
            console.error('Error unsubscribing from chat:', error);
        }
    }

    async sendMessage(chatId: number, content: string): Promise<ChatMessage> {
        try {
            const response = await api.post(`/chats/${chatId}/messages`, { content });
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

    async getMessages(chatId: number): Promise<ChatMessage[]> {
        try {
            const response = await api.get(`/chats/${chatId}/messages`);
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
}

export const chatService = new ChatService();
