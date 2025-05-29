<?php

namespace Tests\Feature\Controllers;

use Tests\TestCase;
use App\Models\User;
use App\Models\Company;
use Illuminate\Testing\Fluent\AssertableJson;

class CompanyUserControllerTest extends TestCase
{
    public function test_can_change_user_role(): void
    {
        // arrange
        $data = $this->createCompanyWithUsers();
        $company = $data['company'];
        $owner = $data['owner'];
        $member = $data['member'];

        // act
        $response = $this->actingAs($owner)
            ->patchJson("/api/companies/{$company->id}/users/{$member->id}/role", [
                'role' => 'admin'
            ], $this->withApiHeaders());

        // assert
        $response->assertOk();
        $this->assertDatabaseHas('company_users', [
            'company_id' => $company->id,
            'user_id' => $member->id,
            'role' => 'admin'
        ]);
    }

    public function test_cannot_remove_last_owner(): void
    {
        // arrange
        $data = $this->createCompanyWithOwner();
        $company = $data['company'];
        $owner = $data['owner'];

        // act
        $response = $this->actingAs($owner)
            ->deleteJson("/api/companies/{$company->id}/users/{$owner->id}", [], $this->withApiHeaders());

        // assert
        $response->assertStatus(422);
        $this->assertDatabaseHas('company_users', [
            'company_id' => $company->id,
            'user_id' => $owner->id,
            'role' => 'owner'
        ]);
    }

    public function test_can_transfer_ownership(): void
    {
        // arrange
        $data = $this->createCompanyWithUsers();
        $company = $data['company'];
        $owner = $data['owner'];
        $admin = $data['admin'];

        // act
        $response = $this->actingAs($owner)
            ->postJson("/api/companies/{$company->id}/users/{$admin->id}/transfer-ownership", [
                'password' => 'password'
            ], $this->withApiHeaders());

        // assert
        $response->assertOk();
        $this->assertDatabaseHas('company_users', [
            'company_id' => $company->id,
            'user_id' => $admin->id,
            'role' => 'owner'
        ]);
        $this->assertDatabaseHas('company_users', [
            'company_id' => $company->id,
            'user_id' => $owner->id,
            'role' => 'admin' // предыдущий владелец становится администратором
        ]);
    }

    public function test_user_can_leave_company(): void
    {
        // arrange
        $data = $this->createCompanyWithUsers();
        $company = $data['company'];
        $member = $data['member'];

        // act
        $response = $this->actingAs($member)
            ->postJson("/api/companies/{$company->id}/leave", [], $this->withApiHeaders());

        // assert
        $response->assertStatus(200);
        $this->assertDatabaseMissing('company_users', [
            'company_id' => $company->id,
            'user_id' => $member->id
        ]);
    }

    public function test_validates_unique_roles(): void
    {
        // arrange
        $data = $this->createCompanyWithUsers();
        $company = $data['company'];
        $owner = $data['owner'];
        $member = $data['member'];

        // act - попытка создать второго владельца
        $response = $this->actingAs($owner)
            ->patchJson("/api/companies/{$company->id}/users/{$member->id}/role", [
                'role' => 'owner'
            ], $this->withApiHeaders());

        // assert
        $response->assertStatus(422);
        $this->assertValidationErrorResponse($response);
    }

}