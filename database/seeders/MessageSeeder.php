<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Message;
use App\Models\Chat;
use App\Models\File;
use Illuminate\Support\Facades\DB;

class MessageSeeder extends Seeder
{
    private $groupMessages = [
        // Обсуждение проекта
        [
            'Коллеги, как продвигается работа над новым модулем?',
            'Есть небольшие задержки, но к концу недели все будет готово',
            'Нужна помощь с оптимизацией запросов',
            'Могу помочь завтра, давай созвонимся',
            'Отправляю текущую версию документации на ревью'
        ],
        // Технические обсуждения
        [
            'Кто может помочь с настройкой CI/CD?',
            'У меня есть опыт, могу показать',
            'Появились ошибки после последнего деплоя',
            'Уже исправляю, скоро будет фикс',
            'Давайте проведем код-ревью перед мержем'
        ],
        // Организационные вопросы
        [
            'Не забудьте про дейли в 11:00',
            'Обновил график отпусков на следующий месяц',
            'Кто сегодня заполнял отчет по задачам?',
            'Нужно обсудить приоритеты на следующий спринт',
            'Завтра важная встреча с клиентом, подготовьте материалы'
        ]
    ];

    private $personalMessages = [
        // Рабочие обсуждения
        [
            'Привет, глянешь мой PR?',
            'Конечно, через 30 минут посмотрю',
            'Нашел баг в твоем коде, давай обсудим',
            'Спасибо за ревью, уже исправляю',
            'Как продвигается работа над твоей задачей?'
        ],
        // Неформальное общение
        [
            'Пойдем на обед?',
            'Видел новое обновление фреймворка?',
            'Спасибо за помощь вчера!',
            'Как тебе новый проект?',
            'Поздравляю с успешным релизом!'
        ]
    ];

    private $fileTypes = [
        [
            'path' => 'sample-10s.mp4',
            'mime_type' => 'video/mp4',
            'descriptions' => [
                'Видеоотчет о проделанной работе',
                'Демонстрация нового функционала',
                'Запись тестирования системы'
            ]
        ],
        [
            'path' => 'sample-15s.mp3',
            'mime_type' => 'audio/mpeg',
            'descriptions' => [
                'Аудиозапись совещания',
                'Голосовые заметки по проекту',
                'Аудиокомментарии к задаче'
            ]
        ],
        [
            'path' => 'sample-city-park-400x300.jpg',
            'mime_type' => 'image/jpeg',
            'descriptions' => [
                'Скриншот с результатами',
                'Диаграмма архитектуры',
                'Пример интерфейса'
            ]
        ]
    ];

    public function run(): void
    {
        $chats = Chat::with('participants')->get();
        
        foreach ($chats as $chat) {
            $participants = $chat->participants;
            
            // Проверяем минимальное количество участников в зависимости от типа чата
            $minParticipants = $chat->type === 'private' ? 2 : 3;
            if ($participants->count() < $minParticipants) {
                continue;
            }
            
            $messageCount = rand(15, 30);
            $messages = $chat->type === 'group' ?
                $this->groupMessages[array_rand($this->groupMessages)] :
                $this->personalMessages[array_rand($this->personalMessages)];
            
            $baseTime = now()->subDays(rand(1, 30));
            $chatMessages = [];
            
            for ($i = 0; $i < $messageCount; $i++) {
                // Выбираем отправителя из реальных участников чата
                $sender = $participants->random();
                $sentAt = $baseTime->addMinutes(rand(1, 60));
                
                // Временно устанавливаем все сообщения как отправленные
                $status = 'sent';
                $deliveredAt = null;
                $readAt = null;
                
                $isFile = rand(0, 4) === 0; // 20% шанс на файл
                
                $messageData = [
                    'chat_id' => $chat->id,
                    'sender_id' => $sender->id,
                    'content' => $isFile ? $this->fileTypes[array_rand($this->fileTypes)]['descriptions'][array_rand($this->fileTypes[0]['descriptions'])] : $messages[rand(0, count($messages) - 1)],
                    'sent_at' => $sentAt,
                    'status' => $status,
                    'delivered_at' => $deliveredAt,
                    'read_at' => $readAt
                ];
                
                $message = Message::create($messageData);
                $chatMessages[] = $message;
                
                if ($isFile) {
                    $fileType = $this->fileTypes[array_rand($this->fileTypes)];
                    $file = File::create([
                        'name' => 'file_' . now()->format('d_m_Y_H_i_s'),
                        'path' => 'тестовые данные/' . $fileType['path'],
                        'type' => strtok($fileType['mime_type'], '/'),
                        'mime_type' => $fileType['mime_type']
                    ]);

                    // Создаем связь в промежуточной таблице
                    DB::table('messages_media')->insert([
                        'message_id' => $message->id,
                        'files_id' => $file->id,
                        'created_at' => now(),
                        'updated_at' => now()
                    ]);
                }
            }
            
            // После создания всех сообщений в чате, обновляем статусы
            // Получаем последнее сообщение
            $lastMessage = end($chatMessages);
            
            // Обновляем все сообщения кроме последнего как прочитанные
            foreach ($chatMessages as $message) {
                if ($message->id !== $lastMessage->id) {
                    $message->update([
                        'status' => 'read',
                        'delivered_at' => $message->sent_at->copy()->addSeconds(rand(1, 30)),
                        'read_at' => $message->sent_at->copy()->addMinutes(rand(1, 30))
                    ]);
                }
            }
        }
    }
}