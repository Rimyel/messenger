<?php

namespace App\Http\Controllers;

use App\Events\JoinRequestStatusUpdated;
use App\Models\JoinRequest;
use App\Models\Company;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Gate;

class JoinRequestController extends Controller
{
    /**
     * Получить список запросов на вступление для компании
     */
    public function index(Company $company)
    {
        // Проверяем права доступа
        // if (!Gate::allows('manage-company', $company)) {
        //     abort(403);
        // }

        return $company->joinRequests()
            ->with(['user:id,name,email,avatar'])
            ->latest()
            ->get();
    }

    /**
     * Создать новый запрос на вступление
     */
    public function store(Request $request, Company $company)
    {
        $request->validate([
            'message' => 'nullable|string|max:500',
        ]);

        // Проверяем, нет ли уже активного запроса
        $existingRequest = JoinRequest::where([
            'user_id' => Auth::id(),
            'company_id' => $company->id,
            'status' => 'pending'
        ])->first();

        if ($existingRequest) {
            return response()->json([
                'message' => 'У вас уже есть активный запрос на вступление в эту компанию'
            ], 422);
        }

        // Создаем запрос
        $joinRequest = JoinRequest::create([
            'user_id' => Auth::id(),
            'company_id' => $company->id,
            'message' => $request->message,
        ]);

        // Загружаем связанные данные
        $joinRequest->load('user:id,name,email,avatar');

        return response()->json($joinRequest, 201);
    }

    /**
     * Обновить статус запроса (принять/отклонить)
     */
    public function update(Request $request, Company $company, JoinRequest $joinRequest)
    {
        // Проверяем права доступа
        // if (!Gate::allows('manage-company', $company)) {
        //     abort(403);
        // }

        $request->validate([
            'status' => 'required|in:approved,rejected',
            'rejection_reason' => 'required_if:status,rejected|nullable|string|max:500',
        ]);

        if ($request->status === 'approved') {
            $joinRequest->approve();
        } else {
            $joinRequest->reject($request->rejection_reason);
        }

        // Загружаем связанные данные перед отправкой ответа
        $joinRequest->load('user:id,name,email,avatar');

        return response()->json($joinRequest);
    }
}
