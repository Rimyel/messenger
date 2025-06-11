<?php

namespace Tests\Feature\Controllers;

use Tests\TestCase;
use App\Models\Task;
use App\Models\User;
use App\Models\TaskAssignment;
use App\Models\TaskResponse;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;

class TaskControllerTest extends TestCase
{
    protected function setUp(): void
    {
        parent::setUp();
        $this->setUpStorage();
    }

    protected function tearDown(): void
    {
        $this->tearDownStorage();
        parent::tearDown();
    }

    /**
     * Тесты создания задач
     */
    public function test_admin_can_create_basic_task(): void
    {
        // Arrange
        $companyData = $this->createCompanyWithUsers();
        $admin = $companyData['admin'];
        $assignee = $companyData['member'];

        $taskData = [
            'title' => 'Test Task',
            'description' => 'Test Description',
            'start_date' => now()->toDateString(),
            'due_date' => now()->addDays(7)->toDateString(),
            'user_ids' => [$assignee->id]
        ];

        // Act
        $response = $this->actingAs($admin)
            ->postJson('/api/tasks', $taskData, $this->withApiHeaders());

        // Assert
        $response->assertStatus(201)
            ->assertJsonStructure([
                'id',
                'title',
                'description',
                'start_date',
                'due_date',
                'status',
                'created_by',
                'assignments' => [
                    '*' => [
                        'id',
                        'user_id',
                        'status'
                    ]
                ]
            ]);

        $this->assertDatabaseHas('tasks', [
            'title' => $taskData['title'],
            'description' => $taskData['description'],
            'start_date' => $taskData['start_date'],
            'due_date' => $taskData['due_date'],
            'status' => 'pending',
            'company_id' => $companyData['company']->id,
            'created_by' => $admin->id
        ]);

        $this->assertDatabaseHas('task_assignments', [
            'user_id' => $assignee->id,
            'status' => 'not_started'
        ]);
    }

    public function test_admin_can_create_task_with_files(): void
    {
        // Arrange
        $companyData = $this->createCompanyWithUsers();
        $admin = $companyData['admin'];
        $assignee = $companyData['member'];

        $taskData = [
            'title' => 'Task with Files',
            'description' => 'Test Description',
            'start_date' => now()->toDateString(),
            'due_date' => now()->addDays(7)->toDateString(),
            'user_ids' => [$assignee->id],
            'files' => [
                UploadedFile::fake()->create('document1.pdf', 100),
                UploadedFile::fake()->create('document2.docx', 200)
            ]
        ];

        // Act
        $response = $this->actingAs($admin)
            ->postJson('/api/tasks', $taskData, $this->withApiHeaders());

        // Assert
        $response->assertStatus(201);

        $taskId = $response->json('id');
        
        foreach ($taskData['files'] as $file) {
            Storage::disk('public')->assertExists('tasks/' . $file->hashName());
            
            $this->assertDatabaseHas('files', [
                'name' => $file->getClientOriginalName()
            ]);
        }
    }

    public function test_admin_can_create_task_with_multiple_assignees(): void
    {
        // Arrange
        $companyData = $this->createCompanyWithUsers();
        $admin = $companyData['admin'];
        
        $assignees = User::factory()->count(3)->create();
        foreach ($assignees as $assignee) {
            $companyData['company']->users()->attach($assignee->id, ['role' => 'member']);
        }

        $taskData = [
            'title' => 'Task with Multiple Assignees',
            'description' => 'Test Description',
            'start_date' => now()->toDateString(),
            'due_date' => now()->addDays(7)->toDateString(),
            'user_ids' => $assignees->pluck('id')->toArray()
        ];

        
        $response = $this->actingAs($admin)
            ->postJson('/api/tasks', $taskData, $this->withApiHeaders());

    
        $response->assertStatus(201);

        $taskId = $response->json('id');
        
        foreach ($assignees as $assignee) {
            $this->assertDatabaseHas('task_assignments', [
                'task_id' => $taskId,
                'user_id' => $assignee->id,
                'status' => 'not_started'
            ]);
        }
    }

    public function test_task_creation_validation(): void
    {
        // Arrange
        $companyData = $this->createCompanyWithUsers();
        $admin = $companyData['admin'];

        $invalidData = [
            'title' => '', // Required field
            'description' => '', // Required field
            'start_date' => 'invalid-date', // Invalid date format
            'due_date' => now()->subDays(1)->toDateString(), // Date in past
            'user_ids' => [] // Empty array
        ];

        // Act
        $response = $this->actingAs($admin)
            ->postJson('/api/tasks', $invalidData, $this->withApiHeaders());

        // Assert
        $response->assertStatus(422)
            ->assertJsonValidationErrors(['title', 'description', 'start_date', 'due_date', 'user_ids']);
    }

    public function test_regular_user_cannot_create_task(): void
    {
        // Arrange
        $companyData = $this->createCompanyWithUsers();
        $member = $companyData['member'];

        $taskData = [
            'title' => 'Test Task',
            'description' => 'Test Description',
            'start_date' => now()->toDateString(),
            'due_date' => now()->addDays(7)->toDateString(),
            'user_ids' => [$member->id]
        ];

        // Act
        $response = $this->actingAs($member)
            ->postJson('/api/tasks', $taskData, $this->withApiHeaders());

        // Assert
        $response->assertStatus(403);
    }

