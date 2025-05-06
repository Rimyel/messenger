<?php

use App\Http\Controllers\{ProfileController, MainController, ChatController};
use App\Http\Controllers\CompanyController;
use Illuminate\Foundation\Application;
use Illuminate\Support\Facades\Route;
use Illuminate\Support\Facades\Broadcast;
use Inertia\Inertia;

/*
|--------------------------------------------------------------------------
| Web Routes
|--------------------------------------------------------------------------
|
| Here is where you can register web routes for your application. These
| routes are loaded by the RouteServiceProvider within a group which
| contains the "web" middleware group. Now create something great!
|
*/

Route::get('/', function () {
    return Inertia::render('Welcome', [
        'canLogin' => Route::has('login'),
        'canRegister' => Route::has('register'),
        'laravelVersion' => Application::VERSION,
        'phpVersion' => PHP_VERSION,
    ]);
});

Route::middleware(['auth', 'verified'])->group(function () {
    Route::get('/dashboard', [MainController::class, 'index'])->name('dashboard');

    // Profile routes
    Route::patch('/profile', [ProfileController::class, 'update'])->name('profile.update');
    Route::delete('/profile', [ProfileController::class, 'destroy'])->name('profile.destroy');
    Route::post('/email/verification-notification', [ProfileController::class, 'sendVerificationNotification'])
        ->name('verification.send');

    // Company routes
    Route::prefix('api')->group(function () {
        Route::get('/companies', [CompanyController::class, 'index']);
        Route::post('/companies', [CompanyController::class, 'store']);
        Route::get('/companies/{company}', [CompanyController::class, 'show']);
        Route::post('/companies/{company}', [CompanyController::class, 'update']);
        Route::delete('/companies/{company}', [CompanyController::class, 'destroy']);
        Route::post('/companies/{company}/join', [CompanyController::class, 'join']);
        Route::post('/companies/{company}/leave', [CompanyController::class, 'leave']);
    });

    // Chat routes
    Route::prefix('api/chats')->group(function () {
        Route::get('/', [ChatController::class, 'index']);
        Route::get('/{chat}/messages', [ChatController::class, 'messages']);
        Route::post('/{chat}/messages', [ChatController::class, 'sendMessage']);
        Route::post('/private', [ChatController::class, 'createPrivateChat']);
        Route::post('/group', [ChatController::class, 'createGroupChat']);
        Route::post('/{chat}/messages/{message}/delivered', [ChatController::class, 'markMessageDelivered']);
        Route::post('/{chat}/messages/{message}/read', [ChatController::class, 'markMessageRead']);
    });
});

Broadcast::routes(['middleware' => ['web', 'auth:sanctum']]);

require __DIR__ . '/auth.php';
