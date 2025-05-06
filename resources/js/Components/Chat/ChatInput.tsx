import React, { useState, useRef } from "react";
import { Textarea } from "@/Components/ui/textarea";
import { Button } from "@/Components/ui/button";
import { Send, Paperclip, Smile } from "lucide-react";
import { cn } from "@/lib/utils";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/Components/ui/tooltip";

interface ChatInputProps {
    onSendMessage: (content: string) => Promise<void>;
    disabled?: boolean;
}

export const ChatInput: React.FC<ChatInputProps> = ({ onSendMessage, disabled }) => {
    const [message, setMessage] = useState("");
    const [isSending, setIsSending] = useState(false);
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    const handleSend = async () => {
        if (message.trim() && !isSending) {
            setIsSending(true);
            try {
                await onSendMessage(message);
                setMessage("");
                // Reset textarea height
                if (textareaRef.current) {
                    textareaRef.current.style.height = 'auto';
                }
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

    const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        setMessage(e.target.value);
        // Auto-resize textarea
        if (textareaRef.current) {
            textareaRef.current.style.height = 'auto';
            textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
        }
    };

    return (
        <div className="border-t px-4 py-2">
            <div className="flex items-center gap-2">
                <Button
                    size="icon"
                    variant="ghost"
                    className="text-muted-foreground h-8 w-8"
                    disabled={disabled}
                >
                    <Paperclip className="h-4 w-4" />
                    <span className="sr-only">Прикрепить файл</span>
                </Button>
    
                <Textarea
                    ref={textareaRef}
                    value={message}
                    onChange={handleTextareaChange}
                    onKeyDown={handleKeyDown}
                    placeholder="Сообщение..."
                    className={cn(
                        "flex-1 resize-none border-0 bg-transparent px-1 py-1 text-sm",
                        "focus-visible:ring-0 focus-visible:ring-offset-0",
                        "min-h-[32px] max-h-[100px] overflow-y-auto"
                    )}
                    disabled={disabled || isSending}
                />
    
                <Button
                    size="icon"
                    variant="outline"
                    className="h-8 w-8"
                    disabled={disabled}
                >
                    <Smile className="h-4 w-4" />
                    <span className="sr-only">Эмодзи</span>
                </Button>
    
                <Button
                    onClick={handleSend}
                    size="icon"
                    variant="ghost"
                    className={cn(
                        "text-primary h-8 w-8",
                        !message.trim() && "opacity-50"
                    )}
                    disabled={!message.trim() || disabled || isSending}
                >
                    <Send className={cn("h-4 w-4", isSending && "animate-pulse")} />
                    <span className="sr-only">Отправить</span>
                </Button>
            </div>
        </div>
    );
};

export default ChatInput;