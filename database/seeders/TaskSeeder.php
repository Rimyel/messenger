<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Task;
use App\Models\User;
use App\Models\Company;
use App\Models\File;
use App\Models\TaskAssignment;
use Illuminate\Support\Facades\DB;

class TaskSeeder extends Seeder
{
    private $taskTemplates = [
        [
            'title' => 'Подготовка презентации проекта',
            'description' => 'Создать презентацию для демонстрации текущего статуса проекта клиенту. Включить: прогресс, ключевые достижения, планы',
            'requires_multiple_users' => true
        ],
        [
            'title' => 'Анализ производительности системы',
            'description' => 'Провести комплексный анализ производительности системы. Подготовить отчет с графиками нагрузки и рекомендациями',
            'requires_multiple_users' => true
        ],
        [
            'title' => 'Обновление пользовательской документации',
            'description' => 'Актуализировать документацию по новым функциям системы. Добавить скриншоты и примеры использования',
            'requires_multiple_users' => false
        ],
        [
            'title' => 'Оптимизация SQL запросов',
            'description' => 'Выявить и оптимизировать медленные SQL запросы. Особое внимание уделить отчетам и аналитике',
            'requires_multiple_users' => true
        ],
        [
            'title' => 'Еженедельный бэкап данных',
            'description' => 'Выполнить полное резервное копирование базы данных и проверить целостность архива',
            'requires_multiple_users' => false
        ],
        [
            'title' => 'Код-ревью новых модулей',
            'description' => 'Провести ревью кода последних изменений. Проверить соответствие стандартам и безопасность',
            'requires_multiple_users' => false
        ],
        [
            'title' => 'Интеграционное тестирование',
            'description' => 'Выполнить полный цикл интеграционных тестов после обновления API. Проверить все критические сценарии',
            'requires_multiple_users' => true
        ],
        [
            'title' => 'Анализ логов системы',
            'description' => 'Проанализировать системные логи за последнюю неделю. Выявить потенциальные проблемы и узкие места',
            'requires_multiple_users' => false
        ]
    ];

    private $taskStatuses = [
        'pending',
        'in_progress',
        'completed',
        'revision',
        'overdue'
    ];

    private $assignmentStatuses = [
        'not_started',
        'in_progress',
        'submitted',
        'revision',
        'completed'
    ];


    public function run(): void
    {
        $companies = Company::all();
        
        foreach ($companies as $company) {
            $users = $company->users;
            
            // Для каждого пользователя создаем задания
            foreach ($users as $creator) {
                // Создаем 5-7 задач для каждого пользователя
                $taskCount = rand(5, 7);
                
                for ($i = 0; $i < $taskCount; $i++) {
                    $template = $this->taskTemplates[array_rand($this->taskTemplates)];
                    $status = $this->taskStatuses[array_rand($this->taskStatuses)];
                    
                    // Устанавливаем дату в зависимости от статуса
                    $startDate = match($status) {
                        'pending' => now()->addDays(rand(1, 3)),
                        'in_progress' => now()->subDays(rand(1, 3)),
                        'completed' => now()->subDays(rand(7, 14)),
                        'revision' => now()->subDays(rand(4, 7)),
                        'overdue' => now()->subDays(rand(10, 20)),
                    };

                    $dueDate = match($status) {
                        'pending' => now()->addDays(rand(5, 10)),
                        'in_progress' => now()->addDays(rand(1, 5)),
                        'completed' => now()->subDays(rand(1, 7)),
                        'revision' => now()->addDays(rand(1, 3)),
                        'overdue' => now()->subDays(rand(1, 5)),
                    };

                    $task = Task::create([
                        'title' => $template['title'],
                        'description' => $template['description'],
                        'status' => $status,
                        'start_date' => $startDate,
                        'due_date' => $dueDate,
                        'company_id' => $company->id,
                        'created_by' => $creator->id
                    ]);

                    // Выбираем исполнителя, исключая создателя задания
                    $availableUsers = $users->where('id', '!=', $creator->id);
                    $mainExecutor = $availableUsers->random();

                    // Основное назначение задачи
                    $assignment = TaskAssignment::create([
                        'task_id' => $task->id,
                        'user_id' => $mainExecutor->id,
                        'status' => $this->assignmentStatuses[array_rand($this->assignmentStatuses)]
                    ]);

                    // Если задача требует нескольких исполнителей
                    if ($template['requires_multiple_users']) {
                        // Добавляем 1-2 дополнительных исполнителя, исключая создателя и основного исполнителя
                        $additionalUsers = $availableUsers
                            ->where('id', '!=', $mainExecutor->id)
                            ->random(min($availableUsers->count() - 1, rand(1, 2)));

                        foreach ($additionalUsers as $additionalUser) {
                            TaskAssignment::create([
                                'task_id' => $task->id,
                                'user_id' => $additionalUser->id,
                                'status' => $this->assignmentStatuses[array_rand($this->assignmentStatuses)]
                            ]);
                        }
                    }

                    // Для завершенных задач просто обновляем статус
                    if ($status === 'completed') {
                        $assignment->update(['status' => 'completed']);
                    }

                    // Для задач на доработке добавляем ответ и комментарий администратора
                    if ($status === 'revision') {
                        // Добавляем ответ со статусом revision и комментарием администратора
                        DB::table('task_responses')->insert([
                            'assignment_id' => $assignment->id,
                            'text' => "Требуется доработка следующих пунктов:\n\n" .
                                    "1. Выполнены основные требования\n" .
                                    "2. Требуется дополнительное тестирование\n" .
                                    "3. Необходимо обновить документацию",
                            'status' => 'revision',
                            'revision_comment' => "Требуется доработка следующих аспектов:\n" .
                                    "1. Улучшить качество тестирования\n" .
                                    "2. Дополнить документацию примерами использования\n" .
                                    "3. Оптимизировать производительность",
                            'created_at' => $dueDate,
                            'updated_at' => $dueDate
                        ]);

                        // Обновляем статус назначения
                        $assignment->update(['status' => 'revision']);
                    }
                }
            }
        }
    }
}