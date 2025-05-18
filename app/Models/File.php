<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

class File extends Model
{
    use HasUuids;

    protected $fillable = [
        'name',
        'path',
        'type',
        'mime_type',
        'size',
    ];

    /**
     * Получить сообщения, к которым прикреплен файл.
     */
    public function messages(): BelongsToMany
    {
        return $this->belongsToMany(Message::class, 'message_files')
            ->withTimestamps();
    }

    /**
     * Получить задания, к которым прикреплен файл.
     */
    public function tasks(): BelongsToMany
    {
        return $this->belongsToMany(Task::class, 'task_files')
            ->withTimestamps();
    }

    /**
     * Получить ответы на задания, к которым прикреплен файл.
     */
    public function taskResponses(): BelongsToMany
    {
        return $this->belongsToMany(TaskResponse::class, 'task_response_files')
            ->withTimestamps();
    }

    /**
     * Форматирует размер файла для отображения.
     */
    public function getFormattedSizeAttribute(): string
    {
        $bytes = $this->size;
        if ($bytes === 0) return "0 B";

        $units = ['B', 'KB', 'MB', 'GB'];
        $i = floor(log($bytes, 1024));
        
        return round($bytes / pow(1024, $i), 2) . ' ' . $units[$i];
    }
}