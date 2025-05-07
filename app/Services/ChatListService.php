<?php

namespace App\Services;

use App\Models\Chat;
use App\Models\User;
use Illuminate\Support\Collection;

class ChatListService
{
    public function getCompanyUsers($user): Collection
    {
        return User::where('company_id', $user->company_id)
            ->where('id', '!=', $user->id)
            ->select('id', 'name', 'avatar')
            ->get();
    }

    public function getUserChats($user): Collection
    {
        return $user->chats()
            ->with(['lastMessage', 'participants'])
            ->get()
            ->map(function ($chat) use ($user) {
                if ($chat->type === 'private') {
                    $otherParticipant = $chat->participants->where('id', '!=', $user->id)->first();
                    return [
                        'id' => $chat->id,
                        'type' => 'private',
                        'name' => $otherParticipant->name,
                        'lastMessage' => $chat->lastMessage,
                        'participants' => $chat->participants,
                        'updatedAt' => $chat->updated_at,
                        'participantAvatar' => $otherParticipant->avatar
                    ];
                } else {
                    return [
                        'id' => $chat->id,
                        'type' => 'group',
                        'name' => $chat->name,
                        'lastMessage' => $chat->lastMessage,
                        'participants' => $chat->participants,
                        'updatedAt' => $chat->updated_at
                    ];
                }
            });
    }

    public function getChatMessages($chatId, $user, $limit = 20, $cursor = null)
    {
        $chat = Chat::findOrFail($chatId);

        if (!$chat->participants()->where('user_id', $user->id)->exists()) {
            throw new \Exception('Unauthorized');
        }

        $query = $chat->messages()
            ->with(['sender:id,name,avatar', 'media'])
            ->orderBy('id', 'desc');

        if ($cursor) {
            $messageId = (int) explode(':', $cursor)[1];
            $query->where('id', '<', $messageId);
        }

        $messages = $query->take($limit + 1)->get();
        $hasMore = $messages->count() > $limit;

        if ($hasMore) {
            $messages = $messages->take($limit);
        }

        $mappedMessages = $messages->map(function ($msg) {
            return [
                'id' => $msg->id,
                'content' => $msg->content,
                'sender' => [
                    'id' => $msg->sender->id,
                    'name' => $msg->sender->name,
                    'avatar' => $msg->sender->avatar,
                ],
                'sent_at' => $msg->sent_at->toISOString(),
                'status' => $msg->status,
                'delivered_at' => $msg->delivered_at?->toISOString(),
                'read_at' => $msg->read_at?->toISOString(),
                'media' => $msg->media->map(function ($media) {
                    return [
                        'id' => $media->id,
                        'type' => $media->type,
                        'link' => asset('storage/' . $media->link),
                        'name_file' => $media->name_file,
                        'mime_type' => $media->mime_type,
                        'size' => $media->size
                    ];
                })->all()
            ];
        })->all();

        $nextCursor = $hasMore && !empty($messages) ? 'id:' . $messages->last()->id : null;

        return [
            'messages' => $mappedMessages,
            'hasMore' => $hasMore,
            'nextCursor' => $nextCursor
        ];
    }
}