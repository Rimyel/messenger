import { FC, useEffect, useRef } from "react";
import type { ChatMessage, Chat, ChatParticipant } from "@/types/chat";
import MessageBubble from "./MessageBubble";
import { chatService } from "@/services/chat";

interface Props {
  messages: ChatMessage[];
  currentUser: ChatParticipant;
  chat: Chat;
}

const ChatMessages: FC<Props> = ({ messages, currentUser, chat }) => {
  const endOfMessagesRef = useRef<HTMLDivElement | null>(null);
  const messageObserverRef = useRef<IntersectionObserver | null>(null);

  useEffect(() => {
    endOfMessagesRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (!currentUser) return;

    messageObserverRef.current = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const messageId = parseInt(entry.target.getAttribute('data-message-id') || '0');
            const message = messages.find(m => m.id === messageId);
            
            if (message && message.sender.id !== currentUser.id) {
              if (message.status === 'delivered') {
                chatService.markMessageRead(chat.id, message.id);
              } else if (message.status === 'sent') {
                chatService.markMessageDelivered(chat.id, message.id)
                  .then(() => chatService.markMessageRead(chat.id, message.id));
              }
            }
          }
        });
      },
      {
        threshold: 0.5,
      }
    );

    messages.forEach(message => {
      const element = document.querySelector(`[data-message-id="${message.id}"]`);
      if (element) {
        messageObserverRef.current?.observe(element);
      }
    });

    return () => {
      messageObserverRef.current?.disconnect();
    };
  }, [chat.id, currentUser, messages]);

  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-2">
      {messages.map((message) => (
        <div key={message.id} data-message-id={message.id}>
          <MessageBubble
            message={message}
            isOwn={message.sender.id === currentUser.id}
          />
        </div>
      ))}
      <div ref={endOfMessagesRef} />
    </div>
  );
};

export default ChatMessages;