<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

class Company extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'description',
        'logo_url',
    ];

    protected $casts = [
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    /**
     * Пользователи компании
     */
    public function users(): BelongsToMany
    {
        return $this->belongsToMany(User::class, 'company_users')
            ->withPivot('role')
            ->withTimestamps()
            ->using(CompanyUser::class);
    }

    /**
     * Запросы на вступление в компанию
     */
    public function joinRequests(): HasMany
    {
        return $this->hasMany(JoinRequest::class);
    }

    /**
     * Получить владельца компании
     */
    public function getOwner(): ?User
    {
        return $this->users()
            ->wherePivot('role', 'owner')
            ->first();
    }

    /**
     * Получить администраторов компании
     */
    public function getAdmins()
    {
        return $this->users()
            ->wherePivot('role', 'admin')
            ->get();
    }

    /**
     * Добавить пользователя в компанию
     */
    public function addUser(User $user, string $role = 'member'): void
    {
        if (!$this->hasUser($user)) {
            $this->users()->attach($user->id, ['role' => $role]);
        }
    }

    /**
     * Проверить, есть ли пользователь в компании
     */
    public function hasUser(User $user): bool
    {
        return $this->users()->where('users.id', $user->id)->exists();
    }

    /**
     * Получить роль пользователя в компании
     */
    public function getUserRole(User $user): ?string
    {
        if (!$this->hasUser($user)) {
            return null;
        }

        return $this->users()
            ->where('users.id', $user->id)
            ->first()
            ->pivot
            ->role;
    }

    /**
     * Изменить роль пользователя в компании
     */
    public function changeUserRole(User $user, string $role): bool
    {
        if (!$this->hasUser($user)) {
            return false;
        }

        $this->users()->updateExistingPivot($user->id, ['role' => $role]);
        return true;
    }

    /**
     * Удалить пользователя из компании
     */
    public function removeUser(User $user): bool
    {
        if (!$this->hasUser($user)) {
            return false;
        }

        $this->users()->detach($user->id);
        return true;
    }
}