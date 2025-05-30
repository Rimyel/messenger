<?php

namespace Tests\Feature\Controllers;

use Tests\TestCase;
use App\Models\User;
use App\Models\Company;

class CompanyControllerTest extends TestCase
{
    public function test_can_create_company_with_basic_data(): void
    {
        // arrange
        $user = User::factory()->create();
        $companyData = [
            'name' => 'Test Company',
            'description' => 'Test Description'
        ];

        // act
        $response = $this->actingAs($user)
            ->postJson('/api/companies', $companyData, $this->withApiHeaders());

        // assert
        $response->assertStatus(201)
            ->assertJsonStructure([
                'name',
                'description',
                'users'
            ]);

        $this->assertDatabaseHas('companies', [
            'name' => 'Test Company',
            'description' => 'Test Description'
        ]);

        // Проверяем, что создатель назначен владельцем
        $company = Company::where('name', 'Test Company')->first();
        $this->assertDatabaseHas('company_users', [
            'company_id' => $company->id,
            'user_id' => $user->id,
            'role' => 'owner'
        ]);
    }

    public function test_company_creation_validation(): void
    {
        // arrange
        $user = User::factory()->create();

        // act & assert - пустые данные
        $response = $this->actingAs($user)
            ->postJson('/api/companies', [], $this->withApiHeaders());

        $response->assertStatus(422);
        $this->assertValidationErrorResponse($response);

        // act & assert - слишком длинное название
        $response = $this->actingAs($user)
            ->postJson('/api/companies', [
                'name' => str_repeat('a', 256),
                'description' => 'Test Description'
            ], $this->withApiHeaders());

        $response->assertStatus(422);
        $this->assertValidationErrorResponse($response);
    }

    public function test_can_get_company_details(): void
    {
        // arrange
        $data = $this->createCompanyWithOwner();
        $company = $data['company'];
        $owner = $data['owner'];

        // act
        $response = $this->actingAs($owner)
            ->getJson("/api/companies/{$company->id}", $this->withApiHeaders());

        // assert
        $response->assertOk()
            ->assertJsonStructure([
                'name',
                'description'
            ]);
    }

    public function test_can_update_company(): void
    {
        // arrange
        $data = $this->createCompanyWithOwner();
        $company = $data['company'];
        $owner = $data['owner'];

        $updateData = [
            'name' => 'Updated Company Name',
            'description' => 'Updated Description'
        ];

        // act
        $response = $this->actingAs($owner)
            ->putJson("/api/companies/{$company->id}", $updateData, $this->withApiHeaders());

        // assert
        $response->assertOk();
        $this->assertDatabaseHas('companies', $updateData);
    }

    public function test_can_delete_company(): void
    {
        // arrange
        $data = $this->createCompanyWithOwner();
        $company = $data['company'];
        $owner = $data['owner'];

        // act
        $response = $this->actingAs($owner)
            ->deleteJson("/api/companies/{$company->id}", [], $this->withApiHeaders());

        // assert
        $response->assertStatus(204);
        $this->assertDatabaseMissing('companies', ['id' => $company->id]);
        $this->assertDatabaseMissing('company_users', ['company_id' => $company->id]);
    }

    public function test_non_member_cannot_access_company(): void
    {
        // arrange
        $data = $this->createCompanyWithOwner();
        $company = $data['company'];
        $nonMember = User::factory()->create();

        // act & assert
        $this->actingAs($nonMember)
            ->getJson("/api/companies/{$company->id}", $this->withApiHeaders())
            ->assertForbidden();

        $this->actingAs($nonMember)
            ->putJson("/api/companies/{$company->id}", [
                'name' => 'Try Update'
            ], $this->withApiHeaders())
            ->assertForbidden();

        $this->actingAs($nonMember)
            ->deleteJson("/api/companies/{$company->id}", [], $this->withApiHeaders())
            ->assertForbidden();
    }

    public function test_member_cannot_update_or_delete_company(): void
    {
        // arrange
        $data = $this->createCompanyWithUsers();
        $company = $data['company'];
        $member = $data['member'];

        // act & assert
        $this->actingAs($member)
            ->putJson("/api/companies/{$company->id}", [
                'name' => 'Try Update'
            ], $this->withApiHeaders())
            ->assertForbidden();

        $this->actingAs($member)
            ->deleteJson("/api/companies/{$company->id}", [], $this->withApiHeaders())
            ->assertForbidden();
    }
}