<?php

namespace App\Policies;

use App\Models\Company;
use App\Models\User;
use Illuminate\Auth\Access\HandlesAuthorization;

class CompanyPolicy
{
    use HandlesAuthorization;

    /**
     * Определяет, может ли пользователь просматривать компанию.
     */
    public function view(User $user, Company $company): bool
    {
        return $user->belongsToCompany($company);
    }

    /**
     * Определяет, может ли пользователь создавать компании.
     */
    public function create(User $user): bool
    {
        // Любой пользователь может создать компанию
        return true;
    }

    /**
     * Определяет, может ли пользователь обновлять компанию.
     */
    public function update(User $user, Company $company): bool
    {
        return $user->canManageCompany($company);
    }

    /**
     * Определяет, может ли пользователь удалять компанию.
     */
    public function delete(User $user, Company $company): bool
    {
        return $user->isOwnerOfCompany($company);
    }

    /**
     * Определяет, может ли пользователь управлять участниками компании.
     */
    public function manageUsers(User $user, Company $company): bool
    {
        return $user->canManageCompany($company);
    }

    /**
     * Определяет, может ли пользователь управлять ролями участников компании.
     */
    public function manageRoles(User $user, Company $company): bool
    {
        return $user->isOwnerOfCompany($company);
    }

    /**
     * Определяет, может ли пользователь покинуть компанию.
     */
    public function leave(User $user, Company $company): bool
    {
        if (!$user->belongsToCompany($company)) {
            return false;
        }

        // Владелец не может покинуть компанию
        return !$user->isOwnerOfCompany($company);
    }
}