<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class TaskAssignmentResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'userId' => $this->user_id,
            'userName' => $this->user->name,
            'userAvatar' => $this->user->profile_photo_url,
            'status' => $this->status,
            'response' => $this->whenLoaded('response', function() {
                return [
                    'id' => $this->response->id,
                    'text' => $this->response->text,
                    'status' => $this->response->status,
                    'revisionComment' => $this->response->revision_comment,
                    'submittedAt' => $this->response->created_at,
                    'files' => $this->response->files
                ];
            }),
        ];
    }
}