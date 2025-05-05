<?php

namespace App\Http\Controllers;

use App\Events\MessageSent;
use App\Models\Chat;
use App\Models\Message;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Log;
class ChatController extends Controller
{
    public function index(): JsonResponse
    {
        $user = Auth::user();
        return response()->json(
            $user->chats()
                ->with(['lastMessage', 'participants'])
                ->get()
                ->map(function ($chat) use ($user) {
                    $data = [
                        'id' => $chat->id,
                        'type' => $chat->type,
                        'name' => $chat->name,
                        'lastMessage' => $chat->lastMessage,
                        'updatedAt' => $chat->updated_at,
                    ];

                    if ($chat->type === 'private') {
                        $otherParticipant = $chat->participants->where('id', '!=', $user->id)->first();
                        $data['name'] = $otherParticipant->name;
                        $data['participantAvatar'] = $otherParticipant->avatar;
                    }

                    return $data;
                })
        );
    }

    public function messages($chatId): JsonResponse
    {
        try {
            $user = Auth::user();
            $chat = Chat::findOrFail($chatId);

            // Verify user is part of the chat
            if (!$chat->participants()->where('user_id', $user->id)->exists()) {
                return response()->json(['error' => 'Unauthorized'], 403);
            }

            return response()->json(
                $chat->messages()
                    ->with('sender:id,name,avatar')
                    ->orderBy('sent_at', 'asc')
                    ->get()
                    ->map(function ($msg) {
                        return [
                            'id' => $msg->id,
                            'content' => $msg->content,
                            'sender' => [
                                'id' => $msg->sender->id,
                                'name' => $msg->sender->name,
                                'avatar' => $msg->sender->avatar,
                            ],
                            'sent_at' => $msg->sent_at->toISOString(),
                        ];
                    })
            );
        } catch (\Exception $e) {
            return response()->json(['error' => 'Failed to fetch messages'], 500);
        }
    }

    public function createPrivateChat(Request $request): JsonResponse
    {
        $request->validate([
            'userId' => 'required|exists:users,id',
        ]);

        $user = Auth::user();
        $otherUser = User::findOrFail($request->userId);

        // Check if chat already exists
        $existingChat = Chat::whereHas('participants', function ($query) use ($user) {
            $query->where('user_id', $user->id);
        })->whereHas('participants', function ($query) use ($otherUser) {
            $query->where('user_id', $otherUser->id);
        })->where('type', 'private')
            ->first();

        if ($existingChat) {
            return response()->json($existingChat);
        }

        // Create new private chat
        $chat = Chat::create([
            'company_id' => $user->company_id,
            'type' => 'private',
        ]);

        $chat->participants()->attach([$user->id, $otherUser->id]);

        return response()->json($chat->load('participants'));
    }

    public function createGroupChat(Request $request): JsonResponse
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'participantIds' => 'required|array|min:2',
            'participantIds.*' => 'exists:users,id',
        ]);

        $user = Auth::user();

        $chat = Chat::create([
            'company_id' => $user->company_id,
            'type' => 'group',
            'name' => $request->name,
        ]);

        // Add all participants including the creator
        $participantIds = array_unique(array_merge([$user->id], $request->participantIds));
        $chat->participants()->attach($participantIds);

        return response()->json($chat->load('participants'));
    }

    public function sendMessage(Chat $chat, Request $request): JsonResponse
    {
        try {
            $request->validate([
                // 'chatId' => 'required|exists:chats,id',
                'content' => 'required|string',
            ]);

            $user = Auth::user();

            // Verify user is part of the chat
            if (!$chat->participants()->where('user_id', $user->id)->exists()) {
                return response()->json(['error' => 'Unauthorized'], 403);
            }

            $message = Message::create([
                'chat_id' => $chat->id,
                'sender_id' => $user->id,
                'content' => $request->content,
                'sent_at' => now(),
            ]);

            Log::info("Отправляем событие MessageSent для чата:", [
                'chat_id' => $chat->id,
                'message_id' => $message->id,
                'sender_id' => $user->id
            ]);

            // Broadcast the message
            $event = new MessageSent($message);
            broadcast($event);
            Log::info("Событие MessageSent отправлено", ['event' => get_class($event)]);

            return response()->json($message->load('sender:id,name,avatar'));
        } catch (\Exception $e) {
            Log::error("Ошибка при отправке сообщения:", ['error' => $e->getMessage()]);
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }
}