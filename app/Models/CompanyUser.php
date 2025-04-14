<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Relations\Pivot;

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
     * Доступные роли пользователей в компании
     */
    public const ROLES = [
        'owner' => 'Владелец',
        'admin' => 'Администратор',
        'member' => 'Участник'
    ];
}