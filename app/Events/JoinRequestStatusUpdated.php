<?php

namespace App\Events;

use App\Models\JoinRequest;
use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PresenceChannel;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class JoinRequestStatusUpdated implements ShouldBroadcast
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public $joinRequest;

    /**
     * Create a new event instance.
     */
    public function __construct(JoinRequest $joinRequest)
    {
        $this->joinRequest = $joinRequest;
    }

    /**
     * Get the channels the event should broadcast on.
     *
     * @return array<int, \Illuminate\Broadcasting\Channel>
     */
    public function broadcastOn(): array
    {
        return [
            new PresenceChannel('company.' . $this->joinRequest->company_id),
            new PrivateChannel('user.' . $this->joinRequest->user_id)
        ];
    }

    /**
     * The event's broadcast name.
     */
    public function broadcastAs(): string
    {
        return 'join-request.updated';
    }

    /**
     * Get the data to broadcast.
     *
     * @return array
     */
    public function broadcastWith(): array
    {
        return [
            'id' => $this->joinRequest->id,
            'status' => $this->joinRequest->status,
            'rejection_reason' => $this->joinRequest->rejection_reason,
            'company_id' => $this->joinRequest->company_id,
            'user_id' => $this->joinRequest->user_id,
            'updated_at' => $this->joinRequest->updated_at
        ];
    }
}