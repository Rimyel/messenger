<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use InvalidArgumentException;

class TaskResponse extends Model
{
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

    /**
     * Допустимые переходы между статусами.
     */
    private const STATUS_TRANSITIONS = [
        'submitted' => ['revision', 'approved'],
        'revision' => ['submitted'],
        'approved' => []
    ];

    /**
     * Валидирует новый статус и проверяет возможность перехода.
     *
     * @param string $newStatus
     * @throws InvalidArgumentException
     */
    public function validateStatusTransition(string $newStatus): void
    {
        // Проверяем, что новый статус допустим
        if (!in_array($newStatus, self::STATUSES)) {
            throw new InvalidArgumentException("Недопустимый статус: {$newStatus}");
        }

        // Для нового ответа пропускаем проверку перехода
        if (!$this->exists) {
            return;
        }

        // Проверяем возможность перехода
        $allowedTransitions = self::STATUS_TRANSITIONS[$this->status] ?? [];
        if (!in_array($newStatus, $allowedTransitions)) {
            throw new InvalidArgumentException(
                "Недопустимый переход статуса из {$this->status} в {$newStatus}"
            );
        }
    }

    /**
     * Устанавливает статус с валидацией.
     *
     * @param string $status
     * @return $this
     */
    public function setStatus(string $status): self
    {
        $this->validateStatusTransition($status);
        $this->status = $status;
        return $this;
    }

    public function assignment(): BelongsTo
    {
        return $this->belongsTo(TaskAssignment::class);
    }

    public function files(): BelongsToMany
    {
        return $this->belongsToMany(File::class, 'task_response_files', 'response_id', 'file_id')
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