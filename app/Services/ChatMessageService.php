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
            'sent_at' => now()->utc(),
            'status' => 'sent' // Initial status is 'sent' (one checkmark)
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

    public function markMessageRead(Chat $chat, Message $message, $user)
    {
        // Only mark as read if it's not the sender and message isn't read
        if ($message->sender_id !== $user->id && $message->status !== 'read') {
            // Update only status and read_at fields to prevent touching other timestamps
            $message->status = 'read';
            $message->read_at = now()->utc()->toDateTimeString();
            $message->save();

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