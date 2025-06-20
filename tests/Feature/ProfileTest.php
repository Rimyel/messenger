<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ProfileTest extends TestCase
{
    use RefreshDatabase;

    // public function test_profile_page_is_displayed(): void
    // {
    //     $user = User::factory()->create();

    //     $response = $this
    //         ->actingAs($user)
    //         ->get('/profile');

    //     $response->assertOk();
    // }

    // public function test_profile_information_can_be_updated(): void
    // {
    //     $user = User::factory()->create();

    //     $response = $this
    //         ->actingAs($user)
    //         ->patch('/profile', [
    //             'name' => 'Test User',
    //             'email' => 'test@example.com',
    //         ]);

    //     $response
    //         ->assertStatus(200)
    //         ->assertJsonStructure([
    //             'message',
    //             'user'
    //         ]);

    //     $user->refresh();

    //     $this->assertSame('Test User', $user->name);
    //     $this->assertSame('test@example.com', $user->email);
    // }

    // public function test_user_can_delete_their_account(): void
    // {
    //     $user = User::factory()->create();

    //     $response = $this
    //         ->actingAs($user)
    //         ->delete('/profile', [
    //             'password' => 'password',
    //         ]);

    //     $response
    //         ->assertStatus(200)
    //         ->assertJsonStructure([
    //             'message'
    //         ]);

    //     $this->assertGuest();
    //     $this->assertNull($user->fresh());
    // }

    // public function test_correct_password_must_be_provided_to_delete_account(): void
    // {
    //     $user = User::factory()->create();

    //     $response = $this
    //         ->actingAs($user)
    //         ->from('/profile')
    //         ->delete('/profile', [
    //             'password' => 'wrong-password',
    //         ], $this->withApiHeaders());

    //     $response
    //         ->assertStatus(422)
    //         ->assertJsonValidationErrors(['password']);

    //     $this->assertNotNull($user->fresh());
    // }
}
