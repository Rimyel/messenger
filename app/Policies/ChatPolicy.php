<?php

namespace App\Policies;

use App\Models\Chat;
use App\Models\User;
use Illuminate\Auth\Access\HandlesAuthorization;

class ChatPolicy
{
    use HandlesAuthorization;

    /**
     * Определяет, может ли пользователь просматривать чат.
     */
    public function view(User $user, Chat $chat): bool
    {
        // Для личных чатов проверяем только участие в чате
        if ($chat->type === 'private') {
            return $chat->hasUser($user);
        }

        // Для групповых чатов проверяем членство в компании
        if (!$chat->company->users()->where('user_id', $user->id)->exists()) {
            return false;
        }

        return $chat->hasUser($user);
    }

    /**
     * Определяет, может ли пользователь создавать чаты.
     */
    public function create(User $user): bool
    {
        // Пользователь может создавать чаты, если он состоит хотя бы в одной компании
        return $user->companies()->exists();
    }

    /**
     * Определяет, может ли пользователь обновлять чат.
     */
    public function update(User $user, Chat $chat): bool
    {
        return $chat->canBeManageBy($user);
    }

    /**
     * Определяет, может ли пользователь удалять чат.
     */
    public function delete(User $user, Chat $chat): bool
    {
        // Только владелец чата или администратор/владелец компании может удалить чат
        if ($user->canManageCompany($chat->company)) {
            return true;
        }

        return $chat->getUserRole($user) === 'owner';
    }

    /**
     * Определяет, может ли пользователь добавлять участников в чат.
     */
    public function addParticipants(User $user, Chat $chat): bool
    {
        return $chat->canBeManageBy($user);
    }

    /**
     * Определяет, может ли пользователь удалять участников из чата.
     */
    public function removeParticipants(User $user, Chat $chat): bool
    {
        return $chat->canBeManageBy($user);
    }

    /**
     * Определяет, может ли пользователь управлять ролями участников в чате.
     */
    public function manageRoles(User $user, Chat $chat): bool
    {
        // Только владелец чата или администратор/владелец компании может управлять ролями
        if ($user->canManageCompany($chat->company)) {
            return true;
        }

        return $chat->getUserRole($user) === 'owner';
    }

    /**
     * Определяет, может ли пользователь покинуть чат.
     */
    public function leave(User $user, Chat $chat): bool
    {
        // Пользователь не может покинуть чат, если он его владелец и единственный администратор
        if ($chat->getUserRole($user) === 'owner') {
            $hasOtherAdmins = $chat->participants()
                ->wherePivot('role', 'admin')
                ->where('users.id', '!=', $user->id)
                ->exists();

            return $hasOtherAdmins;
        }

        return true;
    }

    /**
     * Определяет, может ли пользователь отправлять сообщения в чат.
     */
    public function sendMessage(User $user, Chat $chat): bool
    {
        // Для личных чатов проверяем только участие в чате
        if ($chat->type === 'private') {
            return $chat->hasUser($user);
        }

        // Для групповых чатов проверяем членство в компании
        if (!$chat->company->users()->where('user_id', $user->id)->exists()) {
            return false;
        }

        return $chat->hasUser($user);
    }
}