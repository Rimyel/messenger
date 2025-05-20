import { FC } from "react";
import { Search, X } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/Components/ui/avatar";
import { Button } from "@/Components/ui/button";
import { Input } from "@/Components/ui/input";
import type { Chat } from "@/types/chat";
import GroupChatInfo from "./GroupChatInfo";

interface Props {
    chat: Chat;
    isSearchMode: boolean;
    searchQuery: string;
    onSearchQueryChange: (query: string) => void;
    onToggleSearch: () => void;
    onUpdateChat?: (updatedChat: Chat) => void;
}

const ChatHeader: FC<Props> = ({
    chat,
    isSearchMode,
    searchQuery,
    onSearchQueryChange,
    onToggleSearch,
    onUpdateChat,
}) => {
    const displayName =
        chat.type === "private" && chat.participants?.[0]
            ? chat.participants[0].name
            : chat.name;

    const avatar =
        chat.type === "private" && chat.participants?.[0]
            ? chat.participants[0].avatar
            : undefined;

    return (
        <div className="border-b">
            {!isSearchMode ? (
                <div className="flex items-center gap-4 p-4">
                    {chat.type === "group" ? (
                        <GroupChatInfo chat={chat}>
                            <div className="flex items-center gap-4 flex-1 cursor-pointer">
                                <Avatar>
                                    <AvatarImage src={avatar} />
                                    <AvatarFallback>
                                        {displayName[0]}
                                    </AvatarFallback>
                                </Avatar>
                                <div className="flex-1">
                                    <h2 className="font-semibold">
                                        {displayName}
                                    </h2>
                                    <div className="text-sm text-muted-foreground">
                                        {chat.participants?.length || 0}{" "}
                                        участников
                                    </div>
                                </div>
                            </div>
                        </GroupChatInfo>
                    ) : (
                        <div className="flex items-center gap-4 flex-1">
                            <Avatar>
                                <AvatarImage src={avatar} />
                                <AvatarFallback>
                                    {displayName[0]}
                                </AvatarFallback>
                            </Avatar>
                            <div className="flex-1">
                                <h2 className="font-semibold">{displayName}</h2>
                            </div>
                        </div>
                    )}
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={(e) => {
                            e.stopPropagation();
                            onToggleSearch();
                        }}
                    >
                        <Search className="h-5 w-5" />
                        <span className="sr-only">Поиск</span>
                    </Button>
                </div>
            ) : (
                <>
                    <div className="flex-1">
                        <Input
                            type="search"
                            placeholder="Поиск сообщений..."
                            value={searchQuery}
                            onChange={(e) =>
                                onSearchQueryChange(e.target.value)
                            }
                            className="w-full"
                            autoFocus
                        />
                    </div>
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={onToggleSearch}
                    >
                        <X className="h-5 w-5" />
                        <span className="sr-only">Закрыть поиск</span>
                    </Button>
                </>
            )}
        </div>
    );
};

export default ChatHeader;
