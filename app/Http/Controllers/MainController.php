<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Inertia\Inertia;
use App\Models\Conversation;
use App\Models\Message;
use Illuminate\Support\Facades\Auth;

class MainController extends Controller
{
    public function index()
    {
        $userId = Auth::id();

        $conversations = Conversation::where('participant1_id', $userId)
            ->orWhere('participant2_id', $userId)
            ->with([
                'participant1:id,name',
                'participant2:id,name',
                'messages' => function ($query) {
                    $query->latest()->limit(1); // последнее сообщение
                }
            ])
            ->get()
            ->map(function ($conversation) use ($userId) {
                $other = $conversation->participant1_id === $userId
                    ? $conversation->participant2
                    : $conversation->participant1;

                $lastMessage = $conversation->messages->first();

                $unreadCount = Message::where('conversation_id', $conversation->id)
                    ->where('receiver_id', $userId)
                    ->where('read', false)
                    ->count();

                return [
                    'id' => $conversation->id,
                    'participantId' => $other->id,
                    'participantName' => $other->name,
                    'participantAvatar' => null,
                    'lastMessage' => $lastMessage ? [
                        'id' => $lastMessage->id,
                        'content' => $lastMessage->content,
                        'senderId' => $lastMessage->sender_id,
                        'receiverId' => $lastMessage->receiver_id,
                        'created_at' => $lastMessage->created_at->toISOString(),
                        'read' => $lastMessage->read,
                    ] : null,
                    'unreadCount' => $unreadCount,
                    'updated_at' => $conversation->updated_at->toISOString(),
                ];
            });

        return Inertia::render('Dashboard', [
            'userId' => $userId,
            'mustVerifyEmail' => Auth::user() instanceof \Illuminate\Contracts\Auth\MustVerifyEmail,
            'status' => session('status'),
            'chats' => $conversations,
        ]);
    }
}
