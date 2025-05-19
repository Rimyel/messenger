<?php

namespace App\Services;

use App\Events\MessageSent;
use App\Events\MessageStatusUpdated;
use App\Models\Chat;
use App\Models\Message;
use App\Models\File;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;

class ChatMessageService
{
    public function sendMessage(Chat $chat, Request $request, $user)
    {
        // Логируем время до создания
        $timeBeforeCreate = now()->utc()->format('Y-m-d H:i:s');
        Log::info('Time before create:', ['time' => $timeBeforeCreate]);

        $message = Message::create([
            'chat_id' => $chat->id,
            'sender_id' => $user->id,
            'content' => $request->content ?? '',
            'sent_at' => now()->utc()->format('Y-m-d H:i:s'),
            'status' => 'sent' // Initial status is 'sent' (one checkmark)
        ]);

        // Логируем время сразу после создания
        Log::info('Message after create:', [
            'id' => $message->id,
            'sent_at' => $message->sent_at,
            'sent_at_raw' => $message->getOriginal('sent_at'),
            'timezone' => date_default_timezone_get()
        ]);

        if ($request->hasFile('files')) {
            foreach ($request->file('files') as $file) {
                $path = $file->store('chat-files', 'public');

                // Создаем файл
                $fileModel = File::create([
                    'type' => $this->getFileType($file->getMimeType()),
                    'path' => $path,
                    'name' => $file->getClientOriginalName(),
                    'mime_type' => $file->getMimeType(),
                    'size' => $file->getSize()
                ]);

                // Прикрепляем файл к сообщению
                $message->files()->attach($fileModel->id);
            }
        }

        $message->load('files');

        Log::info("Отправляем событие MessageSent для чата:", [
            'chat_id' => $chat->id,
            'message_id' => $message->id,
            'sender_id' => $user->id
        ]);

        broadcast(new MessageSent($message));
        Log::info("Событие MessageSent отправлено", ['event' => MessageSent::class]);

        $message->load(['sender:id,name,avatar', 'files']);

        return $message;
    }

    public function markMessageRead(Chat $chat, Message $message, $user)
    {
        // Сохраняем оригинальные значения
        $originalData = $message->getOriginal();

        // Логируем оригинальные значения
        Log::info('Оригинальные значения сообщения:', [
            'sent_at' => $originalData['sent_at'],
            'read_at' => $originalData['read_at'],
            'delivered_at' => $originalData['delivered_at'] ?? null
        ]);

        if ($message->sender_id !== $user->id && $message->status !== 'read') {
            // Логируем состояние до изменений с дополнительной информацией


            // Обновляем статус и время прочтения
            // Логируем все данные перед обновлением
            Log::info('Данные перед обновлением:', [
                'id' => $message->id,
                'sent_at_original' => $message->getOriginal('sent_at'),
                'sent_at_attribute' => $message->sent_at,
                'current_time' => now()->utc()->format('Y-m-d H:i:s')
            ]);
            
            // Получаем оригинальное значение sent_at перед обновлением
            $originalSentAt = $message->getOriginal('sent_at');
            
            // Создаем массив с данными для обновления
            $updateData = [
                'status' => 'read',
                'read_at' => now()->utc()->format('Y-m-d H:i:s'),
                'sent_at' => $originalSentAt
            ];
            
            // Логируем данные, которые будут использованы для обновления
            Log::info('Данные для обновления:', $updateData);
            
            // Обновляем только нужные поля через Query Builder
            Message::where('id', $message->id)->update($updateData);
            
            // Получаем свежие данные из базы
            $message = Message::find($message->id);
            
            // Логируем данные после обновления
            Log::info('Данные после обновления:', [
                'id' => $message->id,
                'sent_at_from_db' => $message->getOriginal('sent_at'),
                'sent_at_attribute' => $message->sent_at,
                'raw_attributes' => $message->getAttributes()
            ]);

            // Логируем состояние после изменений с дополнительной информацией
            Log::info('Message after update:', [
                'original_data' => $message->getOriginal(),
                'sent_at' => $message->sent_at,
                'sent_at_raw' => $message->getOriginal('sent_at'),
                'read_at' => $message->read_at,
                'read_at_raw' => $message->getOriginal('read_at'),
                'timezone' => date_default_timezone_get()
            ]);

            broadcast(new MessageStatusUpdated($message));
        } else {
            // Используем getOriginal для логирования чтобы избежать автоматических преобразований
            Log::info('Message not updated:', [
                'id' => $message->id,
                'sent_at_raw' => $message->getOriginal('sent_at'),
                'status' => $message->getOriginal('status'),
                'read_at_raw' => $message->getOriginal('read_at')
            ]);
        }

        // Возвращаем исходные данные без преобразований
        return [
            'id' => $message->id,
            'chat_id' => $message->chat_id,
            'sender_id' => $message->sender_id,
            'content' => $message->content,
            'sent_at' => $message->getOriginal('sent_at'),
            'status' => $message->status,
            'delivered_at' => $message->getOriginal('delivered_at'),
            'read_at' => $message->getOriginal('read_at')
        ];
    }

    private function getFileType(string $mimeType): string
    {
        if (str_starts_with($mimeType, 'image/')) {
            return 'image';
        } elseif (str_starts_with($mimeType, 'video/')) {
            return 'video';
        } elseif (str_starts_with($mimeType, 'audio/')) {
            return 'audio';
        } else {
            return 'document';
        }
    }
}