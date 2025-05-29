<?php

namespace App\Http\Controllers;

use App\Models\Company;
use App\Models\CompanyUser;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class CompanyUserController extends Controller
{
    /**
     * Выход текущего пользователя из компании
     */
    public function leave(Company $company)
    {
        $user = Auth::user();

        if (!$company->users()->where('user_id', $user->id)->exists()) {
            return response()->json(['message' => 'Вы не являетесь участником этой компании'], 403);
        }

        $company->users()->detach($user->id);
        return response()->json(['message' => 'Вы успешно покинули компанию']);
    }

    /**
     * Обновление роли пользователя в компании
     */
    public function updateRole(Request $request, Company $company, User $user)
    {
        $validated = $request->validate([
            'role' => 'required|in:admin,member'
        ]);

        $currentUser = Auth::user();

        // Проверяем права на изменение роли
        $currentUserRole = $company->users()->where('user_id', $currentUser->id)->value('role');
        if ($currentUserRole !== 'owner') {
            return response()->json(['message' => 'Недостаточно прав для изменения роли'], 403);
        }

        // Обновляем роль
        $company->users()->updateExistingPivot($user->id, [
            'role' => $validated['role']
        ]);

        return response()->json(['message' => 'Роль пользователя обновлена']);
    }

    /**
     * Исключение пользователя из компании
     */
    public function remove(Company $company, User $user)
    {
        $currentUser = Auth::user();

        // Проверяем права на исключение пользователя
        $currentUserRole = $company->users()->where('user_id', $currentUser->id)->value('role');
        if (!in_array($currentUserRole, ['owner', 'admin'])) {
            return response()->json(['message' => 'Недостаточно прав для исключения пользователя'], 403);
        }

        // Проверяем, не пытается ли админ исключить владельца
        $targetUserRole = $company->users()->where('user_id', $user->id)->value('role');
        if ($targetUserRole === 'owner') {
            return response()->json(['message' => 'Нельзя исключить владельца компании'], 422);
        }

        // Если админ пытается исключить другого админа
        if ($currentUserRole === 'admin' && $targetUserRole === 'admin') {
            return response()->json(['message' => 'Администратор не может исключить другого администратора'], 422);
        }

        // Удаляем пользователя только из групповых чатов компании, оставляя личные чаты
        $company->chats()
            ->where('type', 'group')
            ->get()
            ->each(function ($chat) use ($user) {
                $chat->participants()->detach($user->id);
            });

        // Переводим все созданные пользователем задачи в статус completed
        $company->tasks()
            ->where('created_by', $user->id)
            ->update(['status' => 'completed']);

        // Удаляем непроверенные ответы пользователя
        $company->tasks()
            ->whereHas('assignments', function ($query) use ($user) {
                $query->where('user_id', $user->id)
                    ->whereIn('status', ['not_started', 'in_progress']);
            })
            ->get()
            ->each(function ($task) use ($user) {
                $task->assignments()
                    ->where('user_id', $user->id)
                    ->delete();
            });

        // Удаляем запросы на вступление
        JoinRequest::where('user_id', $user->id)
            ->where('company_id', $company->id)
            ->where('status', 'pending')
            ->delete();

        // Удаляем пользователя из компании
        $company->users()->detach($user->id);

        return response()->json(['message' => 'Пользователь успешно исключен из компании']);
    }

    /**
     * Передача прав владельца другому пользователю
     */
    public function transferOwnership(Request $request, Company $company, User $user)
    {
        $validated = $request->validate([
            'password' => 'required|string'
        ]);

        $currentUser = Auth::user();

        // Проверяем, является ли текущий пользователь владельцем
        $currentUserRole = $company->users()->where('user_id', $currentUser->id)->value('role');
        if ($currentUserRole !== 'owner') {
            return response()->json(['message' => 'Только владелец может передать права'], 403);
        }

        // Проверяем пароль текущего пользователя
        if (!Auth::guard('web')->attempt(['email' => $currentUser->email, 'password' => $validated['password']])) {
            return response()->json(['message' => 'Неверный пароль'], 422);
        }

        // Обновляем роли
        $company->users()->updateExistingPivot($currentUser->id, ['role' => 'admin']);
        $company->users()->updateExistingPivot($user->id, ['role' => 'owner']);

        return response()->json(['message' => 'Права владельца успешно переданы']);
    }
}