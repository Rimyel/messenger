<?php

namespace App\Http\Controllers;

use App\Models\Task;
use App\Models\File;
use App\Models\TaskAssignment;
use App\Models\TaskResponse;
use App\Http\Resources\TaskResource;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class TaskController extends Controller
{
    /**
     * Получить список заданий для текущего пользователя или компании.
     */
    /**
     * Получить список назначенных пользователю заданий
     */
    public function userTasks(Request $request)
    {
        $user = $request->user();
        $company = $user->companies()->first();

        if (!$company) {
            return response()->json(['message' => 'User does not belong to any company'], 403);
        }

        // Получаем только задания, где пользователь является исполнителем
        $query = Task::with(['creator', 'files', 'assignments.user', 'assignments.response.files'])
            ->where('company_id', $company->id)
            ->whereHas('assignments', function ($q) use ($user) {
                $q->where('user_id', $user->id);
            });

        $tasks = $query->latest()->paginate(10);
        return TaskResource::collection($tasks);
    }

    /**
     * Получить список всех заданий компании (для администраторов)
     */
    public function index(Request $request)
    {
        $user = $request->user();
        $company = $user->companies()->first();

        if (!$company) {
            return response()->json(['message' => 'User does not belong to any company'], 403);
        }

        // Проверяем права на управление
        if (!$user->canManageCompany($company)) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        // Получаем задания, созданные текущим пользователем
        $query = Task::with(['creator', 'files', 'assignments.user', 'assignments.response.files'])
            ->where('company_id', $company->id)
            ->where('created_by', $user->id);

        $tasks = $query->latest()->paginate(10);

        return TaskResource::collection($tasks);
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
                'task_id' => $task->id,
                'user_id' => $userId,
                'status' => 'not_started',
            ]);
        }

        // Сохраняем файлы
        if ($request->hasFile('files')) {
            foreach ($request->file('files') as $uploadedFile) {
                $path = $uploadedFile->storeAs('tasks', $uploadedFile->getClientOriginalName(), 'public');

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

        $task->load(['creator', 'files', 'assignments.user', 'assignments.response.files']);
        return new TaskResource($task);
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
            'assignment_id' => $assignment->id,
            'text' => $validated['text'],
            'status' => 'submitted',
        ]);

        // Сохраняем файлы ответа
        if ($request->hasFile('files')) {
            foreach ($request->file('files') as $uploadedFile) {
                $path = $uploadedFile->storeAs('task-responses', $uploadedFile->getClientOriginalName(), 'public');

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

        // Обновляем статус задания на in_progress при получении ответа
        $task = $assignment->task;
        if ($task->status === 'pending') {
            $task->update(['status' => 'in_progress']);
        }

        return response()->json($response->load('files'));
    }

    /**
     * Обновить существующий ответ на задание.
     */
    public function updateResponse(Request $request, TaskResponse $response)
    {
        // Проверяем, что пользователь является автором ответа
        if ($response->assignment->user_id !== $request->user()->id) {
            return response()->json(['message' => 'Unauthorized не ваш ответ, либо не видим кто ты'], 403);
        }

        // Проверяем, что ответ можно редактировать
        if ($response->status === 'approved') {
            return response()->json(['message' => 'Ответ нельзя отредактировать блин'], 403);
        }

        $validated = $request->validate([
            'text' => 'required|string',
            'files' => 'array',
            'files.*' => 'file|max:10240',
            'existing_files' => 'array',
            'existing_files.*' => 'exists:files,id'
        ]);

        $response->update([
            'text' => $validated['text'],
            'status' => 'submitted'
        ]);

        // Обновляем связи с существующими файлами
        $response->files()->detach();
        if (isset($validated['existing_files'])) {
            $response->files()->attach($validated['existing_files']);
        }

        // Сохраняем новые файлы
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

        // Обновляем статус назначения
        $response->assignment->update(['status' => 'submitted']);

        // Обновляем статус задания на in_progress при обновлении ответа
        $task = $response->assignment->task;
        if ($task->status === 'pending') {
            $task->update(['status' => 'in_progress']);
        }

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

        // Проверяем, не завершено ли уже задание
        $task = $response->assignment->task;
        if ($task->status === 'completed') {
            return response()->json(['message' => 'Невозможно изменить статус ответа для завершенного задания'], 403);
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