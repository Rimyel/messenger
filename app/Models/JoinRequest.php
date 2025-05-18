<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class JoinRequest extends Model
{
    protected $fillable = [
        'user_id',
        'company_id',
        'status',
        'message',
        'rejection_reason',
        'approved_at',
        'rejected_at',
    ];

    protected $casts = [
        'approved_at' => 'datetime',
        'rejected_at' => 'datetime',
    ];

    /**
     * Get the user that made the request
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    /**
     * Get the company that the request is for
     */
    public function company(): BelongsTo
    {
        return $this->belongsTo(Company::class, 'company_id');
    }

    /**
     * Scope a query to only include pending requests
     */
    public function scopePending($query)
    {
        return $query->where('status', 'pending');
    }

    /**
     * Approve the join request
     */
    public function approve()
    {
        // Загружаем отношения, если они еще не загружены
        if (!$this->relationLoaded('user')) {
            $this->load('user');
        }
        if (!$this->relationLoaded('company')) {
            $this->load('company');
        }

        $this->update([
            'status' => 'approved',
            'approved_at' => now(),
        ]);

        
        

        // Создаем запись в company_users с ролью member
        CompanyUser::create([
            'company_id' => $this->company_id,
            'user_id' => $this->user_id,
            'role' => 'member'
        ]);

        // Перезагружаем модель для получения обновленных данных
        $this->refresh();

        // Отправляем событие об обновлении статуса
        event(new \App\Events\JoinRequestStatusUpdated($this));

        return $this;
    }

    /**
     * Reject the join request
     */
    public function reject(?string $reason = null)
    {
        $this->update([
            'status' => 'rejected',
            'rejection_reason' => $reason,
            'rejected_at' => now(),
        ]);

        // Перезагружаем модель для получения обновленных данных
        $this->refresh();

        // Отправляем событие об обновлении статуса
        event(new \App\Events\JoinRequestStatusUpdated($this));

        return $this;
    }
}