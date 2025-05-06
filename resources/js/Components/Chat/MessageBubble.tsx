import { FC } from "react";
import type { ChatMessage } from "@/types/chat";
import clsx from "clsx";

interface Props {
    message: ChatMessage;
    isOwn: boolean;
}

import { Clock, Check } from "lucide-react";
import { cn } from "@/lib/utils";

const MessageStatusIcon = ({
    status,
    isOwn,
}: {
    status: string;
    isOwn: boolean;
}) => {
    const textColor = isOwn ? "text-primary-foreground/60" : "text-muted-foreground/60";
    const textColorRead = isOwn ? "text-primary-foreground/80" : "text-primary/80";

    switch (status) {
        case "sending":
            return <Clock className={cn("h-3 w-3 animate-pulse", textColor)} />;
        case "sent":
            return <Check className={cn("h-3 w-3", textColor)} />;
        case "delivered":
            return (
                <div className="relative inline-flex">
                    <Check className={cn("h-3 w-3", textColor)} />
                    <Check className={cn("h-3 w-3 -ml-[3px]", textColor)} />
                </div>
            );
        case "read":
            return (
                <div className="relative inline-flex">
                    <Check className={cn("h-3 w-3", textColorRead)} />
                    <Check className={cn("h-3 w-3 -ml-[3px]", textColorRead)} />
                </div>
            );
        default:
            return null;
    }
};

const MessageBubble: FC<Props> = ({ message, isOwn }) => {
    const { content, sender, sent_at, status } = message;

    return (
        <div
            className={clsx("flex", {
                "justify-end": isOwn,
                "justify-start": !isOwn,
            })}
        >
            <div
                className={clsx(
                    "rounded-2xl px-3 py-2 max-w-[280px] text-sm shadow-sm",
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
                <div className="whitespace-pre-wrap break-words leading-relaxed">{content}</div>
                <div className="flex items-center justify-end gap-0.5 mt-1 text-[10px] text-muted-foreground/80">
                    <span className="flex-shrink-0">
                        {new Date(sent_at).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                        })}
                    </span>
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
