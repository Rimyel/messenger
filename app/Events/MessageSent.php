<?php

namespace App\Events;

use App\Models\Message;
use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PresenceChannel;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;

class MessageSent implements ShouldBroadcast
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public $message;

    public function __construct(Message $message)
    {
        $this->message = $message->load(['sender:id,name,avatar', 'files']);
        Log::info('Создано событие MessageSent', [
            'chat_id' => $message->chat_id,
            'message_id' => $message->id,
            'sender_id' => $message->sender_id
        ]);
    }

    public function broadcastOn(): array
    {
        $channel = 'chat.' . $this->message->chat_id;
        Log::info('Broadcasting MessageSent на канал', ['channel' => $channel]);
        return [
            new PrivateChannel($channel),
        ];
    }

    public function broadcastAs(): string
    {
        return 'MessageSent';
    }

    public function broadcastWith(): array
    {
        return [
            'message' => [
                'id' => $this->message->id,
                'content' => $this->message->content,
                'sender' => [
                    'id' => $this->message->sender->id,
                    'name' => $this->message->sender->name,
                    'avatar' => $this->message->sender->avatar,
                ],
                'sent_at' => $this->message->sent_at instanceof \Carbon\Carbon
                    ? $this->message->sent_at->timezone('UTC')->toISOString()
                    : \Carbon\Carbon::parse($this->message->sent_at)->timezone('UTC')->toISOString(),
                'chat_id' => $this->message->chat_id,
                'status' => $this->message->status,
                'delivered_at' => $this->message->delivered_at instanceof \Carbon\Carbon
                    ? $this->message->delivered_at->timezone('UTC')->toISOString()
                    : ($this->message->delivered_at ? \Carbon\Carbon::parse($this->message->delivered_at)->timezone('UTC')->toISOString() : null),
                'read_at' => $this->message->read_at instanceof \Carbon\Carbon
                    ? $this->message->read_at->timezone('UTC')->toISOString()
                    : ($this->message->read_at ? \Carbon\Carbon::parse($this->message->read_at)->timezone('UTC')->toISOString() : null),
                'media' => $this->message->files->map(function ($file) {
                    return [
                        'id' => $file->id,
                        'type' => $file->type,
                        'link' => asset('storage/' . $file->path),
                        'name_file' => $file->name,
                        'mime_type' => $file->mime_type,
                        'size' => $file->size
                    ];
                }),
            ],
        ];
    }
}