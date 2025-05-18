<?php

namespace App\Http\Controllers;

use App\Models\Task;
use App\Models\File;
use App\Models\TaskAssignment;
use App\Models\TaskResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class TaskController extends Controller
{
    /**
     * Получить список заданий для текущего пользователя или компании.
     */
    public function index(Request $request)
    {
        $user = $request->user();
        $company = $user->companies()->first();
        
        if (!$company) {
            return response()->json(['message' => 'User does not belong to any company'], 403);
        }

        $query = Task::with(['creator', 'files', 'assignments.user', 'assignments.response.files'])
            ->where('company_id', $company->id);

        // Если пользователь не может управлять компанией, показываем только его задания
        if (!$user->canManageCompany($company)) {
            $query->whereHas('assignments', function ($q) use ($request) {
                $q->where('user_id', $request->user()->id);
            });
        }

        $tasks = $query->latest()->paginate(10);

        return response()->json($tasks);
    }

    /**
     * Создать новое задание.
     */
    public function store(Request $request)
    {
        $user = $request->user();
        $company = $user->companies()->first();

        if (!$company) {
            return response()->json(['message' => 'User does not belong to any company'], 403);
        }

        // Только администраторы или владельцы могут создавать задания
        if (!$user->canManageCompany($company)) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'description' => 'required|string',
            'start_date' => 'required|date',
            'due_date' => 'required|date|after:start_date',
            'user_ids' => 'required|array',
            'user_ids.*' => 'exists:users,id',
            'files' => 'array',
            'files.*' => 'file|max:10240', // Максимум 10MB на файл
        ]);

        $task = Task::create([
            'id' => Str::uuid(),
            'company_id' => $company->id,
            'title' => $validated['title'],
            'description' => $validated['description'],
            'start_date' => $validated['start_date'],
            'due_date' => $validated['due_date'],
            'status' => 'pending',
            'created_by' => $request->user()->id,
        ]);

        // Создаем назначения для пользователей
        foreach ($validated['user_ids'] as $userId) {
            TaskAssignment::create([
                'id' => Str::uuid(),
                'task_id' => $task->id,
                'user_id' => $userId,
                'status' => 'not_started',
            ]);
        }

        // Сохраняем файлы
        if ($request->hasFile('files')) {
            foreach ($request->file('files') as $uploadedFile) {
                $path = $uploadedFile->store('tasks');
                
                $file = File::create([
                    'id' => Str::uuid(),
                    'name' => $uploadedFile->getClientOriginalName(),
                    'path' => $path,
                    'type' => $uploadedFile->getClientOriginalExtension(),
                    'mime_type' => $uploadedFile->getMimeType(),
                    'size' => $uploadedFile->getSize(),
                ]);

                $task->files()->attach($file->id);
            }
        }

        return response()->json($task->load(['creator', 'files', 'assignments.user']));
    }

    /**
     * Получить детали задания.
     */
    public function show(Request $request, Task $task)
    {
        // Проверяем доступ к заданию
        if (!$this->canAccessTask($request->user(), $task)) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        return response()->json(
            $task->load(['creator', 'files', 'assignments.user', 'assignments.response.files'])
        );
    }

    /**
     * Обновить статус задания.
     */
    public function updateStatus(Request $request, Task $task)
    {
        $user = $request->user();
        $company = $user->companies()->first();

        if (!$company || !$user->canManageCompany($company)) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $validated = $request->validate([
            'status' => 'required|in:pending,in_progress,completed,revision,overdue',
        ]);

        $task->update(['status' => $validated['status']]);

        return response()->json($task->load(['creator', 'files', 'assignments.user']));
    }

    /**
     * Отправить ответ на задание.
     */
    public function submitResponse(Request $request, TaskAssignment $assignment)
    {
        // Пользователь может отправлять ответ только на свои назначения
        if ($assignment->user_id !== $request->user()->id) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $validated = $request->validate([
            'text' => 'required|string',
            'files' => 'array',
            'files.*' => 'file|max:10240', // Максимум 10MB на файл
        ]);

        $response = TaskResponse::create([
            'id' => Str::uuid(),
            'assignment_id' => $assignment->id,
            'text' => $validated['text'],
            'status' => 'submitted',
        ]);

        // Сохраняем файлы ответа
        if ($request->hasFile('files')) {
            foreach ($request->file('files') as $uploadedFile) {
                $path = $uploadedFile->store('task-responses');
                
                $file = File::create([
                    'id' => Str::uuid(),
                    'name' => $uploadedFile->getClientOriginalName(),
                    'path' => $path,
                    'type' => $uploadedFile->getClientOriginalExtension(),
                    'mime_type' => $uploadedFile->getMimeType(),
                    'size' => $uploadedFile->getSize(),
                ]);

                $response->files()->attach($file->id);
            }
        }

        $assignment->update(['status' => 'submitted']);

        return response()->json($response->load('files'));
    }

    /**
     * Обновить статус ответа на задание (принять или отправить на доработку).
     */
    public function reviewResponse(Request $request, TaskResponse $response)
    {
        $user = $request->user();
        $company = $user->companies()->first();

        if (!$company || !$user->canManageCompany($company)) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $validated = $request->validate([
            'status' => 'required|in:approved,revision',
            'revision_comment' => 'required_if:status,revision|string',
        ]);

        $response->update([
            'status' => $validated['status'],
            'revision_comment' => $validated['revision_comment'] ?? null,
        ]);

        // Обновляем статус назначения
        $assignment = $response->assignment;
        $assignment->update([
            'status' => $validated['status'] === 'approved' ? 'completed' : 'revision'
        ]);

        // Если все назначения выполнены, обновляем статус задания
        $task = $assignment->task;
        if ($task->assignments()->where('status', '!=', 'completed')->doesntExist()) {
            $task->update(['status' => 'completed']);
        }

        return response()->json($response->load('files'));
    }

    /**
     * Проверить, может ли пользователь получить доступ к заданию.
     */
    private function canAccessTask($user, Task $task): bool
    {
        $company = $user->companies()->first();
        if (!$company) {
            return false;
        }

        // Администраторы могут видеть все задания компании
        if ($user->canManageCompany($company)) {
            return $task->company_id === $company->id;
        }

        // Обычный пользователь может видеть только свои задания
        return $task->assignments()->where('user_id', $user->id)->exists();
    }
}