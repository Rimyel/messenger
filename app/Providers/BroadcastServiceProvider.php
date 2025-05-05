<?php

namespace App\Providers;

use Illuminate\Support\Facades\Broadcast;
use Illuminate\Support\ServiceProvider;

class BroadcastServiceProvider extends ServiceProvider
{
    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        Broadcast::routes(['middleware' => ['web', 'auth:sanctum']]);

        Broadcast::channel('chat.{chatId}', function ($user, $chatId) {
            $chat = \App\Models\Chat::find($chatId);
            
            if (!$chat) {
                \Illuminate\Support\Facades\Log::error("Chat not found", ['chat_id' => $chatId]);
                return false;
            }

            $authorized = $chat->participants()->where('user_id', $user->id)->exists();
            \Illuminate\Support\Facades\Log::info("Channel authorization", [
                'user_id' => $user->id,
                'chat_id' => $chatId,
                'authorized' => $authorized
            ]);
            
            return $authorized;
        });
    }
}