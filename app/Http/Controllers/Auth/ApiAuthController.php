<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Http\Requests\Auth\LoginRequest;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class ApiAuthController extends Controller
{
    /**
     * Аутентификация пользователя и создание токена
     */
    public function login(LoginRequest $request)
    {
        $request->authenticate();

        $user = $request->user();
        // Удаляем старые токены пользователя для безопасности
        $user->tokens()->delete();
        
        // Создаем новый токен с полными правами
        $token = $user->createToken('API Token', ['*'])->plainTextToken;

        return response()->json([
            'token' => $token,
            'user' => $user,
            'message' => 'Authenticated successfully'
        ]);
    }

    /**
     * Выход пользователя (удаление текущего токена)
     */
    public function logout(Request $request)
    {
        // Удаляем текущий токен
        $request->user()->currentAccessToken()->delete();

        return response()->json([
            'message' => 'Logged out successfully'
        ]);
    }

    /**
     * Получение информации о текущем пользователе
     */
    public function me(Request $request)
    {
        return response()->json([
            'user' => $request->user()
        ]);
    }
}