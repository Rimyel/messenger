<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Chat extends Model
{
    use HasFactory;

    protected $fillable = [
        'company_id',
        'type',
        'name',
    ];

    /**
     * Scope для фильтрации чатов по текущей компании пользователя
     */
    public function scopeForUser($query, User $user)
    {
        $userCompanyIds = $user->companies()->pluck('companies.id');
        return $query->where(function ($query) use ($userCompanyIds) {
            $query->where('type', 'private')
                ->orWhere(function ($q) use ($userCompanyIds) {
                    $q->where('type', 'group')
                        ->whereIn('chats.company_id', $userCompanyIds);
                });
        });
    }

    /**
     * Компания, которой принадлежит чат.
     */
    public function company(): BelongsTo
    {
        return $this->belongsTo(Company::class);
    }

    /**
     * Пользователи в чате.
     */
    public function participants(): BelongsToMany
    {
        return $this->belongsToMany(User::class, 'chat_user')
            ->withPivot('role')
            ->withTimestamps();
    }
    /**
     * Сообщения в чате.
     */
    public function messages(): HasMany
    {
        return $this->hasMany(Message::class)->orderBy('sent_at', 'desc');
    }

    /**
     * Последнее сообщение в чате
     */
    public function lastMessage()
    {
        return $this->hasOne(Message::class)->latest('sent_at');
    }

    /**
     * Добавить пользователя в чат с указанной ролью.
     */
    public function addUser(User $user, string $role = 'member'): bool
    {
        // Проверяем, принадлежит ли пользователь к компании
        if (!$user->belongsToCompany($this->company)) {
            return false;
        }

        if (!$this->hasUser($user)) {
            $this->participants()->attach($user->id, ['role' => $role]);
        }
        return true;
    }

    /**
     * Проверить, есть ли пользователь в чате.
     */
    public function hasUser(User $user): bool
    {
        // Для личных чатов проверяем только участие в чате
        if ($this->type === 'private') {
            return $this->participants()->where('users.id', $user->id)->exists();
        }

        // Для групповых чатов проверяем членство в компании и участие в чате
        if (!$this->company->users()->where('user_id', $user->id)->exists()) {
            return false;
        }

        return $this->participants()->where('users.id', $user->id)->exists();
    }

    /**
     * Получить роль пользователя в чате.
     */
    public function getUserRole(User $user): ?string
    {
        if (!$this->hasUser($user)) {
            return null;
        }

        return $this->participants()
            ->where('users.id', $user->id)
            ->first()
            ->pivot
            ->role;
    }

    /**
     * Изменить роль пользователя в чате.
     */
    public function changeUserRole(User $user, string $role): bool
    {
        if (!$this->hasUser($user)) {
            return false;
        }

        $this->participants()->updateExistingPivot($user->id, ['role' => $role]);
        return true;
    }

    /**
     * Удалить пользователя из чата.
     */
    public function removeUser(User $user): bool
    {
        if (!$this->hasUser($user)) {
            return false;
        }

        $this->participants()->detach($user->id);
        return true;
    }

    /**
     * Получить владельца чата.
     */
    public function getOwner(): ?User
    {
        return $this->participants()
            ->wherePivot('role', 'owner')
            ->first();
    }

    /**
     * Получить администраторов чата.
     */
    public function getAdmins()
    {
        return $this->participants()
            ->wherePivot('role', 'admin')
            ->get();
    }

    /**
     * Может ли пользователь управлять чатом.
     */
    public function canBeManageBy(User $user): bool
    {
        // Владелец или администратор компании может управлять любым чатом
        if ($user->canManageCompany($this->company)) {
            return true;
        }

        // Проверяем роль пользователя в чате
        $role = $this->getUserRole($user);
        return in_array($role, ['owner', 'admin']);
    }
}