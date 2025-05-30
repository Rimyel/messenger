<?php

namespace Tests;

use App\Models\User;
use App\Models\Company;
use Illuminate\Foundation\Testing\TestCase as BaseTestCase;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Foundation\Testing\WithFaker;
use Illuminate\Support\Facades\Storage;

abstract class TestCase extends BaseTestCase
{
    use CreatesApplication, RefreshDatabase, WithFaker;

    #[Description('Создает тестового пользователя с указанной ролью в компании')]
    protected function createUserWithRole(string $role, ?Company $company = null): User
    {
        $user = User::factory()->create();
        
        if ($company) {
            $company->users()->attach($user->id, ['role' => $role]);
        }

        return $user;
    }

    #[Description('Создает тестовую компанию с владельцем')]
    protected function createCompanyWithOwner(): array
    {
        $owner = User::factory()->create();
        $company = Company::factory()->create();
        
        $company->users()->attach($owner->id, ['role' => 'owner']);

        return ['company' => $company, 'owner' => $owner];
    }

    #[BeforeTest]
    protected function setUpStorage(): void
    {
        Storage::fake('local');
        Storage::fake('public');
    }

    #[AfterTest]
    protected function tearDownStorage(): void
    {
        Storage::disk('local')->deleteDirectory('');
        Storage::disk('public')->deleteDirectory('');
    }

    #[Description('Проверяет структуру ответа с пагинацией')]
    protected function assertPaginatedResponse($response): void
    {
        $response->assertJsonStructure([
            'data' => [
                '*' => [
                    'id'
                ]
            ],
            'links' => [
                'first',
                'last',
                'prev',
                'next'
            ],
            'meta' => [
                'current_page',
                'from',
                'last_page',
                'path',
                'per_page',
                'to',
                'total'
            ]
        ]);
    }

    #[Description('Проверяет базовую структуру ошибки валидации')]
    protected function assertValidationErrorResponse($response): void
    {
        $response->assertJsonStructure([
            'errors' => []
        ]);
    }

    #[Description('Создает тестовые данные для компании с разными ролями пользователей')]
    protected function createCompanyWithUsers(): array
    {
        $company = Company::factory()->create();
        
        $owner = $this->createUserWithRole('owner', $company);
        $admin = $this->createUserWithRole('admin', $company);
        $member = $this->createUserWithRole('member', $company);

        return [
            'company' => $company,
            'owner' => $owner,
            'admin' => $admin,
            'member' => $member
        ];
    }

    #[Description('Устанавливает заголовки для API запросов')]
    protected function withApiHeaders(array $headers = []): array
    {
        $user = auth()->user();
        if ($user) {
            // Удаляем все существующие токены пользователя
            $user->tokens()->delete();
            // Создаем новый токен
            $token = $user->createToken('test-token')->plainTextToken;
        } else {
            $token = null;
        }

        return array_merge([
            'Accept' => 'application/json',
            'Content-Type' => 'application/json',
            'X-Requested-With' => 'XMLHttpRequest',
            'X-CSRF-TOKEN' => csrf_token(),
            'Authorization' => $token ? 'Bearer ' . $token : ''
        ], $headers);
    }
}
