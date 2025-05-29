<?php

namespace App\Policies;

use App\Models\Task;
use App\Models\User;
use Illuminate\Auth\Access\HandlesAuthorization;

class TaskPolicy
{
    use HandlesAuthorization;

    /**
     * Определяет, может ли пользователь просматривать задание.
     */
    public function view(User $user, Task $task): bool
    {
        // Получаем компанию задания
        $company = $task->company;

        // Проверяем, является ли пользователь членом компании
        if (!$company->users()->where('user_id', $user->id)->exists()) {
            return false;
        }

        // Администратор или владелец компании может просматривать все задания компании
        if ($user->canManageCompany($company)) {
            return true;
        }

        // Пользователь может просматривать задания, назначенные ему
        return $task->assignments()->where('user_id', $user->id)->exists();
    }

    /**
     * Определяет, может ли пользователь создавать задания.
     */
    public function create(User $user): bool
    {
        // Пользователь может создавать задания, если он является администратором 
        // или владельцем хотя бы одной компании
        $companies = $user->companies;
        
        foreach ($companies as $company) {
            if ($user->canManageCompany($company)) {
                return true;
            }
        }

        return false;
    }

    /**
     * Определяет, может ли пользователь обновлять задание.
     */
    public function update(User $user, Task $task): bool
    {
        // Получаем компанию задания
        $company = $task->company;

        // Только администратор или владелец компании может обновлять задания
        return $user->canManageCompany($company);
    }

    /**
     * Определяет, может ли пользователь удалять задание.
     */
    public function delete(User $user, Task $task): bool
    {
        // Получаем компанию задания
        $company = $task->company;

        // Только администратор или владелец компании может удалять задания
        return $user->canManageCompany($company);
    }
}