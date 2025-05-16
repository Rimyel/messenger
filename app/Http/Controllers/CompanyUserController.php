<?php

namespace App\Http\Controllers;

use App\Models\Company;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Gate;

class CompanyUserController extends Controller
{
    /**
     * Выход пользователя из компании
     */
    public function leave(Company $company)
    {
        $user = Auth::user();

        // Проверяем, является ли пользователь владельцем компании
        $isOwner = $company->users()
            ->wherePivot('user_id', $user->id)
            ->wherePivot('role', 'owner')
            ->exists();

        if ($isOwner) {
            return response()->json([
                'message' => 'Владелец компании не может покинуть её'
            ], 422);
        }

        // Удаляем пользователя из компании
        $company->users()->detach($user->id);

        return response()->json([
            'message' => 'Вы успешно покинули компанию'
        ]);
    }

    /**
     * Обновление роли пользователя в компании
     */
    public function updateRole(Request $request, Company $company, User $user)
    {
        if (!Gate::allows('manage-company', $company)) {
            abort(403);
        }

        $request->validate([
            'role' => 'required|in:admin,member'
        ]);

        // Проверяем, не пытаемся ли мы изменить роль владельца
        $isOwner = $company->users()
            ->wherePivot('user_id', $user->id)
            ->wherePivot('role', 'owner')
            ->exists();

        if ($isOwner) {
            return response()->json([
                'message' => 'Нельзя изменить роль владельца компании'
            ], 422);
        }

        $company->users()->updateExistingPivot($user->id, [
            'role' => $request->role
        ]);

        return response()->json([
            'message' => 'Роль пользователя успешно обновлена'
        ]);
    }
}