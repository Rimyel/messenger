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
            'file_name' => 'Презентация проекта',
            'uses_file' => true
        ],
        [
            'title' => 'Анализ производительности системы',
            'description' => 'Провести комплексный анализ производительности системы. Подготовить отчет с графиками нагрузки и рекомендациями',
            'file_name' => 'Отчет по производительности',
            'uses_file' => true
        ],
        [
            'title' => 'Обновление пользовательской документации',
            'description' => 'Актуализировать документацию по новым функциям системы. Добавить скриншоты и примеры использования',
            'file_name' => 'Руководство пользователя',
            'uses_file' => true
        ],
        [
            'title' => 'Оптимизация SQL запросов',
            'description' => 'Выявить и оптимизировать медленные SQL запросы. Особое внимание уделить отчетам и аналитике',
            'uses_file' => false
        ],
        [
            'title' => 'Еженедельный бэкап данных',
            'description' => 'Выполнить полное резервное копирование базы данных и проверить целостность архива',
            'uses_file' => false
        ],
        [
            'title' => 'Код-ревью новых модулей',
            'description' => 'Провести ревью кода последних изменений. Проверить соответствие стандартам и безопасность',
            'uses_file' => false
        ],
        [
            'title' => 'Интеграционное тестирование',
            'description' => 'Выполнить полный цикл интеграционных тестов после обновления API. Проверить все критические сценарии',
            'uses_file' => false
        ],
        [
            'title' => 'Анализ логов системы',
            'description' => 'Проанализировать системные логи за последнюю неделю. Выявить потенциальные проблемы и узкие места',
            'file_name' => 'Анализ системных логов',
            'uses_file' => true
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

    private $fileTypes = [
        [
            'path' => 'sample-10s.mp4',
            'mime_type' => 'video/mp4'
        ],
        [
            'path' => 'sample-15s.mp3',
            'mime_type' => 'audio/mpeg'
        ],
        [
            'path' => 'sample-city-park-400x300.jpg',
            'mime_type' => 'image/jpeg'
        ]
    ];

    public function run(): void
    {
        $companies = Company::all();
        
        foreach ($companies as $company) {
            $users = $company->users;
            
            foreach ($users as $user) {
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
                        'created_by' => $company->users()->wherePivot('role', 'owner')->first()->id
                    ]);

                    // Создаем назначение задачи
                    $assignment = TaskAssignment::create([
                        'task_id' => $task->id,
                        'user_id' => $user->id,
                        'status' => $this->assignmentStatuses[array_rand($this->assignmentStatuses)]
                    ]);

                    // Если задача завершена, добавляем ответ
                    if ($status === 'completed') {
                        $responseText = "Задача выполнена в соответствии с требованиями:\n\n" .
                            "1. Основные цели достигнуты\n" .
                            "2. Проведено тестирование\n" .
                            "3. Документация обновлена\n\n" .
                            "Результаты работы готовы к проверке.";

                        DB::table('task_responses')->insert([
                            'assignment_id' => $assignment->id,
                            'text' => $responseText,
                            'status' => 'approved',
                            'created_at' => $dueDate,
                            'updated_at' => $dueDate
                        ]);

                        // Обновляем статус назначения на completed
                        $assignment->update(['status' => 'completed']);
                    }

                    // Добавляем файл если он предусмотрен для задачи
                    if ($template['uses_file']) {
                        $fileType = $this->fileTypes[array_rand($this->fileTypes)];
                        $file = File::create([
                            'name' => $template['file_name'] . '_' . now()->format('d-m-Y'),
                            'path' => 'тестовые данные/' . $fileType['path'],
                            'type' => strtok($fileType['mime_type'], '/'),
                            'mime_type' => $fileType['mime_type']
                        ]);

                        DB::table('task_files')->insert([
                            'task_id' => $task->id,
                            'file_id' => $file->id,
                            'created_at' => now(),
                            'updated_at' => now()
                        ]);
                    }
                }
            }
        }
    }
}