<?php

namespace App\Http\Controllers;

use App\Http\Resources\MessageResource;
use App\Models\Chat;
use App\Models\Message;
use App\Services\ChatListService;
use App\Services\ChatMessageService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Http\JsonResponse;

class ChatController extends Controller
{
    protected $chatListService;
    protected $chatMessageService;

    public function __construct(
        ChatListService $chatListService,
        ChatMessageService $chatMessageService
    ) {
        $this->chatListService = $chatListService;
        $this->chatMessageService = $chatMessageService;
    }

    public function index(): JsonResponse
    {
        try {
            $user = Auth::user();
            $chats = $this->chatListService->getUserChats($user);
            return response()->json($chats);
        } catch (\Exception $e) {
            return response()->json(['error' => 'Failed to fetch chats'], 500);
        }
    }

    public function messages($chatId, Request $request): JsonResponse
    {
        try {
            $user = Auth::user();
            $limit = (int) $request->query('limit', 20);
            $cursor = $request->query('cursor');

            $result = $this->chatListService->getChatMessages($chatId, $user, $limit, $cursor);
            return response()->json($result);
        } catch (\Exception $e) {
            return response()->json(['error' => 'Failed to fetch messages'], 500);
        }
    }

    public function sendMessage(Chat $chat, Request $request): JsonResponse
    {
        try {
            $request->validate([
                'content' => 'required_without:files|string|nullable',
                'files' => 'required_without:content|array|nullable',
                'files.*' => 'required|file|max:10240', // Max 10MB per file
            ]);

            $user = Auth::user();

            if (!$chat->participants()->where('user_id', $user->id)->exists()) {
                return response()->json(['error' => 'Unauthorized'], 403);
            }

            $message = $this->chatMessageService->sendMessage($chat, $request, $user);
            return response()->json(new MessageResource($message));
        } catch (\Exception $e) {
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }

    public function markMessageDelivered(Chat $chat, Message $message): JsonResponse
    {
        try {
            $user = Auth::user();

            if (!$chat->participants()->where('user_id', $user->id)->exists()) {
                return response()->json(['error' => 'Unauthorized'], 403);
            }

            $this->chatMessageService->markMessageDelivered($chat, $message, $user);
            return response()->json(['status' => 'success']);
        } catch (\Exception $e) {
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }

    public function markMessageRead(Chat $chat, Message $message): JsonResponse
    {
        try {
            $user = Auth::user();

            if (!$chat->participants()->where('user_id', $user->id)->exists()) {
                return response()->json(['error' => 'Unauthorized'], 403);
            }

            $this->chatMessageService->markMessageRead($chat, $message, $user);
            return response()->json(['status' => 'success']);
        } catch (\Exception $e) {
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }
}