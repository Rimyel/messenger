<?php

namespace App\Http\Controllers;

use App\Events\MessageSent;
use App\Events\MessageStatusUpdated;
use App\Models\Chat;
use App\Models\Message;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Log;

class ChatController extends Controller
{
    public function getCompanyUsers(): JsonResponse
    {
        try {
            $user = Auth::user();
            $users = User::where('company_id', $user->company_id)
                ->where('id', '!=', $user->id)
                ->select('id', 'name', 'avatar')
                ->get();

            return response()->json($users);
        } catch (\Exception $e) {
            return response()->json(['error' => 'Failed to fetch users'], 500);
        }
    }

    public function index(): JsonResponse
    {
        try {
            $user = Auth::user();
            $chats = $user->chats()
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

            return response()->json($chats);
        } catch (\Exception $e) {
            return response()->json(['error' => 'Failed to fetch chats'], 500);
        }
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
                            'status' => $msg->status,
                            'delivered_at' => $msg->delivered_at?->toISOString(),
                            'read_at' => $msg->read_at?->toISOString(),
                        ];
                    })
            );
        } catch (\Exception $e) {
            return response()->json(['error' => 'Failed to fetch messages'], 500);
        }
    }

    public function createPrivateChat(Request $request): JsonResponse
    {
        try {
            $request->validate([
                'userId' => 'required|exists:users,id',
            ]);

            $user = Auth::user();
            $otherUser = User::findOrFail($request->userId);

            // Prevent creating chat with yourself
            if ($user->id === $otherUser->id) {
                return response()->json(['error' => 'Cannot create chat with yourself'], 400);
            }

            // Validate users are from the same company
            if ($user->company_id !== $otherUser->company_id) {
                return response()->json(['error' => 'Cannot create chat with user from different company'], 403);
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
                return response()->json([
                    'id' => $existingChat->id,
                    'type' => 'private',
                    'name' => $otherUser->name,
                    'lastMessage' => $existingChat->lastMessage,
                    'participants' => $existingChat->participants,
                    'updatedAt' => $existingChat->updated_at
                ]);
            }

            // Create new private chat
            $chat = Chat::create([
                'company_id' => $user->company_id,
                'type' => 'private',
            ]);

            $chat->participants()->attach([$user->id, $otherUser->id]);
            $chat->load(['lastMessage', 'participants']);

            return response()->json([
                'id' => $chat->id,
                'type' => 'private',
                'name' => $otherUser->name,
                'lastMessage' => null,
                'participants' => $chat->participants,
                'updatedAt' => $chat->updated_at
            ]);
        } catch (\Exception $e) {
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }

    public function createGroupChat(Request $request): JsonResponse
    {
        try {
            $request->validate([
                'name' => 'required|string|max:255',
                'participantIds' => 'required|array|min:2',
                'participantIds.*' => 'exists:users,id',
            ]);

            $user = Auth::user();
            
            // Remove duplicates and creator from participants list
            $participantIds = array_unique($request->participantIds);

            // Validate all participants are from the same company
            $participants = User::whereIn('id', $participantIds)->get();
            foreach ($participants as $participant) {
                if ($participant->company_id !== $user->company_id) {
                    return response()->json([
                        'error' => "User {$participant->name} is from a different company"
                    ], 403);
                }
            }

            $chat = Chat::create([
                'company_id' => $user->company_id,
                'type' => 'group',
                'name' => $request->name,
            ]);

            // Add all participants including creator
            $allParticipants = array_unique(array_merge([$user->id], $participantIds));
            $chat->participants()->attach($allParticipants);

            $chat->load(['lastMessage', 'participants']);

            return response()->json([
                'id' => $chat->id,
                'type' => 'group',
                'name' => $chat->name,
                'lastMessage' => null,
                'participants' => $chat->participants,
                'updatedAt' => $chat->updated_at
            ]);
        } catch (\Exception $e) {
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }

    public function sendMessage(Chat $chat, Request $request): JsonResponse
    {
        try {
            $request->validate([
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
                'status' => 'sent' // Change initial status to 'sent'
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

            // Return message with sender info
            $message->load('sender:id,name,avatar');

            return response()->json([
                'id' => $message->id,
                'content' => $message->content,
                'sender' => [
                    'id' => $message->sender->id,
                    'name' => $message->sender->name,
                    'avatar' => $message->sender->avatar,
                ],
                'sent_at' => $message->sent_at->toISOString(),
                'status' => $message->status,
                'delivered_at' => null,
                'read_at' => null
            ]);
        } catch (\Exception $e) {
            Log::error("Ошибка при отправке сообщения:", ['error' => $e->getMessage()]);
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }

    public function markMessageDelivered(Chat $chat, Message $message): JsonResponse
    {
        try {
            $user = Auth::user();

            // Verify user is part of the chat
            if (!$chat->participants()->where('user_id', $user->id)->exists()) {
                return response()->json(['error' => 'Unauthorized'], 403);
            }

            // Only update if recipient is viewing
            if ($message->sender_id !== $user->id) {
                $message->update([
                    'status' => 'delivered',
                    'delivered_at' => now(),
                ]);

                broadcast(new MessageStatusUpdated($message));
            }

            return response()->json(['status' => 'success']);
        } catch (\Exception $e) {
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }

    public function markMessageRead(Chat $chat, Message $message): JsonResponse
    {
        try {
            $user = Auth::user();

            // Verify user is part of the chat
            if (!$chat->participants()->where('user_id', $user->id)->exists()) {
                return response()->json(['error' => 'Unauthorized'], 403);
            }

            // Only update if recipient is viewing
            if ($message->sender_id !== $user->id) {
                $message->update([
                    'status' => 'read',
                    'read_at' => now(),
                ]);

                broadcast(new MessageStatusUpdated($message));
            }

            return response()->json(['status' => 'success']);
        } catch (\Exception $e) {
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }
}