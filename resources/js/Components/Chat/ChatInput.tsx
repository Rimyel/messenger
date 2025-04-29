import React, { useState } from "react";
import { Textarea } from "@/Components/ui/textarea";
import { Button } from "@/Components/ui/button";
import { Send } from "lucide-react";
import { cn } from "@/lib/utils";

interface ChatInputProps {
    onSendMessage: (content: string) => Promise<void>;
    disabled?: boolean;
}

export const ChatInput: React.FC<ChatInputProps> = ({ onSendMessage, disabled }) => {
    const [message, setMessage] = useState("");
    const [isSending, setIsSending] = useState(false);

    const handleSend = async () => {
        if (message.trim() && !isSending) {
            setIsSending(true);
            try {
                await onSendMessage(message);
                setMessage("");
            } catch (error) {
                console.error("Failed to send message:", error);
          
            } finally {
                setIsSending(false);
            }
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    return (
        <div className="border-t p-4 flex gap-4 items-end">
            <Textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Введите сообщение..."
                className="min-h-[80px] resize-none"
                disabled={disabled || isSending}
            />
            <Button
                onClick={handleSend}
                className="h-10 w-10 rounded-full p-0"
                disabled={!message.trim() || disabled || isSending}
            >
                <Send className={cn("h-4 w-4", isSending && "animate-pulse")} />
            </Button>
        </div>
    );
};

export default ChatInput;