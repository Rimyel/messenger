<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class TaskResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'title' => $this->title,
            'description' => $this->description,
            'startDate' => $this->start_date,
            'dueDate' => $this->due_date,
            'status' => $this->status,
            'createdBy' => $this->creator->name,
            'createdAt' => $this->created_at,
            'files' => $this->whenLoaded('files'),
            'assignments' => TaskAssignmentResource::collection($this->whenLoaded('assignments')),
        ];
    }
}