<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;

class Conversation extends Model
{
    use HasUuids;

    protected $fillable = [
        'participant1_id',
        'participant2_id',
    ];

    public function participant1(): BelongsTo
    {
        return $this->belongsTo(User::class, 'participant1_id');
    }

    public function participant2(): BelongsTo
    {
        return $this->belongsTo(User::class, 'participant2_id');
    }

    public function messages(): HasMany
    {
        return $this->hasMany(Message::class);
    }

    public function lastMessage(): HasOne
    {
        return $this->hasOne(Message::class)->latest();
    }
}