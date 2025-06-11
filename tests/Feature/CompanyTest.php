<?php

namespace Tests\Feature;

use App\Models\User;
use App\Models\Company;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Foundation\Testing\WithFaker;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class CompanyTest extends TestCase
{
    use RefreshDatabase, WithFaker;

    protected $user;
    protected $anotherUser;

    protected function setUp(): void
    {
        parent::setUp();
        
        // Создаем тестовых пользователей
        $this->user = User::factory()->create();
        $this->anotherUser = User::factory()->create();
    }

    // /** @test */
    // public function user_can_create_company()
    // {
    //     Storage::fake('public');

    //     $companyData = [
    //         'name' => $this->faker->company,
    //         'description' => $this->faker->paragraph,
            
    //     ];

    //     $response = $this->actingAs($this->user)
    //         ->postJson('/api/companies', $companyData, $this->withApiHeaders());

    //     $response->assertStatus(201)
    //         ->assertJsonStructure([
    //             'data' => [
    //                 'id',
    //                 'name',
    //                 'description',
    //                 'created_at',
    //                 'updated_at'
    //             ]
    //         ]);

    //     $this->assertDatabaseHas('companies', [
    //         'name' => $companyData['name'],
    //         'description' => $companyData['description'],
    //     ]);

    //     $this->assertDatabaseHas('company_users', [
    //         'user_id' => $this->user->id,
    //         'role' => 'owner'
    //     ]);
    // }

    /** @test */
    public function user_can_search_company()
    {
        $company = Company::factory()->create([
            'name' => 'Unique Company Name',
            'description' => 'Test Description'
        ]);

        $response = $this->actingAs($this->user)
            ->getJson('/api/companies?query=Unique', $this->withApiHeaders());

        $response->assertStatus(200)
            ->assertJsonStructure(['data'])
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.name', 'Unique Company Name');
    }

    // /** @test */
    // public function user_can_join_company()
    // {
    //     $company = Company::factory()->create();
    //     $company->users()->attach($this->anotherUser->id, ['role' => 'owner']);

    //     $response = $this->actingAs($this->user)
    //         ->postJson("/api/companies/{$company->id}/join", [], $this->withApiHeaders());

    //     $response->assertStatus(200);

    //     $this->assertDatabaseHas('company_users', [
    //         'company_id' => $company->id,
    //         'user_id' => $this->user->id,
    //         'role' => 'member'
    //     ]);
    // }

    /** @test */
    public function owner_can_delete_company()
    {
        $company = Company::factory()->create();
        $company->users()->attach($this->user->id, ['role' => 'owner']);

        Storage::fake('public');
        $logo = UploadedFile::fake()->image('logo.jpg');
        $logoPath = $logo->store('company-logos', 'public');
        $company->update(['logo_url' => $logoPath]);

        $response = $this->actingAs($this->user)
            ->deleteJson("/api/companies/{$company->id}", [], $this->withApiHeaders());

        $response->assertStatus(204);

        $this->assertDatabaseMissing('companies', ['id' => $company->id]);
        $this->assertDatabaseMissing('company_users', [
            'company_id' => $company->id,
            'user_id' => $this->user->id
        ]);

        Storage::disk('public')->assertMissing($logoPath);
    }

    /** @test */
    public function non_owner_cannot_delete_company()
    {
        $company = Company::factory()->create();
        $company->users()->attach($this->user->id, ['role' => 'member']);

        $response = $this->actingAs($this->user)
            ->deleteJson("/api/companies/{$company->id}", [], $this->withApiHeaders());

        $response->assertStatus(403);

        $this->assertDatabaseHas('companies', ['id' => $company->id]);
    }
}