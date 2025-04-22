import Pusher from "pusher-js";
import type { ChatMessage, ChatConversation } from "@/types/chat";
import { useAuthStore } from "@/stores/useAuthStore";

class ChatService {
    private pusher: Pusher;
    private channel: any;

    constructor() {
        // Initialize Pusher with your credentials
        this.pusher = new Pusher("fbec33f8ff40825149ad", {
            cluster: "eu",
            forceTLS: true,
            authEndpoint: "/api/broadcasting/auth",
        });
    }

    // Subscribe to a specific chat channel
    subscribeToChat(
        conversationId: number,
        onMessageReceived: (message: ChatMessage) => void
    ) {
        this.channel = this.pusher.subscribe(`private-chat.${conversationId}`);
        this.channel.bind("message.sent", onMessageReceived);
    }

    // Unsubscribe from current chat channel
    unsubscribeFromChat(conversationId: number) {
        if (this.channel) {
            this.channel.unbind("message.sent");
            this.pusher.unsubscribe(`private-chat.${conversationId}`);
        }
    }

    // Send a message
    async sendMessage(conversationId: number, content: string): Promise<void> {
        try {
            const { token } = useAuthStore.getState();
            const response = await fetch("/api/messages", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: token ? `Bearer ${token}` : "",
                },
                body: JSON.stringify({
                    conversationId,
                    content,
                }),
            });

            if (!response.ok) {
                throw new Error("Failed to send message");
            }
        } catch (error) {
            console.error("Error sending message:", error);
            throw error;
        }
    }

    // Get conversation list
    async getConversations(): Promise<ChatConversation[]> {
        try {
            const response = await fetch("/api/conversations");
            if (!response.ok) {
                throw new Error("Failed to fetch conversations");
            }
            return await response.json();
        } catch (error) {
            console.error("Error fetching conversations:", error);
            throw error;
        }
    }

    // Get messages for a specific conversation
    async getMessages(conversationId: number): Promise<ChatMessage[]> {
        try {
            const response = await fetch(
                `/api/conversations/${conversationId}/messages`
            );
            if (!response.ok) {
                throw new Error("Failed to fetch messages");
            }
            return await response.json();
        } catch (error) {
            console.error("Error fetching messages:", error);
            throw error;
        }
    }
}

export const chatService = new ChatService();
