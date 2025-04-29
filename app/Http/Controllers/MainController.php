<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Inertia\Inertia;
use App\Models\Chat;
use App\Models\Message;
use Illuminate\Support\Facades\Auth;

class MainController extends Controller
{
    public function index()
    {
        $userId = Auth::id();

        $chats = Chat::whereHas('participants', function ($query) use ($userId) {
            $query->where('user_id', $userId);
        })
            ->with(['lastMessage', 'participants'])
            ->get()
            ->map(function ($chat) use ($userId) {
                $data = [
                    'id' => $chat->id,
                    'type' => $chat->type,
                    'name' => $chat->name,
                    'lastMessage' => $chat->lastMessage ? [
                        'id' => $chat->lastMessage->id,
                        'content' => $chat->lastMessage->content,
                        'sender' => [
                            'id' => $chat->lastMessage->sender->id,
                            'name' => $chat->lastMessage->sender->name,
                            'avatar' => $chat->lastMessage->sender->avatar,
                        ],
                        'sent_at' => $chat->lastMessage->sent_at->toISOString(),
                    ] : null,
                    'updatedAt' => $chat->updated_at->toISOString(),
                ];

                if ($chat->type === 'private') {
                    $otherParticipant = $chat->participants->where('id', '!=', $userId)->first();
                    $data['name'] = $otherParticipant->name;
                    $data['participantAvatar'] = $otherParticipant->avatar;
                }

                return $data;
            });

        return Inertia::render('Dashboard', [
            'userId' => $userId,

            'status' => session('status'),
            'chats' => $chats,
        ]);
    }
}
