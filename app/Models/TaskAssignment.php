<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasOne;

class TaskAssignment extends Model
{
    

    protected $fillable = [
        'task_id',
        'user_id',
        'status',
    ];

    protected $hidden = ['updated_at', 'created_at'];

    protected $with = ['user'];

    /**
     * Доступные статусы для назначения.
     */
    public const STATUSES = [
        'not_started',
        'in_progress',
        'submitted',
        'revision',
        'completed',
    ];

    public function task(): BelongsTo
    {
        return $this->belongsTo(Task::class);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function response(): HasOne
    {
        return $this->hasOne(TaskResponse::class, 'assignment_id');
    }

    /**
     * Проверяет, завершено ли назначение.
     */
    public function isCompleted(): bool
    {
        return $this->status === 'completed';
    }

    /**
     * Проверяет, находится ли назначение на доработке.
     */
    public function needsRevision(): bool
    {
        return $this->status === 'revision';
    }

    /**
     * Проверяет, отправлен ли ответ на проверку.
     */
    public function isSubmitted(): bool
    {
        return $this->status === 'submitted';
    }
}