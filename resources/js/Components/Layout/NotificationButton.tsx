"use client";
import Echo from 'laravel-echo';
import * as React from "react";
import { useEffect } from "react";
import { Bell, Image as ImageIcon, FileText, Mic, Video } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { ru } from "date-fns/locale";
import { router } from "@inertiajs/react";

import { Avatar, AvatarFallback, AvatarImage } from "@/Components/ui/avatar";
import { Badge } from "@/Components/ui/badge";
import { Button } from "@/Components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuGroup,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/Components/ui/dropdown-menu";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/Components/ui/tooltip";
import { chatService } from "@/services/chat";
import { MediaType } from "@/types/chat";
declare global {
    interface Window {
        userId: number;
        Echo: Echo<any>;
    }
}

interface UnreadMessageResponse {
    chatId: number;
    chatName: string;
    chatType: "private" | "group";
    count: number;
    lastMessage: {
        id: number;
        content: string;
        sender: {
            id: number;
            name: string;
            avatar?: string;
        };
        sent_at: string;
        media?: {
            id: number;
            type: MediaType;
            link: string;
            name_file: string;
            mime_type: string;
            size: number;
        }[];
    };
}

type Notification = {
    id: string;
    chatId: number;
    chatName: string;
    chatType: "private" | "group";
    message: string;
    time: string;
    sender: {
        name: string;
        avatar?: string;
    };
    preview: string;
    hasMedia: boolean;
    mediaType?: MediaType;
};

