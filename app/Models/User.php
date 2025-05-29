<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Laravel\Sanctum\HasApiTokens;

class User extends Authenticatable
{
    use HasApiTokens, HasFactory;

    protected $fillable = [
        'name',
        'email',
        'password',
        'avatar',
    ];

    protected $hidden = [
        'password',
        'remember_token',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'password' => 'hashed',
        ];
    }

    /**
     * Компании пользователя
     */
    public function companies(): BelongsToMany
    {
        return $this->belongsToMany(Company::class, 'company_users')
            ->withPivot('role')
            ->withTimestamps()
            ->using(CompanyUser::class);
    }

    /**
     * Чаты пользователя
     */
    public function chats(): BelongsToMany
    {
        return $this->belongsToMany(Chat::class, 'chat_user')
            ->withPivot('role')
            ->withTimestamps();
    }

    /**
     * Проверить, состоит ли пользователь в компании
     */
    public function belongsToCompany(Company $company): bool
    {
        return $this->companies()
            ->where('companies.id', $company->id)
            ->exists();
    }

    /**
     * Получить роль пользователя в компании
     */
    public function getRoleInCompany(Company $company): ?string
    {
        if (!$this->belongsToCompany($company)) {
            return null;
        }

        return $this->companies()
            ->where('companies.id', $company->id)
            ->first()
            ->pivot
            ->role;
    }

    /**
     * Является ли пользователь владельцем компании
     */
    public function isOwnerOfCompany(Company $company): bool
    {
        return $this->getRoleInCompany($company) === 'owner';
    }

    /**
     * Является ли пользователь администратором компании
     */
    public function isAdminOfCompany(Company $company): bool
    {
        return $this->getRoleInCompany($company) === 'admin';
    }

    /**
     * Может ли пользователь управлять компанией
     */
    public function canManageCompany(Company $company): bool
    {
        $role = $this->getRoleInCompany($company);
        return in_array($role, ['owner', 'admin']);
    }

    /**
     * Является ли пользователь владельцем чата
     */
    public function isOwnerOfChat(Chat $chat): bool
    {
        return $this->chats()
            ->wherePivot('chat_id', $chat->id)
            ->wherePivot('role', 'owner')
            ->exists();
    }

    /**
     * Является ли пользователь администратором чата
     */
    public function isAdminOfChat(Chat $chat): bool
    {
        return $this->chats()
            ->wherePivot('chat_id', $chat->id)
            ->wherePivot('role', 'admin')
            ->exists();
    }

    /**
     * Может ли пользователь управлять чатом
     */
    public function canManageChat(Chat $chat): bool
    {
        // Если пользователь может управлять компанией, он может управлять любым чатом
        if ($this->canManageCompany($chat->company)) {
            return true;
        }

        // Владелец или администратор чата может управлять им
        return $this->isOwnerOfChat($chat) || $this->isAdminOfChat($chat);
    }
}
