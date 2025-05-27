<?php

use App\Http\Controllers\CompanyController;
use App\Http\Controllers\Auth\ApiAuthController;
use App\Http\Controllers\ChatController;
use App\Http\Controllers\ChatManagementController;
use App\Http\Controllers\JoinRequestController;
use App\Http\Controllers\CompanyUserController;
use App\Http\Controllers\MediaController;
use App\Http\Controllers\TaskController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use Illuminate\Support\Facades\Broadcast;
use App\Http\Middleware\AuthenticateByToken;

Route::middleware([AuthenticateByToken::class])->group(function () {
    // Тестовый маршрут для проверки аутентификации
    Route::middleware('auth:sanctum')->get('/auth-test', function (Request $request) {
        return response()->json([
            'message' => 'Вы успешно аутентифицированы',
            'user' => $request->user(),
        ]);
    });

    // Pusher Authentication
    Route::post('/broadcasting/auth', function (Request $request) {
        return Broadcast::auth($request);
    })->middleware('auth:sanctum');

    // Маршруты аутентификации API
    Route::post('/auth/login', [ApiAuthController::class, 'login'])->name('api.login');

    // Защищенные маршруты API
    Route::middleware('auth:sanctum')->group(function () {
        // Маршруты аутентификации
        // Route::post('/auth/logout', [ApiAuthController::class, 'logout'])->name('api.logout');
        Route::get('/auth/me', [ApiAuthController::class, 'me'])->name('api.me');

        // Маршруты для работы с заданиями
        Route::get('/tasks/my', [TaskController::class, 'userTasks']); // Мои задания
        Route::get('/tasks', [TaskController::class, 'index']); // Управление заданиями (для админов)
        Route::post('/tasks', [TaskController::class, 'store']);
        Route::get('/tasks/{task}', [TaskController::class, 'show']);
        Route::patch('/tasks/{task}/status', [TaskController::class, 'updateStatus']);
        Route::post('/tasks/assignments/{assignment}/response', [TaskController::class, 'submitResponse']);
        Route::post('/tasks/responses/{response}/update', [TaskController::class, 'updateResponse']);
        Route::patch('/tasks/responses/{response}/review', [TaskController::class, 'reviewResponse']);

        // Маршруты для работы с компаниями
        Route::get('/companies', [CompanyController::class, 'index']);
        Route::post('/companies', [CompanyController::class, 'store']);
        Route::get('/companies/{company}', [CompanyController::class, 'show']);
        Route::put('/companies/{company}', [CompanyController::class, 'update']);
        Route::delete('/companies/{company}', [CompanyController::class, 'destroy']);

        // Маршруты для запросов на вступление
        Route::get('/companies/{company}/join-requests', [JoinRequestController::class, 'index']);Route::post('/companies/{company}/join-requests', [JoinRequestController::class, 'store']);
        Route::patch('/companies/{company}/join-requests/{joinRequest}', [JoinRequestController::class, 'update']);

        // Маршруты для управления участниками компании
        Route::post('/companies/{company}/leave', [CompanyUserController::class, 'leave']);
        Route::patch('/companies/{company}/users/{user}/role', [CompanyUserController::class, 'updateRole']);
        Route::get('/companies/{company}/users', [CompanyController::class, 'users']);

        // Маршруты управления чатами 
        Route::get('/chats/users', [ChatManagementController::class, 'getCompanyUsers']);
        Route::post('/chats/private', [ChatManagementController::class, 'createPrivateChat']);
        Route::post('/chats/group', [ChatManagementController::class, 'createGroupChat']);

        // Маршруты для работы с сообщениями 
        Route::get('/chats', [ChatController::class, 'index']);
        Route::get('/chats/{chatId}/messages', [ChatController::class, 'messages']);
        Route::post('/chats/{chat}/messages', [ChatController::class, 'sendMessage']);
        Route::post('/chats/{chat}/messages/{message}/read', [ChatController::class, 'markMessageRead']);

        // Маршрут для стриминга медиафайлов
        

        // Маршруты для управления участниками группового чата
        Route::post('/chats/{chat}/participants', [ChatManagementController::class, 'addParticipants']);
        Route::delete('/chats/{chat}/participants/{participant}', [ChatManagementController::class, 'removeParticipant']);
        Route::put('/chats/{chat}/participants/{participant}/role', [ChatManagementController::class, 'updateParticipantRole']);
    });
});