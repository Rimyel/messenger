import React, { useState, useRef } from "react";
import { Textarea } from "@/Components/ui/textarea";
import { Button } from "@/Components/ui/button";
import { Send, Paperclip, Smile, X, Music } from "lucide-react";
import { cn } from "@/lib/utils";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/Components/ui/tooltip";

interface ChatInputProps {
    onSendMessage: (content: string, files?: File[]) => Promise<void>;
    disabled?: boolean;
}

interface FilePreview {
    file: File;
    preview: string;
}

export const ChatInput: React.FC<ChatInputProps> = ({ onSendMessage, disabled }) => {
    const [message, setMessage] = useState("");
    const [isSending, setIsSending] = useState(false);
    const [selectedFiles, setSelectedFiles] = useState<FilePreview[]>([]);
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleSend = async () => {
        if ((message.trim() || selectedFiles.length > 0) && !isSending) {
            setIsSending(true);
            try {
                await onSendMessage(
                    message,
                    selectedFiles.map(f => f.file)
                );
                setMessage("");
                setSelectedFiles([]);

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

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files || []);
        
        const newPreviews = files.map(file => ({
            file,
            preview: URL.createObjectURL(file)
        }));

        setSelectedFiles(prev => [...prev, ...newPreviews]);
        
        // Reset file input
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    const removeFile = (index: number) => {
        setSelectedFiles(prev => {
            const newFiles = [...prev];
            URL.revokeObjectURL(newFiles[index].preview);
            newFiles.splice(index, 1);
            return newFiles;
        });
    };

    return (
        <div className="border-t px-4 py-2">
            {selectedFiles.length > 0 && (
                <div className="flex gap-2 mb-2 overflow-x-auto py-2">
                    {selectedFiles.map((file, index) => (
                        <div key={index} className="relative group">
                            {file.file.type.startsWith('image/') ? (
                                <img
                                    src={file.preview}
                                    alt={file.file.name}
                                    className="h-20 w-20 object-cover rounded"
                                />
                            ) : file.file.type.startsWith('audio/') ? (
                                <div className="h-20 w-20 flex flex-col items-center justify-center bg-secondary rounded gap-2">
                                    <Music className="h-8 w-8 text-primary" />
                                    <span className="text-xs text-center break-words px-2 line-clamp-2">
                                        {file.file.name}
                                    </span>
                                </div>
                            ) : (
                                <div className="h-20 w-20 flex items-center justify-center bg-secondary rounded">
                                    <span className="text-xs text-center break-words px-2">
                                        {file.file.name}
                                    </span>
                                </div>
                            )}
                            <button
                                onClick={() => removeFile(index)}
                                className="absolute -top-2 -right-2 bg-destructive text-destructive-foreground rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                                <X className="h-3 w-3" />
                            </button>
                        </div>
                    ))}
                </div>
            )}
            <div className="flex items-center gap-2">
                <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileSelect}
                    className="hidden"
                    multiple
                    accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.xls,.xlsx,.txt"
                />
                <Button
                    size="icon"
                    variant="ghost"
                    className="text-muted-foreground h-8 w-8"
                    disabled={disabled}
                    onClick={() => fileInputRef.current?.click()}
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
                        (!message.trim() && selectedFiles.length === 0) && "opacity-50"
                    )}
                    disabled={(!message.trim() && selectedFiles.length === 0) || disabled || isSending}
                >
                    <Send className={cn("h-4 w-4", isSending && "animate-pulse")} />
                    <span className="sr-only">Отправить</span>
                </Button>
            </div>
        </div>
    );
};

export default ChatInput;