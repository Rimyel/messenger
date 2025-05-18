<?php

namespace App\Models;
use Illuminate\Support\Facades\Log;
use Carbon\Carbon;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Message extends Model
{
    public $timestamps = false;
    
    protected $fillable = [
        'chat_id',
        'sender_id',
        'content',
        'sent_at',
        'status',
        'delivered_at',
        'read_at'
    ];

    protected $casts = [
        'sent_at' => 'string',
        'delivered_at' => 'string',
        'read_at' => 'string'
    ];

    // Отключаем автоматическую сериализацию дат
    protected $dates = [];

    public function fromDateTime($value)
    {
        return $value;
    }

    public function chat(): BelongsTo
    {
        return $this->belongsTo(Chat::class);
    }

    public function sender(): BelongsTo
    {
        return $this->belongsTo(User::class, 'sender_id');
    }

    public function media(): HasMany
    {
        return $this->hasMany(MessagesMedia::class);
    }
    // Отключаем автоматическое преобразование sent_at в Carbon
    public function getSentAtAttribute($value)
    {
        return $value;
    }

    public function getReadAtAttribute($value)
    {
        return $value;
    }

    public function getDeliveredAtAttribute($value)
    {
        return $value;
    }
}