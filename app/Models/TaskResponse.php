<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

class TaskResponse extends Model
{
    use HasUuids;

    protected $fillable = [
        'assignment_id',
        'text',
        'status',
        'revision_comment',
    ];

    /**
     * Доступные статусы для ответа.
     */
    public const STATUSES = [
        'submitted',
        'revision',
        'approved'
    ];

    public function assignment(): BelongsTo
    {
        return $this->belongsTo(TaskAssignment::class);
    }

    public function files(): BelongsToMany
    {
        return $this->belongsToMany(File::class, 'task_response_files')
            ->withTimestamps();
    }

    /**
     * Проверяет, одобрен ли ответ.
     */
    public function isApproved(): bool
    {
        return $this->status === 'approved';
    }

    /**
     * Проверяет, требует ли ответ доработки.
     */
    public function needsRevision(): bool
    {
        return $this->status === 'revision';
    }

    /**
     * Проверяет, находится ли ответ на проверке.
     */
    public function isSubmitted(): bool
    {
        return $this->status === 'submitted';
    }
}