export function NotificationButton() {
    const [notifications, setNotifications] = React.useState<Notification[]>(
        []
    );

    // const loadUnreadMessages = async () => {
    //     try {
    //         const unreadMessages = await chatService.getUnreadMessages();
    //         const formattedNotifications: Notification[] = unreadMessages.map(
    //             (msg) => ({
    //                 id: msg.lastMessage.id.toString(),
    //                 chatId: msg.chatId,
    //                 chatName: msg.chatName,
    //                 chatType: msg.chatType,
    //                 message:
    //                     msg.count === 1
    //                         ? "Новое сообщение"
    //                         : `${msg.count} непрочитанных ${
    //                               msg.count < 5 ? "сообщения" : "сообщений"
    //                           }`,
    //                 time: formatDistanceToNow(
    //                     new Date(msg.lastMessage.sent_at),
    //                     {
    //                         addSuffix: true,
    //                         locale: ru,
    //                     }
    //                 ),
    //                 sender: {
    //                     name: msg.lastMessage.sender.name,
    //                     avatar: msg.lastMessage.sender.avatar,
    //                 },
    //                 preview: msg.lastMessage.content,
    //                 hasMedia: !!msg.lastMessage.media?.length,
    //                 mediaType: msg.lastMessage.media?.[0]?.type,
    //             })
    //         );
    //         setNotifications(formattedNotifications);
    //     } catch (error) {
    //         console.error("Error loading unread messages:", error);
    //     }
    // };

    // useEffect(() => {
    //     loadUnreadMessages();

    //     // Подписываемся на событие новых сообщений
    //     const channel = window.Echo.private(`User.${window.userId}`);
    //     channel.listen(".MessageSent", () => {
    //         loadUnreadMessages();
    //     });

    //     return () => {
    //         channel.stopListening(".MessageSent");
    //     };
    // }, []);

    const unreadCount = notifications.length;

    const markAllAsRead = async () => {
        try {
            // Отмечаем все сообщения как прочитанные для каждого чата
            await Promise.all(
                notifications.map((notification) =>
                    chatService.markMessageRead(
                        notification.chatId,
                        parseInt(notification.id)
                    )
                )
            );
            setNotifications([]);
        } catch (error) {
            console.error("Error marking all as read:", error);
        }
    };

    const markAsRead = async (notification: Notification) => {
      try {
        console.log('Marking message as read:', notification);
        
        await chatService.markMessageRead(
          notification.chatId,
          parseInt(notification.id)
        );
        setNotifications(
          notifications.filter((n) => n.id !== notification.id)
        );


        // Сначала переключаем на чат


        // Даем немного времени на монтирование компонента чата
        setTimeout(() => {
          console.log('Dispatching onSelectChat event:', {
            id: notification.chatId,
            type: notification.chatType,
            name: notification.chatName,
          });
          
          window.dispatchEvent(
            new CustomEvent("onSelectChat", {
              detail: {
                id: notification.chatId,
                type: notification.chatType,
                name: notification.chatName,
              }
            })
          );
        }, 100); // Увеличиваем задержку до 100мс
        } catch (error) {
            console.error("Error marking as read:", error);
        }
    };
    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="relative">
                    <Bell className="h-5 w-5" />
                    {unreadCount > 0 && (
                        <Badge
                            className="absolute -right-1 -top-1 h-5 w-5 rounded-full p-0 text-xs flex items-center justify-center"
                            variant="destructive"
                        >
                            {unreadCount}
                        </Badge>
                    )}
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-96">
                <DropdownMenuLabel className="flex items-center justify-between">
                    <span>Уведомления</span>
                    {unreadCount > 0 && (
                        <Button
                            variant="ghost"
                            size="sm"
                            className="h-auto p-0 text-xs font-normal"
                            onClick={markAllAsRead}
                        >
                            Отметить все как прочитанные
                        </Button>
                    )}
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuGroup className="max-h-[300px] overflow-y-auto">
                    {notifications.length > 0 ? (
                        notifications.map((notification) => (
                            <DropdownMenuItem
                                key={notification.id}
                                className="cursor-pointer p-3 hover:bg-muted/40"
                                onClick={() => markAsRead(notification)}
                            >
                                <div className="flex w-full gap-3">
                                    <Avatar className="h-10 w-10 border">
                                        <AvatarImage
                                            src={notification.sender.avatar}
                                            alt={notification.sender.name}
                                        />
                                        <AvatarFallback>
                                            {notification.sender.name
                                                .substring(0, 2)
                                                .toUpperCase()}
                                        </AvatarFallback>
                                    </Avatar>
                                    <div className="flex flex-col space-y-1">
                                        <div className="flex items-start justify-between">
                                            <span className="font-medium">
                                                {notification.chatType ===
                                                "private"
                                                    ? notification.sender.name
                                                    : notification.chatName}
                                            </span>
                                            <span className="ml-2 shrink-0 text-xs text-muted-foreground">
                                                {notification.time}
                                            </span>
                                        </div>
                                        <span className="text-sm font-medium">
                                            {notification.message}
                                        </span>
                                        <div className="flex items-center gap-2">
                                            {notification.hasMedia && (
                                                <TooltipProvider>
                                                    <Tooltip>
                                                        <TooltipTrigger asChild>
                                                            <span>
                                                                {notification.mediaType ===
                                                                    "image" && (
                                                                    <ImageIcon className="h-4 w-4" />
                                                                )}
                                                                {notification.mediaType ===
                                                                    "video" && (
                                                                    <Video className="h-4 w-4" />
                                                                )}
                                                                {notification.mediaType ===
                                                                    "audio" && (
                                                                    <Mic className="h-4 w-4" />
                                                                )}
                                                                {notification.mediaType ===
                                                                    "document" && (
                                                                    <FileText className="h-4 w-4" />
                                                                )}
                                                            </span>
                                                        </TooltipTrigger>
                                                        <TooltipContent>
                                                            {`Прикреплен ${
                                                                notification.mediaType ===
                                                                "image"
                                                                    ? "изображение"
                                                                    : notification.mediaType ===
                                                                      "video"
                                                                    ? "видео"
                                                                    : notification.mediaType ===
                                                                      "audio"
                                                                    ? "аудио"
                                                                    : "файл"
                                                            }`}
                                                        </TooltipContent>
                                                    </Tooltip>
                                                </TooltipProvider>
                                            )}
                                            <p className="line-clamp-2 text-sm text-muted-foreground">
                                                {notification.preview}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </DropdownMenuItem>
                        ))
                    ) : (
                        <div className="p-3 text-center text-sm text-muted-foreground">
                            Нет уведомлений
                        </div>
                    )}
                </DropdownMenuGroup>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}

