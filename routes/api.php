<?php

use App\Http\Controllers\CompanyController;
use App\Http\Controllers\Auth\ApiAuthController;
use App\Http\Controllers\ChatController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use Illuminate\Support\Facades\Broadcast;

// Pusher Authentication
Route::post('/broadcasting/auth', function (Request $request) {
    return Broadcast::auth($request);
})->middleware('auth:sanctum');

// Маршруты аутентификации API
Route::post('/auth/login', [ApiAuthController::class, 'login'])->name('api.login');

// Защищенные маршруты API
Route::middleware('auth:sanctum')->group(function () {
    // Маршруты аутентификации
    Route::post('/auth/logout', [ApiAuthController::class, 'logout'])->name('api.logout');
    Route::get('/auth/me', [ApiAuthController::class, 'me'])->name('api.me');

    // Маршруты для работы с компаниями
    Route::get('/companies', [CompanyController::class, 'index']);
    Route::post('/companies', [CompanyController::class, 'store']);
    Route::get('/companies/{company}', [CompanyController::class, 'show']);
    Route::put('/companies/{company}', [CompanyController::class, 'update']);
    Route::delete('/companies/{company}', action: [CompanyController::class, 'destroy']);
    Route::post('/companies/{company}/join', [CompanyController::class, 'join']);

    // Маршруты для чата
    Route::get('/conversations', [ChatController::class, 'conversations']);
    Route::get('/conversations/{conversationId}/messages', [ChatController::class, 'messages']);
    Route::post('/messages', [ChatController::class, 'sendMessage']);
});
