<?php

use App\Http\Controllers\{ProfileController, MainController, ChatController, TaskReportController};
use App\Http\Controllers\CompanyController;
use App\Http\Controllers\MediaController;
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
        'auth' => [
            'user' => auth()->user(),
        ],
    ]);
});
Route::get('/storage/chat-files/{filename}', [MediaController::class, 'serveFile'])->name('file.serve');
Route::get('/storage/company-logos/{filename}', [MediaController::class, 'serveCompanyLogo'])->name('company.logo');
Route::get('/storage/task-file/{file}', [MediaController::class, 'serveTaskFile'])
    ->middleware(['auth'])
    ->name('task.file.download');


Route::get('/video/{filename}', [MediaController::class, 'streamVideo'])->name('video.stream');
Route::middleware(['auth', 'verified'])->group(function () {
    Route::get('/company', [MainController::class, 'index'])->name('company');

    // Tasks report route
  

    // Profile routes
    Route::patch('/profile', [ProfileController::class, 'update'])->name('profile.update');
    Route::delete('/profile', [ProfileController::class, 'destroy'])->name('profile.destroy');
    Route::post('/email/verification-notification', [ProfileController::class, 'sendVerificationNotification'])
        ->name('verification.send');


});

Broadcast::routes(['middleware' => ['web', 'auth:sanctum']]);

require __DIR__ . '/auth.php';
