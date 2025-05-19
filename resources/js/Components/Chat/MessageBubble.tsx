import { FC } from "react";
import type { ChatMessage, MessageMedia } from "@/types/chat";
import HighlightedText from "./HighlightedText";
import clsx from "clsx";
import { Download, FileText, Video } from "lucide-react";
import AudioPlayer from "./AudioPlayer";
import { VideoPlayer } from "./VideoPlayer";
import { toZonedTime, format } from "date-fns-tz";
import { ru } from "date-fns/locale/ru";
import { cn } from "@/lib/utils";
interface Props {
    message: ChatMessage;
    isOwn: boolean;
    searchQuery?: string;
}

// Компонент статуса сообщения
const MessageStatusIcon = ({
    status,
    isOwn,
}: {
    status: string;
    isOwn: boolean;
}) => {
    const textColor = isOwn
        ? "text-primary-foreground/60"
        : "text-muted-foreground/60";
    const textColorRead = isOwn
        ? "text-primary-foreground/80"
        : "text-primary/80";

    switch (status) {
        case "sending":
            return (
                <span className={cn("h-3 w-3 animate-pulse", textColor)}>
                    🕒
                </span>
            );
        case "sent":
            return <span className={cn("h-3 w-3", textColor)}>✔</span>;
        case "delivered":
            return (
                <div className="relative inline-flex">
                    <span className={cn("h-3 w-3", textColor)}>✔</span>
                    <span className={cn("h-3 w-3 -ml-[3px]", textColor)}>
                        ✔
                    </span>
                </div>
            );
        case "read":
            return (
                <div className="relative inline-flex">
                    <span className={cn("h-3 w-3", textColorRead)}>✔</span>
                    <span className={cn("h-3 w-3 -ml-[3px]", textColorRead)}>
                        ✔
                    </span>
                </div>
            );
        default:
            return null;
    }
};

const MessageBubble: FC<Props> = ({ message, isOwn, searchQuery }) => {
    const { content, sender, sent_at, status, media } = message;    

    const renderMediaPreview = (media: MessageMedia[]) => {
        return (
            <div className="space-y-2 mb-2">
                {media.map((file, index) => {
                    if (file.type === "image") {
                        return (
                            <div
                                key={index}
                                className="rounded-lg overflow-hidden"
                            >
                                <img
                                    src={file.link}
                                    alt={file.name_file}
                                    className="max-h-[200px] w-full object-cover"
                                />
                            </div>
                        );
                    }

                    const getIcon = () => {
                        switch (file.type) {
                            case "video":
                                return <Video className="h-5 w-5" />;
                            default:
                                return <FileText className="h-5 w-5" />;
                        }
                    };

                    if (file.type === "audio") {
                        return (
                            <AudioPlayer
                                key={index}
                                src={file.link}
                                filename={file.name_file}
                                fileSize={file.size || 0}
                                isOwn={isOwn}
                            />
                        );
                    }

                    if (file.type === "video") {
                        return (
                            <div key={index} className="max-w-sm sm:max-w-md">
                                <VideoPlayer src={file} />
                                <div
                                    className={clsx(
                                        "flex items-center justify-between p-2 text-xs",
                                        "hover:bg-black/5 transition-colors",
                                        {
                                            "hover:bg-white/10": isOwn,
                                            "hover:bg-black/10": !isOwn,
                                        }
                                    )}
                                >
                                    <div className="flex items-center gap-1.5">
                                        <Video className="h-3.5 w-3.5" />
                                        <span>Video</span>
                                        <span className="opacity-70">
                                            {(file.size / 1024 / 1024).toFixed(
                                                2
                                            )}{" "}
                                            MB
                                        </span>
                                    </div>
                                    <a
                                        href={file.link}
                                        download={file.name_file}
                                        onClick={(e) => e.stopPropagation()}
                                        className="flex items-center gap-1"
                                    >
                                        <Download className="h-3.5 w-3.5 opacity-70" />
                                    </a>
                                </div>
                            </div>
                        );
                    }

                    return (
                        <a
                            key={index}
                            href={file.link}
                            download={file.name_file}
                            className={clsx(
                                "flex items-center gap-2 p-2 rounded-lg",
                                "hover:bg-black/5 transition-colors",
                                {
                                    "hover:bg-white/10": isOwn,
                                    "hover:bg-black/10": !isOwn,
                                }
                            )}
                        >
                            {getIcon()}
                            <div className="flex-1 min-w-0">
                                <div className="truncate text-sm">
                                    {file.name_file}
                                </div>
                                <div className="text-xs opacity-70">
                                    {(file.size / 1024 / 1024).toFixed(2)} MB
                                </div>
                            </div>
                            <Download className="h-4 w-4 opacity-70" />
                        </a>
                    );
                })}
            </div>
        );
    };

    // Получаем часовой пояс пользователя один раз
    const userTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;

    // Форматируем дату отправки с учетом локального времени пользователя
    const formattedSentAt = sent_at
        ? (() => {
              try {
                  const localTime = toZonedTime(
                      new Date(sent_at),
                      userTimezone
                  );
                  return format(localTime, "HH:mm", {
                      locale: ru,
                      timeZone: userTimezone,
                  });
              } catch (error) {
                  console.error("Ошибка форматирования даты:", error);
                  return "--:--";
              }
          })()
        : "--:--";

    return (
        <div
            className={clsx("flex", {
                "justify-end": isOwn,
                "justify-start": !isOwn,
            })}
        >
            <div
                className={clsx(
                    "rounded-2xl px-3 py-2 max-w-[320px] text-sm shadow-sm",
                    {
                        "bg-primary text-primary-foreground": isOwn,
                        "bg-muted/50 text-foreground": !isOwn,
                    }
                )}
            >
                {!isOwn && (
                    <div className="text-xs text-muted-foreground mb-1">
                        {sender.name}
                    </div>
                )}

                {media && media.length > 0 && renderMediaPreview(media)}

                {content && (
                    <div className="whitespace-pre-wrap break-words leading-relaxed">
                        <HighlightedText
                            text={content}
                            highlight={searchQuery}
                        />
                    </div>
                )}

                <div className="flex items-center justify-end gap-0.5 mt-1 text-[10px] text-muted-foreground/80">
                    <span className="flex-shrink-0">{formattedSentAt}</span>

                    {isOwn && (
                        <span className="flex items-center flex-shrink-0">
                            <MessageStatusIcon status={status} isOwn={isOwn} />
                        </span>
                    )}
                </div>
            </div>
        </div>
    );
};

export default MessageBubble;
