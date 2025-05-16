<?php

namespace App\Providers;

use Illuminate\Foundation\Support\Providers\AuthServiceProvider as ServiceProvider;
use Illuminate\Support\Facades\Gate;

class AuthServiceProvider extends ServiceProvider
{
    /**
     * The model to policy mappings for the application.
     *
     * @var array<class-string, class-string>
     */
    protected $policies = [
        //
    ];

    /**
     * Register any authentication / authorization services.
     */
    public function boot(): void
    {
        $this->registerPolicies();

        Gate::define('manage-company', function ($user, $company) {
            if ($user->company_id !== $company->id) {
                return false;
            }

            // Проверяем, является ли пользователь создателем компании
            $firstUser = $company->users()->orderBy('created_at')->first();
            return $firstUser && $firstUser->id === $user->id;
        });
    }
}