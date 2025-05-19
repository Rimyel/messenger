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
            'media' => $this->files->map(function ($file) {
                return [
                    'id' => $file->id,
                    'type' => $file->type,
                    'link' => asset('storage/' . $file->path),   // путь остается тем же
                    'name_file' => $file->name,
                    'mime_type' => $file->mime_type,
                    'size' => $file->size
                ];
            })->all()
        ];
    }
}