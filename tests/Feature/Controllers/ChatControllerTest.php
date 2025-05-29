<?php

namespace Tests\Feature\Controllers;

use Tests\TestCase;
use App\Models\Chat;
use App\Models\User;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;

class ChatControllerTest extends TestCase
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
     * Тесты создания чатов
     */
    public function test_user_can_create_direct_chat(): void
    {
        // Arrange
        $companyData = $this->createCompanyWithUsers();
        $creator = $companyData['member'];
        $recipient = User::factory()->create();
        $companyData['company']->users()->attach($recipient->id, ['role' => 'member']);

        // Act
        $response = $this->actingAs($creator)
            ->postJson('/api/chats', [
                'type' => 'direct',
                'company_id' => $companyData['company']->id,
                'user_ids' => [$recipient->id]
            ], $this->withApiHeaders());

        // Assert
        $response->assertStatus(201)
            ->assertJsonStructure([
                'data' => [
                    'id',
                    'type',
                    'participants'
                ]
            ]);

        $this->assertDatabaseHas('chats', [
            'type' => 'direct',
            'company_id' => $companyData['company']->id
        ]);
    }

    public function test_user_can_create_group_chat(): void
    {
        // Arrange
        $companyData = $this->createCompanyWithUsers();
        $creator = $companyData['member'];
        $participants = User::factory()->count(3)->create();
        
        foreach ($participants as $participant) {
            $companyData['company']->users()->attach($participant->id, ['role' => 'member']);
        }

        // Act
        $response = $this->actingAs($creator)
            ->postJson('/api/chats', [
                'type' => 'group',
                'name' => 'Test Group',
                'description' => 'Test Description',
                'company_id' => $companyData['company']->id,
                'user_ids' => $participants->pluck('id')->toArray()
            ], $this->withApiHeaders());

        // Assert
        $response->assertStatus(201)
            ->assertJsonStructure([
                'data' => [
                    'id',
                    'type',
                    'name',
                    'description',
                    'participants'
                ]
            ]);

        $this->assertDatabaseHas('chats', [
            'type' => 'group',
            'name' => 'Test Group',
            'description' => 'Test Description',
            'company_id' => $companyData['company']->id
        ]);
    }

    public function test_chat_creation_validation(): void
    {
        // Arrange
        $companyData = $this->createCompanyWithUsers();
        $creator = $companyData['member'];

        // Act
        $response = $this->actingAs($creator)
            ->postJson('/api/chats', [
                'type' => 'invalid_type',
                'company_id' => $companyData['company']->id,
                'user_ids' => []
            ], $this->withApiHeaders());

        // Assert
        $response->assertStatus(422);
        $this->assertValidationErrorResponse($response);
    }

    /**
     * Тесты получения списка чатов
     */
    public function test_user_can_get_chat_list(): void
    {
        // Arrange
        $companyData = $this->createCompanyWithUsers();
        $user = $companyData['member'];
        
        $chats = Chat::factory()
            ->count(5)
            ->group()
            ->create(['company_id' => $companyData['company']->id]);
            
        foreach ($chats as $chat) {
            $chat->participants()->attach($user->id, ['role' => 'member']);
        }

        // Act
        $response = $this->actingAs($user)
            ->getJson('/api/chats?company_id=' . $companyData['company']->id, $this->withApiHeaders());

        // Assert
        $response->assertStatus(200);
        $this->assertPaginatedResponse($response);
    }

    public function test_chat_list_pagination(): void
    {
        // Arrange
        $companyData = $this->createCompanyWithUsers();
        $user = $companyData['member'];
        
        $chats = Chat::factory()
            ->count(15)
            ->group()
            ->create(['company_id' => $companyData['company']->id]);
            
        foreach ($chats as $chat) {
            $chat->participants()->attach($user->id, ['role' => 'member']);
        }

        // Act
        $response = $this->actingAs($user)
            ->getJson('/api/chats?company_id=' . $companyData['company']->id . '&per_page=5', $this->withApiHeaders());

        // Assert
        $response->assertStatus(200);
        $this->assertPaginatedResponse($response);
        $response->assertJsonCount(5, 'data');
    }

    public function test_chat_list_filtering(): void
    {
        // Arrange
        $companyData = $this->createCompanyWithUsers();
        $user = $companyData['member'];
        
        $groupChat = Chat::factory()->group()->create([
            'name' => 'Test Group Chat',
            'company_id' => $companyData['company']->id
        ]);
        $groupChat->participants()->attach($user->id, ['role' => 'member']);

        $directChat = Chat::factory()->direct()->create([
            'company_id' => $companyData['company']->id
        ]);
        $directChat->participants()->attach($user->id, ['role' => 'member']);

        // Act & Assert - Фильтр по типу
        $response = $this->actingAs($user)
            ->getJson('/api/chats?company_id=' . $companyData['company']->id . '&type=group', $this->withApiHeaders());

        $response->assertStatus(200)
            ->assertJsonCount(1, 'data');

        // Act & Assert - Поиск по имени
        $response = $this->actingAs($user)
            ->getJson('/api/chats?company_id=' . $companyData['company']->id . '&search=Test Group', $this->withApiHeaders());

        $response->assertStatus(200)
            ->assertJsonCount(1, 'data');
    }

    /**
     * Тесты управления сообщениями
     */
    public function test_user_can_send_text_message(): void
    {
        // Arrange
        $companyData = $this->createCompanyWithUsers();
        $user = $companyData['member'];
        $chat = Chat::factory()->group()->create(['company_id' => $companyData['company']->id]);
        $chat->participants()->attach($user->id, ['role' => 'member']);

        // Act
        $response = $this->actingAs($user)
            ->postJson("/api/chats/{$chat->id}/messages", [
                'content' => 'Test message'
            ], $this->withApiHeaders());

        // Assert
        $response->assertStatus(201)
            ->assertJsonStructure([
                'data' => [
                    'id',
                    'content',
                    'user_id',
                    'chat_id'
                ]
            ]);

        $this->assertDatabaseHas('messages', [
            'content' => 'Test message',
            'chat_id' => $chat->id,
            'user_id' => $user->id
        ]);
    }

    public function test_user_can_send_file(): void
    {
        // Arrange
        $companyData = $this->createCompanyWithUsers();
        $user = $companyData['member'];
        $chat = Chat::factory()->group()->create(['company_id' => $companyData['company']->id]);
        $chat->participants()->attach($user->id, ['role' => 'member']);
        
        $file = UploadedFile::fake()->create('test.pdf', 100);

        // Act
        $response = $this->actingAs($user)
            ->postJson("/api/chats/{$chat->id}/messages", [
                'content' => 'File message',
                'files' => [$file]
            ], $this->withApiHeaders());

        // Assert
        $response->assertStatus(201);
        
        Storage::disk('public')->assertExists('chat_files/' . $file->hashName());
        
        $this->assertDatabaseHas('messages_media', [
            'message_id' => $response->json('data.id'),
            'type' => 'file'
        ]);
    }

    public function test_user_can_get_message_history(): void
    {
        // Arrange
        $companyData = $this->createCompanyWithUsers();
        $user = $companyData['member'];
        $chat = Chat::factory()->group()->create(['company_id' => $companyData['company']->id]);
        $chat->participants()->attach($user->id, ['role' => 'member']);

        // Создаем несколько сообщений
        $chat->messages()->createMany([
            ['content' => 'Message 1', 'user_id' => $user->id],
            ['content' => 'Message 2', 'user_id' => $user->id],
            ['content' => 'Message 3', 'user_id' => $user->id]
        ]);

        // Act
        $response = $this->actingAs($user)
            ->getJson("/api/chats/{$chat->id}/messages", $this->withApiHeaders());

        // Assert
        $response->assertStatus(200);
        $this->assertPaginatedResponse($response);
        $response->assertJsonCount(3, 'data');
    }

    /**
     * Тесты управления участниками
     */
    public function test_admin_can_add_participants(): void
    {
        // Arrange
        $companyData = $this->createCompanyWithUsers();
        $admin = $companyData['admin'];
        $chat = Chat::factory()->group()->create(['company_id' => $companyData['company']->id]);
        $chat->participants()->attach($admin->id, ['role' => 'admin']);
        
        $newUser = User::factory()->create();
        $companyData['company']->users()->attach($newUser->id, ['role' => 'member']);

        // Act
        $response = $this->actingAs($admin)
            ->postJson("/api/chats/{$chat->id}/participants", [
                'user_ids' => [$newUser->id]
            ], $this->withApiHeaders());

        // Assert
        $response->assertStatus(200);
        $this->assertDatabaseHas('chat_user', [
            'chat_id' => $chat->id,
            'user_id' => $newUser->id
        ]);
    }

    public function test_admin_can_remove_participants(): void
    {
        // Arrange
        $companyData = $this->createCompanyWithUsers();
        $admin = $companyData['admin'];
        $member = User::factory()->create();
        
        $chat = Chat::factory()->group()->create(['company_id' => $companyData['company']->id]);
        $chat->participants()->attach([
            $admin->id => ['role' => 'admin'],
            $member->id => ['role' => 'member']
        ]);

        // Act
        $response = $this->actingAs($admin)
            ->deleteJson("/api/chats/{$chat->id}/participants/{$member->id}", [], $this->withApiHeaders());

        // Assert
        $response->assertStatus(200);
        $this->assertDatabaseMissing('chat_user', [
            'chat_id' => $chat->id,
            'user_id' => $member->id
        ]);
    }

    public function test_admin_can_change_participant_role(): void
    {
        // Arrange
        $companyData = $this->createCompanyWithUsers();
        $admin = $companyData['admin'];
        $member = User::factory()->create();
        
        $chat = Chat::factory()->group()->create(['company_id' => $companyData['company']->id]);
        $chat->participants()->attach([
            $admin->id => ['role' => 'admin'],
            $member->id => ['role' => 'member']
        ]);

        // Act
        $response = $this->actingAs($admin)
            ->putJson("/api/chats/{$chat->id}/participants/{$member->id}", [
                'role' => 'admin'
            ], $this->withApiHeaders());

        // Assert
        $response->assertStatus(200);
        $this->assertDatabaseHas('chat_user', [
            'chat_id' => $chat->id,
            'user_id' => $member->id,
            'role' => 'admin'
        ]);
    }

    public function test_member_cannot_manage_participants(): void
    {
        // Arrange
        $companyData = $this->createCompanyWithUsers();
        $member = $companyData['member'];
        $newUser = User::factory()->create();
        
        $chat = Chat::factory()->group()->create(['company_id' => $companyData['company']->id]);
        $chat->participants()->attach($member->id, ['role' => 'member']);

        // Act & Assert
        $response = $this->actingAs($member)
            ->postJson("/api/chats/{$chat->id}/participants", [
                'user_ids' => [$newUser->id]
            ], $this->withApiHeaders());

        $response->assertStatus(403);
    }
}