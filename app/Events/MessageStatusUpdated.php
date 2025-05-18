<?php

namespace App\Events;

use App\Models\Message;
use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;
class MessageStatusUpdated implements ShouldBroadcast
{
    use Dispatchable, InteractsWithSockets;
    // Temporarily remove SerializesModels to check if it affects date serialization
    // use SerializesModels;

    public $message;

    public function __construct(Message $message)
    {
        // Создаем новый массив с оригинальными значениями
        $this->message = [
            'id' => $message->id,
            'chat_id' => $message->chat_id,
            'sender_id' => $message->sender_id,
            'content' => $message->content,
            'sent_at' => $message->getOriginal('sent_at'),
            'status' => $message->status,
            'delivered_at' => $message->getOriginal('delivered_at'),
            'read_at' => $message->getOriginal('read_at')
        ];
        
        Log::info('MessageStatusUpdated constructor:', [
            'message_data' => $this->message
        ]);
    }

    public function broadcastOn()
    {
        return new PrivateChannel('chat.' . $this->message['chat_id']);
    }

    public function broadcastAs()
    {
        return 'MessageStatusUpdated';
    }

    public function broadcastWith()
    {
        Log::info('Broadcasting message:', [
            'message_data' => $this->message
        ]);
        
        return [
            'message' => $this->message
        ];
    }
}
