"use client";

import { type FC, useState, useEffect } from "react";
import { chatService } from "@/services/chat";
import ChatSidebar from "./ChatSidebar";
import ChatMessages from "./ChatMessages";
import ChatInput from "./ChatInput";
import ChatHeader from "./ChatHeader";
import type { ChatMessage, Chat, ChatParticipant } from "@/types/chat";
import { useAuthStore } from "@/stores/useAuthStore";
import { AuthService } from "@/services/auth";
import { router } from "@inertiajs/core";
import { useIsMobile } from "@/hooks/use-mobile";
import { Sheet, SheetContent, SheetTrigger } from "@/Components/ui/sheet";
import { Button } from "@/Components/ui/button";
import { Menu } from "lucide-react";

interface Props {
    initialChats?: Chat[];
    selectedChat?: Chat;
    onSelectChat?: (chat: Chat) => void;
    sidebarOpen?: boolean;
    onSidebarOpenChange?: (open: boolean) => void;
}

const ChatComponent: FC<Props> = ({
    initialChats,
    selectedChat: externalSelectedChat,
    onSelectChat: externalOnSelectChat,
    sidebarOpen: externalSidebarOpen,
    onSidebarOpenChange: externalOnSidebarOpenChange
}) => {
    const [localSelectedChat, setLocalSelectedChat] = useState<Chat | undefined>();
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [chats, setChats] = useState<Chat[]>(initialChats ?? []);
    const [isLoading, setIsLoading] = useState(false);
    const [isLoadingMore, setIsLoadingMore] = useState(false);
    const [isSearchMode, setIsSearchMode] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [hasMore, setHasMore] = useState(true);
    const [nextCursor, setNextCursor] = useState<string>();
    const { user, token } = useAuthStore((state) => state);
    const isMobile = useIsMobile();
    const [localSidebarOpen, setLocalSidebarOpen] = useState(!isMobile);

    const selectedChat = externalSelectedChat ?? localSelectedChat;
    const setSelectedChat = externalOnSelectChat ?? setLocalSelectedChat;
    const sidebarOpen = externalSidebarOpen ?? localSidebarOpen;
    const setSidebarOpen = externalOnSidebarOpenChange ?? setLocalSidebarOpen;

    useEffect(() => {
        if (!isMobile) {
            setSidebarOpen(true);
        }
    }, [isMobile]);

    useEffect(() => {
        if (!AuthService.isAuthenticated()) {
            router.visit("/login");
            return;
        }
    }, []);



    useEffect(() => {
        if (user) {
            loadChats();
        }
    }, [user]);

    useEffect(() => {
        if (selectedChat?.id) {
            const initializeChat = async () => {
                try {
                    setIsSearchMode(false);
                    setSearchQuery("");
                    await loadMessages(selectedChat.id);

                    chatService.subscribeToChat(
                        selectedChat.id,
                        handleNewMessage,
                        (messageId, status, timestamp) => {
                            setMessages((prev) =>
                                prev.map((msg) =>
                                    msg.id === messageId
                                        ? {
                                              ...msg,
                                              status,
                                              delivered_at:
                                                  status === "delivered"
                                                      ? timestamp
                                                      : msg.delivered_at,
                                              read_at:
                                                  status === "read"
                                                      ? timestamp
                                                      : msg.read_at,
                                          }
                                        : msg
                                )
                            );
                        }
                    );

                    if (isMobile) {
                        setSidebarOpen(false);
                    }
                } catch (error) {
                    console.error("Error initializing chat:", error);
                }
            };

            initializeChat();
        }

        return () => {
            if (selectedChat?.id) {
                chatService.unsubscribeFromChat(selectedChat.id);
            }
            setMessages([]);
        };
    }, [selectedChat?.id, isMobile]);

    const loadChats = async () => {
        try {
            const data = await chatService.getChats();
            if (Array.isArray(data)) {
                setChats(data);
            }
        } catch (error) {
            console.error("Error loading chats:", error);
        }
    };

    const loadMessages = async (
        chatId: number,
        cursor?: string,
        search?: string
    ) => {
        try {
            const {
                messages: newMessages,
                hasMore,
                nextCursor,
            } = await chatService.getMessages(chatId, {
                limit: 20,
                cursor,
                search,
            });

            setMessages((prev) => {
                let updatedMessages;
                if (!cursor) {
                    updatedMessages = newMessages;
                } else {
                    const newMessageIds = new Set(
                        newMessages.map((msg) => msg.id)
                    );
                    const filteredPrev = prev.filter(
                        (msg) => !newMessageIds.has(msg.id)
                    );
                    updatedMessages = [...filteredPrev, ...newMessages];
                }
                return updatedMessages.sort(
                    (a, b) => Number(b.id) - Number(a.id)
                );
            });
            setHasMore(hasMore);
            setNextCursor(nextCursor);
        } catch (error) {
            console.error("Error loading messages:", error);
            setMessages([]);
        }
    };

    const handleNewMessage = (message: ChatMessage) => {
        if (!message) return;

        setMessages((prev) => {
            let updatedMessages;
            const tempMessage = prev.find(
                (m) =>
                    m.status === "sending" &&
                    m.content === message.content &&
                    m.sender.id === message.sender.id &&
                    ((!m.media?.length && !message.media?.length) ||
                        m.media?.length === message.media?.length)
            );

            if (tempMessage) {
                updatedMessages = prev.map((m) =>
                    m === tempMessage
                        ? {
                              ...message,
                              media: message.media?.map((media) => ({
                                  ...media,
                                  link: media.link.startsWith("blob:")
                                      ? tempMessage.media?.find(
                                            (m) =>
                                                m.name_file === media.name_file
                                        )?.link || media.link
                                      : media.link,
                              })),
                          }
                        : m
                );
            } else {
                updatedMessages = [...prev, message];
            }

            return updatedMessages.sort((a, b) => Number(b.id) - Number(a.id));
        });

        setChats((prevChats) =>
            prevChats.map((chat) =>
                chat?.id === selectedChat?.id
                    ? { ...chat, lastMessage: message }
                    : chat
            )
        );
    };

    const handleSendMessage = async (content: string, files?: File[]) => {
        if (
            !selectedChat?.id ||
            (!content.trim() && (!files || files.length === 0))
        )
            return;

        const tempMessage: ChatMessage = {
            id: Date.now(),
            content: content,
            sender: currentUser,
            sent_at: new Date().toISOString(),
            status: "sending",
            delivered_at: undefined,
            read_at: undefined,
            media: files?.map((file) => ({
                id: Date.now(),
                type: file.type.startsWith("image/") ? "image" : "document",
                link: URL.createObjectURL(file),
                name_file: file.name,
                mime_type: file.type,
                size: file.size,
            })),
        };

        setMessages((prev) => {
            const updatedMessages = [...prev, tempMessage];
            return updatedMessages.sort((a, b) => Number(b.id) - Number(a.id));
        });

        try {
            await chatService.sendMessage(selectedChat.id, content, files);
        } catch (error) {
            setMessages((prev) =>
                prev.filter((msg) => msg.id !== tempMessage.id)
            );
            console.error("Error sending message:", error);
        }
    };

    const handleCreatePrivateChat = async (userId: number) => {
        if (!userId) return;

        setIsLoading(true);
        try {
            const newChat = await chatService.createPrivateChat({ userId });

            setChats((prev) => {
                const existingChatIndex = prev.findIndex(
                    (c) => c?.id === newChat?.id
                );
                if (existingChatIndex !== -1) {
                    const updatedChats = [...prev];
                    updatedChats[existingChatIndex] = newChat;
                    return updatedChats;
                } else {
                    return [newChat, ...prev];
                }
            });

            setSelectedChat(newChat);
        } catch (error: any) {
            console.error("Error creating private chat:", error);
            alert(
                error.response?.data?.error || "Failed to create private chat"
            );
        } finally {
            setIsLoading(false);
        }
    };

    const handleCreateGroupChat = async (
        name: string,
        participantIds: number[]
    ) => {
        if (!name || !participantIds.length) return;

        setIsLoading(true);
        try {
            const newChat = await chatService.createGroupChat({
                name,
                participantIds,
            });
            setChats((prev) => [newChat, ...prev]);
            setSelectedChat(newChat);
        } catch (error: any) {
            console.error("Error creating group chat:", error);
            alert(error.response?.data?.error || "Failed to create group chat");
        } finally {
            setIsLoading(false);
        }
    };

    const currentUser: ChatParticipant = {
        id: user?.id || 0,
        name: user?.name || "",
        avatar: user?.avatar || "",
        role: 'member', // Роль будет обновляться при получении данных чата
    };

    const chatSidebar = (
        <ChatSidebar
            chats={chats}
            selectedChat={selectedChat}
            onSelectChat={setSelectedChat}
            onCreatePrivateChat={handleCreatePrivateChat}
            onCreateGroupChat={handleCreateGroupChat}
            currentUser={currentUser}
        />
    );

    return (
        <div className="flex h-full bg-background relative">
            {isLoading && (
                <div className="absolute inset-0 bg-background/50 flex items-center justify-center z-50 backdrop-blur-sm">
                    <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full"></div>
                </div>
            )}

            {!isMobile && chatSidebar}

            {selectedChat ? (
                <div className="flex-1 flex flex-col h-full">
                    <ChatHeader
                        chat={selectedChat}
                        isSearchMode={isSearchMode}
                        searchQuery={searchQuery}
                        onUpdateChat={(updatedChat) => {
                            setChats(prevChats =>
                                prevChats.map(chat =>
                                    chat.id === updatedChat.id ? updatedChat : chat
                                )
                            );
                            setSelectedChat(updatedChat);
                        }}
                        onSearchQueryChange={async (query) => {
                            setSearchQuery(query);
                            setIsLoading(true);
                            try {
                                if (query.trim()) {
                                    const result =
                                        await chatService.getMessages(
                                            selectedChat.id,
                                            {
                                                limit: 50,
                                                search: query,
                                            }
                                        );
                                    setHasMore(result.hasMore);
                                    setNextCursor(result.nextCursor);
                                    setMessages(result.messages);
                                } else {
                                    await loadMessages(selectedChat.id);
                                }
                            } catch (error) {
                                console.error(
                                    "Error searching messages:",
                                    error
                                );
                            } finally {
                                setIsLoading(false);
                            }
                        }}
                        onToggleSearch={() => {
                            setIsSearchMode(!isSearchMode);
                            if (isSearchMode) {
                                setSearchQuery("");
                                loadMessages(selectedChat.id);
                            }
                        }}
                    />
                    <ChatMessages
                        messages={messages}
                        currentUser={currentUser}
                        chat={selectedChat}
                        onLoadMore={async () => {
                            if (isSearchMode) {
                                if (!isLoadingMore && hasMore && nextCursor) {
                                    setIsLoadingMore(true);
                                    try {
                                        const result =
                                            await chatService.getMessages(
                                                selectedChat.id,
                                                {
                                                    limit: 50,
                                                    cursor: nextCursor,
                                                    search: searchQuery,
                                                }
                                            );
                                        setMessages((prev) => {
                                            const combinedMessages = [
                                                ...prev,
                                                ...result.messages,
                                            ];
                                            // Sort by ID in reverse order (highest to lowest)
                                            return combinedMessages.sort(
                                                (a, b) =>
                                                    Number(b.id) - Number(a.id)
                                            );
                                        });
                                        setHasMore(result.hasMore);
                                        setNextCursor(result.nextCursor);
                                    } catch (error) {
                                        console.error(
                                            "Error loading more search results:",
                                            error
                                        );
                                    } finally {
                                        setIsLoadingMore(false);
                                    }
                                }
                            } else if (
                                !isLoadingMore &&
                                hasMore &&
                                nextCursor
                            ) {
                                setIsLoadingMore(true);
                                try {
                                    await loadMessages(
                                        selectedChat.id,
                                        nextCursor
                                    );
                                } finally {
                                    setIsLoadingMore(false);
                                }
                            }
                        }}
                        isLoadingMore={isLoadingMore}
                        hasMore={hasMore}
                        searchQuery={isSearchMode ? searchQuery : undefined}
                    />
                    <ChatInput onSendMessage={handleSendMessage} />
                </div>
            ) : (
                <div className="flex-1 flex items-center justify-center text-muted-foreground">
                    <div className="max-w-[420px] text-center space-y-2">
                        <h2 className="text-xl font-semibold">Выберите чат</h2>
                        <p className="text-sm">
                            Выберите существующий чат или создайте новый, чтобы
                            начать общение
                        </p>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ChatComponent;
