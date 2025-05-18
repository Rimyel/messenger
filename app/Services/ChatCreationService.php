<?php

namespace App\Services;

use App\Models\Chat;
use App\Models\User;

class ChatCreationService
{
    public function createPrivateChat($user, $otherUserId)
    {
        $otherUser = User::findOrFail($otherUserId);

        if ($user->id === $otherUser->id) {
            throw new \Exception('Cannot create chat with yourself');
        }

        // Получаем текущую компанию пользователя
        $company = $user->companies()->first();
        if (!$company) {
            throw new \Exception('User does not belong to any company');
        }

        // Проверяем, что другой пользователь принадлежит к той же компании
        if (!$otherUser->belongsToCompany($company)) {
            throw new \Exception('Cannot create chat with user from different company');
        }

        // Проверяем существующий чат
        $existingChat = Chat::whereHas('participants', function ($query) use ($user) {
            $query->where('user_id', $user->id);
        })->whereHas('participants', function ($query) use ($otherUser) {
            $query->where('user_id', $otherUser->id);
        })->where('type', 'private')
            ->with(['lastMessage', 'participants'])
            ->first();

        if ($existingChat) {
            $existingChat->name = $otherUser->name;
            return $existingChat;
        }

        // Создаем новый чат
        $chat = Chat::create([
            'company_id' => $company->id,
            'type' => 'private',
        ]);

        // Добавляем участников с ролями (для приватного чата оба участника - members)
        $chat->participants()->attach([
            $user->id => ['role' => 'member'],
            $otherUser->id => ['role' => 'member']
        ]);
        
        $chat->load(['lastMessage', 'participants']);
        $chat->name = $otherUser->name;
        
        return $chat;
    }

    public function createGroupChat($user, string $name, array $participantIds)
    {
        // Убираем дубликаты ID участников
        $participantIds = array_unique($participantIds);

        // Получаем текущую компанию пользователя
        $company = $user->companies()->first();
        if (!$company) {
            throw new \Exception('User does not belong to any company');
        }

        // Проверяем принадлежность всех участников к той же компании
        $participants = User::whereIn('id', $participantIds)->get();
        foreach ($participants as $participant) {
            if (!$participant->belongsToCompany($company)) {
                throw new \Exception("User {$participant->name} is from a different company");
            }
        }

        // Создаем групповой чат
        $chat = Chat::create([
            'company_id' => $company->id,
            'type' => 'group',
            'name' => $name,
        ]);

        // Добавляем создателя как владельца
        $chat->participants()->attach($user->id, ['role' => 'owner']);

        // Добавляем остальных участников как обычных членов
        $participantAttachments = [];
        foreach ($participantIds as $participantId) {
            if ($participantId != $user->id) {
                $participantAttachments[$participantId] = ['role' => 'member'];
            }
        }
        if (!empty($participantAttachments)) {
            $chat->participants()->attach($participantAttachments);
        }

        $chat->load(['lastMessage', 'participants']);

        return $chat;
    }
}