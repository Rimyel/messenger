import { FC, useEffect, useRef, useState } from "react";
import type { ChatMessage, Chat, ChatParticipant } from "@/types/chat";
import MessageBubble from "./MessageBubble";
import { chatService } from "@/services/chat";
import { ScrollArea } from "@/Components/ui/scroll-area";
import { Button } from "@/Components/ui/button";
import { format, formatInTimeZone } from "date-fns-tz";
import { ru } from "date-fns/locale";

interface Props {
  messages: ChatMessage[];
  currentUser: ChatParticipant;
  chat: Chat;
  onLoadMore: () => Promise<void>;
  isLoadingMore: boolean;
  hasMore: boolean;
  searchQuery?: string;
  totalCount?: number;
}

const ChatMessages: FC<Props> = ({
  messages,
  currentUser,
  chat,
  onLoadMore,
  isLoadingMore,
  hasMore,
  searchQuery,
  totalCount
}) => {
  const endOfMessagesRef = useRef<HTMLDivElement | null>(null);
  const messageObserverRef = useRef<IntersectionObserver | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const lastMessageCountRef = useRef(messages.length);
  const [showScrollButton, setShowScrollButton] = useState(false);
  const processedMessagesRef = useRef<Set<number>>(new Set());

  const initialLoadRef = useRef(true);

  useEffect(() => {
    const viewport = document.querySelector('[data-radix-scroll-area-viewport]') as HTMLDivElement;
    if (!viewport) return;

    const currentLength = messages.length;
    const previousLength = lastMessageCountRef.current;

    const isFirstLoad = initialLoadRef.current && currentLength > 0;
    const isNewMessage = !initialLoadRef.current &&
      currentLength === previousLength + 1 &&
      messages[currentLength - 1]?.sender.id === currentUser.id;

    if (isFirstLoad || isNewMessage) {
      requestAnimationFrame(() => {
        endOfMessagesRef.current?.scrollIntoView({ behavior: "smooth" });
      });
    }

    if (isFirstLoad) {
      initialLoadRef.current = false;
    }
    lastMessageCountRef.current = currentLength;
  }, [messages]);

  useEffect(() => {
    if (!currentUser) return;

    messageObserverRef.current = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const messageId = parseInt(entry.target.getAttribute('data-message-id') || '0');
            const message = messages.find(m => m.id === messageId);
            
            if (message &&
                message.sender.id !== currentUser.id &&
                !processedMessagesRef.current.has(messageId)) {
              const updateStatus = async () => {
                try {
                  // Only mark sent messages as read
                  if (message.status === 'sent' && !message.read_at) {
                    processedMessagesRef.current.add(messageId);
                    await chatService.markMessageRead(chat.id, message.id);
                  }
                } catch (error) {
                  processedMessagesRef.current.delete(messageId);
                  console.error('Error marking message as read:', error);
                }
              };
              updateStatus();
            }
          }
        });
      },
      {
        threshold: 0.5,
      }
    );

    // Only observe sent messages from other users that aren't read yet
    messages.forEach(message => {
      if (message.sender.id !== currentUser.id &&
          message.status === 'sent' &&
          !message.read_at) {
        const element = document.querySelector(`[data-message-id="${message.id}"]`);
        if (element) {
          messageObserverRef.current?.observe(element);
        }
      }
    });

    return () => {
      messageObserverRef.current?.disconnect();

      processedMessagesRef.current.clear();
    };
  }, [chat.id, currentUser, messages]);

  return (
    <div className="relative flex-1 h-[calc(100vh-12rem)]">
      <ScrollArea
        className="h-full"
        onScrollCapture={(e: React.UIEvent<HTMLDivElement>) => {
          const viewport = e.currentTarget.querySelector('[data-radix-scroll-area-viewport]') as HTMLDivElement;
          if (viewport) {
            if (viewport.scrollTop === 0 && !isLoadingMore && hasMore) {
              const previousScrollHeight = viewport.scrollHeight;
              
              onLoadMore().then(() => {
                // После загрузки сообщений восстанавливаем позицию
                requestAnimationFrame(() => {
                  const newScrollHeight = viewport.scrollHeight;
                  const scrollDiff = newScrollHeight - previousScrollHeight;
                  viewport.scrollTop = scrollDiff;
                });
              });
            }
            
            const isNearBottom = viewport.scrollHeight - viewport.scrollTop - viewport.clientHeight < 200;
            setShowScrollButton(!isNearBottom);
          }
        }}
      >
      <div ref={containerRef} className="space-y-2">
        {searchQuery && (
          <div className="bg-muted/50 p-2 text-sm text-center border-b">
            {messages.length > 0 ? (
              <span>Найдено {totalCount || messages.length} сообщений</span>
            ) : (
              <span>Сообщений не найдено</span>
            )}
          </div>
        )}
        <div className="p-4">
      {isLoadingMore && (
        <div className="flex justify-center mb-4">
          <div className="animate-spin h-5 w-5 border-2 border-primary border-t-transparent rounded-full"></div>
        </div>
      )}
      {[...messages].reverse().reduce<{ date: string; messages: JSX.Element[] }[]>((groups, message) => {
        // Parse the ISO string with timezone information
        const messageDate = format(new Date(message.sent_at), 'dd MMMM yyyy', { locale: ru });
        const lastGroup = groups[groups.length - 1];

        const messageElement = (
          <div key={message.id} data-message-id={message.id}>
            <MessageBubble
              message={message}
              isOwn={message.sender.id === currentUser.id}
              searchQuery={searchQuery}
            />
          </div>
        );

        if (lastGroup && lastGroup.date === messageDate) {
          lastGroup.messages.push(messageElement);
        } else {
          groups.push({
            date: messageDate,
            messages: [messageElement]
          });
        }

        return groups;
      }, []).map((group, index) => (
        <div key={group.date} className="space-y-2">
          <div className="flex items-center justify-center">
            <div className="bg-muted px-3 py-1 rounded-full text-xs text-muted-foreground">
              {group.date}
            </div>
          </div>
          {group.messages}
        </div>
      ))}
        <div ref={endOfMessagesRef} />
        </div>
      </div>
      </ScrollArea>
      
      {/* Кнопка скролла вниз */}
      <Button
        variant="secondary"
        size="icon"
        className={`fixed bottom-20 right-8 rounded-full shadow-lg transition-all duration-200 ${
          showScrollButton ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none'
        }`}
        onClick={() => {
          endOfMessagesRef.current?.scrollIntoView({ behavior: "smooth" });
        }}
      >
        <svg
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <polyline points="6 9 12 15 18 9"></polyline>
        </svg>
      </Button>
    </div>
  );
};

export default ChatMessages;