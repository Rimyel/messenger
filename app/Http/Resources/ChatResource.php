<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;
use Illuminate\Support\Facades\Auth;

class ChatResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        $user = Auth::user();

        if ($this->type === 'private') {
            $otherParticipant = $this->participants->where('id', '!=', $user->id)->first();
            return [
                'id' => $this->id,
                'type' => 'private',
                'name' => $otherParticipant->name,
                'lastMessage' => $this->lastMessage ? new MessageResource($this->lastMessage) : null,
                'participants' => UserResource::collection($this->participants),
                'updatedAt' => $this->updated_at,
                'participantAvatar' => $otherParticipant->avatar
            ];
        }

        return [
            'id' => $this->id,
            'type' => 'group',
            'name' => $this->name,
            'lastMessage' => $this->lastMessage ? new MessageResource($this->lastMessage) : null,
            'participants' => UserResource::collection($this->participants),
            'updatedAt' => $this->updated_at
        ];
    }
}