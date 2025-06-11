<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;

class UserSeeder extends Seeder
{
    public function run(): void
    {
        // Создаем пользователей
        $users = [
            // Компания 1 - Инновационные Технологии
            [
                'name' => 'Александр Владимиров',
                'email' => 'owner1@example.com',
                'password' => Hash::make('password'),
                'created_at' => now(),
                'updated_at' => now()
            ],
            [
                'name' => 'Мария Петрова',
                'email' => 'admin1@example.com',
                'password' => Hash::make('password'),
                'created_at' => now(),
                'updated_at' => now()
            ],
            [
                'name' => 'Иван Сергеев',
                'email' => 'member1@example.com',
                'password' => Hash::make('password'),
                'created_at' => now(),
                'updated_at' => now()
            ],
            // Компания 2 - Цифровые Системы
            [
                  'name' => 'Екатерина Смирнова',
                'email' => 'owner2@example.com',
                'password' => Hash::make('password'),
                'created_at' => now(),
                'updated_at' => now()
            ],
            [
                'name' => 'Дмитрий Николаев',
                'email' => 'admin2@example.com',
                'password' => Hash::make('password'),
                'created_at' => now(),
                'updated_at' => now()
            ],
            [
                'name' => 'Анна Козлова',
                'email' => 'member2@example.com',
                'password' => Hash::make('password'),
                'created_at' => now(),
                'updated_at' => now()
            ],
            // Компания 3 - ТехноПрогресс
            [
                'name' => 'Сергей Морозов',
                'email' => 'owner3@example.com',
                'password' => Hash::make('password'),
                'created_at' => now(),
                'updated_at' => now()
            ],
            [
                'name' => 'Ольга Соколова',
                'email' => 'admin3@example.com',
                'password' => Hash::make('password'),
                'created_at' => now(),
                'updated_at' => now()
            ],
            [
                'name' => 'Павел Васильев',
                'email' => 'member3@example.com',
                'password' => Hash::make('password'),
                'created_at' => now(),
                'updated_at' => now()
            ],
            // Компания 4 - Смарт Солюшенс
            [
                'name' => 'Андрей Козлов',
                'email' => 'owner4@example.com',
                'password' => Hash::make('password'),
                'created_at' => now(),
                'updated_at' => now()
            ],
            [
                'name' => 'Наталья Романова',
                'email' => 'admin4@example.com',
                'password' => Hash::make('password'),
                'created_at' => now(),
                'updated_at' => now()
            ],
            [
                'name' => 'Максим Лебедев',
                'email' => 'member4@example.com',
                'password' => Hash::make('password'),
                'created_at' => now(),
                'updated_at' => now()
            ],
            // Компания 5 - Кибер Защита
            [
                'name' => 'Игорь Волков',
                'email' => 'owner5@example.com',
                'password' => Hash::make('password'),
                'created_at' => now(),
                'updated_at' => now()
            ],
            [
                'name' => 'Евгения Орлова',
                'email' => 'admin5@example.com',
                'password' => Hash::make('password'),
                'created_at' => now(),
                'updated_at' => now()
            ],
            [
                'name' => 'Артем Соловьев',
                'email' => 'member5@example.com',
                'password' => Hash::make('password'),
                'created_at' => now(),
                'updated_at' => now()
            ]
        ];

        DB::table('users')->insert($users);

        // Связываем пользователей с компаниями и назначаем роли
        $companyUsers = [
            // Компания 1 - Инновационные Технологии
            [
                'company_id' => 1,
                'user_id' => 1,
                'role' => 'owner',
                'created_at' => now(),
                'updated_at' => now()
            ],
            [
                'company_id' => 1,
                'user_id' => 2,
                'role' => 'admin',
                'created_at' => now(),
                'updated_at' => now()
            ],
            [
                'company_id' => 1,
                'user_id' => 3,
                'role' => 'member',
                'created_at' => now(),
                'updated_at' => now()
            ],
            // Компания 2 - Цифровые Системы
            [
                'company_id' => 2,
                'user_id' => 4,
                'role' => 'owner',
                'created_at' => now(),
                'updated_at' => now()
            ],
            [
                'company_id' => 2,
                'user_id' => 5,
                'role' => 'admin',
                'created_at' => now(),
                'updated_at' => now()
            ],
            [
                'company_id' => 2,
                'user_id' => 6,
                'role' => 'member',
                'created_at' => now(),
                'updated_at' => now()
            ],
            // Компания 3 - ТехноПрогресс
            [
                'company_id' => 3,
                'user_id' => 7,
                'role' => 'owner',
                'created_at' => now(),
                'updated_at' => now()
            ],
            [
                'company_id' => 3,
                'user_id' => 8,
                'role' => 'admin',
                'created_at' => now(),
                'updated_at' => now()
            ],
            [
                'company_id' => 3,
                'user_id' => 9,
                'role' => 'member',
                'created_at' => now(),
                'updated_at' => now()
            ],
            // Компания 4 - Смарт Солюшенс
            [
                'company_id' => 4,
                'user_id' => 10,
                'role' => 'owner',
                'created_at' => now(),
                'updated_at' => now()
            ],
            [
                'company_id' => 4,
                'user_id' => 11,
                'role' => 'admin',
                'created_at' => now(),
                'updated_at' => now()
            ],
            [
                'company_id' => 4,
                'user_id' => 12,
                'role' => 'member',
                'created_at' => now(),
                'updated_at' => now()
            ],
            // Компания 5 - Кибер Защита
            [
                'company_id' => 5,
                'user_id' => 13,
                'role' => 'owner',
                'created_at' => now(),
                'updated_at' => now()
            ],
            [
                'company_id' => 5,
                'user_id' => 14,
                'role' => 'admin',
                'created_at' => now(),
                'updated_at' => now()
            ],
            [
                'company_id' => 5,
                'user_id' => 15,
                'role' => 'member',
                'created_at' => now(),
                'updated_at' => now()
            ]
        ];

        DB::table('company_users')->insert($companyUsers);
    }
}