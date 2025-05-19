<?php

namespace App\Services;

use App\Models\Chat;
use App\Models\User;
use Illuminate\Support\Collection;

class ChatListService
{
    public function getCompanyUsers($user): Collection
    {
        $company = $user->companies()->first();
        if (!$company) {
            return collect();
        }

        return $company->users()
            ->where('users.id', '!=', $user->id)
            ->select('users.id', 'users.name', 'users.avatar')
            ->get();
    }

    public function getUserChats($user): Collection
    {
        return $user->chats()
            ->with(['lastMessage', 'participants'])
            ->get()
            ->map(function ($chat) use ($user) {
                $baseData = [
                    'id' => $chat->id,
                    'type' => $chat->type,
                    'lastMessage' => $chat->lastMessage,
                    'participants' => $chat->participants->map(function ($participant) use ($chat) {
                        return [
                            'id' => $participant->id,
                            'name' => $participant->name,
                            'avatar' => $participant->avatar,
                            'role' => $chat->getUserRole($participant)
                        ];
                    }),
                    'updatedAt' => $chat->updated_at,
                    'userRole' => $chat->getUserRole($user)
                ];

                if ($chat->type === 'private') {
                    $otherParticipant = $chat->participants->where('id', '!=', $user->id)->first();
                    return array_merge($baseData, [
                        'name' => $otherParticipant->name,
                        'participantAvatar' => $otherParticipant->avatar
                    ]);
                } else {
                    return array_merge($baseData, [
                        'name' => $chat->name
                    ]);
                }
            });
    }

    public function getChatMessages($chatId, $user, $limit = 20, $cursor = null, $search = null)
    {
        $chat = Chat::findOrFail($chatId);

        if (!$chat->hasUser($user)) {
            throw new \Exception('Unauthorized');
        }

        $query = $chat->messages()
            ->with(['sender:id,name,avatar', 'files']);

        if ($search) {
            $searchTerm = "%{$search}%";

            // Сначала подсчитаем общее количество сообщений для поиска
            $totalCount = $query->where('content', 'like', $searchTerm)->count();

            // Создаем основной запрос с сортировкой по релевантности и дате
            $query->where('content', 'like', $searchTerm)
                ->orderByRaw('
                    CASE
                        WHEN content LIKE ? THEN 1
                        WHEN content LIKE ? THEN 2
                        ELSE 3
                    END,
                    sent_at DESC
                ', [
                    $search, // Точное совпадение
                    $searchTerm // Частичное совпадение
                ]);
        } else {
            $query->orderBy('id', 'desc');
        }

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
            $sent_at = $msg->sent_at instanceof \Carbon\Carbon
                ? $msg->sent_at->timezone('UTC')
                : \Carbon\Carbon::parse($msg->sent_at)->timezone('UTC');

            return [
                'id' => $msg->id,
                'content' => $msg->content,
                'sender' => [
                    'id' => $msg->sender->id,
                    'name' => $msg->sender->name,
                    'avatar' => $msg->sender->avatar,
                ],
                'sent_at' => $sent_at,
                'status' => $msg->status,
                'delivered_at' => $msg->delivered_at,
                'read_at' => $msg->read_at,
                'media' => $msg->files->map(function ($file) {
                    return [
                        'id' => $file->id,
                        'type' => $file->type,
                        'link' => asset('storage/' . $file->path),
                        'name_file' => $file->name,
                        'mime_type' => $file->mime_type,
                        'size' => $file->size
                    ];
                })->all()
            ];
        })->all();

        $nextCursor = $hasMore && !empty($messages) ? 'id:' . $messages->last()->id : null;

        $result = [
            'messages' => $mappedMessages,
            'hasMore' => $hasMore,
            'nextCursor' => $nextCursor
        ];

        if ($search) {
            $result['totalCount'] = $totalCount;
        }

        return $result;
    }
}
