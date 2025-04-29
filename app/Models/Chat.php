<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;

class Chat extends Model
{
    protected $fillable = [
        'company_id',
        'type',
        'name',
    ];

    protected $casts = [
        'type' => 'string',
    ];

    public function company(): BelongsTo
    {
        return $this->belongsTo(Company::class);
    }

    public function participants(): BelongsToMany
    {
        return $this->belongsToMany(User::class, 'chat_user');
    }

    public function messages(): HasMany
    {
        return $this->hasMany(Message::class);
    }

    public function lastMessage(): HasOne
    {
        return $this->hasOne(Message::class)->latest('sent_at');
    }
}