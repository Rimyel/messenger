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
            'sent_at' => $this->getOriginal('sent_at'),
            'status' => $this->status,
            'delivered_at' => $this->getOriginal('delivered_at'),
            'read_at' => $this->getOriginal('read_at'),
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