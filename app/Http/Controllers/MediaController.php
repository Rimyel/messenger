<?php

namespace App\Http\Controllers;

use App\Models\File;
use App\Models\Task;
use App\Models\TaskResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Symfony\Component\HttpFoundation\Response;

class MediaController extends Controller
{
    public function serveTaskFile(Request $request, File $file)
    {
        $user = $request->user();

        // Проверяем, имеет ли пользователь доступ к файлу
        $hasAccess = false;

        // Проверяем файлы заданий
        $taskWithFile = Task::whereHas('files', function ($query) use ($file) {
            $query->where('id', $file->id);
        })->first();

        if ($taskWithFile) {
            // Если это файл задания, проверяем права доступа к заданию
            $hasAccess = $taskWithFile->company_id === $user->companies()->first()?->id &&
                ($user->canManageCompany($user->companies()->first()) ||
                    $taskWithFile->assignments()->where('user_id', $user->id)->exists());
        }

        // Проверяем файлы ответов
        if (!$hasAccess) {
            $responseWithFile = TaskResponse::whereHas('files', function ($query) use ($file) {
                $query->where('id', $file->id);
            })->first();

            if ($responseWithFile) {
                $task = $responseWithFile->assignment->task;
                // Если это файл ответа, проверяем права доступа к заданию
                $hasAccess = $task->company_id === $user->companies()->first()?->id &&
                    ($user->canManageCompany($user->companies()->first()) ||
                        $task->assignments()->where('user_id', $user->id)->exists());
            }
        }

        if (!$hasAccess) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        // Определяем путь к файлу в публичном хранилище
        $path = Storage::disk('public')->path($file->path);

        if (!Storage::disk('public')->exists($file->path)) {
            return response()->json(['message' => 'File not found'], 404);
        }

        // Отдаем файл
        return response()->download($path, $file->name);
    }

    public function streamVideo(Request $request, $filename)
    {
        $filePath = 'video/' . $filename;

        // Проверяем существование файла в публичном хранилище
        if (!Storage::disk('public')->exists($filePath)) {
            abort(404);
        }

        $path = Storage::disk('public')->path($filePath);
        $size = filesize($path);
        $file = fopen($path, 'rb');

        // Все файлы в папке video - это видео файлы
        $mimeType = 'video/mp4';

        // Базовые заголовки для видео стриминга
        $headers = [
            'Content-Type' => $mimeType,
            'Accept-Ranges' => 'bytes',
            'Content-Length' => $size
        ];

        // Обработка Range запроса
        $start = 0;
        $end = $size - 1;

        if ($range = $request->header('Range')) {
            $range = str_replace('bytes=', '', $range);
            [$start] = explode('-', $range);
            $start = max((int) $start, 0);

            if ($start >= $size) {
                $start = 0;
            }

            $headers = array_merge($headers, [
                'Content-Range' => "bytes {$start}-{$end}/{$size}",
                'Content-Length' => $size - $start
            ]);

            fseek($file, $start);
        }

        return response()->stream(
            function () use ($file) {
                while (!feof($file)) {
                    echo fread($file, 8192);
                    flush();
                }
                fclose($file);
            },
            $range ? 206 : 200,
            $headers
        );
    }
    public function serveFile(Request $request, $filename)
    {
        $filePath = 'chat-files/' . $filename;

        // Проверяем существование файла в публичном хранилище
        if (!Storage::disk('public')->exists($filePath)) {
            abort(404);
        }

        $path = Storage::disk('public')->path($filePath);
        $mimeType = mime_content_type($path);

        if (str_starts_with($mimeType, 'video/')) {
            // Для видео используем потоковую передачу
            $size = filesize($path);
            $file = fopen($path, 'rb');

            $headers = [
                'Content-Type' => $mimeType,
                'Accept-Ranges' => 'bytes',
                'Content-Length' => $size
            ];

            // Обработка Range запроса
            if ($range = $request->header('Range')) {
                $range = str_replace('bytes=', '', $range);
                [$start] = explode('-', $range);
                $start = max((int) $start, 0);
                $end = $size - 1;

                if ($start >= $size) {
                    $start = 0;
                }

                $headers = array_merge($headers, [
                    'Content-Range' => "bytes {$start}-{$end}/{$size}",
                    'Content-Length' => $size - $start
                ]);

                fseek($file, $start);
            }

            return response()->stream(
                function () use ($file) {
                    while (!feof($file)) {
                        echo fread($file, 8192);
                        flush();
                    }
                    fclose($file);
                },
                $range ? 206 : 200,
                $headers
            );
        } else {
            // Для остальных типов файлов используем обычную отдачу
            return response()->file($path);
        }
    }
    public function serveCompanyLogo(Request $request, $filename)
    {
        $filePath = 'company-logos/' . $filename;

        // Проверяем существование файла в публичном хранилище
        if (!Storage::disk('public')->exists($filePath)) {
            abort(404);
        }

        $path = Storage::disk('public')->path($filePath);
        return response()->file($path);
    }
}