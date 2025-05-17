<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Http\Requests\Auth\LoginRequest;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;
use Inertia\Response;
use Illuminate\Support\Facades\Log;

class AuthenticatedSessionController extends Controller
{
    /**
     * Display the login view.
     */
    public function create(): Response
    {
        return Inertia::render('Auth/Login', [
            'canResetPassword' => Route::has('password.request'),
            'status' => session('status'),
        ]);
    }

    /**
     * Handle an incoming authentication request.
     */
    public function store(LoginRequest $request)
    {
        try {
            // Аутентификация пользователя
            $request->authenticate();

            // Проверяем, что пользователь действительно аутентифицирован
            if (!$request->user()) {
                Log::error('Пользователь не аутентифицирован после authenticate()');
                return response()->json(['message' => 'Ошибка аутентификации'], 401);
            }

            // Удаляем старые токены (опционально)
            // $request->user()->tokens()->delete();

            // Создаем новый токен с отладочной информацией
            $token = $request->user()->createToken('API Token')->plainTextToken;

            // Проверяем, что токен создан
            if (!$token) {
                Log::error('Не удалось создать токен для пользователя ' . $request->user()->id);
                return response()->json(['message' => 'Ошибка создания токена'], 500);
            }

            // Логируем информацию о токене
            Log::info('Создан токен для пользователя ' . $request->user()->id . ': ' . $token);

            // Проверяем, что токен сохранен в базе данных
            $tokenParts = explode('|', $token);
            $tokenId = $tokenParts[0] ?? null;

            if ($tokenId) {
                $accessToken = \Laravel\Sanctum\PersonalAccessToken::find($tokenId);
                if (!$accessToken) {
                    Log::error('Токен не найден в базе данных после создания: ' . $tokenId);
                } else {
                    Log::info('Токен успешно сохранен в базе данных: ' . $tokenId);
                }
            }

            if ($request->wantsJson()) {
                return response()->json([
                    'token' => $token,
                    'user' => $request->user(),
                    'debug' => [
                        'token_created' => !empty($token),
                        'token_id' => $tokenId,
                        'token_in_db' => isset($accessToken) && !empty($accessToken),
                    ]
                ]);
            }

            $request->session()->regenerate();
            $request->session()->put('api_token', $token);
            return redirect()->intended(route('dashboard', absolute: false));
        } catch (\Exception $e) {
            Log::error('Ошибка при создании токена: ' . $e->getMessage());
            Log::error($e->getTraceAsString());

            if ($request->wantsJson()) {
                return response()->json([
                    'message' => 'Ошибка при создании токена',
                    'error' => $e->getMessage(),
                ], 500);
            }

            return back()->withErrors(['email' => 'Ошибка при входе в систему']);
        }
    }

    /**
     * Destroy an authenticated session.
     */
    public function destroy(Request $request): RedirectResponse
    {
        Auth::guard('web')->logout();

        $request->session()->invalidate();

        $request->session()->regenerateToken();

        return redirect('/');
    }
}