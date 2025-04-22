import React, { useState } from "react";
import { Textarea } from "@/Components/ui/textarea";
import { Button } from "@/Components/ui/button";
import { Send } from "lucide-react";

interface ChatInputProps {
    onSendMessage: (content: string) => void;
}

export const ChatInput: React.FC<ChatInputProps> = ({ onSendMessage }) => {
    const [message, setMessage] = useState("");

    const handleSend = () => {
        if (message.trim()) {
            onSendMessage(message);
            setMessage("");
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
            />
            <Button
                onClick={handleSend}
                className="h-10 w-10 rounded-full p-0"
                disabled={!message.trim()}
            >
                <Send className="h-4 w-4" />
            </Button>
        </div>
    );
};

export default ChatInput;