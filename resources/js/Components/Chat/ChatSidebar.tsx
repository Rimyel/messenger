import React, { useState } from "react";
import { ScrollArea } from "@/Components/ui/scroll-area";
import { Input } from "@/Components/ui/input";
import { Button } from "@/Components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from "@/Components/ui/dialog";
import { Search, Plus, Users, UserPlus, Group } from "lucide-react";
import type { Chat, ChatParticipant } from "@/types/chat";

interface ChatSidebarProps {
    chats: Chat[];
    selectedChat?: Chat;
    onSelectChat: (chat: Chat) => void;
    onCreatePrivateChat: (userId: number) => Promise<void>;
    onCreateGroupChat: (
        name: string,
        participantIds: number[]
    ) => Promise<void>;
    currentUser?: ChatParticipant;
}

export const ChatSidebar: React.FC<ChatSidebarProps> = ({
    chats,
    selectedChat,
    onSelectChat,
    onCreatePrivateChat,
    onCreateGroupChat,
    currentUser,
}) => {
    const [isNewChatDialogOpen, setIsNewChatDialogOpen] = useState(false);
    const [isGroupChatDialogOpen, setIsGroupChatDialogOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [groupName, setGroupName] = useState("");
    const [selectedParticipants, setSelectedParticipants] = useState<number[]>([]);
    const [isSelectUserDialogOpen, setIsSelectUserDialogOpen] = useState(false);

    const handleCreateGroupChat = async () => {
        if (!groupName || selectedParticipants.length === 0) return;
        
        try {
            await onCreateGroupChat(groupName, selectedParticipants);
            setGroupName("");
            setSelectedParticipants([]);
            setIsGroupChatDialogOpen(false);
        } catch (error) {
            console.error("Error creating group chat:", error);
        }
    };

    const handleCreatePrivateChat = (userId: number) => {
        onCreatePrivateChat(userId);
        setIsSelectUserDialogOpen(false);
    };

    const filteredChats = chats.filter((chat) => {
        const searchTerm = searchQuery.toLowerCase();
        if (chat.type === "private") {
            const otherParticipant = chat.participants?.find(
                (p) => p.id !== currentUser?.id
            );
            return otherParticipant?.name.toLowerCase().includes(searchTerm);
        }
        return chat?.name.toLowerCase().includes(searchTerm);
   
    });

    const getChatDisplayName = (chat: Chat): string => {
        if (chat.type === "private") {
            const otherParticipant = chat.participants?.find(
                (p) => p.id !== currentUser?.id
            );
            return otherParticipant?.name || "Неизвестный пользователь";
        }
        return chat.name;
    };

    const getChatAvatar = (chat: Chat): string | undefined => {
        if (chat.type === "private") {
            const otherParticipant = chat.participants?.find(
                (p) => p.id !== currentUser?.id
            );
            return otherParticipant?.avatar;
        }
        return undefined;
    };

    return (
        <div className="w-[320px] border-r h-full flex flex-col">
            <div className="p-4 border-b flex items-center gap-2">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Поиск"
                        className="pl-9"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
                <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => setIsNewChatDialogOpen(true)}
                >
                    <Plus className="h-4 w-4" />
                </Button>
            </div>
            <ScrollArea className="flex-1">
                <div className="flex flex-col">
                    {filteredChats.map((chat) => (
                        <button
                            key={chat.id}
                            onClick={() => onSelectChat(chat)}
                            className={`flex items-center p-4 gap-3 hover:bg-accent transition-colors ${
                                selectedChat?.id === chat.id ? "bg-accent" : ""
                            }`}
                        >
                            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                                {chat.type === "group" ? (
                                    <Users className="h-5 w-5 text-primary" />
                                ) : getChatAvatar(chat) ? (
                                    <img
                                        src={getChatAvatar(chat)}
                                        alt={getChatDisplayName(chat)}
                                        className="w-full h-full rounded-full object-cover"
                                    />
                                ) : (
                                    <span className="text-primary text-sm">
                                        {getChatDisplayName(chat)
                                            .split(" ")
                                            .map((n) => n[0])
                                            .join("")}
                                    </span>
                                )}
                            </div>
                            <div className="flex-1 text-left">
                                <div className="flex justify-between items-start">
                                    <span className="font-medium">
                                        {getChatDisplayName(chat)}
                                    </span>
                                    {chat.lastMessage && (
                                        <span className="text-xs text-muted-foreground">
                                            {new Date(
                                                chat.lastMessage.sent_at
                                            ).toLocaleTimeString([], {
                                                hour: "2-digit",
                                                minute: "2-digit",
                                            })}
                                        </span>
                                    )}
                                </div>
                                {chat.lastMessage && (
                                    <p className="text-sm text-muted-foreground truncate">
                                        {/* {chat.type === "group" && (
                                            <span className="font-medium">
                                                {chat.lastMessage.sender.name}:{" "}
                                            </span>
                                        )} */}
                                        {chat.lastMessage.content}
                                    </p>
                                )}
                            </div>
                        </button>
                    ))}
                </div>
            </ScrollArea>

            <Dialog
                open={isNewChatDialogOpen}
                onOpenChange={setIsNewChatDialogOpen}
            >
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Новый чат</DialogTitle>
                        <DialogDescription>
                            Выберите тип чата для создания
                        </DialogDescription>
                    </DialogHeader>
                    <div className="flex flex-col gap-2">
                        <Button
                            variant="outline"
                            className="w-full justify-start"
                            onClick={() => {
                                setIsNewChatDialogOpen(false);
                                setIsSelectUserDialogOpen(true);
                            }}
                        >
                            <UserPlus className="mr-2 h-4 w-4" />
                            Личный чат
                        </Button>
                        <Button
                            variant="outline"
                            className="w-full justify-start"
                            onClick={() => {
                                setIsNewChatDialogOpen(false);
                                setIsGroupChatDialogOpen(true);
                            }}
                        >
                            <Group className="mr-2 h-4 w-4" />
                            Групповой чат
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>

            <Dialog
                open={isGroupChatDialogOpen}
                onOpenChange={setIsGroupChatDialogOpen}
            >
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Создать групповой чат</DialogTitle>
                        <DialogDescription>
                            Введите название группы и добавьте участников
                        </DialogDescription>
                    </DialogHeader>
                    <div className="flex flex-col gap-4">
                        <div>
                            <Input
                                placeholder="Название группы"
                                className="mb-4"
                                value={groupName}
                                onChange={(e) => setGroupName(e.target.value)}
                            />
                            <ScrollArea className="h-[200px]">
                                {chats
                                    .filter(chat => chat.type === 'private')
                                    .map(chat => {
                                        const participant = chat.participants?.find(p => p.id !== currentUser?.id);
                                        if (!participant) return null;
                                        
                                        return (
                                            <div key={participant.id} className="flex items-center gap-2 p-2">
                                                <input
                                                    type="checkbox"
                                                    id={`participant-${participant.id}`}
                                                    checked={selectedParticipants.includes(participant.id)}
                                                    onChange={(e) => {
                                                        if (e.target.checked) {
                                                            setSelectedParticipants([...selectedParticipants, participant.id]);
                                                        } else {
                                                            setSelectedParticipants(selectedParticipants.filter(id => id !== participant.id));
                                                        }
                                                    }}
                                                />
                                                <label htmlFor={`participant-${participant.id}`}>
                                                    {participant.name}
                                                </label>
                                            </div>
                                        );
                                    })}
                            </ScrollArea>
                        </div>
                        <DialogFooter>
                            <Button onClick={() => setIsGroupChatDialogOpen(false)} variant="outline">
                                Отмена
                            </Button>
                            <Button
                                onClick={handleCreateGroupChat}
                                disabled={!groupName || selectedParticipants.length === 0}
                            >
                                Создать
                            </Button>
                        </DialogFooter>
                    </div>
                </DialogContent>
            </Dialog>

            <Dialog
                open={isSelectUserDialogOpen}
                onOpenChange={setIsSelectUserDialogOpen}
            >
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Выбрать пользователя</DialogTitle>
                        <DialogDescription>
                            Выберите пользователя для создания личного чата
                        </DialogDescription>
                    </DialogHeader>
                    <ScrollArea className="h-[300px]">
                        <div className="flex flex-col">
                            {chats
                                .filter(chat => chat.type === 'private')
                                .map(chat => {
                                    const participant = chat.participants?.find(p => p.id !== currentUser?.id);
                                    if (!participant) return null;
                                    
                                    return (
                                        <button
                                            key={participant.id}
                                            onClick={() => handleCreatePrivateChat(participant.id)}
                                            className="flex items-center gap-3 p-3 hover:bg-accent transition-colors rounded-lg text-left"
                                        >
                                            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                                                {participant.avatar ? (
                                                    <img
                                                        src={participant.avatar}
                                                        alt={participant.name}
                                                        className="w-full h-full rounded-full object-cover"
                                                    />
                                                ) : (
                                                    <span className="text-primary text-sm">
                                                        {participant.name
                                                            .split(" ")
                                                            .map((n) => n[0])
                                                            .join("")}
                                                    </span>
                                                )}
                                            </div>
                                            <span className="font-medium">{participant.name}</span>
                                        </button>
                                    );
                                })}
                        </div>
                    </ScrollArea>
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default ChatSidebar;
