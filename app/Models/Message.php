<?php

namespace App\Models;
use Illuminate\Support\Facades\Log;
use Carbon\Carbon;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

class Message extends Model
{
    public $timestamps = false;

    protected $fillable = [
        'chat_id',
        'sender_id',
        'content',
        'sent_at',
        'type',
        'status',
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
    /**
     * Чат, к которому принадлежит сообщение.
     */
    public function chat(): BelongsTo
    {
        return $this->belongsTo(Chat::class);
    }

    /**
     * Пользователь, отправивший сообщение.
     */
    public function sender(): BelongsTo
    {
        return $this->belongsTo(User::class, 'sender_id');
    }

    /**
    * Файлы, прикрепленные к сообщению
    */
   public function files(): BelongsToMany
   {
       return $this->belongsToMany(File::class, 'messages_media', 'message_id', 'files_id')
           ->withTimestamps();
   }

   /**
    * Псевдоним для отношения files()
    */
   public function media(): BelongsToMany
   {
       return $this->files();
   }
}