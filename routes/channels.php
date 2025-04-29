<?php

use Illuminate\Support\Facades\Broadcast;
use App\Models\Chat;

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

    // Check if the authenticated user is a participant in the chat
    return $chat->participants()->where('user_id', $user->id)->exists();
});
