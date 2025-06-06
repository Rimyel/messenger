<?php

namespace App\Http\Controllers;

use App\Http\Resources\ChatResource;
use App\Http\Resources\UserResource;
use App\Services\ChatCreationService;
use App\Services\ChatListService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Http\JsonResponse;

class ChatManagementController extends Controller
{
    protected $chatCreationService;
    protected $chatListService;

    public function __construct(
        ChatCreationService $chatCreationService,
        ChatListService $chatListService
    ) {
        $this->chatCreationService = $chatCreationService;
        $this->chatListService = $chatListService;
    }

    public function getCompanyUsers(Request $request): JsonResponse
    {
        try {
            $users = $this->chatListService->getCompanyUsers($request->user());
            return response()->json(UserResource::collection($users));
        } catch (\Exception $e) {
            return response()->json(['error' => 'Failed to fetch users'], 500);
        }
    }

    public function createPrivateChat(Request $request): JsonResponse
    {
        try {
            $request->validate([
                'userId' => 'required|exists:users,id',
            ]);

            $user = Auth::user();
            $chat = $this->chatCreationService->createPrivateChat($user, $request->userId);

            return response()->json(new ChatResource($chat));
        } catch (\Exception $e) {
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }

    public function createGroupChat(Request $request): JsonResponse
    {
        try {
            $request->validate([
                'name' => 'required|string|max:255',
                'participantIds' => 'required|array|min:1',
                'participantIds.*' => 'exists:users,id',
            ]);

            $user = Auth::user();
            $chat = $this->chatCreationService->createGroupChat(
                $user,
                $request->name,
                $request->participantIds
            );

            return response()->json(new ChatResource($chat));
        } catch (\Exception $e) {
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }

    public function addParticipants(Request $request, $chatId): JsonResponse
    {
        try {
            $request->validate([
                'participantIds' => 'required|array|min:1',
                'participantIds.*' => 'exists:users,id',
            ]);

            $user = Auth::user();
            $chat = $this->chatCreationService->addParticipantsToChat(
                $chatId,
                $request->participantIds,
                $user
            );

            return response()->json(new ChatResource($chat));
        } catch (\Exception $e) {
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }

    public function removeParticipant(Request $request, $chatId, $participantId): JsonResponse
    {
        try {
            $user = Auth::user();
            $chat = $this->chatCreationService->removeParticipantFromChat(
                $chatId,
                $participantId,
                $user
            );

            return response()->json(new ChatResource($chat));
        } catch (\Exception $e) {
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }

    public function updateParticipantRole(Request $request, $chatId, $participantId): JsonResponse
    {
        try {
            $request->validate([
                'role' => 'required|string|in:admin,member',
            ]);

            $user = Auth::user();
            $chat = $this->chatCreationService->updateParticipantRole(
                $chatId,
                $participantId,
                $request->role,
                $user
            );

            return response()->json(new ChatResource($chat));
        } catch (\Exception $e) {
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }
}