<?php

namespace App\Providers;

use App\Models\Company;
use App\Models\Chat;

use App\Policies\CompanyPolicy;
use App\Policies\ChatPolicy;

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
        Company::class => CompanyPolicy::class,
        Chat::class => ChatPolicy::class,

    ];

    /**
     * Register any authentication / authorization services.
     */
    public function boot(): void
    {
        $this->registerPolicies();

        // Определяем общий гейт для проверки возможности управления компанией
        Gate::define('manage-company', function ($user, $company) {
            return $user->canManageCompany($company);
        });

        // Определяем общий гейт для проверки возможности управления чатом
        Gate::define('manage-chat', function ($user, $chat) {
            return $chat->canBeManageBy($user);
        });

        // Определяем гейт для проверки владельца компании
        Gate::define('company-owner', function ($user, $company) {
            return $user->isOwnerOfCompany($company);
        });

        // Определяем гейт для проверки администратора компании
        Gate::define('company-admin', function ($user, $company) {
            return $user->isAdminOfCompany($company);
        });

        // Определяем гейт для проверки принадлежности к компании
        Gate::define('company-member', function ($user, $company) {
            return $user->belongsToCompany($company);
        });

        // Определяем гейт для проверки владельца чата
        Gate::define('chat-owner', function ($user, $chat) {
            return $user->isOwnerOfChat($chat);
        });

        // Определяем гейт для проверки администратора чата
        Gate::define('chat-admin', function ($user, $chat) {
            return $user->isAdminOfChat($chat);
        });

        // Определяем гейт для проверки участника чата
        Gate::define('chat-member', function ($user, $chat) {
            return $chat->hasUser($user);
        });
    }
}