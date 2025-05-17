<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;
use Illuminate\Support\Facades\Auth;

class AuthenticateByToken
{
    public function handle(Request $request, Closure $next): Response
    {
        $token = $request->bearerToken();

        if ($token) {
            $accessToken = \Laravel\Sanctum\PersonalAccessToken::findToken($token);

            if ($accessToken) {
                $user = $accessToken->tokenable;

                if ($user) {
                    // Set the user in the Auth facade
                    Auth::setUser($user);

                    return $next($request);
                }
            }
        }

        return response()->json(['message' => 'Не авторизован'], 401);
    }
}
