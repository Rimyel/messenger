import { FC, useState, useCallback, useMemo } from "react";
import {
    Users,
    MoreVertical,
    UserPlus,
    UserMinus,
    Shield,
    Crown,
    Check,
} from "lucide-react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/Components/ui/dialog";
import { ScrollArea } from "@/Components/ui/scroll-area";
import { Button } from "@/Components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/Components/ui/avatar";
import { Checkbox } from "@/Components/ui/checkbox";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/Components/ui/dropdown-menu";
import type { Chat, ChatParticipant, ChatRole } from "@/types/chat";
import { chatService } from "@/services/chat";
import { useAuthStore } from "@/stores/useAuthStore";

interface Props {
    chat: Chat;
    children?: React.ReactNode;
    trigger?: React.ReactNode;
    onUpdateChat?: (updatedChat: Chat) => void;
}

const GroupChatInfo: FC<Props> = ({
    chat,
    children,
    trigger,
    onUpdateChat,
}) => {
    const { user } = useAuthStore();
    const [showAllParticipants, setShowAllParticipants] = useState(false);
    const [isAddingParticipants, setIsAddingParticipants] = useState(false);
    const [availableUsers, setAvailableUsers] = useState<ChatParticipant[]>([]);
    const [selectedUsers, setSelectedUsers] = useState<number[]>([]);
    const [isAddingLoading, setIsAddingLoading] = useState(false);
    const [localParticipants, setLocalParticipants] = useState(chat.participants || []);
    const initialParticipantsCount = 10;
    const loadMoreCount = 20;

    if (chat.type !== "group") return null;

    const handleAddSelectedUsers = async () => {
        if (selectedUsers.length === 0) return;

        setIsAddingLoading(true);
        
        // Находим выбранных пользователей из доступных
        const selectedParticipants = availableUsers.filter(user => selectedUsers.includes(user.id));
        
        // Обновляем локальное состояние
        setLocalParticipants(prev => [...prev, ...selectedParticipants]);
        
        // Удаляем выбранных пользователей из списка доступных
        setAvailableUsers(prev => prev.filter(user => !selectedUsers.includes(user.id)));

        try {
            const updatedChat = await chatService.addParticipants(
                chat.id,
                selectedUsers
            );
            onUpdateChat?.(updatedChat);
            setSelectedUsers([]);
            setIsAddingParticipants(false);
        } catch (error) {
            console.error("Error adding participants:", error);
            // Откатываем изменения при ошибке
            setLocalParticipants(chat.participants || []);
            setAvailableUsers(prev => [...prev, ...selectedParticipants]);
        } finally {
            setIsAddingLoading(false);
        }
    };

    const displayedParticipants = showAllParticipants
        ? chat.participants
        : chat.participants?.slice(0, initialParticipantsCount);

    const hasMoreParticipants =
        chat.participants &&
        chat.participants.length >
            (showAllParticipants
                ? chat.participants.length
                : initialParticipantsCount);

    const handleAddParticipants = useCallback(async () => {
        try {
            const users = await chatService.getCompanyUsers();
            setAvailableUsers(
                users.filter(
                    (user) =>
                        !localParticipants.some(
                            (participant) => participant.id === user.id
                        )
                )
            );
            setIsAddingParticipants(true);
        } catch (error) {
            console.error("Error fetching users:", error);
        }
    }, [localParticipants]);

    const handleRemoveParticipant = async (participantId: number) => {
        // Находим удаляемого участника для добавления в доступные пользователи
        const removedParticipant = localParticipants.find(p => p.id === participantId);
        
        // Сначала обновляем локально
        const updatedParticipants = localParticipants.filter(
            (p) => p.id !== participantId
        );
        setLocalParticipants(updatedParticipants);

        // Добавляем удаленного участника в список доступных пользователей
        if (removedParticipant) {
            setAvailableUsers(prev => [...prev, removedParticipant]);
        }

        try {
            await chatService.removeParticipant(chat.id, participantId);
            onUpdateChat?.({
                ...chat,
                participants: updatedParticipants,
            });
        } catch (error) {
            console.error("Error removing participant:", error);
            // Возвращаем предыдущее состояние при ошибке
            setLocalParticipants(chat.participants || []);
            if (removedParticipant) {
                setAvailableUsers(prev => prev.filter(u => u.id !== removedParticipant.id));
            }
        }
    };

    const handleUpdateRole = async (
        participantId: number,
        newRole: ChatRole
    ) => {
        // Сначала обновляем локально
        const updatedParticipants = localParticipants.map((p) =>
            p.id === participantId ? { ...p, role: newRole } : p
        );
        setLocalParticipants(updatedParticipants);

        try {
            await chatService.updateParticipantRole(
                chat.id,
                participantId,
                newRole
            );
            onUpdateChat?.({
                ...chat,
                participants: updatedParticipants,
            });
        } catch (error) {
            console.error("Error updating role:", error);
            // Возвращаем предыдущее состояние при ошибке
            setLocalParticipants(chat.participants || []);
        }
    };

    const currentUserRole = useMemo(() => {
        return chat.participants?.find(p => p.id === user?.id)?.role;
    }, [chat.participants, user?.id]);

    const canManageParticipants = useMemo(() => {
        return currentUserRole === 'creator' || currentUserRole === 'owner' || currentUserRole === 'admin';
    }, [currentUserRole]);

    const getRoleIcon = (role: ChatRole) => {
        switch (role) {
            case "creator":
                return <Crown className="h-4 w-4 text-yellow-500" />;
            case "admin":
                return <Shield className="h-4 w-4 text-blue-500" />;
            default:
                return null;
        }
    };

    return (
        <Dialog>
            <DialogTrigger asChild>
                {trigger || children || (
                    <Button variant="ghost" size="sm" className="gap-2">
                        <Users className="h-4 w-4" />
                        {chat.participants?.length || 0} участников
                    </Button>
                )}
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle className="text-xl font-semibold mb-4">
                        {chat.name}
                    </DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Users className="h-4 w-4" />
                        <span>{chat.participants?.length || 0} участников</span>
                    </div>

                    <ScrollArea className="h-[300px] pr-4">
                        <div className="space-y-4">
                            {(showAllParticipants ? localParticipants : localParticipants.slice(0, initialParticipantsCount))?.map((participant) => (
                                <div key={participant.id} className="flex items-center gap-3">
                                    <Avatar className="h-8 w-8">
                                        <AvatarImage src={participant.avatar} />
                                        <AvatarFallback>{participant.name[0]}</AvatarFallback>
                                    </Avatar>
                                    <div className="flex-1">
                                        <div className="font-medium flex items-center gap-2">
                                            {participant.name}
                                            {getRoleIcon(participant.role)}
                                        </div>
                                        <div className="text-sm text-muted-foreground capitalize">
                                            {participant.role}
                                        </div>
                                    </div>
                                    {canManageParticipants && participant.role !== "creator" && participant.role !== "owner" && (
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" size="icon">
                                                    <MoreVertical className="h-4 w-4" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                <DropdownMenuItem
                                                    onClick={() => handleUpdateRole(participant.id, "admin")}
                                                    disabled={participant.role === "admin"}
                                                >
                                                    <Shield className="h-4 w-4 mr-2" />
                                                    Назначить администратором
                                                </DropdownMenuItem>
                                                <DropdownMenuItem
                                                    onClick={() => handleUpdateRole(participant.id, "member")}
                                                    disabled={participant.role === "member"}
                                                >
                                                    <Users className="h-4 w-4 mr-2" />
                                                    Снять администратора
                                                </DropdownMenuItem>
                                                <DropdownMenuItem
                                                    onClick={() => handleRemoveParticipant(participant.id)}
                                                    className="text-red-600"
                                                >
                                                    <UserMinus className="h-4 w-4 mr-2" />
                                                    Удалить из группы
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    )}
                                </div>
                            ))}
                        </div>
                    </ScrollArea>

                    <div className="space-y-2">
                        {hasMoreParticipants && (
                            <Button
                                variant="outline"
                                className="w-full"
                                onClick={() => setShowAllParticipants(true)}
                            >
                                Показать еще {loadMoreCount} участников
                            </Button>
                        )}
                        {canManageParticipants && (
                            <Button
                                variant="default"
                                className="w-full"
                                onClick={handleAddParticipants}
                            >
                                <UserPlus className="h-4 w-4 mr-2" />
                                Добавить участников
                            </Button>
                        )}
                    </div>
                </div>
            </DialogContent>

            {/* Диалог добавления участников */}
            <Dialog open={isAddingParticipants} onOpenChange={(open) => {
                setIsAddingParticipants(open);
                if (!open) setSelectedUsers([]);
            }}>
                <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle>Добавить участников</DialogTitle>
                    </DialogHeader>
                    <ScrollArea className="h-[300px] pr-4">
                        <div className="space-y-4">
                            {availableUsers.map((user) => (
                                <div key={user.id} className="flex items-center gap-3">
                                    <Checkbox
                                        checked={selectedUsers.includes(user.id)}
                                        onCheckedChange={(checked) => {
                                            if (checked) {
                                                setSelectedUsers(prev => [...prev, user.id]);
                                            } else {
                                                setSelectedUsers(prev => prev.filter(id => id !== user.id));
                                            }
                                        }}
                                    />
                                    <Avatar className="h-8 w-8">
                                        <AvatarImage src={user.avatar} />
                                        <AvatarFallback>{user.name[0]}</AvatarFallback>
                                    </Avatar>
                                    <div className="flex-1">
                                        <div className="font-medium">{user.name}</div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </ScrollArea>
                    <div className="flex justify-end gap-2 mt-4">
                        <Button
                            variant="outline"
                            onClick={() => {
                                setIsAddingParticipants(false);
                                setSelectedUsers([]);
                            }}
                        >
                            Отмена
                        </Button>
                        <Button
                            onClick={handleAddSelectedUsers}
                            disabled={selectedUsers.length === 0 || isAddingLoading}
                        >
                            {isAddingLoading ? (
                                <div className="flex items-center gap-2">
                                    <div className="animate-spin w-4 h-4 border-2 border-current border-t-transparent rounded-full" />
                                    Добавление...
                                </div>
                            ) : (
                                <>
                                    <Check className="h-4 w-4 mr-2" />
                                    Добавить выбранных
                                </>
                            )}
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        </Dialog>
    );
};

export default GroupChatInfo;
