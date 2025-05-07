<?php

namespace App\Services;

use App\Models\Chat;
use App\Models\User;

class ChatCreationService
{
    public function createPrivateChat($user, $otherUserId)
    {
        $otherUser = User::findOrFail($otherUserId);

        // Prevent creating chat with yourself
        if ($user->id === $otherUser->id) {
            throw new \Exception('Cannot create chat with yourself');
        }

        // Validate users are from the same company
        if ($user->company_id !== $otherUser->company_id) {
            throw new \Exception('Cannot create chat with user from different company');
        }

        // Check if chat already exists
        $existingChat = Chat::whereHas('participants', function ($query) use ($user) {
            $query->where('user_id', $user->id);
        })->whereHas('participants', function ($query) use ($otherUser) {
            $query->where('user_id', $otherUser->id);
        })->where('type', 'private')
            ->with(['lastMessage', 'participants'])
            ->first();

        if ($existingChat) {
            return [
                'id' => $existingChat->id,
                'type' => 'private',
                'name' => $otherUser->name,
                'lastMessage' => $existingChat->lastMessage,
                'participants' => $existingChat->participants,
                'updatedAt' => $existingChat->updated_at
            ];
        }

        // Create new private chat
        $chat = Chat::create([
            'company_id' => $user->company_id,
            'type' => 'private',
        ]);

        $chat->participants()->attach([$user->id, $otherUser->id]);
        $chat->load(['lastMessage', 'participants']);

        return [
            'id' => $chat->id,
            'type' => 'private',
            'name' => $otherUser->name,
            'lastMessage' => null,
            'participants' => $chat->participants,
            'updatedAt' => $chat->updated_at
        ];
    }

    public function createGroupChat($user, string $name, array $participantIds)
    {
        // Remove duplicates and creator from participants list
        $participantIds = array_unique($participantIds);

        // Validate all participants are from the same company
        $participants = User::whereIn('id', $participantIds)->get();
        foreach ($participants as $participant) {
            if ($participant->company_id !== $user->company_id) {
                throw new \Exception("User {$participant->name} is from a different company");
            }
        }

        $chat = Chat::create([
            'company_id' => $user->company_id,
            'type' => 'group',
            'name' => $name,
        ]);

        // Add all participants including creator
        $allParticipants = array_unique(array_merge([$user->id], $participantIds));
        $chat->participants()->attach($allParticipants);

        $chat->load(['lastMessage', 'participants']);

        return [
            'id' => $chat->id,
            'type' => 'group',
            'name' => $chat->name,
            'lastMessage' => null,
            'participants' => $chat->participants,
            'updatedAt' => $chat->updated_at
        ];
    }
}