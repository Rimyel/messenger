<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Chat;
use App\Models\User;
use App\Models\Company;

class ChatSeeder extends Seeder
{
    private $groupChatTemplates = [
        'Общий чат команды',
        'Проектный чат',
        'Технический отдел',
        'Срочные вопросы',
        'Дизайн и UX',
        'Тестирование',
        'Документация'
    ];

    public function run(): void
    {
        $companies = Company::with('users')->get();
        
        foreach ($companies as $company) {
            $users = $company->users;
            
            // Создаем групповые чаты только если есть достаточно пользователей
            if (count($users) >= 3) {
                $groupChatsCount = min(count($this->groupChatTemplates), rand(4, 6));
                $selectedTemplates = array_rand($this->groupChatTemplates, $groupChatsCount);
                
                if (!is_array($selectedTemplates)) {
                    $selectedTemplates = [$selectedTemplates];
                }
                
                foreach ($selectedTemplates as $templateIndex) {
                $chatName = $this->groupChatTemplates[$templateIndex];
                $groupChat = Chat::create([
                    'name' => $chatName,
                    'type' => 'group',
                    'company_id' => $company->id,
                    'created_at' => now()->subDays(rand(1, 30))
                ]);
                
                // Добавляем случайное подмножество пользователей (минимум 3)
                $chatUsers = $users->random(rand(3, count($users)));
                
                // Назначаем первого пользователя владельцем чата
                $owner = $chatUsers->first();
                $groupChat->participants()->attach($owner->id, ['role' => 'owner']);
                
                // Случайно выбираем админов (1-2 человека)
                $admins = $chatUsers->slice(1, rand(1, 2));
                foreach ($admins as $admin) {
                    $groupChat->participants()->attach($admin->id, ['role' => 'admin']);
                }
                
                // Остальные пользователи - обычные участники
                $members = $chatUsers->slice($admins->count() + 1);
                foreach ($members as $member) {
                    $groupChat->participants()->attach($member->id, ['role' => 'member']);
                }
            }
            }
            
            // Создаем личные чаты между пользователями только если есть минимум 2 пользователя
            $userCount = count($users);
            if ($userCount >= 2) {
                for ($i = 0; $i < $userCount - 1; $i++) {
                    // Создаем 2-4 личных чата для каждого пользователя
                    $personalChatsCount = min($userCount - $i - 1, rand(2, 4));
                    $remainingUsers = array_slice($users->toArray(), $i + 1);
                    
                    if (empty($remainingUsers)) {
                        continue;
                    }
                    
                    // Выбираем случайных пользователей из оставшихся
                    $chatPartnersCount = min(count($remainingUsers), $personalChatsCount);
                    $chatPartnerIndices = (array)array_rand($remainingUsers, $chatPartnersCount);
                    
                    foreach ($chatPartnerIndices as $index) {
                        $partner = $remainingUsers[$index];
                        
                        $personalChat = Chat::create([
                            'type' => 'private',
                            'company_id' => $company->id,
                            'created_at' => now()->subDays(rand(1, 30))
                        ]);
                        
                        // В личном чате оба пользователя - владельцы
                        $personalChat->participants()->attach([
                            $users[$i]->id => ['role' => 'owner'],
                            $partner['id'] => ['role' => 'owner']
                        ]);
                    }
                }
            }
        }
    }
}