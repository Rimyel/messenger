<?php

namespace App\Models;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class MessagesMedia extends Model
{
    use HasFactory;
    protected $table = 'messages_media';

    protected $fillable = [
        'message_id',
        'type',
        'link',
        'name_file',
        'mime_type',
        'size',
    ];

    public function message(): BelongsTo
    {
        return $this->belongsTo(Message::class);
    }
}