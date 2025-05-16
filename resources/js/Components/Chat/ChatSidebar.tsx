import React, { useState, useEffect } from "react";
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
import { Skeleton } from "@/Components/ui/skeleton";
import { Checkbox } from "@/Components/ui/checkbox";
import { Label } from "@/Components/ui/label";
import { Search, Plus, Users, UserPlus, Group, Hash } from "lucide-react";
import type { Chat, ChatParticipant } from "@/types/chat";
import { chatService } from "@/services/chat";
import { format } from "date-fns";
import { ru } from "date-fns/locale";
import { cn } from "@/lib/utils";

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
    const [userSearchQuery, setUserSearchQuery] = useState("");
    const [groupSearchQuery, setGroupSearchQuery] = useState("");
    const [groupName, setGroupName] = useState("");
    const [selectedParticipants, setSelectedParticipants] = useState<number[]>(
        []
    );
    const [isSelectUserDialogOpen, setIsSelectUserDialogOpen] = useState(false);
    const [companyUsers, setCompanyUsers] = useState<ChatParticipant[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        const fetchCompanyUsers = async () => {
            setIsLoading(true);
            try {
                const users = await chatService.getCompanyUsers();
                setCompanyUsers(users);
            } catch (error) {
                console.error("Failed to fetch company users:", error);
            } finally {
                setIsLoading(false);
            }
        };

        if (isSelectUserDialogOpen || isGroupChatDialogOpen) {
            fetchCompanyUsers();
        }
    }, [isSelectUserDialogOpen, isGroupChatDialogOpen]);
    // в принципе можно и с 1 участником если это не вызовет проблем в реализации
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
        if (chat?.type === "private") {
            const otherParticipant = chat.participants?.find(
                (p) => p?.id !== currentUser?.id
            );
            return (
                otherParticipant?.name?.toLowerCase().includes(searchTerm) ??
                false
            );
        }
        return chat?.name?.toLowerCase().includes(searchTerm) ?? false;
    });

    const getChatDisplayName = (chat: Chat): string => {
        if (chat?.type === "private") {
            const otherParticipant = chat.participants?.find(
                (p) => p?.id !== currentUser?.id
            );
            return otherParticipant?.name || "Неизвестный пользователь";
        }
        return chat?.name || "Неизвестный чат";
    };

    const getChatAvatar = (chat: Chat): string | undefined => {
        if (chat?.type === "private") {
            const otherParticipant = chat.participants?.find(
                (p) => p?.id !== currentUser?.id
            );
            return otherParticipant?.avatar;
        }
        return undefined;
    };

    return (
        <aside className="w-[320px] border-r h-full flex flex-col bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
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
                <div className="flex flex-col py-2">
                    {filteredChats?.map((chat) => {
                        const isSelected = selectedChat?.id === chat?.id;
                        const lastMessageDate = chat?.lastMessage?.sent_at
                            ? new Date(chat.lastMessage.sent_at).toLocaleTimeString('ru-RU', {
                                hour: '2-digit',
                                minute: '2-digit',
                                hour12: false
                              })
                            : null;

                        return (
                            <button
                                key={chat?.id}
                                onClick={() => onSelectChat(chat)}
                                className={cn(
                                    "flex items-center p-3 gap-3 hover:bg-accent transition-colors relative",
                                    "focus:outline-none focus:bg-accent",
                                    "mx-2 rounded-lg",
                                    isSelected && "bg-accent"
                                )}
                            >
                                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center relative shrink-0">
                                    {chat?.type === "group" ? (
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
                                                .map((n) => n?.[0])
                                                .join("")}
                                        </span>
                                    )}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex justify-between items-baseline gap-2">
                                        <span className="font-medium truncate">
                                            {getChatDisplayName(chat)}
                                        </span>
                                        {lastMessageDate && (
                                            <span className="text-xs text-muted-foreground shrink-0">
                                                {lastMessageDate}
                                            </span>
                                        )}
                                    </div>
                                    {chat?.lastMessage && (
                                        <div className="flex gap-1 items-baseline">
                                            {chat?.type === "group" &&
                                                chat?.lastMessage?.sender
                                                    ?.id !== undefined &&
                                                chat?.lastMessage?.sender
                                                    ?.id ===
                                                    currentUser?.id && (
                                                    <span className="text-xs text-primary font-medium shrink-0">
                                                        Вы:
                                                    </span>
                                                )}
                                            <p className="text-sm text-muted-foreground truncate">
                                                {chat?.lastMessage?.content}
                                            </p>
                                        </div>
                                    )}
                                </div>
                            </button>
                        );
                    })}
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
                            <div className="flex gap-2 items-center mb-4">
                                <Hash className="w-4 h-4 text-muted-foreground" />
                                <Input
                                    placeholder="Название группы"
                                    value={groupName}
                                    onChange={(e) =>
                                        setGroupName(e.target.value)
                                    }
                                />
                            </div>
                            <div className="relative mb-4">
                                <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                                <Input
                                    placeholder="Поиск пользователей"
                                    className="pl-9"
                                    value={groupSearchQuery}
                                    onChange={(e) =>
                                        setGroupSearchQuery(e.target.value)
                                    }
                                />
                            </div>
                            <ScrollArea className="h-[200px]">
                                {isLoading ? (
                                    <div className="space-y-4 p-4">
                                        {[1, 2, 3].map((i) => (
                                            <div
                                                key={i}
                                                className="flex items-center gap-4"
                                            >
                                                <Skeleton className="h-10 w-10 rounded-full" />
                                                <div className="space-y-2">
                                                    <Skeleton className="h-4 w-[200px]" />
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    companyUsers
                                        .filter((user) =>
                                            user?.name
                                                ?.toLowerCase()
                                                .includes(
                                                    groupSearchQuery.toLowerCase()
                                                )
                                        )
                                        .map((user) => (
                                            <div
                                                key={user?.id}
                                                className="flex items-center gap-3 p-2 hover:bg-accent rounded-lg"
                                            >
                                                <Checkbox
                                                    id={`participant-${user?.id}`}
                                                    checked={selectedParticipants.includes(
                                                        user?.id || 0
                                                    )}
                                                    onCheckedChange={(
                                                        checked: boolean
                                                    ) => {
                                                        if (
                                                            user?.id ===
                                                            undefined
                                                        )
                                                            return;
                                                        if (checked) {
                                                            setSelectedParticipants(
                                                                [
                                                                    ...selectedParticipants,
                                                                    user.id,
                                                                ]
                                                            );
                                                        } else {
                                                            setSelectedParticipants(
                                                                selectedParticipants.filter(
                                                                    (id) =>
                                                                        id !==
                                                                        user.id
                                                                )
                                                            );
                                                        }
                                                    }}
                                                />
                                                <div className="flex items-center gap-2 flex-1">
                                                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                                                        {user?.avatar ? (
                                                            <img
                                                                src={
                                                                    user.avatar
                                                                }
                                                                alt={
                                                                    user?.name ||
                                                                    ""
                                                                }
                                                                className="w-full h-full rounded-full object-cover"
                                                            />
                                                        ) : (
                                                            <span className="text-primary text-sm">
                                                                {(
                                                                    user?.name ||
                                                                    ""
                                                                )
                                                                    .split(" ")
                                                                    .map(
                                                                        (n) =>
                                                                            n?.[0]
                                                                    )
                                                                    .join("")}
                                                            </span>
                                                        )}
                                                    </div>
                                                    <Label
                                                        htmlFor={`participant-${user?.id}`}
                                                        className="flex-1 cursor-pointer"
                                                    >
                                                        {user?.name}
                                                    </Label>
                                                </div>
                                            </div>
                                        ))
                                )}
                            </ScrollArea>
                        </div>
                        <DialogFooter>
                            <Button
                                onClick={() => setIsGroupChatDialogOpen(false)}
                                variant="outline"
                            >
                                Отмена
                            </Button>
                            <Button
                                onClick={handleCreateGroupChat}
                                disabled={
                                    !groupName ||
                                    selectedParticipants.length === 0
                                }
                            >
                                Создать группу
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
                    <div className="relative mb-4">
                        <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Поиск пользователей"
                            className="pl-9"
                            value={userSearchQuery}
                            onChange={(e) => setUserSearchQuery(e.target.value)}
                        />
                    </div>
                    <ScrollArea className="h-[300px] -mx-4 px-4">
                        {isLoading ? (
                            <div className="space-y-4">
                                {[1, 2, 3].map((i) => (
                                    <div
                                        key={i}
                                        className="flex items-center gap-4"
                                    >
                                        <Skeleton className="h-10 w-10 rounded-full" />
                                        <div className="space-y-2">
                                            <Skeleton className="h-4 w-[200px]" />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="flex flex-col">
                                {companyUsers
                                    .filter((user) =>
                                        user?.name
                                            ?.toLowerCase()
                                            .includes(
                                                userSearchQuery.toLowerCase()
                                            )
                                    )
                                    .map((user) => (
                                        <button
                                            key={user?.id}
                                            onClick={() =>
                                                user?.id !== undefined &&
                                                handleCreatePrivateChat(user.id)
                                            }
                                            className="flex items-center gap-3 p-3 hover:bg-accent transition-colors rounded-lg text-left -mx-4 px-4"
                                        >
                                            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                                                {user?.avatar ? (
                                                    <img
                                                        src={user.avatar}
                                                        alt={user?.name || ""}
                                                        className="w-full h-full rounded-full object-cover"
                                                    />
                                                ) : (
                                                    <span className="text-primary text-sm">
                                                        {(user?.name || "")
                                                            .split(" ")
                                                            .map((n) => n?.[0])
                                                            .join("")}
                                                    </span>
                                                )}
                                            </div>
                                            <span className="font-medium">
                                                {user?.name}
                                            </span>
                                        </button>
                                    ))}
                            </div>
                        )}
                    </ScrollArea>
                </DialogContent>
            </Dialog>
        </aside>
    );
};

export default ChatSidebar;
