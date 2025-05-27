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

        // Добавляем создателя как creator
        $chat->participants()->attach($user->id, ['role' => 'owner']);

        // Добавляем остальных участников как обычных members
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

    public function addParticipantsToChat($chatId, array $participantIds, $user)
    {
        $chat = Chat::with('participants')->findOrFail($chatId);

        // Проверяем, что это групповой чат
        if ($chat->type !== 'group') {
            throw new \Exception('Can only add participants to group chats');
        }

        // Проверяем права доступа
        $userRole = $chat->participants()->where('user_id', $user->id)->value('role');
        if (!in_array($userRole, ['member', 'admin', 'owner'])) {
            throw new \Exception('Only owner and admins can add participants');
        }

        // Получаем компанию чата
        $company = $chat->company;

        // Проверяем и добавляем новых участников
        $newParticipants = User::whereIn('id', $participantIds)
            ->whereNotIn('id', $chat->participants->pluck('id'))
            ->get();

        foreach ($newParticipants as $participant) {
            if (!$participant->belongsToCompany($company)) {
                throw new \Exception("User {$participant->name} is from a different company");
            }
        }

        // Добавляем новых участников как обычных членов
        $participantAttachments = [];
        foreach ($newParticipants as $participant) {
            $participantAttachments[$participant->id] = ['role' => 'member'];
        }

        if (!empty($participantAttachments)) {
            $chat->participants()->attach($participantAttachments);
        }

        $chat->load(['lastMessage', 'participants']);
        return $chat;
    }

    public function removeParticipantFromChat($chatId, $participantId, $user)
    {
        $chat = Chat::with('participants')->findOrFail($chatId);

        // Проверяем, что это групповой чат
        if ($chat->type !== 'group') {
            throw new \Exception('Can only remove participants from group chats');
        }

        // Проверяем права доступа
        $userRole = $chat->participants()->where('user_id', $user->id)->value('role');
        if (!in_array($userRole, ['member', 'admin', 'owner'])) {
            throw new \Exception('Only owner and admins can remove participants');
        }

        // Нельзя удалить создателя чата
        $participantRole = $chat->participants()->where('user_id', $participantId)->value('role');
        if ($participantRole === 'owner' || $participantRole === 'owner') {
            throw new \Exception('Cannot remove chat owner');
        }

        // Если админ пытается удалить админа
        if ($userRole === 'admin' && $participantRole === 'admin') {
            throw new \Exception('Admins cannot remove other admins');
        }

        $chat->participants()->detach($participantId);
        
        $chat->load(['lastMessage', 'participants']);
        return $chat;
    }

    public function updateParticipantRole($chatId, $participantId, $newRole, $user)
    {
        $chat = Chat::with('participants')->findOrFail($chatId);

        // Проверяем, что это групповой чат
        if ($chat->type !== 'group') {
            throw new \Exception('Can only update roles in group chats');
        }

        // Проверяем права доступа
        $userRole = $chat->participants()->where('user_id', $user->id)->value('role');
        if (!in_array($userRole, ['admin', 'owner'])) {
            throw new \Exception('Only owner can change roles');
        }

        // Нельзя изменить роль создателя
        $participantRole = $chat->participants()->where('user_id', $participantId)->value('role');
        if ($participantRole === 'owner' || $participantRole === 'owner') {
            throw new \Exception('Cannot change creator\'s role');
        }

        // Обновляем роль
        $chat->participants()->updateExistingPivot($participantId, ['role' => $newRole]);
        
        $chat->load(['lastMessage', 'participants']);
        return $chat;
    }
}