<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log; 
class AuthenticateByToken
{
    public function handle(Request $request, Closure $next): Response
    {
        $token = $request->bearerToken();
        Log::debug('Bearer token from request:', ['token' => $token]);

        if ($token) {
            $accessToken = \Laravel\Sanctum\PersonalAccessToken::findToken($token);
            Log::debug('Found access token:', ['token' => $accessToken]);

            if ($accessToken) {
                $user = $accessToken->tokenable;
                Log::debug('Found user:', ['user' => $user]);

                if ($user) {
                    // Set the user in the Auth facade
                    Auth::setUser($user);
                    return $next($request);
                }
                Log::warning('User not found for token');
                return response()->json(['message' => 'Пользователь не найден для данного токена'], 401);
            }
            Log::warning('Invalid token provided');
            return response()->json(['message' => 'Недействительный токен'], 401);
        }
        Log::warning('No bearer token provided');
        return response()->json(['message' => 'Не предоставлен токен авторизации'], 401);
    }
}
