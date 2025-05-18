<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Relations\Pivot;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class CompanyUser extends Pivot
{
    protected $table = 'company_users';

    protected $fillable = [
        'company_id',
        'user_id',
        'role'
    ];
    protected $casts = [
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];
    /**
     * Компания
     */
    public function company(): BelongsTo
    {
        return $this->belongsTo(Company::class);
    }

    /**
     * Пользователь
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Проверить, является ли пользователь владельцем
     */
    public function isOwner(): bool
    {
        return $this->role === 'owner';
    }

    /**
     * Проверить, является ли пользователь администратором
     */
    public function isAdmin(): bool
    {
        return $this->role === 'admin';
    }

    /**
     * Проверить, может ли пользователь управлять компанией
     */
    public function canManageCompany(): bool
    {
        return in_array($this->role, ['owner', 'admin']);
    }
}