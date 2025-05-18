<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\MorphTo;

class Media extends Model
{
    protected $fillable = [
        'type',        // Тип файла (изображение, документ и т.д.)
        'link',        // Путь к файлу в хранилище
        'name_file',   // Оригинальное имя файла
        'mime_type',   // MIME-тип файла
        'size',        // Размер файла в байтах
    ];

    /**
     * Сообщения, к которым прикреплен файл
     */
    public function messages()
    {
        return $this->belongsToMany(Message::class, 'messages_media');
    }

    /**
     * Форматирует размер файла для отображения.
     */
    public function getFormattedSizeAttribute(): string
    {
        $bytes = $this->size;
        if ($bytes === 0)
            return "0 B";

        $units = ['B', 'KB', 'MB', 'GB'];
        $i = floor(log($bytes, 1024));

        return round($bytes / pow(1024, $i), 2) . ' ' . $units[$i];
    }
}