    /**
     * Тесты получения списка задач
     */
    public function test_admin_can_get_company_tasks(): void
    {
        // Arrange
        $companyData = $this->createCompanyWithUsers();
        $admin = $companyData['admin'];
        
        $tasks = Task::factory()
            ->count(5)
            ->create([
                'company_id' => $companyData['company']->id,
                'created_by' => $admin->id
            ]);

        // Act
        $response = $this->actingAs($admin)
            ->getJson('/api/tasks', $this->withApiHeaders());

        // Assert
        $response->assertStatus(200)
            ->assertJsonStructure([
                'data' => [
                    '*' => [
                        'id',
                        'title',
                        'description',
                        'status',
                        'start_date',
                        'due_date',
                        'created_by'
                    ]
                ]
            ]);
        
        $this->assertCount(5, $response->json('data'));
    }

    public function test_user_can_get_assigned_tasks(): void
    {
        // Arrange
        $companyData = $this->createCompanyWithUsers();
        $user = $companyData['member'];
        
        // Создаем задачи и назначаем пользователю
        $tasks = Task::factory()
            ->count(3)
            ->create([
                'company_id' => $companyData['company']->id,
                'created_by' => $companyData['admin']->id
            ]);
            
        foreach ($tasks as $task) {
            TaskAssignment::create([
                'task_id' => $task->id,
                'user_id' => $user->id,
                'status' => 'not_started'
            ]);
        }

        // Act
        $response = $this->actingAs($user)
            ->getJson('/api/tasks/my', $this->withApiHeaders());

        // Assert
        $response->assertStatus(200)
            ->assertJsonCount(3, 'data');
    }

    /**
     * Тесты управления статусами
     */
    public function test_admin_can_update_task_status(): void
    {
        // Arrange
        $companyData = $this->createCompanyWithUsers();
        $admin = $companyData['admin'];
        
        $task = Task::factory()->create([
            'company_id' => $companyData['company']->id,
            'created_by' => $admin->id,
            'status' => 'pending'
        ]);

        // Act
        $response = $this->actingAs($admin)
            ->patchJson("/api/tasks/{$task->id}/status", [
                'status' => 'in_progress'
            ], $this->withApiHeaders());

        // Assert
        $response->assertStatus(200);
        
        $this->assertDatabaseHas('tasks', [
            'id' => $task->id,
            'status' => 'in_progress'
        ]);
    }

    /**
     * Тесты работы с ответами
     */
    public function test_assignee_can_submit_response(): void
    {
        // Arrange
        $companyData = $this->createCompanyWithUsers();
        $user = $companyData['member'];
        
        $task = Task::factory()->create([
            'company_id' => $companyData['company']->id,
            'created_by' => $companyData['admin']->id
        ]);

        $assignment = TaskAssignment::create([
            'task_id' => $task->id,
            'user_id' => $user->id,
            'status' => 'in_progress'
        ]);

        $responseData = [
            'text' => 'Test Response Content',
            'files' => [
                UploadedFile::fake()->create('response.pdf', 100)
            ]
        ];

        // Act
        $response = $this->actingAs($user)
            ->postJson("/api/task-assignments/{$assignment->id}/response", $responseData, $this->withApiHeaders());

        // Assert
        $response->assertStatus(201);
        
        $this->assertDatabaseHas('task_responses', [
            'assignment_id' => $assignment->id,
            'text' => $responseData['text'],
            'status' => 'submitted'
        ]);

        $this->assertDatabaseHas('task_assignments', [
            'id' => $assignment->id,
            'status' => 'submitted'
        ]);

        Storage::disk('public')->assertExists('task-responses/' . $responseData['files'][0]->hashName());
    }

    public function test_admin_can_review_response(): void
    {
        $companyData = $this->createCompanyWithUsers();
        $admin = $companyData['admin'];
        $task = Task::factory()->create([
            'company_id' => $companyData['company']->id,
            'created_by' => $admin->id
        ]);
        $assignment = TaskAssignment::create([
            'task_id' => $task->id,
            'user_id' => $companyData['member']->id,
            'status' => 'submitted'
        ]);
        $taskResponse = TaskResponse::create([
            'assignment_id' => $assignment->id,
            'text' => 'Test Response',
            'status' => 'submitted'
        ]);
        $response = $this->actingAs($admin)
            ->patchJson("/api/tasks/responses/{$taskResponse->id}/review", [
                'status' => 'revision',
                'revision_comment' => 'Need improvements'
            ], $this->withApiHeaders());

        $response->assertStatus(200);
        $this->assertDatabaseHas('task_responses', [
            'id' => $taskResponse->id,
            'status' => 'revision',
            'revision_comment' => 'Need improvements'
        ]);
        $this->assertDatabaseHas('task_assignments', [
            'id' => $assignment->id,
            'status' => 'revision'
        ]);
        $response = $this->actingAs($admin)
            ->putJson("/api/task-responses/{$taskResponse->id}/review", [
                'status' => 'approved'
            ], $this->withApiHeaders());

        $response->assertStatus(200);
        $this->assertDatabaseHas('task_responses', [
            'id' => $taskResponse->id,
            'status' => 'approved',
            'revision_comment' => null
        ]);
        $this->assertDatabaseHas('task_assignments', [
            'id' => $assignment->id,
            'status' => 'completed'
        ]);
        $this->assertDatabaseHas('tasks', [
            'id' => $task->id,
            'status' => 'completed'
        ]);
    }
}