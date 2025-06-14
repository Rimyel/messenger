<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Message;
use App\Models\Chat;
use Illuminate\Support\Carbon;

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
            
            // Используем дату создания чата, но не позже чем 2024-03-01
            $chatCreatedAt = Carbon::parse($chat->created_at);
            $latestAllowedDate = Carbon::create(2024, 3, 1);
            $baseTime = $chatCreatedAt->gt($latestAllowedDate) ? $latestAllowedDate : $chatCreatedAt;
            $chatMessages = [];
            
            for ($i = 0; $i < $messageCount; $i++) {
                // Выбираем отправителя из реальных участников чата
                $sender = $participants->random();
                // Добавляем сообщения последовательно с интервалом в 5 минут
                $sentAt = $baseTime->copy()->addMinutes($i * 5);
                
                $status = 'sent';
                $deliveredAt = null;
                $readAt = null;
                
                $messageData = [
                    'chat_id' => $chat->id,
                    'sender_id' => $sender->id,
                    'content' => $messages[rand(0, count($messages) - 1)],
                    'sent_at' => $sentAt,
                    'status' => $status,
                    'delivered_at' => $deliveredAt,
                    'read_at' => $readAt
                ];
                
                $message = Message::create($messageData);
                $chatMessages[] = $message;
            }
            
            // После создания всех сообщений в чате, обновляем статусы
            if (!empty($chatMessages)) {
                $lastMessage = end($chatMessages);
                
                // Обновляем все сообщения кроме последнего как прочитанные
                foreach ($chatMessages as $message) {
                    if ($message->id !== $lastMessage->id) {
                        $sentAt = Carbon::parse($message->sent_at);
                        $message->update([
                            'status' => 'read',
                            'delivered_at' => $sentAt->copy()->addSeconds(10),
                            'read_at' => $sentAt->copy()->addSeconds(30)
                        ]);
                    }
                }
            }
        }
    }
}