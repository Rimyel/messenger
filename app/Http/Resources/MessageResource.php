<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class MessageResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'content' => $this->content,
            'sender' => [
                'id' => $this->sender->id,
                'name' => $this->sender->name,
                'avatar' => $this->sender->avatar,
            ],
            'sent_at' => $this->sent_at->toISOString(),
            'status' => $this->status,
            'delivered_at' => $this->delivered_at?->toISOString(),
            'read_at' => $this->read_at?->toISOString(),
            'media' => $this->media->map(function ($media) {
                return [
                    'id' => $media->id,
                    'type' => $media->type,
                    'link' => asset('storage/' . $media->link),
                    'name_file' => $media->name_file,
                    'mime_type' => $media->mime_type,
                    'size' => $media->size
                ];
            })->all()
        ];
    }
}