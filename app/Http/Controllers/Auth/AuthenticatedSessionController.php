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
                return back()->withErrors([
                    'email' => trans('auth.failed'),
                ])->onlyInput('email');
            }

            // Отзываем старые токены (если есть)
            $request->user()->tokens()->delete();

            // Создаем новый токен
            $tokenResult = $request->user()->createToken('API Token');
            $token = $tokenResult->plainTextToken;

            // Проверяем, что токен создан
            if (!$token) {
                Log::error('Не удалось создать токен для пользователя ' . $request->user()->id);
                return response()->json(['message' => 'Ошибка создания токена'], 500);
            }

            // Регенерируем сессию для веб-аутентификации
            $request->session()->regenerate();
            $request->session()->put('api_token', $token);

            Log::info('Токен успешно создан для пользователя ID: ' . $request->user()->id);
            return redirect()->route('dashboard');
        } catch (\Illuminate\Validation\ValidationException $e) {
            return back()->withErrors([
                'email' => $e->getMessage(),
            ])->onlyInput('email');
        } catch (\Exception $e) {
            return back()->withErrors([
                'email' => trans('auth.failed'),
            ])->onlyInput('email');
        }
    }

    /**
     * Destroy an authenticated session.
     */
    public function destroy(Request $request): RedirectResponse
    {
        
        try {
            // Sanctum: отзыв токена только если пользователь существует и имеет активный токен
            if ($request->user() && $request->user()->currentAccessToken()) {
                try {
                    $request->user()->currentAccessToken()->delete();
                    Log::info('Токен успешно отозван для пользователя ID: ' . $request->user()->id);
                } catch (\Exception $e) {
                    Log::info('Не удалось отозвать токен: ' . $e->getMessage());
                    // Продолжаем процесс выхода даже если не удалось удалить токен
                }
            }

            // Выход из web-сессии
            Auth::guard('web')->logout();
            
            // Инвалидация и регенерация сессии
            $request->session()->invalidate();
            $request->session()->regenerateToken();
            
            Log::info('Пользователь успешно вышел из системы');
            return redirect('/');
            
        } catch (\Exception $e) {
            Log::error('Критическая ошибка при выходе: ' . $e->getMessage());
            throw $e; // Пробрасываем критические ошибки для обработки глобальным обработчиком
        }
    }
}