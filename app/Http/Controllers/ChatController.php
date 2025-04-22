<?php

namespace App\Http\Controllers;

use App\Events\MessageSent;
use App\Models\Conversation;
use App\Models\Message;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Http\JsonResponse;

class ChatController extends Controller
{
    public function conversations(): JsonResponse
    {
        $user = Auth::user();
        return response()->json(
            Conversation::where('participant1_id', $user->id)
                ->orWhere('participant2_id', $user->id)
                ->with(['lastMessage'])
                ->get()
                ->map(function ($conversation) use ($user) {
                    $participant = $conversation->participant1_id === $user->id
                        ? $conversation->participant2
                        : $conversation->participant1;

                    return [
                        'id' => $conversation->id,
                        'participantId' => $participant->id,
                        'participantName' => $participant->name,
                        'participantAvatar' => $participant->avatar,
                        'lastMessage' => $conversation->lastMessage,
                        'unreadCount' => $conversation->messages()
                            ->where('receiver_id', $user->id)
                            ->where('read', false)
                            ->count(),
                        'updatedAt' => $conversation->updated_at,
                    ];
                })
        );
    }

    public function messages($conversationId): JsonResponse
    {
        try {
            $user = Auth::user();
            $conversation = Conversation::findOrFail($conversationId);

            // Verify user is part of the conversation
            if ($conversation->participant1_id !== $user->id && $conversation->participant2_id !== $user->id) {
                return response()->json(['error' => 'Unauthorized'], 403);
            }

            // Mark messages as read
            $conversation->messages()
                ->where('receiver_id', $user->id)
                ->where('read', false)
                ->update(['read' => true]);

            return response()->json(
                $conversation->messages()
                    ->orderBy('created_at', 'asc')
                    ->get()
            );
        } catch (\Exception $e) {
            return response()->json(['error' => 'Failed to fetch messages'], 500);
        }
    }

    public function sendMessage(Request $request): JsonResponse
    {
        try {
            $request->validate([
                'conversationId' => 'required|integer',
                'content' => 'required|string',
            ]);
            $user = Auth::user();
            dd($request->conversationId);
            $conversation = Conversation::find($request->conversationId);

            // Verify user is part of the conversation
            if ($conversation->participant1_id !== $user->id && $conversation->participant2_id !== $user->id) {
                return response()->json(['error' => 'Unauthorized'], 403);
            }

            // Determine receiver
            $receiverId = $conversation->participant1_id === $user->id
                ? $conversation->participant2_id
                : $conversation->participant1_id;

            $message = Message::create([
                'conversation_id' => $conversation->id,
                'sender_id' => $user->id,
                'receiver_id' => $receiverId,
                'content' => $request->content,
                'read' => false,
            ]);

            // Update conversation timestamp
            $conversation->touch();

            // Broadcast the message
            broadcast(new MessageSent($message))->toOthers();

            return response()->json($message);
        } catch (\Exception $e) {
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }
}