<?php

namespace App\Services;

use App\Events\MessageSent;
use App\Events\MessageStatusUpdated;
use App\Models\Chat;
use App\Models\Message;
use App\Models\MessagesMedia;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;

class ChatMessageService
{
    public function sendMessage(Chat $chat, Request $request, $user)
    {
        $message = Message::create([
            'chat_id' => $chat->id,
            'sender_id' => $user->id,
            'content' => $request->content ?? '',
            'sent_at' => now()->setTimezone('UTC'),
            'status' => 'sent'
        ]);

        if ($request->hasFile('files')) {
            foreach ($request->file('files') as $file) {
                $path = $file->store('chat-files', 'public');

                MessagesMedia::create([
                    'message_id' => $message->id,
                    'type' => $this->getFileType($file->getMimeType()),
                    'link' => $path,
                    'name_file' => $file->getClientOriginalName(),
                    'mime_type' => $file->getMimeType(),
                    'size' => $file->getSize()
                ]);
            }
        }

        $message->load('media');

        Log::info("Отправляем событие MessageSent для чата:", [
            'chat_id' => $chat->id,
            'message_id' => $message->id,
            'sender_id' => $user->id
        ]);

        broadcast(new MessageSent($message));
        Log::info("Событие MessageSent отправлено", ['event' => MessageSent::class]);

        $message->load(['sender:id,name,avatar', 'media']);

        return $message;
    }

    public function markMessageDelivered(Chat $chat, Message $message, $user)
    {
        if ($message->sender_id !== $user->id) {
            $message->update([
                'status' => 'delivered',
                'delivered_at' => now()->setTimezone('UTC'),
            ]);

            broadcast(new MessageStatusUpdated($message));
        }

        return $message;
    }

    public function markMessageRead(Chat $chat, Message $message, $user)
    {
        if ($message->sender_id !== $user->id) {
            $message->update([
                'status' => 'read',
                'read_at' => now()->setTimezone('UTC'),
            ]);

            broadcast(new MessageStatusUpdated($message));
        }

        return $message;
    }

    private function getFileType(string $mimeType): string
    {
        if (str_starts_with($mimeType, 'image/')) {
            return 'image';
        } elseif (str_starts_with($mimeType, 'video/')) {
            return 'video';
        } elseif (str_starts_with($mimeType, 'audio/')) {
            return 'audio';
        } else {
            return 'document';
        }
    }
}