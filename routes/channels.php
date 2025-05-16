<?php

use Illuminate\Support\Facades\Broadcast;
use App\Models\Chat;
use Illuminate\Support\Facades\Log;

/*
|--------------------------------------------------------------------------
| Broadcast Channels
|--------------------------------------------------------------------------
|
| Here you may register all of the event broadcasting channels that your
| application supports. The given channel authorization callbacks are
| used to check if an authenticated user can listen to the channel.
|
*/

Broadcast::channel('chat.{chatId}', function ($user, $chatId) {
    $chat = Chat::find($chatId);
    
    if (!$chat) {
        return false;
    }
    Log::info("Проверка доступа к чату", ['user_id' => $user->id, 'chat_id' => $chatId]);
    // Check if the authenticated user is a participant in the chat
    return $chat->participants()->where('user_id', $user->id)->exists();
});

Broadcast::channel('company.{companyId}', function ($user, $companyId) {
    return $user->companies()
        ->where('companies.id', $companyId)
        ->where('company_user.role', 'admin')
        ->exists();
});

Broadcast::channel('user.{userId}', function ($user, $userId) {
    return $user->id === (int) $userId;
});
